$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Resolve-Path (Join-Path $ScriptDir "..")
Set-Location $BackendDir

if (-not (Test-Path -LiteralPath ".env")) {
    Write-Host "backend/.env not found. Creating it from backend/.env.example for local development."
    Copy-Item -LiteralPath ".env.example" -Destination ".env"
}

$Python = "python"
$VenvPython = Join-Path $BackendDir ".venv\Scripts\python.exe"
if (Test-Path -LiteralPath $VenvPython) {
    $Python = $VenvPython
}

Write-Host "Checking backend Python dependencies..."
try {
    & $Python -c "import fastapi, uvicorn, pydantic_settings" | Out-Null
} catch {
    Write-Host "Missing backend dependencies. Run this first:"
    Write-Host "  cd backend"
    Write-Host "  python -m venv .venv"
    Write-Host "  .\.venv\Scripts\python.exe -m pip install -r requirements.txt"
    exit 1
}

$PortInUse = netstat -ano | Select-String -Pattern ':8000\s+.*LISTENING'
if ($PortInUse) {
    Write-Host "Backend already appears to be running on http://127.0.0.1:8000"
    Write-Host "Health: http://127.0.0.1:8000/health"
    Write-Host "Docs:   http://127.0.0.1:8000/api/docs"
    exit 0
}

Write-Host "Starting HireTrain AI backend..."
Write-Host "Health: http://127.0.0.1:8000/health"
Write-Host "Docs:   http://127.0.0.1:8000/api/docs"
Write-Host "Press Ctrl+C to stop."

& $Python -m uvicorn main:app --host 127.0.0.1 --port 8000