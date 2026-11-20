# ✨ ClarityForge — Image & Video Enhancer

Make blurry, dark, dull or low-resolution photos and videos **sharper, cleaner, more colorful and bigger** — processed 100% locally.

## Features

| Feature | Photos | Videos |
| --- | --- | --- |
| **Upscale (more pixels)** | 2× / 4× progressive Lanczos + iterative back-projection super resolution (up to 24 MP) | 1.5× / 2× Lanczos upscaling (up to 4K) |
| **Deblur & sharpen** | Multi-scale, noise-gated, halo-limited sharpening on luminance | `unsharp` + Contrast Adaptive Sharpening (`cas`) |
| **Auto color fix** | Gray-world white balance, auto levels, auto exposure (LAB) | Per-channel `colorlevels` measured from sampled frames + auto gamma |
| **Local contrast** | CLAHE on luminance | `eq` contrast |
| **Vibrance** | Smart saturation that protects greys & skin | `vibrance` filter |
| **Denoise** | Non-local means | `hqdn3d` spatial + temporal denoise |
| **Smart analysis** | Detects blur, noise, color cast, exposure, low-res and recommends settings | — |
| **Comparison** | Drag before/after slider with 2.6× zoom inspection | Frame comparison slider + synced side-by-side playback |

Presets: Smart Auto, Portrait, Vivid Landscape, Low Light, Old Photo Restore, Fix Blur, Upscale Only.

## 📸 Pro Camera Look (iPhone / DSLR)

Turns ordinary photos into images that look shot on a flagship phone or a full-frame DSLR by recreating a camera's image pipeline:

| Look | What it does |
| --- | --- |
| **iPhone** | Smart HDR (single-image exposure fusion), Deep-Fusion style micro detail, clean auto white balance, bright natural tone curve, skin-safe color pop, ~12 MP output |
| **iPhone Portrait** | iPhone look + portrait-mode background blur |
| **DSLR** | Filmic S-curve with highlight roll-off, lens clarity, subtle split toning, vignette, fine film grain, ~24 MP output |
| **DSLR Portrait (85mm f/1.8)** | Subject detection (GrabCut seeded at your tap-to-focus point) + optical lens blur with bokeh highlight bloom and halo-free edges |
| **Night Mode** | Strong sensor-noise removal, shadow lifting, highlight protection |

Sliders: Look Strength, Smart HDR, Detail, Color Pop, Background Blur, Warmth, Vignette, Film Grain · Resolution: Original / 12 MP / 24 MP.

## Project structure

```
clarityforge/
├── backend/
│   ├── main.py             FastAPI routes (serves the built frontend too)
│   ├── image_enhancer.py   OpenCV image pipeline + analysis
│   ├── camera_look.py      iPhone / DSLR camera-look pipeline (HDR, bokeh, film character)
│   ├── video_enhancer.py   FFmpeg video pipeline (background jobs)
│   ├── jobs.py             Thread-safe job tracking & cleanup
│   └── requirements.txt
├── frontend/               React + Vite UI
└── run.bat                 One-click launcher (Windows)
```

## Run

```bash
cd backend
pip install -r requirements.txt
cd ../frontend
npm install
npm run build
cd ../backend
python -m uvicorn main:app --host 127.0.0.1 --port 8002
```

Open **http://127.0.0.1:8002** (or just double-click `run.bat` after building).

For frontend development with hot reload: `npm run dev` in `frontend/` (proxies `/api` to port 8002).

Test the image engine on its own: `python backend/image_enhancer.py`

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Engine status |
| POST | `/api/analyze/image` | Analyze a photo and get recommended settings |
| POST | `/api/enhance/image` | Enhance a photo (returns the image; stats in `X-*` headers) |
| POST | `/api/camera/image` | Apply an iPhone / DSLR camera look |
| POST | `/api/enhance/video` | Start a video job, returns `job_id` |
| GET | `/api/jobs/{id}` | Job progress / ETA |
| POST | `/api/jobs/{id}/cancel` | Cancel a running job |
| GET | `/api/jobs/{id}/file` | Stream / download (`?download=1`) the result |
| GET | `/api/jobs/{id}/frame/{before\|after}` | Comparison frames |

## Limits

- Photos: 25 MB input, 24 MP output
- Videos: 500 MB, 15 minutes, output capped at 3840×2160, 2 jobs in parallel
- Temporary video files are deleted automatically after 2 hours

> The engine uses classical computer-vision super resolution (fast, CPU-only, no model downloads).
> It recovers real detail and removes softness, but it can't invent detail that was never captured the way heavy generative AI models do.
