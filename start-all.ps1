# EXOPTUS - Admin Dashboard Launcher

Write-Host ""
Write-Host "========================================"
Write-Host "   EXOPTUS - Admin Dashboard Launcher"
Write-Host "========================================"
Write-Host ""

Set-Location $PSScriptRoot

# Check and install root dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing root dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error installing dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check and install admin dashboard dependencies
if (-not (Test-Path "apps\web-dashboard\node_modules")) {
    Write-Host "Installing admin dashboard dependencies..."
    Push-Location "apps\web-dashboard"
    npm install
    Pop-Location
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error installing admin dashboard dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "Starting EXOPTUS services..." -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Admin Dashboard: http://localhost:5173" -ForegroundColor Cyan
Write-Host "📱 Mobile App: http://localhost:8081" -ForegroundColor Cyan
Write-Host "🖥️  Server API: http://10.175.216.47:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin Key: admin-secret-key-change-in-prod" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host ""

# Start all services
npm run dev

Read-Host "Press Enter to exit"
