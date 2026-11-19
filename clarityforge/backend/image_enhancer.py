"""
ClarityForge - Image enhancement engine.

Pipeline (in this order, so that expensive steps run on the smallest image):
    1. Denoise          - Non-local means denoising (removes grain / JPEG noise)
    2. Color fix        - Auto white balance, auto levels, auto exposure (LAB space)
    3. Local contrast   - CLAHE on the luminance channel
    4. Vibrance         - Smart saturation boost that protects neutral & saturated tones
    5. Upscale          - Progressive Lanczos + iterative back-projection super resolution
    6. Deblur / sharpen - Multi-scale, noise-aware, halo-limited sharpening on luminance
"""

from __future__ import annotations

import math
from dataclasses import dataclass, asdict
from io import BytesIO
from typing import Optional, Tuple

import cv2
import numpy as np
from PIL import Image, ImageOps

try:  # Optional HEIC / HEIF support (installed for ImageForge)
    import pillow_heif

    pillow_heif.register_heif_opener()
except Exception:  # pragma: no cover
    pass

MAX_INPUT_PIXELS = 40_000_000
MAX_OUTPUT_PIXELS = 24_000_000  # e.g. 6000 x 4000 - keeps RAM usage reasonable
Image.MAX_IMAGE_PIXELS = MAX_INPUT_PIXELS

OUTPUT_FORMATS = {"PNG", "JPEG", "WEBP"}
MIME_TYPES = {"PNG": "image/png", "JPEG": "image/jpeg", "WEBP": "image/webp"}


# --------------------------------------------------------------------------- #
# Settings
# --------------------------------------------------------------------------- #
@dataclass
class EnhanceSettings:
    scale: float = 2.0      # 1, 2 or 4
    sharpen: int = 45       # 0-100  deblur / detail recovery
    denoise: int = 20       # 0-100  grain & artifact removal
    color_fix: int = 60     # 0-100  white balance + levels + exposure
    contrast: int = 35      # 0-100  local contrast (CLAHE)
    vibrance: int = 25      # 0-100  smart saturation
    brightness: int = 0     # -50..50 manual exposure

    @classmethod
    def from_dict(cls, data: dict) -> "EnhanceSettings":
        s = cls()
        for key in asdict(s):
            if key in data and data[key] is not None:
                setattr(s, key, data[key])
        return s.clamped()

    def clamped(self) -> "EnhanceSettings":
        def clip(v, lo, hi):
            return max(lo, min(hi, v))

        self.scale = float(clip(float(self.scale), 1.0, 4.0))
        for key in ("sharpen", "denoise", "color_fix", "contrast", "vibrance"):
            setattr(self, key, int(clip(int(getattr(self, key)), 0, 100)))
        self.brightness = int(clip(int(self.brightness), -50, 50))
        return self


# --------------------------------------------------------------------------- #
# Decode / encode
# --------------------------------------------------------------------------- #
def load_image(data: bytes) -> Tuple[np.ndarray, Optional[np.ndarray]]:
    """Decode bytes into a BGR uint8 array plus an optional alpha channel."""
    try:
        img = Image.open(BytesIO(data))
        if img.width * img.height > MAX_INPUT_PIXELS:
            raise ValueError("Image is too large (over 40 megapixels).")
        img = ImageOps.exif_transpose(img)
        img.load()
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError("Unsupported or corrupted image file.") from exc

    has_alpha = img.mode in ("RGBA", "LA", "PA") or (
        img.mode == "P" and "transparency" in img.info
    )
    if has_alpha:
        rgba = np.array(img.convert("RGBA"))
        alpha = rgba[..., 3].copy()
        # Ignore fully opaque alpha channels
        if alpha.min() == 255:
            alpha = None
        bgr = cv2.cvtColor(rgba[..., :3], cv2.COLOR_RGB2BGR)
        return bgr, alpha

    bgr = cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2BGR)
    return bgr, None


