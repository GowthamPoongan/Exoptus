#!/usr/bin/env pwsh
# Test the new Google-style email template

param(
    [Parameter(Mandatory=$false)]
    [string]$Email = "test@example.com"
)

Write-Host "📧 Testing Email Template..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Sending magic link email to: $Email" -ForegroundColor Yellow
Write-Host ""

# Send POST request to trigger magic link email
$body = @{
    email = $Email
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/auth/email/start" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "✅ Email sent successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 3
    Write-Host ""
    Write-Host "📱 Check your email inbox (including spam folder)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Expected improvements:" -ForegroundColor Cyan
    Write-Host "  ✓ Clean, Google-style design" -ForegroundColor White
    Write-Host "  ✓ Clickable button and link" -ForegroundColor White
    Write-Host "  ✓ Mobile-friendly layout" -ForegroundColor White
    Write-Host "  ✓ Professional appearance" -ForegroundColor White
    Write-Host "  ✓ Better email client compatibility" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error sending email" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure backend is running:" -ForegroundColor Yellow
    Write-Host "  cd server" -ForegroundColor Gray
    Write-Host '  npm run dev' -ForegroundColor Gray
}
