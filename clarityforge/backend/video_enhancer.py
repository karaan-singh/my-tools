"""
ClarityForge - Video enhancement pipeline (FFmpeg based).

Filter chain:
    hqdn3d (denoise) -> colorlevels (auto white balance + levels, measured from sampled frames)
    -> eq (exposure / contrast) -> vibrance -> scale (Lanczos upscale) -> unsharp + cas (deblur)
Audio is preserved (re-encoded to AAC), output is H.264 MP4 with +faststart.
"""

from __future__ import annotations

import math
import os
import re
import subprocess
import time
from typing import Optional

import cv2
import numpy as np
import imageio_ffmpeg

from image_enhancer import EnhanceSettings
from jobs import job_manager

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
MAX_OUTPUT_LONG_SIDE = 3840   # 4K UHD
MAX_OUTPUT_SHORT_SIDE = 2160
MAX_DURATION_SECONDS = 15 * 60
CREATE_FLAGS = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0


# --------------------------------------------------------------------------- #
# Probing & sampling
# --------------------------------------------------------------------------- #
def probe_video(path: str) -> dict:
    """Parse `ffmpeg -i` output for duration, resolution, fps and audio presence."""
    proc = subprocess.run(
        [FFMPEG, "-hide_banner", "-i", path],
        capture_output=True, text=True, errors="replace", creationflags=CREATE_FLAGS,
    )
    info = proc.stderr

    duration = 0.0
    m = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", info)
    if m:
        duration = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))

    width = height = 0
    fps = 0.0
    video_line = next((line for line in info.splitlines() if "Video:" in line), "")
    if not video_line:
        raise ValueError("No video stream found in this file.")
    m = re.search(r"(\d{2,5})x(\d{2,5})", video_line)
    if m:
        width, height = int(m.group(1)), int(m.group(2))
    m = re.search(r"([\d.]+)\s*fps", video_line)
    if m:
        fps = float(m.group(1))

    rotation = re.search(r"rotation of (-?[\d.]+)", info)
    if rotation and abs(round(float(rotation.group(1)))) % 180 == 90:
        width, height = height, width

    has_audio = any("Audio:" in line for line in info.splitlines())
    if not width or not height:
        raise ValueError("Could not read the video resolution.")
    return {"duration": duration, "width": width, "height": height, "fps": fps, "has_audio": has_audio}


def grab_frame(path: str, t: float, out_path: Optional[str] = None, max_width: int = 0):
    """Extract a single frame at time t. Returns a BGR array, or writes a JPEG if out_path is given."""
    vf = [f"scale='min({max_width},iw)':-2"] if max_width else []
    cmd = [FFMPEG, "-hide_banner", "-loglevel", "error", "-ss", f"{max(0.0, t):.3f}", "-i", path,
           "-frames:v", "1"]
    if vf:
        cmd += ["-vf", ",".join(vf)]
    if out_path:
        subprocess.run(cmd + ["-q:v", "2", "-y", out_path], capture_output=True, creationflags=CREATE_FLAGS)
        return out_path if os.path.exists(out_path) else None
    proc = subprocess.run(cmd + ["-f", "image2pipe", "-vcodec", "png", "-"],
                          capture_output=True, creationflags=CREATE_FLAGS)
    if not proc.stdout:
        return None
    return cv2.imdecode(np.frombuffer(proc.stdout, np.uint8), cv2.IMREAD_COLOR)


def measure_color(path: str, duration: float, samples: int = 6) -> Optional[dict]:
    """Sample frames across the video and measure per-channel levels and brightness."""
    lows, highs, means = [], [], []
    for i in range(samples):
        t = duration * (i + 0.5) / samples if duration > 0 else 0
        frame = grab_frame(path, t, max_width=480)
        if frame is None:
            continue
        flat = frame.reshape(-1, 3).astype(np.float32)
        lows.append(np.percentile(flat, 0.5, axis=0))
        highs.append(np.percentile(flat, 99.5, axis=0))
        means.append(float(cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)[..., 0].mean()) / 255.0)
    if not lows:
        return None
    lo = np.median(np.array(lows), axis=0)   # B, G, R
    hi = np.median(np.array(highs), axis=0)
    return {"low": lo.tolist(), "high": hi.tolist(), "brightness": float(np.median(means))}