def encode_image(
    bgr: np.ndarray, alpha: Optional[np.ndarray], fmt: str = "PNG", quality: int = 95
) -> Tuple[bytes, str]:
    fmt = fmt.upper()
    if fmt == "JPG":
        fmt = "JPEG"
    if fmt not in OUTPUT_FORMATS:
        raise ValueError(f"Unsupported output format: {fmt}")

    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    if alpha is not None and fmt != "JPEG":
        pil = Image.fromarray(np.dstack([rgb, alpha]), "RGBA")
    elif alpha is not None:  # JPEG has no transparency -> flatten on white
        a = (alpha.astype(np.float32) / 255.0)[..., None]
        flat = rgb.astype(np.float32) * a + 255.0 * (1.0 - a)
        pil = Image.fromarray(np.clip(flat, 0, 255).astype(np.uint8), "RGB")
    else:
        pil = Image.fromarray(rgb, "RGB")

    buf = BytesIO()
    if fmt == "JPEG":
        pil.save(buf, "JPEG", quality=quality, subsampling=0, optimize=True, progressive=True)
    elif fmt == "WEBP":
        pil.save(buf, "WEBP", quality=quality, method=4)
    else:
        pil.save(buf, "PNG", optimize=False, compress_level=6)
    return buf.getvalue(), fmt


# --------------------------------------------------------------------------- #
# Individual enhancement steps
# --------------------------------------------------------------------------- #
def denoise(img: np.ndarray, strength: int) -> np.ndarray:
    if strength <= 0:
        return img
    h = 2.0 + (strength / 100.0) * 10.0  # 2..12
    pixels = img.shape[0] * img.shape[1]
    search = 21 if pixels <= 2_000_000 else 13 if pixels <= 8_000_000 else 9
    return cv2.fastNlMeansDenoisingColored(img, None, h, h * 0.9, 7, search)


def color_fix(img: np.ndarray, strength: int, brightness: int) -> np.ndarray:
    """White balance + auto levels + auto exposure + manual brightness (LAB space)."""
    if strength <= 0 and brightness == 0:
        return img

    a = strength / 100.0
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    L, A, B = cv2.split(lab)

    if a > 0:
        # 1) Gray-world white balance (weighted by luminance, like a real camera AWB)
        avg_a = float(A.mean()) - 128.0
        avg_b = float(B.mean()) - 128.0
        weight = (L / 255.0) * 1.1 * a
        A -= avg_a * weight
        B -= avg_b * weight

        # 2) Auto levels on luminance (robust percentile stretch)
        lo, hi = (float(v) for v in np.percentile(L, (0.5, 99.5)))
        if hi - lo > 12:
            stretched = (L - lo) * (255.0 / (hi - lo))
            L = L + (stretched - L) * a

        # 3) Auto exposure - pull mean luminance toward mid-grey
        mean = float(np.clip(L.mean() / 255.0, 0.02, 0.98))
        if mean < 0.42 or mean > 0.62:
            gamma = math.log(0.5) / math.log(mean)
            gamma = float(np.clip(gamma, 0.55, 1.5))
            gamma = 1.0 + (gamma - 1.0) * a * 0.85
            L = 255.0 * np.power(np.clip(L / 255.0, 0, 1), gamma)

    # 4) Manual brightness (exposure curve)
    if brightness != 0:
        gamma = 2.0 ** (-brightness / 70.0)
        L = 255.0 * np.power(np.clip(L / 255.0, 0, 1), gamma)

    lab = np.stack([L, A, B], axis=-1)
    lab = np.clip(lab, 0, 255).astype(np.uint8)
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


