# EXOPTUS - Quick Start Script
# Run this to start both backend server and Expo app

Write-Host "🚀 EXOPTUS - Starting Development Environment" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
$projectRoot = "C:\Users\gowth\Project Exoptus"
if (-not (Test-Path $projectRoot)) {
    Write-Host "❌ Project directory not found: $projectRoot" -ForegroundColor Red
    exit 1
}

Set-Location $projectRoot

# Step 1: Start Backend Server
Write-Host "Step 1: Starting Backend Server..." -ForegroundColor Yellow
Write-Host ""

# Check if port 3000 is already in use
$port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "⚠️  Port 3000 is already in use. Stopping existing process..." -ForegroundColor Yellow
    $processId = $port3000.OwningProcess
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "✅ Stopped process on port 3000" -ForegroundColor Green
}

# Start backend server in new window
Write-Host "🔧 Starting backend server on port 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\server'; Write-Host '🚀 Backend Server Starting...' -ForegroundColor Green; npm run dev"

# Wait for backend to start
Write-Host "⏳ Waiting for backend to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if backend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend server is running!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend might still be starting..." -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Start Expo App
Write-Host "Step 2: Starting Expo Development Server..." -ForegroundColor Yellow
Write-Host ""

Write-Host "🔧 Starting Expo on port 8081..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 INSTRUCTIONS:" -ForegroundColor Green
Write-Host "1. Scan the QR code with Expo Go app" -ForegroundColor White
Write-Host "2. Or press 'a' for Android emulator" -ForegroundColor White
Write-Host "3. Or press 'i' for iOS simulator" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Backend API: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔗 Expo App: http://localhost:8081" -ForegroundColor Cyan
Write-Host ""

# Start Expo in current window
npx expo start

# If user closes Expo, show cleanup message
Write-Host ""
Write-Host "👋 Expo stopped. Backend server is still running in another window." -ForegroundColor Yellow
Write-Host "   To stop backend: Close the PowerShell window or press Ctrl+C" -ForegroundColor Gray
