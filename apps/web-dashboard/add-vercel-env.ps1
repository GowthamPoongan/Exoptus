# Add Vercel Environment Variables After First Deployment

Write-Host "Setting Vercel environment variables..." -ForegroundColor Cyan

# Add environment variables to Vercel project
vercel env add NEXT_PUBLIC_API_URL production
# When prompted, enter: https://exoptus-server-production.up.railway.app

vercel env add GOOGLE_CLIENT_ID production
# When prompted, enter: 463755159994-qh29mpi9dsbp90gf5id3q3id1m3eluie.apps.googleusercontent.com

vercel env add GOOGLE_CLIENT_SECRET production
# When prompted, enter: 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

vercel env add NEXTAUTH_SECRET production
# When prompted, enter: generate-a-random-secret-here

Write-Host "Environment variables added!" -ForegroundColor Green
Write-Host "Redeploying with new environment variables..." -ForegroundColor Cyan
vercel --prod
