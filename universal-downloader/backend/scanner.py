import json
import os
import re
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup
import yt_dlp

from security import validate_url
from extractor import get_ffmpeg_path, detect_platform, format_duration

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

VIDEO_EXTENSIONS = (".mp4", ".webm", ".mkv", ".mov", ".m4v", ".flv", ".avi", ".ts", ".m3u8")

def is_video_url(url: str) -> bool:
    """Check if URL points directly to a video file."""
    path = urlparse(url).path.lower()
    return any(path.endswith(ext) for ext in VIDEO_EXTENSIONS)

def clean_embed_url(url: str) -> str:
    """Convert embed URLs (like YouTube /embed/ or Vimeo /video/) to standard watch URLs."""
    if "youtube.com/embed/" in url:
        vid_id = url.split("youtube.com/embed/")[1].split("?")[0]
        return f"https://www.youtube.com/watch?v={vid_id}"
    elif "player.vimeo.com/video/" in url:
        vid_id = url.split("player.vimeo.com/video/")[1].split("?")[0]
        return f"https://vimeo.com/{vid_id}"
    return url

def scan_website_for_videos(page_url: str) -> Dict[str, Any]:
    """
    Scans a given website URL and extracts all downloadable videos on the page
    using yt-dlp playlist/flat extraction combined with deep HTML DOM sniffing.
    """
    is_valid, validation_msg = validate_url(page_url)
    if not is_valid:
        raise ValueError(validation_msg)

    discovered_videos: List[Dict[str, Any]] = []
    seen_urls = set()
    page_title = "Discovered Videos"

    # ---------------------------------------------------------
    # 1. yt-dlp Flat & Multi-Video Extraction
    # ---------------------------------------------------------
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "extract_flat": True,
        "socket_timeout": 12,
        "playlist_items": "1:50",
    }
    ffmpeg_exe = get_ffmpeg_path()
    if ffmpeg_exe:
        ydl_opts["ffmpeg_location"] = ffmpeg_exe

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            flat_info = ydl.extract_info(validation_msg, download=False)
            if flat_info:
                page_title = flat_info.get("title") or page_title

                # Check if this is a playlist / channel with multiple entries
                if "entries" in flat_info and flat_info.get("entries"):
                    for entry in flat_info["entries"]:
                        if not entry:
                            continue
                        e_url = entry.get("url") or entry.get("webpage_url")
                        if not e_url:
                            continue
                        if not e_url.startswith(("http://", "https://")):
                            # Could be relative youtube ID
                            e_url = f"https://www.youtube.com/watch?v={e_url}"

                        if e_url in seen_urls:
                            continue
                        seen_urls.add(e_url)

                        dur = entry.get("duration")
                        discovered_videos.append({
                            "id": entry.get("id") or str(len(discovered_videos) + 1),
                            "title": entry.get("title") or "Video",
                            "url": e_url,
                            "thumbnail": entry.get("thumbnail") or (entry.get("thumbnails", [{}])[0].get("url") if entry.get("thumbnails") else None),
                            "duration": dur,
                            "duration_formatted": format_duration(dur) if dur else "--:--",
                            "source_type": "Playlist / Feed Stream",
                            "platform": detect_platform(entry.get("extractor_key", ""), e_url)
                        })
    except Exception:
        # Fall through to HTML DOM sniffing if yt-dlp doesn't natively handle the whole page
        pass

    # ---------------------------------------------------------
    # 2. Deep HTML DOM Sniffing (for blogs, news, portfolios, embeds)
    # ---------------------------------------------------------
    try:
        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }
        resp = requests.get(validation_msg, headers=headers, timeout=12)
        if resp.status_code == 200 and "text/html" in resp.headers.get("Content-Type", ""):
            soup = BeautifulSoup(resp.text, "html.parser")

            # Extract page title
            title_tag = soup.find("title")
            if title_tag and title_tag.string:
                page_title = title_tag.string.strip()

            # A. HTML5 <video> tags
            for v_idx, video_tag in enumerate(soup.find_all("video")):
                v_src = video_tag.get("src")
                if not v_src:
                    # check nested <source>
                    src_child = video_tag.find("source")
                    if src_child:
                        v_src = src_child.get("src")

                if v_src:
                    full_v_src = urljoin(validation_msg, v_src)
                    if full_v_src not in seen_urls:
                        seen_urls.add(full_v_src)
                        poster = video_tag.get("poster")
                        poster_url = urljoin(validation_msg, poster) if poster else None

                        discovered_videos.append({
                            "id": f"html5_{v_idx+1}",
                            "title": video_tag.get("title") or f"HTML5 Video #{v_idx+1}",
                            "url": full_v_src,
                            "thumbnail": poster_url,
                            "duration": 0,
                            "duration_formatted": "Direct Stream",
                            "source_type": "HTML5 Video Tag",
                            "platform": "Direct Media"
                        })

            # B. <iframe> embeds (YouTube, Vimeo, Dailymotion, TikTok, Streamable, Loom, etc.)
            for ifr_idx, ifr in enumerate(soup.find_all("iframe")):
                src = ifr.get("src") or ifr.get("data-src")
                if not src:
                    continue

                full_src = urljoin(validation_msg, src)
                clean_url = clean_embed_url(full_src)

                # Filter for recognized video embed domains
                is_known_embed = any(
                    domain in clean_url.lower()
                    for domain in [
                        "youtube.com", "youtu.be", "vimeo.com", "dailymotion.com",
                        "tiktok.com", "streamable.com", "wistia.net", "loom.com", "player."
                    ]
                )

                if is_known_embed and clean_url not in seen_urls:
                    seen_urls.add(clean_url)
                    discovered_videos.append({
                        "id": f"embed_{ifr_idx+1}",
                        "title": ifr.get("title") or f"Embedded Video #{ifr_idx+1}",
                        "url": clean_url,
                        "thumbnail": None,
                        "duration": 0,
                        "duration_formatted": "Embedded Player",
                        "source_type": "Embedded IFrame Player",
                        "platform": detect_platform("", clean_url)
                    })

            # C. OpenGraph & Twitter video meta tags
            for prop in ["og:video", "og:video:url", "og:video:secure_url", "twitter:player", "twitter:player:stream"]:
                meta_tag = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
                if meta_tag and meta_tag.get("content"):
                    meta_url = urljoin(validation_msg, meta_tag["content"])
                    clean_meta_url = clean_embed_url(meta_url)
                    if clean_meta_url not in seen_urls:
                        seen_urls.add(clean_meta_url)
                        og_img = soup.find("meta", property="og:image")
                        thumb = og_img.get("content") if og_img else None
                        discovered_videos.append({
                            "id": f"meta_{prop}",
                            "title": page_title or "Page Feature Video",
                            "url": clean_meta_url,
                            "thumbnail": thumb,
                            "duration": 0,
                            "duration_formatted": "Featured Video",
                            "source_type": "Social Meta Tag",
                            "platform": detect_platform("", clean_meta_url)
                        })

            # D. Direct video download links (<a href="*.mp4">)
            for a_idx, a_tag in enumerate(soup.find_all("a", href=True)):
                href = a_tag["href"].strip()
                if is_video_url(href):
                    full_link = urljoin(validation_msg, href)
                    if full_link not in seen_urls:
                        seen_urls.add(full_link)
                        link_text = a_tag.get_text(strip=True) or os.path.basename(urlparse(full_link).path)
                        discovered_videos.append({
                            "id": f"link_{a_idx+1}",
                            "title": link_text[:80],
                            "url": full_link,
                            "thumbnail": None,
                            "duration": 0,
                            "duration_formatted": "Direct File",
                            "source_type": "Direct Link",
                            "platform": "File Download"
                        })

            # E. JSON-LD VideoObject schema
            for script_tag in soup.find_all("script", type="application/ld+json"):
                try:
                    data = json.loads(script_tag.string or "")
                    items = data if isinstance(data, list) else [data]
                    for it in items:
                        if isinstance(it, dict) and it.get("@type") == "VideoObject":
                            content_url = it.get("contentUrl") or it.get("embedUrl")
                            if content_url:
                                full_c_url = urljoin(validation_msg, content_url)
                                clean_c = clean_embed_url(full_c_url)
                                if clean_c not in seen_urls:
                                    seen_urls.add(clean_c)
                                    discovered_videos.append({
                                        "id": f"jsonld_{len(discovered_videos)+1}",
                                        "title": it.get("name") or "Schema Video",
                                        "url": clean_c,
                                        "thumbnail": it.get("thumbnailUrl") or (it.get("thumbnail", [None])[0] if isinstance(it.get("thumbnail"), list) else None),
                                        "duration": 0,
                                        "duration_formatted": it.get("duration") or "Schema Object",
                                        "source_type": "JSON-LD VideoObject",
                                        "platform": detect_platform("", clean_c)
                                    })
                except Exception:
                    pass

    except Exception:
        pass

    return {
        "page_url": validation_msg,
        "page_title": page_title,
        "total_found": len(discovered_videos),
        "videos": discovered_videos
    }
