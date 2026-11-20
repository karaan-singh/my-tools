"""
ClarityForge API - AI-style image & video enhancement.

Run:  python -m uvicorn main:app --host 127.0.0.1 --port 8002
"""

from __future__ import annotations

import json
import os
import re
import sys
import threading
import time
from contextlib import asynccontextmanager
from urllib.parse import quote

import cv2
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from image_enhancer import EnhanceSettings, analyze_image, enhance_image, OUTPUT_FORMATS  # noqa: E402
from camera_look import CameraSettings, camera_enhance  # noqa: E402
from jobs import job_manager  # noqa: E402
from video_enhancer import FFMPEG, run_video_job  # noqa: E402

BASE_DIR = os.path.dirname(CURRENT_DIR)
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")
STORAGE_DIR = os.path.join(CURRENT_DIR, "storage")
os.makedirs(STORAGE_DIR, exist_ok=True)

MAX_IMAGE_BYTES = 25 * 1024 * 1024          # 25 MB
MAX_VIDEO_BYTES = 500 * 1024 * 1024         # 500 MB
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff", ".heic", ".heif", ".avif", ".gif"}
VIDEO_EXT = {".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v", ".3gp", ".wmv"}
MAX_PARALLEL_VIDEO_JOBS = 2
_video_slots = threading.Semaphore(MAX_PARALLEL_VIDEO_JOBS)


def _cleaner() -> None:
    while True:
        try:
            job_manager.cleanup(max_age_seconds=7200)
        except Exception:
            pass
        time.sleep(900)


@asynccontextmanager
async def lifespan(_: FastAPI):
    threading.Thread(target=_cleaner, daemon=True).start()
    yield


app = FastAPI(title="ClarityForge API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def safe_stem(filename: str) -> str:
    stem = os.path.splitext(os.path.basename(filename or "file"))[0]
    stem = re.sub(r"[^a-zA-Z0-9_-]+", "_", stem).strip("_")
    return stem[:60] or "file"


def parse_settings(raw: str) -> EnhanceSettings:
    try:
        data = json.loads(raw) if raw else {}
        if not isinstance(data, dict):
            raise ValueError
    except ValueError:
        raise HTTPException(400, "Invalid settings JSON.")
    return EnhanceSettings.from_dict(data)


async def read_image_upload(file: UploadFile) -> bytes:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in IMAGE_EXT:
        raise HTTPException(400, "Unsupported image type. Use JPG, PNG, WebP, HEIC, AVIF, BMP or TIFF.")
    data = await file.read(MAX_IMAGE_BYTES + 1)
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(413, "Image is larger than 25 MB.")
    if not data:
        raise HTTPException(400, "Empty file.")
    return data


# --------------------------------------------------------------------------- #
# Routes
# --------------------------------------------------------------------------- #
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "opencv": cv2.__version__,
        "ffmpeg": os.path.exists(FFMPEG),
        "active_jobs": sum(1 for j in job_manager.list() if j["status"] in ("queued", "analyzing", "processing")),
    }


@app.post("/api/analyze/image")
async def analyze(file: UploadFile = File(...)):
    data = await read_image_upload(file)
    try:
        return await run_in_threadpool(analyze_image, data)
    except ValueError as exc:
        raise HTTPException(400, str(exc))


@app.post("/api/enhance/image")
async def enhance(
    file: UploadFile = File(...),
    settings: str = Form("{}"),
    output_format: str = Form("PNG"),
    quality: int = Form(95),
):
    data = await read_image_upload(file)
    fmt = output_format.upper().replace("JPG", "JPEG")
    if fmt not in OUTPUT_FORMATS:
        raise HTTPException(400, "Output format must be PNG, JPEG or WEBP.")
    opts = parse_settings(settings)

    started = time.time()
    try:
        result = await run_in_threadpool(enhance_image, data, opts, fmt, max(60, min(100, quality)))
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    except MemoryError:
        raise HTTPException(413, "Not enough memory - try a smaller upscale factor.")

    return image_response(result, data, file.filename, "enhanced", started)


def image_response(result: dict, original: bytes, name: str, suffix: str, started: float) -> Response:
    ext = "jpg" if result["format"] == "JPEG" else result["format"].lower()
    filename = f"{safe_stem(name)}_{suffix}.{ext}"
    headers = {
        "Content-Disposition": f"inline; filename*=UTF-8''{quote(filename)}",
        "X-Filename": quote(filename),
        "X-Original-Width": str(result["original_width"]),
        "X-Original-Height": str(result["original_height"]),
        "X-Output-Width": str(result["width"]),
        "X-Output-Height": str(result["height"]),
        "X-Scale": str(result["scale"]),
        "X-Original-Size": str(len(original)),
        "X-Output-Size": str(len(result["data"])),
        "X-Output-Format": result["format"],
        "X-Process-Time": f"{time.time() - started:.2f}",
    }
    if result.get("subject_coverage") is not None:
        headers["X-Subject-Coverage"] = str(result["subject_coverage"])
    return Response(content=result["data"], media_type=result["mime"], headers=headers)


