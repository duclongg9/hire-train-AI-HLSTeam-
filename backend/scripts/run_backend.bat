@echo off
setlocal
cd /d "%~dp0.."

if not exist ".env" (
  echo backend\.env not found. Creating it from backend\.env.example for local development.
  copy ".env.example" ".env" >nul
)

set "PYTHON_CMD=python"
if exist ".venv\Scripts\python.exe" set "PYTHON_CMD=.venv\Scripts\python.exe"

echo Checking backend Python dependencies...
%PYTHON_CMD% -c "import fastapi, uvicorn, pydantic_settings" >nul 2>nul
if errorlevel 1 (
  echo Missing backend dependencies. Run this first:
  echo   cd backend
  echo   python -m venv .venv
  echo   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
  exit /b 1
)

netstat -ano | findstr /R /C:":8000 .*LISTENING" >nul
if not errorlevel 1 (
  echo Backend already appears to be running on http://127.0.0.1:8000
  echo Health: http://127.0.0.1:8000/health
  echo Docs:   http://127.0.0.1:8000/api/docs
  exit /b 0
)

echo Starting HireTrain AI backend...
echo Health: http://127.0.0.1:8000/health
echo Docs:   http://127.0.0.1:8000/api/docs
echo Press Ctrl+C to stop.

%PYTHON_CMD% -m uvicorn main:app --host 127.0.0.1 --port 8000