import os
import sys
import threading
import time
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Ensure current dir is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from security import validate_url, cleanup_old_files
from extractor import extract_media_info
from jobs import job_manager
from downloader import start_download_task

BASE_DIR = os.path.dirname(CURRENT_DIR)
DOWNLOADS_DIR = os.path.join(BASE_DIR, "downloads")
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")

os.makedirs(DOWNLOADS_DIR, exist_ok=True)

# Background cleanup thread
def background_cleaner():
    while True:
        try:
            cleanup_old_files(DOWNLOADS_DIR, max_age_seconds=7200)
        except Exception:
            pass
        time.sleep(1800)  # Every 30 minutes

@asynccontextmanager
async def lifespan(app: FastAPI):
    cleaner_thread = threading.Thread(target=background_cleaner, daemon=True)
    cleaner_thread.start()
    yield

app = FastAPI(
    title="Universal Video Downloader API",
    description="High-performance, secure video and audio extraction and downloading backend powered by yt-dlp & FFmpeg.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend (Vite dev server or production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Request & Response Models
# -----------------------------------------------------------------------------
class ExtractRequest(BaseModel):
    url: str = Field(..., description="The media or video page URL to inspect")

class DownloadRequest(BaseModel):
    url: str
    title: str = "Video"
    ext: str = "mp4"
    quality_tag: str = "Best"
    format_id: Optional[str] = None
    height: Optional[int] = None
    is_audio: bool = False
    thumbnail: Optional[str] = None

# -----------------------------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------------------------
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Universal Video Downloader Backend"}

@app.post("/api/extract")
def extract_video_info(req: ExtractRequest):
    """
    Validates URL against SSRF and extracts formats, metadata, and preview options.
    """
    is_valid, validation_msg = validate_url(req.url)
    if not is_valid:
        raise HTTPException(status_code=400, detail=validation_msg)

    try:
        media_info = extract_media_info(validation_msg)
        return {"success": True, "data": media_info}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected extraction error: {str(e)[:200]}")

@app.post("/api/download")
def create_download_job(req: DownloadRequest):
    """
    Queues a media download job with real-time progress tracking.
    """
    is_valid, validation_msg = validate_url(req.url)
    if not is_valid:
        raise HTTPException(status_code=400, detail=validation_msg)

    job_id = job_manager.create_job(
        url=validation_msg,
        title=req.title,
        ext=req.ext,
        quality_tag=req.quality_tag,
        is_audio=req.is_audio,
        thumbnail=req.thumbnail
    )

    download_opts = {
        "ext": req.ext,
        "is_audio": req.is_audio,
        "height": req.height,
        "format_id": req.format_id,
    }

    start_download_task(job_id, validation_msg, download_opts, DOWNLOADS_DIR)

    return {"success": True, "job_id": job_id, "status": "pending"}

@app.get("/api/jobs/{job_id}")
def get_job_status(job_id: str):
    """
    Fetches real-time download status, speed, percentage, and ETA.
    """
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Download job not found.")
    return {"success": True, "job": job}

@app.get("/api/download/{job_id}/file")
def download_finished_file(job_id: str):
    """
    Serves the downloaded media file to the user as an attachment.
    """
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    if job.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Job has not completed yet.")

    file_path = job.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File is no longer available on server.")

    filename = job.get("filename") or os.path.basename(file_path)
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream"
    )

@app.get("/api/history")
def get_history():
    """
    Returns list of all session download jobs.
    """
    return {"success": True, "jobs": job_manager.list_jobs()}

@app.delete("/api/history/{job_id}")
def delete_history_item(job_id: str):
    """
    Removes job and deletes its file from disk.
    """
    success = job_manager.delete_job(job_id)
    if not success:
        raise HTTPException(status_code=404, detail="Job not found.")
    return {"success": True, "message": "Job and file deleted successfully."}

# -----------------------------------------------------------------------------
# Static files mount (Serves built React frontend if available)
# -----------------------------------------------------------------------------
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
