@echo off
title OptiVideo - Video Compression Tool
echo ========================================================
echo   Launching OptiVideo - Modern Video Compression Studio
echo ========================================================
cd /d "%~dp0"
python -m streamlit run app.py
pause
