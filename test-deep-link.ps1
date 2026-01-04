#!/usr/bin/env pwsh
# Test Deep Linking - Simulates magic link click

param(
    [Parameter(Mandatory=$false)]
    [string]$Token = "test-token-123",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("ios", "android")]
    [string]$Platform = "ios"
)

Write-Host "🔗 Testing Deep Link..." -ForegroundColor Cyan
Write-Host ""

$deepLink = "exoptus://auth/email/verify?token=$Token"

if ($Platform -eq "ios") {
    Write-Host "📱 Opening link on iOS Simulator..." -ForegroundColor Yellow
    Write-Host "Link: $deepLink" -ForegroundColor Gray
    Write-Host ""
    
    xcrun simctl openurl booted $deepLink
    
} elseif ($Platform -eq "android") {
    Write-Host "📱 Opening link on Android Emulator..." -ForegroundColor Yellow
    Write-Host "Link: $deepLink" -ForegroundColor Gray
    Write-Host ""
    
    adb shell am start -W -a android.intent.action.VIEW -d $deepLink
}

Write-Host ""
Write-Host "✅ Deep link sent!" -ForegroundColor Green
Write-Host ""
Write-Host "Expected result:" -ForegroundColor Cyan
Write-Host "  1. Exoptus app opens" -ForegroundColor White
Write-Host "  2. Verifying screen appears" -ForegroundColor White
Write-Host "  3. Token is processed" -ForegroundColor White
Write-Host ""
Write-Host "If app doesn't open:" -ForegroundColor Yellow
Write-Host "  - Make sure Expo is running: npx expo start" -ForegroundColor Gray
Write-Host "  - Make sure app is installed on simulator/emulator" -ForegroundColor Gray
Write-Host "  - Try clearing cache: npx expo start -c" -ForegroundColor Gray
