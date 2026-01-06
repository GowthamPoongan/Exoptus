# Quick Vercel Environment Setup
# Run this after first deployment

Write-Host "Adding environment variables to Vercel..." -ForegroundColor Cyan

# Set all environment variables at once using Vercel API/CLI
$envVars = @{
    "NEXT_PUBLIC_API_URL" = "https://exoptus-server-production.up.railway.app"
    "GOOGLE_CLIENT_ID" = "463755159994-qh29mpi9dsbp90gf5id3q3id1m3eluie.apps.googleusercontent.com"
    "GOOGLE_CLIENT_SECRET" = "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"
    "NEXTAUTH_SECRET" = "exoptus-nextauth-secret-2026-prod-X7k9mN2pQ4"
}

Write-Host ""
Write-Host "Copy these commands and run them one by one:" -ForegroundColor Yellow
Write-Host ""

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-Host "echo `"$value`" | vercel env add $key production" -ForegroundColor White
}

Write-Host ""
Write-Host "After adding all variables, redeploy:" -ForegroundColor Cyan
Write-Host "vercel --prod" -ForegroundColor White
