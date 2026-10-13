@echo off
echo Starting LiveKit Classroom Server for Development...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-livekit.ps1"
pause
