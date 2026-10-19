@echo off
echo Starting local server at http://localhost:8000
echo Press Ctrl+C to stop, then close this window.
cd /d "%~dp0"
py -m http.server 8000
pause
