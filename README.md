# my-tools

A collection of modern, high-performance web applications, media utilities, and optimization tools.

---

## 🛠️ Included Tools

### 1. [🖼️ ImageForge Optimization Studio (`imageforge/`)](./imageforge)
A complete image optimization platform powered by **Python (Pillow + pillow-heif + pillow-avif)** and **React + Vite**.
- **6 Supported Formats**: JPG, PNG, WebP, AVIF, GIF (animated & static), and HEIC/HEIF (Apple iOS photos).
- **Smart Compression**: Automatically detects transparency and animation to choose the most efficient format (e.g. WebP) with zero quality loss.
- **Batch Processing**: Upload and optimize up to 20 images at once with 1-click ZIP archive packaging.
- **Before / After Comparison**: Interactive side-by-side and interactive slider comparison to visually verify quality.
- **Aspect-Ratio Resizing**: Proportional scaling to fit target width and height.

### 2. [🎬 Video Compressor Studio (`video-compressor/`)](./video-compressor)
A local, GPU/CPU-powered video compression web application with a bespoke **Ice Silver, Deep Aubergine & Marigold** interface built with Python, FFmpeg, and Streamlit.
- **Smart Presets**: Web & Social Media, Discord (< 8MB), Email (< 25MB), Archival High-Quality, and Maximum Space Saver.
- **Pro Custom Controls**: CRF rate control, target bitrate, resolution scaling (4K to 360p), codecs (H.264, H.265/HEVC, VP9), audio encoding, and video trimming.
- **Live Progress & Analytics**: Real-time FPS, encoding speed, elapsed time, and side-by-side Before/After video comparisons.
- **Batch Processing & Session History**: Compress queues of videos with unified settings and track cumulative bandwidth/storage savings.

### 3. [⚡ Universal Video Downloader (`universal-downloader/`)](./universal-downloader)
A full-stack media downloader built with **FastAPI**, **React**, **Vite**, **yt-dlp**, and **FFmpeg**.
- **Multi-Platform Support**: Downloads and inspects videos from YouTube, TikTok, X (Twitter), Vimeo, Reddit, SoundCloud, and direct links.
- **Website Video Scanner**: Deeply crawls and sniffs all videos embedded (iframes, HTML5 tags, direct files) on any webpage.
- **SSRF Protection**: Actively prevents Server-Side Request Forgery by blocking localhost, private subnets (`10.x`, `192.168.x`, `172.16.x`), and link-local cloud metadata endpoints.
- **Format & Audio Selection**: Select video resolutions from 4K down to 360p with audio merged via FFmpeg, or extract standalone 320 kbps MP3 / M4A audio.
- **Real-Time Progress Tracking**: Live polling of download progress, transfer speed, and ETA.

---

## 🚀 Quick Start

To launch any tool, navigate to its folder and run its launcher or terminal command:

- **ImageForge**:
  ```bash
  cd imageforge/backend
  python -m uvicorn main:app --host 127.0.0.1 --port 8000
  ```
  *(Or double-click `imageforge/run.bat` on Windows).*

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
