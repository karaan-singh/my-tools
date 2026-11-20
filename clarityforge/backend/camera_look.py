"""
ClarityForge - "Pro Camera Look" engine.

Recreates the processing pipeline that makes iPhone / DSLR photos look the way they do:

    iPhone  : Smart HDR (exposure fusion), Deep-Fusion style micro detail, clean auto white
              balance, bright & natural tone curve, skin-safe color pop, ~12 MP output.
    DSLR    : Deeper filmic tone curve with highlight roll-off, rich micro-contrast, subtle
              split toning, lens vignette, fine film grain, ~24 MP output.
    Portrait: Subject detection (GrabCut seeded at the focus point) + optical lens blur
              (disc kernel, bokeh highlight bloom, halo-free normalized convolution).
"""

from __future__ import annotations

import math
from dataclasses import dataclass, asdict
from typing import Optional, Tuple

import cv2
import numpy as np

from image_enhancer import (
    MAX_OUTPUT_PIXELS, MIME_TYPES, _noise_sigma, color_fix, denoise, encode_image,
    load_image, sharpen, upscale,
)

# Hidden "color science" per look (user sliders scale on top of these)
LOOKS = {
    "iphone":          dict(curve=0.22, rolloff=0.30, split=0.00, clarity=0.28, denoise=0,  brightness=4),
    "iphone_portrait": dict(curve=0.24, rolloff=0.35, split=0.00, clarity=0.22, denoise=5,  brightness=3),
    "dslr":            dict(curve=0.42, rolloff=0.70, split=0.50, clarity=0.40, denoise=0,  brightness=0),
    "dslr_portrait":   dict(curve=0.38, rolloff=0.70, split=0.45, clarity=0.30, denoise=8,  brightness=2),
    "night":           dict(curve=0.20, rolloff=0.50, split=0.00, clarity=0.25, denoise=30, brightness=14),
}
RESOLUTIONS = {"original": 0, "12": 12_000_000, "24": 24_000_000}


@dataclass
class CameraSettings:
    look: str = "iphone"
    intensity: int = 80      # overall look strength (80 = 1.0x)
    hdr: int = 60            # Smart HDR: shadow / highlight recovery
    detail: int = 55         # Deep-Fusion style fine detail
    color: int = 32          # skin-safe color pop
    bokeh: int = 0           # background blur (portrait mode)
    warmth: int = 4          # -50..50 white balance temperature
    vignette: int = 0
    grain: int = 0
    resolution: str = "12"   # original | 12 | 24  (megapixels)
    focus_x: float = 0.5     # portrait focus point (0..1)
    focus_y: float = 0.45

    @classmethod
    def from_dict(cls, data: dict) -> "CameraSettings":
        s = cls()
        for key in asdict(s):
            if key in data and data[key] is not None:
                setattr(s, key, data[key])
        if s.look not in LOOKS:
            s.look = "iphone"
        s.resolution = str(s.resolution)
        if s.resolution not in RESOLUTIONS:
            s.resolution = "12"
        clip = lambda v, lo, hi: max(lo, min(hi, v))  # noqa: E731
        for key in ("intensity", "hdr", "detail", "color", "bokeh", "vignette", "grain"):
            setattr(s, key, int(clip(int(getattr(s, key)), 0, 100)))
        s.warmth = int(clip(int(s.warmth), -50, 50))
        s.focus_x = float(clip(float(s.focus_x), 0.0, 1.0))
        s.focus_y = float(clip(float(s.focus_y), 0.0, 1.0))
        return s


def _to8(x: np.ndarray) -> np.ndarray:
    return np.clip(x * 255.0 + 0.5, 0, 255).astype(np.uint8)


