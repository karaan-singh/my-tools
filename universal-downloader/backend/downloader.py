import os
import shutil
import threading
import time
from typing import Any, Dict, Optional
import yt_dlp
from jobs import job_manager
from extractor import get_ffmpeg_path, format_size, format_duration
from security import sanitize_filename

def format_speed(bytes_per_sec: Optional[float]) -> str:
    if not bytes_per_sec or bytes_per_sec <= 0:
        return "0 KB/s"
    if bytes_per_sec < 1024 * 1024:
        return f"{bytes_per_sec / 1024:.1f} KB/s"
    return f"{bytes_per_sec / (1024 * 1024):.2f} MB/s"

def run_download_job(job_id: str, url: str, options: Dict[str, Any], downloads_dir: str):
    """
    Executes yt-dlp download in a background thread and streams progress to job_manager.
    """
    job_manager.update_job(job_id, status="downloading", progress=0.0)
    ffmpeg_exe = get_ffmpeg_path()

    os.makedirs(downloads_dir, exist_ok=True)

    is_audio = options.get("is_audio", False)
    target_ext = options.get("ext", "mp4").lower()
    height = options.get("height")
    format_id = options.get("format_id")

    # Safe output template
    out_tmpl = os.path.join(downloads_dir, "%(title).100B_%(id)s.%(ext)s")

    def progress_hook(d):
        status = d.get("status")
        if status == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            downloaded = d.get("downloaded_bytes") or 0
            speed = d.get("speed")
            eta = d.get("eta")

            pct = 0.0
            if total > 0:
                pct = min(99.0, (downloaded / total) * 100.0)

            eta_str = format_duration(eta) if eta else "--:--"

            job_manager.update_job(
                job_id,
                status="downloading",
                progress=round(pct, 1),
                downloaded_bytes=downloaded,
                total_bytes=total,
                speed=format_speed(speed),
                eta=eta or 0,
                eta_formatted=eta_str
            )
        elif status == "finished":
            job_manager.update_job(
                job_id,
                status="processing",
                progress=99.0,
                speed="Merging...",
                eta_formatted="Finishing"
            )

    ydl_opts = {
        "outtmpl": out_tmpl,
        "progress_hooks": [progress_hook],
        "quiet": True,
        "no_warnings": True,
        "no_color": True,
        "socket_timeout": 30,
        "restrictfilenames": True,
        "noplaylist": True,
    }

    if ffmpeg_exe:
        ydl_opts["ffmpeg_location"] = ffmpeg_exe

    if is_audio:
        # Audio Extraction
        ydl_opts["format"] = "bestaudio/best"
        if target_ext == "mp3":
            ydl_opts["postprocessors"] = [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "320",
            }]
        elif target_ext == "m4a":
            ydl_opts["postprocessors"] = [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "m4a",
            }]
    else:
        # Video + Audio merging
        if height:
            ydl_opts["format"] = f"bestvideo[height<={height}]+bestaudio/best[height<={height}]/best"
        elif format_id and format_id != "best":
            ydl_opts["format"] = f"{format_id}+bestaudio/best"
        else:
            ydl_opts["format"] = "bestvideo+bestaudio/best"

        if target_ext in ["mp4", "webm", "mkv"]:
            ydl_opts["merge_output_format"] = target_ext

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            if "entries" in info:
                info = info["entries"][0]

            final_path = ydl.prepare_filename(info)

            # Check if postprocessor changed extension (e.g. to .mp3)
            if is_audio and target_ext in ["mp3", "m4a"]:
                base, _ = os.path.splitext(final_path)
                target_path = f"{base}.{target_ext}"
                if os.path.exists(target_path):
                    final_path = target_path

            if not os.path.exists(final_path):
                # Search directory for file matching base
                base = os.path.splitext(os.path.basename(final_path))[0]
                for f in os.listdir(downloads_dir):
                    if base in f and not f.endswith(".part"):
                        final_path = os.path.join(downloads_dir, f)
                        break

            if os.path.exists(final_path):
                file_size = os.path.getsize(final_path)
                filename = os.path.basename(final_path)

                job_manager.update_job(
                    job_id,
                    status="completed",
                    progress=100.0,
                    filename=filename,
                    file_path=final_path,
                    filesize=file_size,
                    filesize_formatted=format_size(file_size),
                    eta_formatted="Completed",
                    speed="Done"
                )
            else:
                job_manager.update_job(
                    job_id,
                    status="failed",
                    error="Downloaded file could not be located on disk."
                )

    except Exception as e:
        err = str(e)
        if "DRM" in err:
            err = "This media is protected by Digital Rights Management (DRM) and cannot be downloaded."
        job_manager.update_job(job_id, status="failed", error=err[:250])

def start_download_task(job_id: str, url: str, options: Dict[str, Any], downloads_dir: str):
    """Spawns download thread."""
    t = threading.Thread(
        target=run_download_job,
        args=(job_id, url, options, downloads_dir),
        daemon=True
    )
    t.start()