# --------------------------------------------------------------------------- #
# Filter graph
# --------------------------------------------------------------------------- #
def output_scale(width: int, height: int, scale: float) -> float:
    if scale <= 1:
        return 1.0
    long_side, short_side = max(width, height), min(width, height)
    cap = min(MAX_OUTPUT_LONG_SIDE / long_side, MAX_OUTPUT_SHORT_SIDE / short_side)
    return float(max(1.0, min(scale, cap)))


def build_filters(s: EnhanceSettings, color: Optional[dict], scale: float) -> str:
    filters = []

    # 1) Denoise (spatial + temporal)
    if s.denoise > 0:
        ls = 1.0 + s.denoise / 100.0 * 6.0
        filters.append(f"hqdn3d={ls:.2f}:{ls * 0.75:.2f}:{ls * 1.5:.2f}:{ls * 1.1:.2f}")

    # 2) Auto white balance + levels (per-channel stretch measured from the footage)
    gamma = 1.0
    if s.color_fix > 0 and color:
        a = s.color_fix / 100.0
        b_lo, g_lo, r_lo = (v / 255.0 for v in color["low"])
        b_hi, g_hi, r_hi = (v / 255.0 for v in color["high"])

        def lvl(lo, hi):
            lo_v = min(lo * a, 0.25)
            hi_v = max(1.0 - (1.0 - hi) * a, 0.7)
            if hi_v - lo_v < 0.4:
                lo_v, hi_v = 0.0, 1.0
            return lo_v, hi_v

        (rmin, rmax), (gmin, gmax), (bmin, bmax) = lvl(r_lo, r_hi), lvl(g_lo, g_hi), lvl(b_lo, b_hi)
        filters.append(
            f"colorlevels=rimin={rmin:.4f}:gimin={gmin:.4f}:bimin={bmin:.4f}"
            f":rimax={rmax:.4f}:gimax={gmax:.4f}:bimax={bmax:.4f}"
        )

        # Auto exposure (estimate brightness after the levels stretch)
        avg_lo = (rmin + gmin + bmin) / 3
        avg_hi = (rmax + gmax + bmax) / 3
        mean = (color["brightness"] - avg_lo) / max(0.2, avg_hi - avg_lo)
        mean = float(np.clip(mean, 0.05, 0.95))
        if mean < 0.42 or mean > 0.62:
            exponent = float(np.clip(math.log(0.5) / math.log(mean), 0.6, 1.4))
            exponent = 1.0 + (exponent - 1.0) * a * 0.8
            gamma = 1.0 / exponent

    # 3) Exposure + global contrast
    if s.brightness:
        gamma *= 2.0 ** (s.brightness / 70.0)
    contrast = 1.0 + s.contrast / 100.0 * 0.28
    if abs(gamma - 1.0) > 0.01 or abs(contrast - 1.0) > 0.01:
        filters.append(f"eq=contrast={contrast:.3f}:gamma={gamma:.3f}")

    # 4) Vibrance
    if s.vibrance > 0:
        filters.append(f"vibrance=intensity={s.vibrance / 100.0 * 0.7:.3f}")

    # 5) Upscale (always force even dimensions for H.264 / yuv420p)
    filters.append(
        f"scale=w='trunc(iw*{scale:.4f}/2)*2':h='trunc(ih*{scale:.4f}/2)*2':flags=lanczos+accurate_rnd"
    )

    # 6) Deblur / sharpen
    if s.sharpen > 0:
        msize = 7 if scale >= 1.5 else 5
        amount = s.sharpen / 100.0 * 1.5
        filters.append(f"unsharp={msize}:{msize}:{amount:.2f}:{msize}:{msize}:0")
        filters.append(f"cas=strength={s.sharpen / 100.0 * 0.55:.3f}")

    filters.append("format=yuv420p")
    return ",".join(filters)


