@echo off
title ClarityForge - Image ^& Video Enhancer
echo ========================================================
echo   ClarityForge - Image ^& Video Enhancement Studio
echo   Backend : FastAPI + OpenCV + FFmpeg
echo   Frontend: React + Vite
echo   URL     : http://127.0.0.1:8002
echo ========================================================
cd /d "%~dp0backend"
start "" http://127.0.0.1:8002
python -m uvicorn main:app --host 127.0.0.1 --port 8002
pause
