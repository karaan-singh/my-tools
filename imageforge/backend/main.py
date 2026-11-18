from io import BytesIO
import json
import os
import re
import sys
from typing import List, Optional
from urllib.parse import quote
from zipfile import ZipFile, ZIP_DEFLATED

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

# Ensure backend directory is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from compressor import compress_image

app = FastAPI(
    title="ImageForge API",
    description="High-performance image compression and conversion API supporting JPG, PNG, WebP, AVIF, GIF & HEIC.",
    version="1.0.0"
)

# Enable CORS for Vite dev server or standalone frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Original-Size", "X-Compressed-Size", "X-Output-Format", "X-Processed-Count", "Content-Disposition"]
)

MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB
MAX_BATCH_FILES = 20

def safe_name(filename: str) -> str:
    """Create a safe alphanumeric filename without extension."""
    if not filename:
        return "image"
    name = filename.rsplit(".", 1)[0] if "." in filename else filename
    name = re.sub(r"[^a-zA-Z0-9_-]", "_", name)
    return name[:80] or "image"

async def read_upload(file: UploadFile) -> bytes:
    """Read upload with size limit protection."""
    data = await file.read(MAX_FILE_SIZE + 1)
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File '{file.filename}' exceeds the maximum allowed size of 15 MB."
        )
    return data

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "ImageForge Image Compression Engine"}

@app.post("/compress")
async def compress_single(
    file: UploadFile = File(...),
    quality: int = Form(82),
    output_format: str = Form("AUTO"),
    width: int = Form(0),
    height: int = Form(0)
):
    """
    Compress a single image and return the optimized media stream with stats in headers.
    """
    data = await read_upload(file)
    original_size = len(data)

    try:
        compressed_bytes, final_format, mime_type = compress_image(
            data,
            quality=quality,
            output_format=output_format,
            width=width,
            height=height
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Compression failed: {str(exc)}")

    compressed_size = len(compressed_bytes)
    ext = final_format.lower()
    if ext == "jpeg":
        ext = "jpg"
    out_filename = f"{safe_name(file.filename)}_optimized.{ext}"

    headers = {
        "X-Original-Size": str(original_size),
        "X-Compressed-Size": str(compressed_size),
        "X-Output-Format": final_format,
        "Content-Disposition": f'attachment; filename="{out_filename}"'
    }

    return Response(content=compressed_bytes, media_type=mime_type, headers=headers)

@app.post("/compress/batch")
async def compress_batch(
    files: List[UploadFile] = File(...),
    quality: int = Form(82),
    output_format: str = Form("AUTO"),
    width: int = Form(0),
    height: int = Form(0)
):
    """
    Compress up to 20 images in batch and return an optimized ZIP archive.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")
    if len(files) > MAX_BATCH_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"Batch size exceeds maximum limit of {MAX_BATCH_FILES} files."
        )

    zip_buffer = BytesIO()
    total_original_size = 0
    total_compressed_size = 0
    processed_count = 0
    used_filenames = set()

    with ZipFile(zip_buffer, "w", compression=ZIP_DEFLATED) as zip_file:
        for idx, file in enumerate(files):
            data = await read_upload(file)
            total_original_size += len(data)

            try:
                compressed_bytes, final_format, _ = compress_image(
                    data,
                    quality=quality,
                    output_format=output_format,
                    width=width,
                    height=height
                )
                total_compressed_size += len(compressed_bytes)

                ext = final_format.lower()
                if ext == "jpeg":
                    ext = "jpg"
                base = safe_name(file.filename)
                target_filename = f"{base}_optimized.{ext}"

                # Ensure unique filename in zip
                dedup_idx = 1
                while target_filename in used_filenames:
                    target_filename = f"{base}_{dedup_idx}_optimized.{ext}"
                    dedup_idx += 1

                used_filenames.add(target_filename)
                zip_file.writestr(target_filename, compressed_bytes)
                processed_count += 1

            except Exception:
                # If an individual image fails, skip it or keep original
                continue

    if processed_count == 0:
        raise HTTPException(status_code=400, detail="Could not process any of the uploaded images.")

    zip_bytes = zip_buffer.getvalue()
    headers = {
        "X-Original-Size": str(total_original_size),
        "X-Compressed-Size": str(len(zip_bytes)),
        "X-Output-Format": "ZIP",
        "X-Processed-Count": str(processed_count),
        "Content-Disposition": 'attachment; filename="imageforge_compressed.zip"'
    }

    return Response(content=zip_bytes, media_type="application/zip", headers=headers)

# Static file mount for production bundle
FRONTEND_DIST = os.path.join(os.path.dirname(BASE_DIR), "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
