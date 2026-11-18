# 🖼️ ImageForge — Smart Image Optimization Studio

A complete, high-performance image compression and conversion suite built with **Python**, **FastAPI**, **Pillow**, and **React + Vite**.

Designed with a modern dark SaaS appearance, purple accents, single & batch uploads, smart auto-compression, aspect-ratio resizing, and before/after quality comparisons.

---

## 🌟 Key Features

- **6 Input Formats**: Supports **JPG / JPEG**, **PNG** (with transparency), **WebP**, **AVIF**, **GIF** (animated & static), and **HEIC / HEIF** (iPhone photos).
- **Smart Compression Mode**:
  - **JPG**: Optimized progressive JPEG encoding.
  - **PNG**: Lossless optimization with full alpha-channel transparency preserved.
  - **WebP**: High-efficiency quality-based encoding.
  - **AVIF**: Next-generation ultra-compressed format.
  - **GIF**: Preserves multi-frame animations and loop timing.
  - **HEIC / HEIF**: Decodes Apple iOS HEIC photos and converts them into web-friendly formats.
  - **AUTO Mode**: Evaluates image type and transparency to automatically pick the optimal format (e.g. WebP) for maximum size reduction with zero visual degradation.
- **Single & Batch Processing**:
  - Compress individual images or upload batches of up to **20 images** (up to 15 MB each).
  - Single downloads or single-click **ZIP Archive** download for batches.
- **Pro Aspect-Ratio Resizing**:
  - Proportional dimension scaling (`width × height`) ensuring images fit neatly inside target bounds without distortion.
- **Visual Quality Comparison**:
  - Interactive **Side-by-side** and **Interactive Before/After Slider** preview for instant quality inspection.
- **Live Compression Statistics**:
  - Original size, optimized size, percentage reduction, and space saved.

---

## 📂 Project Architecture

```
imageforge/
│
├── backend/
│   ├── main.py            # FastAPI REST API & static bundle server
│   ├── compressor.py      # Pillow + pillow-heif + pillow-avif compression engine
│   └── requirements.txt   # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Complete React application & Before/After comparison
│   │   ├── App.css        # Dark premium SaaS design with purple accents
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js     # Dev server with /compress API proxy
│
├── run.bat                # 1-Click launcher for Windows
└── README.md
```

---

## 🚀 Quick Start

### 1. 1-Click Windows Launch
Double-click `run.bat` in the `imageforge` folder. It starts the backend (which also serves the compiled frontend) and opens `http://127.0.0.1:8000`.

### 2. Manual Terminal Launch

#### Backend:
```bash
cd imageforge/backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
Open **`http://127.0.0.1:8000`** in your browser.

#### Frontend (Development Mode):
```bash
cd imageforge/frontend
npm run dev
```
Open **`http://localhost:5173`** for hot-reloading Vite dev server.

---

## 🌐 Deploy for Free Live

- **Backend**: Deploy on **Render.com** as a Web Service (`pip install -r requirements.txt`, start: `uvicorn main:app --host 0.0.0.0 --port $PORT`).
- **Frontend**: Deploy on **Cloudflare Pages** or **Vercel** pointing to `imageforge/frontend` with `VITE_API_URL` set to your Render backend URL.
