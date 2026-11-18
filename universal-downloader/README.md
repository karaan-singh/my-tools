# ⚡ Universal Video Downloader

A modern, high-performance web application to inspect, stream, and download video and audio from popular media platforms with **FastAPI**, **React**, **yt-dlp**, and **FFmpeg**.

Built with a bespoke luxury aesthetic featuring **Ice Silver**, **Deep Aubergine**, and **Marigold**.

---

## 🌟 Key Features

- **Multi-Platform Support**: Powered by `yt-dlp` to extract media from YouTube, TikTok, X (Twitter), Vimeo, Reddit, SoundCloud, Instagram, Facebook, and direct media URLs.
- **SSRF Attack Protection**: Built-in IP validation actively blocks localhost (`127.0.0.1`, `0.0.0.0`), private corporate network subnets (`10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`), link-local metadata addresses (`169.254.169.254`), and non-HTTP protocols.
- **Rich Media Preview**: Instant thumbnail preview, duration pill, channel/uploader name, platform badge, and video description.
- **Quality & Format Selection**:
  - **Video (+Audio)**: 4K UHD, 2K QHD, 1080p FHD, 720p HD, 480p SD, and 360p (merged with high-bitrate audio via FFmpeg).
  - **Audio Only**: 320 kbps MP3 (re-encoded) or M4A/AAC lossless stream container.
- **Real-Time Progress Tracking**: Live polling of download progress (%), download speed (`MB/s`), ETA countdown, and merging status.
- **1-Click Download**: Saves finished media directly to the user's browser.
- **Session History**: Keeps track of recent downloads with 1-click re-download and disk cleanup.
- **Auto-Cleanup**: Background thread automatically purges downloaded files older than 2 hours to conserve disk space.

---

## 📂 Project Architecture

```
universal-downloader/
│
├── backend/
│   ├── main.py            # FastAPI REST API & static file server
│   ├── extractor.py       # yt-dlp metadata & format extraction engine
│   ├── downloader.py      # Background download execution & FFmpeg merging
│   ├── security.py        # SSRF filter, DNS resolver check & filename sanitizer
│   ├── jobs.py            # Thread-safe in-memory job tracker
│   └── requirements.txt   # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/    # Header, UrlInput, MediaPreview, FormatSelector, etc.
│   │   ├── services/      # Fetch API communication client
│   │   ├── App.jsx        # Root state management & polling loop
│   │   ├── index.css      # Deep Aubergine, Ice Silver & Marigold design tokens
│   │   └── main.jsx
│   ├── dist/              # Production optimized bundle
│   ├── package.json
│   └── vite.config.js
│
├── downloads/             # Temporary folder for media processing
├── run.bat                # 1-Click launcher for Windows
└── README.md
```

---

## 🚀 Quick Start

### 1. 1-Click Windows Launch
Double-click `run.bat` in the `universal-downloader` folder. It will start the server and open your browser automatically.

### 2. Manual Terminal Launch

#### Run Backend (+ Frontend Production Build):
```bash
cd universal-downloader/backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
Open **`http://127.0.0.1:8000`** in your browser.

#### Optional — Run Frontend in Vite Dev Mode:
```bash
cd universal-downloader/frontend
npm run dev
```
Open **`http://localhost:5173`** for hot-module reloading.

---

## 🛡️ Security & Terms Notice
This tool is intended strictly for downloading content users own or have explicit authorization to download. It does not bypass DRM, paywalls, or private content restrictions.