def local_contrast(img: np.ndarray, strength: int) -> np.ndarray:
    if strength <= 0:
        return img
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    L, A, B = cv2.split(lab)
    clip = 1.2 + (strength / 100.0) * 2.8  # 1.2..4.0
    tiles = 8 if max(img.shape[:2]) > 600 else 4
    clahe = cv2.createCLAHE(clipLimit=clip, tileGridSize=(tiles, tiles))
    L2 = clahe.apply(L)
    mix = min(1.0, 0.35 + strength / 100.0 * 0.65)
    L = cv2.addWeighted(L, 1.0 - mix, L2, mix, 0)
    return cv2.cvtColor(cv2.merge([L, A, B]), cv2.COLOR_LAB2BGR)


def vibrance(img: np.ndarray, strength: int) -> np.ndarray:
    if strength <= 0:
        return img
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
    s = hsv[..., 1] / 255.0
    boost = (strength / 100.0) * 1.2
    # Boost muted colours most; leave greys and already-vivid colours mostly alone
    s = s + boost * s * (1.0 - s)
    hsv[..., 1] = np.clip(s * 255.0, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)


def _upscale_step(img: np.ndarray, factor: float, iterations: int = 3) -> np.ndarray:
    """Lanczos upscale refined by iterative back-projection (classic super resolution)."""
    h, w = img.shape[:2]
    nw, nh = max(1, int(round(w * factor))), max(1, int(round(h * factor)))
    src = img.astype(np.float32)
    est = cv2.resize(src, (nw, nh), interpolation=cv2.INTER_LANCZOS4)
    for _ in range(iterations):
        down = cv2.resize(est, (w, h), interpolation=cv2.INTER_AREA)
        err = src - down
        est += cv2.resize(err, (nw, nh), interpolation=cv2.INTER_CUBIC) * 0.9
    return np.clip(est, 0, 255).astype(np.uint8)


def effective_scale(width: int, height: int, scale: float) -> float:
    """Reduce the requested scale so the output never exceeds MAX_OUTPUT_PIXELS."""
    if scale <= 1:
        return 1.0
    max_scale = math.sqrt(MAX_OUTPUT_PIXELS / float(width * height))
    return float(max(1.0, min(scale, max_scale)))


def upscale(img: np.ndarray, scale: float) -> np.ndarray:
    if scale <= 1.0:
        return img
    remaining = scale
    out = img
    # Progressive 2x passes give noticeably better detail than a single 4x jump
    while remaining >= 2.0 - 1e-6:
        out = _upscale_step(out, 2.0)
        remaining /= 2.0
    if remaining > 1.01:
        out = _upscale_step(out, remaining, iterations=2)
    return out


def sharpen(img: np.ndarray, strength: int, scale: float = 1.0) -> np.ndarray:
    """Multi-scale, noise-aware, halo-limited sharpening on the luminance channel."""
    if strength <= 0:
        return img
    a = strength / 100.0
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    L = lab[..., 0].astype(np.float32)

    sigma1 = 0.9 * max(1.0, scale * 0.7)
    sigma2 = sigma1 * 3.0
    blur1 = cv2.GaussianBlur(L, (0, 0), sigma1)
    blur2 = cv2.GaussianBlur(L, (0, 0), sigma2)
    fine = L - blur1      # fine texture / edges
    medium = blur1 - blur2  # larger structures softened by blur

    # Noise gate: don't amplify tiny fluctuations in flat areas (skin, sky)
    threshold = 1.5 + (1.0 - a) * 2.0
    mask = np.clip((np.abs(fine) - threshold * 0.5) / threshold, 0.0, 1.0)

    out = L + (1.8 * a) * fine * mask + (0.9 * a) * medium

    # Halo control: limit overshoot relative to the local min / max
    kernel = np.ones((3, 3), np.uint8)
    local_max = cv2.dilate(L, kernel)
    local_min = cv2.erode(L, kernel)
    overshoot = 6.0 + 10.0 * a
    out = np.clip(out, local_min - overshoot, local_max + overshoot)

    lab[..., 0] = np.clip(out, 0, 255).astype(np.uint8)
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


