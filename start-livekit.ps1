# Start LiveKit Development Server for Marta's Classroom
$binPath = Join-Path $PSScriptRoot "bin\livekit-server.exe"

if (-not (Test-Path $binPath)) {
    Write-Host "[!] livekit-server.exe not found in bin/. Downloading Windows binary..." -ForegroundColor Yellow
    $zipPath = Join-Path $PSScriptRoot "bin\livekit.zip"
    New-Item -ItemType Directory -Path (Join-Path $PSScriptRoot "bin") -Force | Out-Null
    curl.exe -L -s -o $zipPath https://github.com/livekit/livekit/releases/download/v1.13.9/livekit_1.13.9_windows_amd64.zip
    Expand-Archive -Path $zipPath -DestinationPath (Join-Path $PSScriptRoot "bin") -Force
    Remove-Item $zipPath -Force
}

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host " Starting LiveKit WebRTC Server (Dev Mode)       " -ForegroundColor Green
Write-Host " URL:    ws://localhost:7880                     " -ForegroundColor Green
Write-Host " Key:    devkey                                  " -ForegroundColor Green
Write-Host " Secret: secret                                  " -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan

& $binPath --dev
