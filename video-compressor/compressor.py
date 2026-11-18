import os
import re
import shutil
import subprocess
import tempfile
import threading
import time
from typing import Callable, Dict, Optional, Tuple, Any

def get_ffmpeg_path() -> str:
    """Return the path to ffmpeg executable (system PATH or imageio_ffmpeg bundled)."""
    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return system_ffmpeg
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        raise FileNotFoundError(
            "FFmpeg could not be found. Please install FFmpeg on your system or run: pip install imageio-ffmpeg"
        )

def format_size(bytes_size: int) -> str:
    """Format bytes to human-readable string (KB, MB, GB)."""
    if bytes_size < 1024:
        return f"{bytes_size} B"
    elif bytes_size < 1024 ** 2:
        return f"{bytes_size / 1024:.2f} KB"
    elif bytes_size < 1024 ** 3:
        return f"{bytes_size / (1024 ** 2):.2f} MB"
    else:
        return f"{bytes_size / (1024 ** 3):.2f} GB"

def format_duration(seconds: float) -> str:
    """Format seconds into HH:MM:SS or MM:SS."""
    seconds = max(0, seconds)
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    if h > 0:
        return f"{h:02d}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"

def get_video_metadata(video_path: str) -> Dict[str, Any]:
    """
    Extract comprehensive video metadata using FFmpeg output inspection.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")

    file_size_bytes = os.path.getsize(video_path)
    ffmpeg_exe = get_ffmpeg_path()

    cmd = [ffmpeg_exe, "-hide_banner", "-nostdin", "-i", video_path]
    proc = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        stdin=subprocess.DEVNULL,
        text=True,
        errors="replace"
    )
    stderr = proc.stderr

    metadata = {
        "file_size": file_size_bytes,
        "file_size_formatted": format_size(file_size_bytes),
        "duration": 0.0,
        "duration_formatted": "00:00",
        "width": 0,
        "height": 0,
        "resolution": "Unknown",
        "resolution_name": "Original",
        "fps": 0.0,
        "video_codec": "Unknown",
        "audio_codec": "None",
        "bitrate_kbps": 0,
        "has_audio": False,
        "raw_info": stderr
    }

    # Duration parsing: "Duration: 00:01:23.45"
    dur_match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.?\d*)", stderr)
    if dur_match:
        h, m, s = map(float, dur_match.groups())
        duration = h * 3600 + m * 60 + s
        metadata["duration"] = duration
        metadata["duration_formatted"] = format_duration(duration)

    # Bitrate parsing: "bitrate: 4521 kb/s"
    br_match = re.search(r"bitrate:\s*(\d+)\s*kb/s", stderr)
    if br_match:
        metadata["bitrate_kbps"] = int(br_match.group(1))
    elif metadata["duration"] > 0:
        # Estimate bitrate from file size and duration
        metadata["bitrate_kbps"] = int((file_size_bytes * 8) / (metadata["duration"] * 1000))

    # Video stream parsing
    v_match = re.search(r"Stream.*?Video:\s*([^\s,]+).*?,\s*(\d{2,5})x(\d{2,5})", stderr)
    if v_match:
        metadata["video_codec"] = v_match.group(1).lower()
        w = int(v_match.group(2))
        h = int(v_match.group(3))
        metadata["width"] = w
        metadata["height"] = h
        metadata["resolution"] = f"{w}x{h}"
        
        # Friendly resolution label
        if w >= 3800 or h >= 2100:
            metadata["resolution_name"] = "4K UHD"
        elif w >= 1900 or h >= 1050:
            metadata["resolution_name"] = "1080p FHD"
        elif w >= 1200 or h >= 700:
            metadata["resolution_name"] = "720p HD"
        elif w >= 840 or h >= 470:
            metadata["resolution_name"] = "480p SD"
        elif w >= 600 or h >= 350:
            metadata["resolution_name"] = "360p"
        else:
            metadata["resolution_name"] = f"{w}x{h}"

    # FPS parsing
    fps_match = re.search(r"(\d+(?:\.\d+)?)\s*fps", stderr)
    if fps_match:
        metadata["fps"] = float(fps_match.group(1))

    # Audio stream parsing
    a_match = re.search(r"Stream.*?Audio:\s*([^\s,]+)", stderr)
    if a_match:
        metadata["audio_codec"] = a_match.group(1).lower()
        metadata["has_audio"] = True

    return metadata

def compute_scale_filter(res_option: str, original_w: int, original_h: int) -> Optional[str]:
    """
    Compute FFmpeg scale filter while ensuring dimensions are even (required by H.264/libx264).
    """
    if res_option == "original" or not res_option:
        return None
    elif res_option == "4k":
        return "scale='min(3840,iw)':-2"
    elif res_option == "1080p":
        return "scale='min(1920,iw)':-2"
    elif res_option == "720p":
        return "scale='min(1280,iw)':-2"
    elif res_option == "480p":
        return "scale='min(854,iw)':-2"
    elif res_option == "360p":
        return "scale='min(640,iw)':-2"
    elif res_option == "75%":
        return "scale=trunc(iw*0.75/2)*2:trunc(ih*0.75/2)*2"
    elif res_option == "50%":
        return "scale=trunc(iw*0.50/2)*2:trunc(ih*0.50/2)*2"
    elif res_option == "25%":
        return "scale=trunc(iw*0.25/2)*2:trunc(ih*0.25/2)*2"
    return None

def compress_video(
    input_path: str,
    output_path: str,
    options: Dict[str, Any],
    progress_callback: Optional[Callable[[Dict[str, Any]], None]] = None
) -> Tuple[bool, str]:
    """
    Compress a video using FFmpeg with real-time progress monitoring.
    """
    ffmpeg_exe = get_ffmpeg_path()
    meta = get_video_metadata(input_path)
    total_duration = meta["duration"]

    trim_start = options.get("trim_start")
    trim_end = options.get("trim_end")
    if trim_start is not None and trim_end is not None and trim_end > trim_start:
        effective_duration = trim_end - trim_start
    elif trim_start is not None:
        effective_duration = max(0.1, total_duration - trim_start)
    else:
        effective_duration = total_duration

    mode = options.get("mode", "crf")
    codec = options.get("codec", "libx264")
    preset = options.get("preset", "medium")
    res_opt = options.get("resolution", "original")
    audio_mode = options.get("audio_mode", "aac")
    audio_kbps = options.get("audio_bitrate", 128)
    fps = options.get("fps")

    cmd = [ffmpeg_exe, "-y", "-nostdin"]

    # Trimming options
    if trim_start is not None and trim_start > 0:
        cmd.extend(["-ss", str(trim_start)])
    if trim_end is not None and trim_end > (trim_start or 0):
        cmd.extend(["-to", str(trim_end)])

    # Input file & progress pipe
    cmd.extend(["-i", input_path, "-progress", "pipe:1", "-nostats"])

    # Scale filter
    scale_filter = compute_scale_filter(res_opt, meta["width"], meta["height"])
    if scale_filter:
        cmd.extend(["-vf", scale_filter])

    # Video Codec
    cmd.extend(["-c:v", codec])

    # Rate control
    if mode == "target_size":
        target_size_mb = float(options.get("target_size_mb", 10.0))
        if effective_duration > 0:
            total_kbits = target_size_mb * 8192
            total_kbps = total_kbits / effective_duration
            if audio_mode != "mute" and meta["has_audio"]:
                effective_audio_kbps = min(audio_kbps, max(32, int(total_kbps * 0.15)))
                v_bitrate_kbps = max(50, int(total_kbps - effective_audio_kbps))
                audio_kbps = effective_audio_kbps
            else:
                v_bitrate_kbps = max(50, int(total_kbps))
        else:
            v_bitrate_kbps = 1000

        cmd.extend([
            "-b:v", f"{v_bitrate_kbps}k",
            "-maxrate", f"{int(v_bitrate_kbps * 1.5)}k",
            "-bufsize", f"{int(v_bitrate_kbps * 2)}k"
        ])
    elif mode == "bitrate":
        v_bitrate_kbps = int(options.get("video_bitrate_kbps", 1500))
        cmd.extend([
            "-b:v", f"{v_bitrate_kbps}k",
            "-maxrate", f"{int(v_bitrate_kbps * 1.4)}k",
            "-bufsize", f"{int(v_bitrate_kbps * 2)}k"
        ])
    else: # CRF mode
        crf = int(options.get("crf", 26))
        cmd.extend(["-crf", str(crf)])

    # Preset
    if "libvpx" in codec:
        cmd.extend(["-deadline", "good", "-cpu-used", "2"])
    else:
        cmd.extend(["-preset", preset])

    # Framerate
    if fps:
        cmd.extend(["-r", str(fps)])

    # Pixel format for compatibility (especially H.264)
    if codec in ["libx264", "libx265"]:
        cmd.extend(["-pix_fmt", "yuv420p"])

    # Web optimization (faststart)
    if output_path.lower().endswith((".mp4", ".mov", ".m4v")):
        cmd.extend(["-movflags", "+faststart"])

    # Audio settings
    if not meta["has_audio"] or audio_mode == "mute":
        cmd.append("-an")
    elif audio_mode == "copy":
        cmd.extend(["-c:a", "copy"])
    else:
        if output_path.lower().endswith(".webm") or codec == "libvpx-vp9":
            cmd.extend(["-c:a", "libopus", "-b:a", f"{audio_kbps}k"])
        else:
            cmd.extend(["-c:a", "aac", "-b:a", f"{audio_kbps}k"])

    cmd.append(output_path)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    start_time = time.time()
    try:
        # Use temp file for stderr to avoid Windows pipe buffer deadlock
        with tempfile.TemporaryFile(mode="w+", encoding="utf-8", errors="replace") as stderr_tmp:
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=stderr_tmp,
                stdin=subprocess.DEVNULL,
                text=True,
                errors="replace",
                bufsize=1
            )

            current_info = {
                "progress": 0.0,
                "speed": "1.0x",
                "fps": 0.0,
                "out_time": 0.0,
                "effective_duration": effective_duration,
                "elapsed_seconds": 0.0
            }

            for line in proc.stdout:
                line = line.strip()
                if not line:
                    continue

                if line.startswith("out_time_us="):
                    try:
                        us = int(line.split("=")[1])
                        cur_sec = us / 1000000.0
                        current_info["out_time"] = cur_sec
                        if effective_duration > 0:
                            prog = min(0.99, cur_sec / effective_duration)
                        else:
                            prog = 0.5
                        current_info["progress"] = max(current_info["progress"], prog)
                    except Exception:
                        pass
                elif line.startswith("out_time_ms="):
                    try:
                        ms = int(line.split("=")[1])
                        cur_sec = ms / 1000000.0
                        current_info["out_time"] = cur_sec
                        if effective_duration > 0:
                            prog = min(0.99, cur_sec / effective_duration)
                        else:
                            prog = 0.5
                        current_info["progress"] = max(current_info["progress"], prog)
                    except Exception:
                        pass
                elif line.startswith("speed="):
                    current_info["speed"] = line.split("=")[1].strip()
                elif line.startswith("fps="):
                    try:
                        current_info["fps"] = float(line.split("=")[1].strip())
                    except Exception:
                        pass

                current_info["elapsed_seconds"] = time.time() - start_time

                if progress_callback:
                    progress_callback(current_info)

            return_code = proc.wait()

            stderr_tmp.seek(0)
            stderr_output = stderr_tmp.read()

            if return_code != 0:
                return False, f"FFmpeg error (code {return_code}): {stderr_output[-400:]}"

            if progress_callback:
                current_info["progress"] = 1.0
                progress_callback(current_info)

            return True, "Compression completed successfully."

    except Exception as e:
        return False, f"Error executing compression: {str(e)}"