# --------------------------------------------------------------------------- #
# Full pipeline
# --------------------------------------------------------------------------- #
def enhance_array(
    bgr: np.ndarray, alpha: Optional[np.ndarray], settings: EnhanceSettings
) -> Tuple[np.ndarray, Optional[np.ndarray], float]:
    h, w = bgr.shape[:2]
    scale = effective_scale(w, h, settings.scale)

    out = denoise(bgr, settings.denoise)
    out = color_fix(out, settings.color_fix, settings.brightness)
    out = local_contrast(out, settings.contrast)
    out = vibrance(out, settings.vibrance)
    out = upscale(out, scale)
    out = sharpen(out, settings.sharpen, scale)

    if alpha is not None and scale > 1.0:
        alpha = cv2.resize(
            alpha, (out.shape[1], out.shape[0]), interpolation=cv2.INTER_LANCZOS4
        )
    return out, alpha, scale


def enhance_image(
    data: bytes, settings: EnhanceSettings, output_format: str = "PNG", quality: int = 95
) -> dict:
    bgr, alpha = load_image(data)
    h, w = bgr.shape[:2]
    out, alpha, scale = enhance_array(bgr, alpha, settings)
    encoded, fmt = encode_image(out, alpha, output_format, quality)
    return {
        "data": encoded,
        "format": fmt,
        "mime": MIME_TYPES[fmt],
        "original_width": w,
        "original_height": h,
        "width": out.shape[1],
        "height": out.shape[0],
        "scale": round(scale, 2),
    }


# --------------------------------------------------------------------------- #
# Analysis / smart recommendations
# --------------------------------------------------------------------------- #
def _noise_sigma(gray: np.ndarray) -> float:
    """Immerkaer's fast noise variance estimation."""
    h, w = gray.shape
    if h < 3 or w < 3:
        return 0.0
    kernel = np.array([[1, -2, 1], [-2, 4, -2], [1, -2, 1]], dtype=np.float32)
    conv = cv2.filter2D(gray.astype(np.float32), -1, kernel)
    return float(np.abs(conv).sum() * math.sqrt(0.5 * math.pi) / (6.0 * (w - 2) * (h - 2)))


