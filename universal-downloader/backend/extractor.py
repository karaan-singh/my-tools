import os
import shutil
from typing import Any, Dict, List, Optional
import yt_dlp

def get_ffmpeg_path() -> Optional[str]:
    """Find FFmpeg binary path."""
    sys_ffmpeg = shutil.which("ffmpeg")
    if sys_ffmpeg:
        return sys_ffmpeg
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None

def format_duration(seconds: Optional[float]) -> str:
    """Format duration in seconds to MM:SS or HH:MM:SS."""
    if not seconds or seconds <= 0:
        return "Unknown"
    s = int(seconds)
    m, s = divmod(s, 60)
    h, m = divmod(m, 60)
    if h > 0:
        return f"{h:02d}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"

def format_size(bytes_size: Optional[int]) -> str:
    """Format byte size to MB or GB."""
    if not bytes_size or bytes_size <= 0:
        return "Size N/A"
    if bytes_size < 1024 * 1024:
        return f"{bytes_size / 1024:.1f} KB"
    elif bytes_size < 1024 * 1024 * 1024:
        return f"{bytes_size / (1024 * 1024):.1f} MB"
    else:
        return f"{bytes_size / (1024 * 1024 * 1024):.2f} GB"

def detect_platform(extractor_key: str, url: str) -> str:
    """Return a clean platform name from extractor key or domain."""
    k = (extractor_key or "").lower()
    u = (url or "").lower()
    if "youtube" in k or "youtu.be" in u:
        return "YouTube"
    if "vimeo" in k:
        return "Vimeo"
    if "twitter" in k or "x.com" in u:
        return "X / Twitter"
    if "tiktok" in k:
        return "TikTok"
    if "reddit" in k:
        return "Reddit"
    if "instagram" in k:
        return "Instagram"
    if "facebook" in k or "fb" in k:
        return "Facebook"
    if "soundcloud" in k:
        return "SoundCloud"
    if "dailymotion" in k:
        return "Dailymotion"
    if "twitch" in k:
        return "Twitch"
    if "pinterest" in k:
        return "Pinterest"
    return extractor_key.title() if extractor_key else "Universal Web Video"

def extract_media_info(url: str) -> Dict[str, Any]:
    """
    Extract media information and organized downloadable formats from a given URL.
    """
    ffmpeg_exe = get_ffmpeg_path()
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "no_color": True,
        "socket_timeout": 15,
        "extract_flat": False,
        "noplaylist": True,
    }
    if ffmpeg_exe:
        ydl_opts["ffmpeg_location"] = ffmpeg_exe

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
        except Exception as e:
            err_msg = str(e)
            # Make common errors user-friendly
            if "Private video" in err_msg or "Sign in" in err_msg:
                raise ValueError("This video is private, age-restricted, or requires login.")
            elif "DRM" in err_msg:
                raise ValueError("This media is protected by Digital Rights Management (DRM) and cannot be downloaded.")
            elif "Video unavailable" in err_msg:
                raise ValueError("The requested video is unavailable or has been removed.")
            else:
                raise ValueError(f"Could not extract video information: {err_msg[:200]}")

    if not info:
        raise ValueError("No video information could be retrieved from this URL.")

    # In case of playlist, get the first item
    if "entries" in info:
        entries = [e for e in info.get("entries", []) if e]
        if not entries:
            raise ValueError("No media found in the provided URL.")
        info = entries[0]

    raw_formats = info.get("formats", [])
    duration_sec = info.get("duration")

    # Group and filter video resolutions
    video_options = []
    seen_resolutions = set()

    # Sort formats from highest to lowest quality
    sorted_formats = sorted(
        raw_formats,
        key=lambda f: (f.get("height") or 0, f.get("tbr") or 0),
        reverse=True
    )

    for f in sorted_formats:
        height = f.get("height")
        vcodec = f.get("vcodec", "none")
        if not height or vcodec == "none":
            continue

        res_label = f"{height}p"
        if height >= 2160:
            quality_tag = "4K UHD"
        elif height >= 1440:
            quality_tag = "2K QHD"
        elif height >= 1080:
            quality_tag = "1080p FHD"
        elif height >= 720:
            quality_tag = "720p HD"
        elif height >= 480:
            quality_tag = "480p SD"
        elif height >= 360:
            quality_tag = "360p"
        else:
            quality_tag = f"{height}p"

        # Unique key by resolution and container
        ext = f.get("ext", "mp4")
        if ext not in ["mp4", "webm"]:
            ext = "mp4"

        combo_key = f"{height}_{ext}"
        if combo_key in seen_resolutions:
            continue
        seen_resolutions.add(combo_key)

        filesize = f.get("filesize") or f.get("filesize_approx")
        if not filesize and f.get("tbr") and duration_sec:
            # Estimate filesize from total bitrate: kbps * seconds / 8
            filesize = int((f.get("tbr") * 1000 * duration_sec) / 8)

        video_options.append({
            "format_id": f.get("format_id"),
            "height": height,
            "resolution": res_label,
            "quality_tag": quality_tag,
            "ext": ext,
            "fps": f.get("fps"),
            "filesize_bytes": filesize,
            "filesize_formatted": format_size(filesize),
            "vcodec": vcodec.split(".")[0],
            "acodec": f.get("acodec", "none").split(".")[0]
        })

    # Deduplicate video options to have 1 primary entry per standard resolution
    standard_heights = [2160, 1440, 1080, 720, 480, 360]
    final_video_options = []
    captured_heights = set()
    for v in video_options:
        h = v["height"]
        if h not in captured_heights and (h in standard_heights or len(captured_heights) < 6):
            captured_heights.add(h)
            final_video_options.append(v)

    # Audio formats
    audio_options = [
        {
            "format_id": "bestaudio",
            "title": "MP3 High Quality (Audio)",
            "ext": "mp3",
            "quality_tag": "320 kbps (Re-encoded)",
            "type": "audio"
        },
        {
            "format_id": "bestaudio",
            "title": "M4A / AAC (Original Audio Stream)",
            "ext": "m4a",
            "quality_tag": "Lossless Container",
            "type": "audio"
        }
    ]

    return {
        "title": info.get("title", "Untitled Video"),
        "description": (info.get("description") or "")[:200],
        "thumbnail": info.get("thumbnail"),
        "duration": duration_sec or 0,
        "duration_formatted": format_duration(duration_sec),
        "uploader": info.get("uploader") or info.get("channel") or "Unknown Creator",
        "platform": detect_platform(info.get("extractor_key", ""), url),
        "webpage_url": info.get("webpage_url", url),
        "video_options": final_video_options,
        "audio_options": audio_options,
    }