# --------------------------------------------------------------------------- #
# Background job
# --------------------------------------------------------------------------- #
def run_video_job(job_id: str, settings: EnhanceSettings, quality: str = "high") -> None:
    job = job_manager.get(job_id)
    if not job:
        return
    src, dst = job["input_path"], job["output_path"]
    started = time.time()

    try:
        job_manager.update(job_id, status="analyzing", stage="Reading video information")
        meta = probe_video(src)
        if meta["duration"] > MAX_DURATION_SECONDS:
            raise ValueError("Video is longer than 15 minutes. Please trim it first.")

        scale = output_scale(meta["width"], meta["height"], settings.scale)
        out_w = int(meta["width"] * scale) // 2 * 2
        out_h = int(meta["height"] * scale) // 2 * 2
        job_manager.update(
            job_id,
            original_width=meta["width"], original_height=meta["height"],
            width=out_w, height=out_h, scale=round(scale, 2),
            duration=round(meta["duration"], 2), fps=meta["fps"],
            stage="Measuring colors & exposure",
        )

        color = measure_color(src, meta["duration"]) if settings.color_fix > 0 else None
        vf = build_filters(settings, color, scale)
        crf = {"balanced": "21", "high": "18", "max": "15"}.get(quality, "18")

        cmd = [
            FFMPEG, "-hide_banner", "-y", "-i", src,
            "-map", "0:v:0", "-map", "0:a:0?",
            "-vf", vf,
            "-c:v", "libx264", "-preset", "medium", "-crf", crf,
            "-c:a", "aac", "-b:a", "192k",
            "-movflags", "+faststart",
            "-progress", "pipe:1", "-nostats",
            dst,
        ]

        if job_manager.get(job_id).get("cancel_requested"):
            raise InterruptedError
        job_manager.update(job_id, status="processing", stage="Enhancing frames", filters=vf)

        log_path = dst + ".log"
        with open(log_path, "w", encoding="utf-8", errors="replace") as log:
            proc = subprocess.Popen(
                cmd, stdout=subprocess.PIPE, stderr=log, text=True,
                errors="replace", creationflags=CREATE_FLAGS,
            )
            job_manager.set_process(job_id, proc)
            encode_start = time.time()
            for line in proc.stdout:
                key, _, value = line.strip().partition("=")
                if key in ("out_time_us", "out_time_ms") and value.isdigit() and meta["duration"] > 0:
                    done = int(value) / 1_000_000 / meta["duration"]
                    progress = float(np.clip(done, 0, 0.99))
                    elapsed = time.time() - encode_start
                    eta = elapsed / progress * (1 - progress) if progress > 0.02 else None
                    job_manager.update(job_id, progress=round(progress * 100, 1),
                                       eta_seconds=round(eta) if eta else None)
                elif key == "speed":
                    job_manager.update(job_id, speed=value)
            proc.wait()
            job_manager.clear_process(job_id)

        if job_manager.get(job_id).get("cancel_requested"):
            raise InterruptedError
        if proc.returncode != 0 or not os.path.exists(dst):
            with open(log_path, encoding="utf-8", errors="replace") as f:
                tail = f.read()[-600:]
            raise RuntimeError(f"FFmpeg failed: {tail.strip().splitlines()[-1] if tail.strip() else 'unknown error'}")

        # Before / after comparison frames
        job_manager.update(job_id, stage="Creating comparison preview", progress=99.5)
        t = meta["duration"] * 0.4
        before = grab_frame(src, t, out_path=job["frame_before_path"])
        after = grab_frame(dst, t, out_path=job["frame_after_path"])

        try:
            os.remove(log_path)
        except OSError:
            pass

        job_manager.update(
            job_id, status="completed", stage="Done", progress=100.0, eta_seconds=0,
            output_size=os.path.getsize(dst), process_time=round(time.time() - started, 1),
            has_frames=bool(before and after),
        )
    except InterruptedError:
        job_manager.update(job_id, status="cancelled", stage="Cancelled by user")
        _safe_remove(dst)
    except Exception as exc:  # noqa: BLE001
        job_manager.update(job_id, status="failed", stage="Failed", error=str(exc))
        _safe_remove(dst)
    finally:
        job_manager.clear_process(job_id)


def _safe_remove(path: str) -> None:
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except OSError:
        pass