def analyze_array(bgr: np.ndarray) -> dict:
    h, w = bgr.shape[:2]
    # Work on a normalised size so metrics are comparable between images
    factor = 1024.0 / max(h, w)
    small = cv2.resize(bgr, (max(1, int(w * factor)), max(1, int(h * factor))),
                       interpolation=cv2.INTER_AREA) if factor < 1 else bgr

    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    lab = cv2.cvtColor(small, cv2.COLOR_BGR2LAB).astype(np.float32)
    hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)

    # Light pre-blur so sensor noise doesn't masquerade as "sharp detail"
    blur_var = float(cv2.Laplacian(cv2.GaussianBlur(gray, (3, 3), 0), cv2.CV_64F).var())
    noise = _noise_sigma(gray)
    brightness = float(lab[..., 0].mean() / 255.0)
    contrast = float(lab[..., 0].std())
    cast_a = float(lab[..., 1].mean() - 128.0)
    cast_b = float(lab[..., 2].mean() - 128.0)
    cast = math.hypot(cast_a, cast_b)
    saturation = float(hsv[..., 1].mean() / 255.0)

    # Sharpness score 0-100 (log scale of laplacian variance)
    sharpness_score = int(np.clip((math.log10(blur_var + 1) - 1.0) / 2.0 * 100, 0, 100))

    issues = []
    rec = {"scale": 1, "sharpen": 25, "denoise": 10, "color_fix": 40,
           "contrast": 25, "vibrance": 15, "brightness": 0}

    longest = max(w, h)
    if longest < 1000:
        rec["scale"] = 4 if longest < 600 else 2
        issues.append(f"Low resolution ({w}x{h}) - upscaling recommended")
    elif longest < 2200:
        rec["scale"] = 2

    if blur_var < 60:
        rec["sharpen"] = 80
        issues.append("Image looks blurry - strong deblur recommended")
    elif blur_var < 180:
        rec["sharpen"] = 60
        issues.append("Image is slightly soft")
    elif blur_var < 500:
        rec["sharpen"] = 40
    else:
        rec["sharpen"] = 22

    if noise > 8:
        rec["denoise"] = 60
        issues.append("Heavy noise / grain detected")
    elif noise > 5:
        rec["denoise"] = 40
        issues.append("Visible noise / grain")
    elif noise > 3:
        rec["denoise"] = 22

    if cast > 8:
        rec["color_fix"] = 80
        tone = ("warm / yellow" if cast_b > 0 else "cool / blue") if abs(cast_b) >= abs(cast_a) \
            else ("magenta" if cast_a > 0 else "green")
        issues.append(f"Strong {tone} color cast")
    elif cast > 4:
        rec["color_fix"] = 60
        issues.append("Slight color cast")

    if brightness < 0.3:
        rec["brightness"] = 22
        rec["color_fix"] = max(rec["color_fix"], 65)
        rec["denoise"] = max(rec["denoise"], 35)
        issues.append("Underexposed / low light")
    elif brightness < 0.4:
        rec["brightness"] = 10
        issues.append("Slightly dark")
    elif brightness > 0.75:
        rec["brightness"] = -12
        issues.append("Overexposed / too bright")

    if contrast < 40:
        rec["contrast"] = 55
        issues.append("Flat / low contrast")
    elif contrast < 55:
        rec["contrast"] = 38

    if saturation < 0.18:
        rec["vibrance"] = 45
        issues.append("Washed-out colors")
    elif saturation < 0.32:
        rec["vibrance"] = 28

    # Don't sharpen noise aggressively
    if rec["denoise"] >= 40:
        rec["sharpen"] = min(rec["sharpen"], 60)

    return {
        "width": w,
        "height": h,
        "metrics": {
            "sharpness": sharpness_score,
            "blur_variance": round(blur_var, 1),
            "noise": round(noise, 2),
            "brightness": round(brightness * 100),
            "contrast": round(contrast, 1),
            "color_cast": round(cast, 1),
            "saturation": round(saturation * 100),
        },
        "issues": issues or ["Image is in good shape - light polish recommended"],
        "recommended": rec,
    }


def analyze_image(data: bytes) -> dict:
    bgr, _ = load_image(data)
    return analyze_array(bgr)


# --------------------------------------------------------------------------- #
# Self-test:  python image_enhancer.py
# --------------------------------------------------------------------------- #
if __name__ == "__main__":
    import time

    print("ClarityForge image engine self-test")
    rng = np.random.default_rng(0)
    base = np.zeros((300, 400, 3), np.uint8)
    cv2.rectangle(base, (40, 40), (200, 200), (60, 120, 200), -1)
    cv2.circle(base, (290, 150), 70, (40, 180, 90), -1)
    cv2.putText(base, "Clarity", (60, 270), cv2.FONT_HERSHEY_SIMPLEX, 1.4, (230, 230, 230), 3)
    # Degrade: blur + dark + warm cast + noise
    degraded = cv2.GaussianBlur(base, (0, 0), 2.0).astype(np.float32) * 0.55
    degraded[..., 2] += 25
    degraded += rng.normal(0, 8, degraded.shape)
    degraded = np.clip(degraded, 0, 255).astype(np.uint8)

    ok, png = cv2.imencode(".png", degraded)
    report = analyze_image(png.tobytes())
    print("Issues:", report["issues"])
    print("Recommended:", report["recommended"])

    t = time.time()
    result = enhance_image(png.tobytes(), EnhanceSettings.from_dict(report["recommended"]))
    print(f"Output {result['width']}x{result['height']} {result['format']} "
          f"in {time.time() - t:.2f}s (scale {result['scale']}x)")
    after = analyze_array(load_image(result["data"])[0])
    print("Before metrics:", report["metrics"])
    print("After metrics: ", after["metrics"])
