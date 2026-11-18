@echo off
title Universal Video Downloader Studio
echo ========================================================
echo   Launching Universal Video Downloader
echo   Backend: FastAPI + yt-dlp + FFmpeg
echo   Frontend: React + Vite
echo ========================================================
cd /d "%~dp0backend"
start http://127.0.0.1:8000
python -m uvicorn main:app --host 127.0.0.1 --port 8000
pause
