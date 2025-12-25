# Fix Prisma Client Script
# Run this in PowerShell (NOT in VS Code terminal)

Write-Host "🔧 EXOPTUS - Prisma Client Fix Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill all node processes
Write-Host "Step 1: Stopping all Node processes..." -ForegroundColor Yellow
try {
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction Stop
    Write-Host "✅ Node processes stopped" -ForegroundColor Green
    Start-Sleep -Seconds 2
} catch {
    Write-Host "⚠️  No Node processes found or already stopped" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Navigate to server directory
Write-Host "Step 2: Navigating to server directory..." -ForegroundColor Yellow
$serverPath = "C:\Users\gowth\Project Exoptus\server"
if (Test-Path $serverPath) {
    Set-Location $serverPath
    Write-Host "✅ In server directory: $serverPath" -ForegroundColor Green
} else {
    Write-Host "❌ Server directory not found: $serverPath" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Clean .prisma folder
Write-Host "Step 3: Cleaning old Prisma client..." -ForegroundColor Yellow
$prismaPath = "node_modules\.prisma"
if (Test-Path $prismaPath) {
    try {
        Remove-Item -Path $prismaPath -Recurse -Force -ErrorAction Stop
        Write-Host "✅ Old Prisma client removed" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not remove old client (might be locked)" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  No old Prisma client to remove" -ForegroundColor Gray
}

Write-Host ""

# Step 4: Regenerate Prisma client
Write-Host "Step 4: Regenerating Prisma client..." -ForegroundColor Yellow
try {
    $output = npx prisma generate 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Prisma client generated successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 SUCCESS! Your Prisma client is now up to date." -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Open VS Code" -ForegroundColor White
        Write-Host "2. Check for TypeScript errors (should be gone)" -ForegroundColor White
        Write-Host "3. Run: npm run dev" -ForegroundColor White
    } else {
        throw "Prisma generate failed"
    }
} catch {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $output
    Write-Host ""
    Write-Host "Solution: Try restarting your computer and running this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