@app.post("/api/camera/image")
async def camera_look(
    file: UploadFile = File(...),
    settings: str = Form("{}"),
    output_format: str = Form("JPEG"),
):
    """Pro Camera Look: iPhone / DSLR style processing."""
    data = await read_image_upload(file)
    fmt = output_format.upper().replace("JPG", "JPEG")
    if fmt not in OUTPUT_FORMATS:
        raise HTTPException(400, "Output format must be PNG, JPEG or WEBP.")
    try:
        raw = json.loads(settings) if settings else {}
        if not isinstance(raw, dict):
            raise ValueError
    except ValueError:
        raise HTTPException(400, "Invalid settings JSON.")
    opts = CameraSettings.from_dict(raw)

    started = time.time()
    try:
        result = await run_in_threadpool(camera_enhance, data, opts, fmt, 95)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    except MemoryError:
        raise HTTPException(413, "Not enough memory - try a lower resolution.")
    return image_response(result, data, file.filename, opts.look, started)


@app.post("/api/enhance/video")
async def enhance_video(
    file: UploadFile = File(...),
    settings: str = Form("{}"),
    quality: str = Form("high"),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in VIDEO_EXT:
        raise HTTPException(400, "Unsupported video type. Use MP4, MOV, MKV, WebM, AVI or M4V.")
    opts = parse_settings(settings)
    if opts.scale > 2:
        opts.scale = 2.0

    stem = safe_stem(file.filename)
    job_id = job_manager.create(
        filename=f"{stem}_enhanced.mp4",
        original_name=file.filename,
        settings=opts.__dict__,
    )
    paths = {
        "input_path": os.path.join(STORAGE_DIR, f"{job_id}_in{ext}"),
        "output_path": os.path.join(STORAGE_DIR, f"{job_id}_out.mp4"),
        "frame_before_path": os.path.join(STORAGE_DIR, f"{job_id}_before.jpg"),
        "frame_after_path": os.path.join(STORAGE_DIR, f"{job_id}_after.jpg"),
    }

    # Stream upload to disk with a size limit
    size = 0
    try:
        with open(paths["input_path"], "wb") as out:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_VIDEO_BYTES:
                    raise HTTPException(413, "Video is larger than 500 MB.")
                out.write(chunk)
    except HTTPException:
        os.remove(paths["input_path"])
        job_manager.update(job_id, status="failed", error="File too large")
        raise
    if size == 0:
        raise HTTPException(400, "Empty file.")

    job_manager.update(job_id, original_size=size, **paths)

    def worker():
        with _video_slots:
            run_video_job(job_id, opts, quality)

    threading.Thread(target=worker, daemon=True).start()
    return {"success": True, "job_id": job_id}


@app.get("/api/jobs/{job_id}")
def get_job(job_id: str):
    job = job_manager.public(job_id)
    if not job:
        raise HTTPException(404, "Job not found.")
    return job


@app.post("/api/jobs/{job_id}/cancel")
def cancel_job(job_id: str):
    if not job_manager.cancel(job_id):
        raise HTTPException(400, "Job cannot be cancelled.")
    return {"success": True}


@app.get("/api/jobs/{job_id}/file")
def job_file(job_id: str, download: int = 0):
    job = job_manager.get(job_id)
    if not job or job["status"] != "completed":
        raise HTTPException(404, "Enhanced video is not available.")
    path = job["output_path"]
    if not os.path.exists(path):
        raise HTTPException(404, "File has expired.")
    return FileResponse(
        path, media_type="video/mp4", filename=job["filename"],
        content_disposition_type="attachment" if download else "inline",
    )


@app.get("/api/jobs/{job_id}/frame/{which}")
def job_frame(job_id: str, which: str):
    job = job_manager.get(job_id)
    if not job or which not in ("before", "after"):
        raise HTTPException(404, "Frame not found.")
    path = job.get(f"frame_{which}_path")
    if not path or not os.path.exists(path):
        raise HTTPException(404, "Frame not available.")
    return FileResponse(path, media_type="image/jpeg")


# Serve the built React frontend
if os.path.isdir(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8002)