# --------------------------------------------------------------------------- #
# Smart HDR (single-image exposure fusion)
# --------------------------------------------------------------------------- #
def smart_hdr(bgr: np.ndarray, amount: float) -> np.ndarray:
    """Fuse synthetic -1.2EV / 0 / +1.6EV exposures (Mertens) and transfer the result
    as a luminance gain map, so shadows open up and highlights hold - like Smart HDR."""
    if amount <= 0.01:
        return bgr
    h, w = bgr.shape[:2]
    factor = min(1.0, math.sqrt(3_000_000 / float(h * w)))
    small = cv2.resize(bgr, (max(1, int(w * factor)), max(1, int(h * factor))),
                       interpolation=cv2.INTER_AREA) if factor < 1 else bgr

    lin = np.power(small.astype(np.float32) / 255.0, 2.2)
    under = _to8(np.power(lin * 0.45, 1 / 2.2))
    over = _to8(np.power(np.clip(lin * 3.0, 0, 1), 1 / 2.2))
    fused = cv2.createMergeMertens(1.0, 1.0, 1.0).process([under, small, over])
    fused = np.clip(fused, 0, 1)

    lo = cv2.cvtColor(small, cv2.COLOR_BGR2LAB)[..., 0].astype(np.float32) / 255.0
    lf = cv2.cvtColor(_to8(fused), cv2.COLOR_BGR2LAB)[..., 0].astype(np.float32) / 255.0
    gain = (lf + 0.03) / (lo + 0.03)

    # Keep mid-tones anchored so the photo doesn't get globally darker / flatter
    mids = (lo > 0.35) & (lo < 0.65)
    if mids.sum() > 100:
        gain /= float(np.median(gain[mids]))
    gain = np.clip(gain, 0.55, 3.0)
    gain = cv2.GaussianBlur(gain, (0, 0), 1.2)
    gain = np.power(gain, min(1.25, amount))
    if factor < 1:
        gain = cv2.resize(gain, (w, h), interpolation=cv2.INTER_LINEAR)

    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    lab[..., 0] = np.clip(lab[..., 0] * gain, 0, 255)
    return cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2BGR)


# --------------------------------------------------------------------------- #
# Tone & color science
# --------------------------------------------------------------------------- #
def _clarity(L: np.ndarray, amount: float) -> np.ndarray:
    """Mid-frequency local contrast (the 'pop' of a good lens), mid-tone weighted."""
    if amount <= 0:
        return L
    h, w = L.shape
    f = min(1.0, 512.0 / max(h, w))
    small = cv2.resize(L, (max(1, int(w * f)), max(1, int(h * f))), interpolation=cv2.INTER_AREA)
    base = cv2.resize(cv2.GaussianBlur(small, (0, 0), 6.0), (w, h), interpolation=cv2.INTER_LINEAR)
    detail = np.clip(L - base, -0.15, 0.15)
    mid = 1.0 - np.square(2.0 * L - 1.0)
    return np.clip(L + amount * 1.2 * detail * (0.3 + 0.7 * mid), 0, 1)


def _tone_curve(x: np.ndarray, contrast: float, rolloff: float) -> np.ndarray:
    """S-curve contrast + soft filmic shoulder (no harsh digital clipping)."""
    s = x * x * (3.0 - 2.0 * x)
    y = x + contrast * (s - x)
    if rolloff > 0:
        knee, white, k = 0.80, 1.0 - 0.025 * rolloff, 1.0 + rolloff
        t = np.clip((y - knee) / (1.0 - knee), 0, 1)
        shoulder = knee + (white - knee) * (1 - np.exp(-k * t)) / (1 - math.exp(-k))
        y = np.where(y > knee, shoulder, y)
    return np.clip(y, 0, 1)


