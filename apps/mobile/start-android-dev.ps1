# Start Metro bundler and Android development build in one command

Write-Host "🚀 Starting Metro Bundler and Android Development Build..." -ForegroundColor Cyan
Write-Host ""

# Get the script directory (where package.json is located)
if ($PSScriptRoot) {
    $projectRoot = $PSScriptRoot
} else {
    # Fallback if PSScriptRoot is not available
    $projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
    if (-not $projectRoot) {
        $projectRoot = Get-Location
    }
}

Set-Location $projectRoot
Write-Host "📁 Working directory: $projectRoot" -ForegroundColor Gray

# Start Metro bundler in background using Start-Process
Write-Host "📦 Starting Metro bundler..." -ForegroundColor Yellow
$metroProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; npx expo start --dev-client" -PassThru

# Wait for Metro to be ready (check if port 8081 is listening)
Write-Host "⏳ Waiting for Metro bundler to start..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$metroReady = $false

while ($attempt -lt $maxAttempts -and -not $metroReady) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8081/status" -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop
        $metroReady = $true
        Write-Host "✅ Metro bundler is ready!" -ForegroundColor Green
    } catch {
        # Port might be listening but not ready yet, check TCP connection as fallback
        $connection = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
        if ($connection) {
            Start-Sleep -Seconds 3  # Give it a bit more time
            $metroReady = $true
            Write-Host "✅ Metro bundler is ready!" -ForegroundColor Green
        }
    }
    $attempt++
}

if (-not $metroReady) {
    Write-Host "⚠️  Metro bundler might still be starting, proceeding anyway..." -ForegroundColor Yellow
    Write-Host "   (You can manually open the app after Metro is ready)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🤖 Building and installing Android app..." -ForegroundColor Yellow
Write-Host ""

# Run Android build
npx expo run:android

# Note: Metro will continue running in the background window
Write-Host ""
Write-Host "✅ Done! Metro bundler is running in a separate window." -ForegroundColor Green
Write-Host "   To stop Metro: Close the PowerShell window that opened for Metro" -ForegroundColor Gray

