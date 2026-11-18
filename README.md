# my-tools

A collection of modern, high-performance web applications and media utilities.

---

## 🛠️ Included Tools

### 1. [🎬 Video Compressor Studio (`video-compressor/`)](./video-compressor)
A local, GPU/CPU-powered video compression web application with a bespoke **Ice Silver, Deep Aubergine & Marigold** interface built with Python, FFmpeg, and Streamlit.
- **Smart Presets**: Web & Social Media, Discord (< 8MB), Email (< 25MB), Archival High-Quality, and Maximum Space Saver.
- **Pro Custom Controls**: CRF rate control, target bitrate, resolution scaling (4K to 360p), codecs (H.264, H.265/HEVC, VP9), audio encoding, and video trimming.
- **Live Progress & Analytics**: Real-time FPS, encoding speed, elapsed time, and side-by-side Before/After video comparisons.
- **Batch Processing & Session History**: Compress queues of videos with unified settings and track cumulative bandwidth/storage savings.

### 2. [⚡ Universal Video Downloader (`universal-downloader/`)](./universal-downloader)
A full-stack media downloader built with **FastAPI**, **React**, **Vite**, **yt-dlp**, and **FFmpeg**.
- **Multi-Platform Support**: Downloads and inspects videos from YouTube, TikTok, X (Twitter), Vimeo, Reddit, SoundCloud, and direct links.
- **SSRF Protection**: Actively prevents Server-Side Request Forgery by blocking localhost, private subnets (`10.x`, `192.168.x`, `172.16.x`), and link-local cloud metadata endpoints.
- **Format & Audio Selection**: Select video resolutions from 4K down to 360p with audio merged via FFmpeg, or extract standalone 320 kbps MP3 / M4A audio.
- **Real-Time Progress Tracking**: Live polling of download progress, transfer speed, and ETA.
- **Single-Process Fullstack**: FastAPI serves the production React build directly, or supports hot-reloading Vite in dev mode.

---

## 🚀 Quick Start

To launch either tool, navigate to its folder and run its launcher or terminal command:

- **Universal Video Downloader**:
  ```bash
  cd universal-downloader/backend
  python -m uvicorn main:app --host 127.0.0.1 --port 8000
  ```
  *(Or double-click `universal-downloader/run.bat` on Windows).*

- **Video Compressor**:
  ```bash
  cd video-compressor
  python -m streamlit run app.py
  ```
  *(Or double-click `video-compressor/run.bat` on Windows).*