def tone_grade(bgr: np.ndarray, contrast: float, rolloff: float, warmth: float,
               split: float, clarity: float) -> np.ndarray:
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    L = lab[..., 0] / 255.0
    L = _clarity(L, clarity)
    L = _tone_curve(L, contrast, rolloff)
    lab[..., 1] += warmth * 0.06
    lab[..., 2] += warmth * 0.28
    if split:
        # DSLR "color science": slightly cooler shadows, warmer highlights
        lab[..., 2] += split * 5.0 * (L - 0.5)
    lab[..., 0] = L * 255.0
    return cv2.cvtColor(np.clip(lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)


def color_pop(bgr: np.ndarray, amount: float) -> np.ndarray:
    """Vibrance that protects skin tones (hue ~0-25deg) from turning orange."""
    if amount <= 0:
        return bgr
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
    hue, sat = hsv[..., 0], hsv[..., 1] / 255.0
    dist = np.minimum(np.abs(hue - 10.0), 180.0 - np.abs(hue - 10.0))
    skin = np.clip(1.0 - (dist - 8.0) / 10.0, 0, 1) * (sat > 0.12)
    boost = amount * 1.1 * (1.0 - 0.6 * skin)
    sat = sat + boost * sat * (1.0 - sat)
    hsv[..., 1] = np.clip(sat * 255.0, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)


# --------------------------------------------------------------------------- #
# Portrait mode: subject mask + lens blur
# --------------------------------------------------------------------------- #
def subject_mask(bgr: np.ndarray, focus: Tuple[float, float]) -> Tuple[np.ndarray, float]:
    """Estimate the subject around the focus point with a two-pass GrabCut."""
    h, w = bgr.shape[:2]
    fx, fy = focus

    def fallback() -> np.ndarray:
        m = np.zeros((h, w), np.float32)
        cv2.ellipse(m, (int(fx * w), int(fy * h)), (int(w * 0.24), int(h * 0.40)), 0, 0, 360, 1.0, -1)
        return m

    # Pass 1 - coarse, seeded by a rectangle around the focus point
    f1 = min(1.0, 400.0 / max(h, w))
    small = cv2.resize(bgr, (max(8, int(w * f1)), max(8, int(h * f1))), interpolation=cv2.INTER_AREA)
    sh, sw = small.shape[:2]
    # Subjects (people, products) are usually "grounded": the box runs from above the
    # focus point down to the bottom edge of the frame.
    rw = int(sw * 0.62)
    x0 = int(np.clip(fx * sw - rw / 2, 1, max(1, sw - rw - 1)))
    y0 = int(np.clip(fy * sh - sh * 0.45, 1, max(1, sh * 0.5)))
    rh = max(8, sh - y0 - 1)
    px, py = int(np.clip(fx * sw, 0, sw - 1)), int(np.clip(fy * sh, 0, sh - 1))

    mask = np.zeros((sh, sw), np.uint8)
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    try:
        cv2.grabCut(small, mask, (x0, y0, rw, rh), bgd, fgd, 4, cv2.GC_INIT_WITH_RECT)
        cv2.circle(mask, (px, py), max(3, sw // 25), cv2.GC_FGD, -1)
        cv2.grabCut(small, mask, None, bgd, fgd, 2, cv2.GC_INIT_WITH_MASK)
    except cv2.error:
        m = fallback()
        return cv2.GaussianBlur(m, (0, 0), max(h, w) * 0.01), float(m.mean())

    fg = ((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)).astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(fg, 8)
    if n > 1:
        label = labels[py, px] or (1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA])))
        fg = (labels == label).astype(np.uint8)
    k = max(3, sw // 40) | 1
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))

    coverage = float(fg.mean())
    if coverage < 0.03 or coverage > 0.9:
        m = fallback()
        return cv2.GaussianBlur(m, (0, 0), max(h, w) * 0.01), float(m.mean())

    # Pass 2 - refine edges at higher resolution
    f2 = min(1.0, 900.0 / max(h, w))
    mid = cv2.resize(bgr, (max(8, int(w * f2)), max(8, int(h * f2))), interpolation=cv2.INTER_AREA)
    mh, mw = mid.shape[:2]
    up = cv2.resize(fg, (mw, mh), interpolation=cv2.INTER_NEAREST)
    band = max(3, mw // 60) | 1
    se = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (band, band))
    sure_fg, maybe = cv2.erode(up, se), cv2.dilate(up, se)
    m2 = np.full((mh, mw), cv2.GC_BGD, np.uint8)
    m2[maybe == 1] = cv2.GC_PR_BGD
    m2[up == 1] = cv2.GC_PR_FGD
    m2[sure_fg == 1] = cv2.GC_FGD
    try:
        bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
        cv2.grabCut(mid, m2, None, bgd, fgd, 2, cv2.GC_INIT_WITH_MASK)
        refined = ((m2 == cv2.GC_FGD) | (m2 == cv2.GC_PR_FGD)).astype(np.float32)
    except cv2.error:
        refined = up.astype(np.float32)

    out = cv2.resize(refined, (w, h), interpolation=cv2.INTER_LINEAR)
    out = cv2.GaussianBlur(out, (0, 0), max(1.5, max(h, w) * 0.003))
    return np.clip(out, 0, 1), float(refined.mean())


def _disc(radius: int) -> np.ndarray:
    y, x = np.ogrid[-radius:radius + 1, -radius:radius + 1]
    k = (x * x + y * y <= radius * radius + radius * 0.5).astype(np.float32)
    return k / k.sum()


