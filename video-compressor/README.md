# 🎬 OptiVideo — Modern Video Compression Tool

A professional, high-performance video compression web application built with **Python**, **FFmpeg**, and **Streamlit**.

Designed with a modern dark glassmorphism interface, purple gradient accents, live progress feedback, before-and-after video comparison, and smart presets.

---

## 🌟 Key Features

- **Drag-and-Drop Video Upload**: Supports MP4, MOV, MKV, AVI, WebM, and M4V.
- **Smart Presets**:
  - 🚀 **Web & Social Media**: Balanced CRF 26 + 1080p cap (60-75% reduction).
  - 💬 **Discord Target**: Auto-calculates bitrate to compress under 8 MB.
  - 📧 **Email Attachment Target**: Auto-calculates bitrate to compress under 25 MB.
  - 💎 **High Quality Archival**: CRF 20 + original resolution (near-lossless).
  - 🗜️ **Maximum Space Saver**: CRF 32 + 720p HD (75-90% reduction).
- **Pro Custom Controls**:
  - **Rate Modes**: CRF (18 to 40), Target File Size (MB), or Target Bitrate (kbps).
  - **Resolution Scaling**: Original, 1080p, 720p, 480p, 360p, 75%, 50%.
  - **Codecs**: H.264 (Universal), H.265 (HEVC), VP9 (WebM).
  - **Audio Controls**: AAC 128k, AAC 96k, Copy Original Audio, or Mute.
  - **Speed Presets**: `ultrafast`, `fast`, `medium`, `slow`.
  - **Video Trimming**: Select start and end timestamps to compress only a clip.
- **Real-Time Progress Tracking**: Live progress bar showing encoding speed, FPS, and elapsed time.
- **Before & After Visual Comparison**: Side-by-side video playback of original and compressed files.
- **Compression Metrics**: Original Size, Compressed Size, Size Reduction (%), Space Saved, and Elapsed Time.
- **Batch Compression**: Process multiple videos simultaneously with unified presets.
- **Session History & Analytics**: Track cumulative bandwidth and storage saved across jobs, with 1-click re-download.

---

## 🚀 Quick Start

### 1. Launch directly
Double-click `run.bat` in the `video-compressor` folder.

Or run from terminal:
```bash
cd "c:\xampp\htdocs\xampp\company web\my tool\video-compressor"
python -m streamlit run app.py
```

The application will open in your browser at `http://localhost:8501`.

---

## 📂 Project Structure

```
video-compressor/
│
├── app.py                # Streamlit Web Application (UI, cards, charts, preview)
├── compressor.py         # FFmpeg Engine (metadata parsing, bitrate calculations, progress streaming)
├── requirements.txt      # Python dependencies
├── run.bat               # 1-Click Windows launcher script
├── uploads/              # Temporary storage for uploaded videos
└── compressed/           # Output directory for compressed videos
```

---

## 🛠️ Technologies Used

- **Python 3.10+**
- **FFmpeg 9.0+** (Auto-detected from PATH or bundled via `imageio-ffmpeg`)
- **Streamlit** (Interactive reactive Web UI)
- **HTML5 & CSS3** (Custom glassmorphic dark theme)
