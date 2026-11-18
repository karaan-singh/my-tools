@echo off
title ImageForge - Image Optimization Studio
echo ========================================================
echo   Launching ImageForge
echo   Engine: Python Pillow + pillow-heif + pillow-avif
echo   Frontend: Modern React + Vite
echo ========================================================
cd /d "%~dp0backend"
start http://127.0.0.1:8000
python -m uvicorn main:app --host 127.0.0.1 --port 8000
pause
