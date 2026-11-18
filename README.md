# my-tools

A collection of modern, high-performance web applications and utilities.

---

## 🛠️ Included Tools

### 1. [🎬 Video Compressor Studio (`video-compressor/`)](./video-compressor)
A local, GPU/CPU-powered video compression web application with a bespoke **Ice Silver, Deep Aubergine & Marigold** interface built with Python, FFmpeg, and Streamlit.
- **Smart Presets**: Web & Social Media, Discord (< 8MB), Email (< 25MB), Archival High-Quality, and Maximum Space Saver.
- **Pro Custom Controls**: CRF rate control, target bitrate, resolution scaling (4K to 360p), codecs (H.264, H.265/HEVC, VP9), audio encoding, and video trimming.
- **Live Progress & Analytics**: Real-time FPS, encoding speed, elapsed time, and side-by-side Before/After video comparisons.
- **Batch Processing & Session History**: Compress queues of videos with unified settings and track cumulative bandwidth/storage savings.

---

## 🚀 Quick Start

To launch any tool, navigate to its folder and check its dedicated README:
```bash
cd video-compressor
pip install -r requirements.txt
python -m streamlit run app.py
```
*(On Windows, you can also simply double-click `run.bat` inside the tool's folder).*
