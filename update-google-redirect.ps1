# Update Google Redirect URI After Deployment
# Usage: .\update-google-redirect.ps1 "https://your-railway-url.railway.app"

param(
    [Parameter(Mandatory=$true)]
    [string]$RailwayUrl
)

Write-Host "Updating GOOGLE_REDIRECT_URI with Railway URL..." -ForegroundColor Cyan
Write-Host "Railway URL: $RailwayUrl" -ForegroundColor Yellow
Write-Host ""

$redirectUri = "$RailwayUrl/auth/google/callback"

railway variables --service exoptus-server --set "GOOGLE_REDIRECT_URI=$redirectUri"

Write-Host ""
Write-Host "✅ GOOGLE_REDIRECT_URI updated!" -ForegroundColor Green
Write-Host "New value: $redirectUri" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Update Google Cloud Console:" -ForegroundColor Yellow
Write-Host "Go to: https://console.cloud.google.com/apis/credentials" -ForegroundColor Cyan
Write-Host ""
Write-Host "Add to Authorized JavaScript Origins:" -ForegroundColor White
Write-Host "  - $RailwayUrl" -ForegroundColor Gray
Write-Host "  - https://exoptus-web-dashboard.vercel.app" -ForegroundColor Gray
Write-Host ""
Write-Host "Add to Authorized Redirect URIs:" -ForegroundColor White
Write-Host "  - $redirectUri" -ForegroundColor Gray
Write-Host "  - https://exoptus-web-dashboard.vercel.app/auth/callback" -ForegroundColor Gray
