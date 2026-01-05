# Railway Environment Variables Setup Script
# Run this after linking your Railway project

Write-Host "Setting up Railway environment variables for exoptus-server..." -ForegroundColor Cyan

$service = "exoptus-server"

# Set environment variables
railway variables --service $service --set "DATABASE_URL=postgresql://postgres.peodlskalmvatqyhctev:Gowtham%40supabase2026@aws-1-ap-south-1.pooler.supabase.com:5432/postgres" | Out-Null
railway variables --service $service --set "JWT_SECRET=exoptus-prod-jwt-2026-X7k9mN2pQ4rS6tU8wZ1yB3cD5eF7gH9j" | Out-Null
railway variables --service $service --set "JWT_EXPIRES_IN=7d" | Out-Null
railway variables --service $service --set "GEMINI_API_KEY=AIzaSyDGq2ixugtiqbE2AJ4gBZ4AHqfkQm29HDs" | Out-Null
railway variables --service $service --set "SMTP_HOST=smtp.gmail.com" | Out-Null
railway variables --service $service --set "SMTP_PORT=587" | Out-Null
railway variables --service $service --set "SMTP_USER=gowthampcsbs2023@jerusalemengg.ac.in" | Out-Null
railway variables --service $service --set "SMTP_PASS=cpanftubcoxswlte" | Out-Null
railway variables --service $service --set "EMAIL_FROM=Exoptus <gowthampcsbs2023@jerusalemengg.ac.in>" | Out-Null
railway variables --service $service --set "GOOGLE_CLIENT_ID=463755159994-qh29mpi9dsbp90gf5id3q3id1m3eluie.apps.googleusercontent.com" | Out-Null
railway variables --service $service --set "GOOGLE_CLIENT_SECRET=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" | Out-Null
railway variables --service $service --set "NODE_ENV=production" | Out-Null
railway variables --service $service --set "PORT=3000" | Out-Null
railway variables --service $service --set "APP_URL=exoptus://" | Out-Null
railway variables --service $service --set "APP_SCHEME=exoptus" | Out-Null
railway variables --service $service --set "FRONTEND_URL=https://exoptus-web-dashboard.vercel.app" | Out-Null

Write-Host "Environment variables set successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Checking current variables..." -ForegroundColor Cyan
railway variables --service $service

Write-Host ""
Write-Host "IMPORTANT: After getting your Railway URL, update:" -ForegroundColor Yellow
Write-Host "   - GOOGLE_REDIRECT_URI (https://your-railway-url/auth/google/callback)" -ForegroundColor Yellow
Write-Host "   - Update Google Cloud Console OAuth settings" -ForegroundColor Yellow