def lens_blur(bgr: np.ndarray, fg: np.ndarray, strength: int) -> np.ndarray:
    """Optical-style background blur: disc aperture, highlight bloom ('bokeh balls'),
    and normalized convolution so the subject never bleeds into the background."""
    h, w = bgr.shape[:2]
    radius_full = strength / 100.0 * 0.03 * max(h, w)  # up to ~f/1.4 look
    if radius_full < 1.5:
        return bgr

    f = min(1.0, 24.0 / radius_full)  # blur is smooth -> compute at reduced size
    sw, sh = max(8, int(w * f)), max(8, int(h * f))
    small = cv2.resize(bgr, (sw, sh), interpolation=cv2.INTER_AREA)
    sfg = cv2.resize(fg, (sw, sh), interpolation=cv2.INTER_LINEAR)
    hard = cv2.dilate((sfg > 0.4).astype(np.uint8), np.ones((3, 3), np.uint8))
    bg_w = 1.0 - hard.astype(np.float32)

    lin = np.power(small.astype(np.float32) / 255.0, 2.2)
    lum = lin.mean(axis=2)
    bloom = 1.0 + 3.0 * np.square(np.clip((lum - 0.7) / 0.3, 0, 1))
    lin *= bloom[..., None]

    kernel = _disc(max(1, int(round(radius_full * f))))
    num = cv2.filter2D(lin * bg_w[..., None], -1, kernel)
    den = cv2.filter2D(bg_w, -1, kernel)
    fallback = cv2.filter2D(lin, -1, kernel)
    blurred = np.where(den[..., None] > 0.05, num / np.maximum(den[..., None], 1e-6), fallback)
    blurred = np.power(np.clip(blurred, 0, 1), 1 / 2.2) * 255.0
    blurred = cv2.resize(blurred, (w, h), interpolation=cv2.INTER_CUBIC)

    a = fg[..., None]
    return np.clip(bgr.astype(np.float32) * a + blurred * (1 - a), 0, 255).astype(np.uint8)


# --------------------------------------------------------------------------- #
# Lens character
# --------------------------------------------------------------------------- #
def vignette(bgr: np.ndarray, amount: float) -> np.ndarray:
    if amount <= 0:
        return bgr
    h, w = bgr.shape[:2]
    y = np.linspace(-1, 1, h, dtype=np.float32)[:, None]
    x = np.linspace(-1, 1, w, dtype=np.float32)[None, :]
    r = np.sqrt(x * x + y * y) / math.sqrt(2)
    t = np.clip((r - 0.35) / 0.65, 0, 1)
    fall = 1.0 - amount * 0.45 * (t * t * (3 - 2 * t))
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    lab[..., 0] *= fall
    return cv2.cvtColor(np.clip(lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)


def film_grain(bgr: np.ndarray, amount: float, seed: int = 7) -> np.ndarray:
    if amount <= 0:
        return bgr
    h, w = bgr.shape[:2]
    rng = np.random.default_rng(seed)
    noise = rng.standard_normal((h, w), dtype=np.float32)
    size = max(0.5, max(h, w) / 4000.0 * 0.8)
    noise = cv2.GaussianBlur(noise, (0, 0), size)
    noise /= max(1e-6, float(noise.std()))
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    L = lab[..., 0] / 255.0
    weight = 0.4 + 0.6 * (1.0 - np.square(2.0 * L - 1.0))
    lab[..., 0] += noise * amount * 9.0 * weight
    return cv2.cvtColor(np.clip(lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)


def target_scale(width: int, height: int, resolution: str) -> float:
    target = RESOLUTIONS.get(resolution, 0)
    if not target:
        return 1.0
    scale = math.sqrt(min(target, MAX_OUTPUT_PIXELS) / float(width * height))
    return float(np.clip(scale, 1.0, 4.0))


# --------------------------------------------------------------------------- #
# Full pipeline
# --------------------------------------------------------------------------- #
def camera_enhance_array(bgr: np.ndarray, alpha: Optional[np.ndarray], s: CameraSettings):
    look = LOOKS[s.look]
    k = s.intensity / 80.0
    h, w = bgr.shape[:2]

    # 1. Sensor-noise aware denoise (camera ISP style)
    probe = bgr if h * w <= 4_000_000 else cv2.resize(bgr, (w // 2, h // 2), interpolation=cv2.INTER_AREA)
    noise = _noise_sigma(cv2.cvtColor(probe, cv2.COLOR_BGR2GRAY))
    dn = float(np.clip((noise - 1.2) * 14.0, 0, 70)) + look["denoise"]
    out = denoise(bgr, int(np.clip(dn * min(k, 1.2), 0, 85)))

    # 2. Auto white balance + auto exposure
    out = color_fix(out, int(np.clip(45 * k, 0, 60)), look["brightness"])

    # 3. Smart HDR
    out = smart_hdr(out, s.hdr / 100.0 * k)

    # 4. Tone curve, warmth, split toning, clarity
    out = tone_grade(out, look["curve"] * k, look["rolloff"], s.warmth,
                     look["split"] * k, look["clarity"] * k)

    # 5. Skin-safe color pop
    out = color_pop(out, s.color / 100.0 * k)

    # 6. Portrait mode
    mask, coverage = None, None
    if s.bokeh > 0:
        mask, coverage = subject_mask(out, (s.focus_x, s.focus_y))
        out = lens_blur(out, mask, s.bokeh)

    # 7. Resolution (12 MP / 24 MP)
    scale = target_scale(w, h, s.resolution)
    out = upscale(out, scale)
    if mask is not None and scale > 1:
        mask = cv2.resize(mask, (out.shape[1], out.shape[0]), interpolation=cv2.INTER_LINEAR)

    # 8. Deep-Fusion style detail (only on the in-focus subject in portrait mode)
    sharp = sharpen(out, int(np.clip(s.detail * k, 0, 100)), scale)
    if mask is not None:
        m = mask[..., None]
        out = np.clip(sharp.astype(np.float32) * m + out.astype(np.float32) * (1 - m), 0, 255).astype(np.uint8)
    else:
        out = sharp

    # 9. Lens character
    out = vignette(out, s.vignette / 100.0 * k)
    out = film_grain(out, s.grain / 100.0 * k)

    if alpha is not None and scale > 1:
        alpha = cv2.resize(alpha, (out.shape[1], out.shape[0]), interpolation=cv2.INTER_LANCZOS4)
    return out, alpha, scale, coverage


def camera_enhance(data: bytes, settings: CameraSettings, output_format: str = "JPEG",
                   quality: int = 95) -> dict:
    bgr, alpha = load_image(data)
    h, w = bgr.shape[:2]
    out, alpha, scale, coverage = camera_enhance_array(bgr, alpha, settings)
    encoded, fmt = encode_image(out, alpha, output_format, quality)
    return {
        "data": encoded, "format": fmt, "mime": MIME_TYPES[fmt],
        "original_width": w, "original_height": h,
        "width": out.shape[1], "height": out.shape[0],
        "scale": round(scale, 2),
        "subject_coverage": None if coverage is None else round(coverage * 100, 1),
    }


# --------------------------------------------------------------------------- #
# Self-test:  python camera_look.py
# --------------------------------------------------------------------------- #
if __name__ == "__main__":
    import time

    rng = np.random.default_rng(3)
    # Synthetic "phone snapshot": busy background, subject in the middle, dull & noisy
    img = (rng.random((600, 800, 3)) * 255).astype(np.uint8)
    img = cv2.GaussianBlur(img, (0, 0), 6)
    img = cv2.normalize(img, None, 40, 200, cv2.NORM_MINMAX)
    for i in range(12):
        cv2.circle(img, (int(rng.integers(0, 800)), int(rng.integers(0, 250))), 6, (250, 250, 250), -1)
    cv2.ellipse(img, (400, 330), (130, 220), 0, 0, 360, (90, 120, 190), -1)   # "person"
    cv2.circle(img, (400, 170), 70, (120, 150, 210), -1)                       # "head"
    img = (img.astype(np.float32) * 0.7 + rng.normal(0, 6, img.shape)).clip(0, 255).astype(np.uint8)
    ok, jpg = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 85])

    for look in LOOKS:
        bokeh = 70 if "portrait" in look else 0
        res = "24" if look.startswith("dslr") else "12"
        s = CameraSettings.from_dict({"look": look, "bokeh": bokeh, "resolution": res,
                                      "vignette": 20 if look.startswith("dslr") else 0,
                                      "grain": 8 if look.startswith("dslr") else 0})
        t = time.time()
        r = camera_enhance(jpg.tobytes(), s)
        print(f"{look:16} -> {r['width']}x{r['height']} {r['format']} {len(r['data']) / 1e6:.2f} MB "
              f"in {time.time() - t:.1f}s  subject={r['subject_coverage']}")
