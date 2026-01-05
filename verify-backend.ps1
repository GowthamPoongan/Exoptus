# 🔧 Backend API Verification Script
# Tests all Phase 2 endpoints with cURL

$BASE_URL = "http://localhost:3000"

Write-Host "`n🚀 EXOPTUS Backend API Verification" -ForegroundColor Cyan
Write-Host "Testing endpoints at: $BASE_URL`n" -ForegroundColor Gray

# Track results
$passed = 0
$failed = 0
$results = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Endpoint,
        [string]$Method = "GET",
        [string]$Body = $null
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    Write-Host "  → $Method $Endpoint" -ForegroundColor Gray
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-WebRequest -Uri "$BASE_URL$Endpoint" -Method GET -UseBasicParsing -ErrorAction Stop
        } else {
            $headers = @{ "Content-Type" = "application/json" }
            $response = Invoke-WebRequest -Uri "$BASE_URL$Endpoint" -Method POST -Body $Body -Headers $headers -UseBasicParsing -ErrorAction Stop
        }
        
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ PASS" -ForegroundColor Green
            $script:passed++
            $script:results += [PSCustomObject]@{
                Test = $Name
                Status = "✅ PASS"
                Code = $response.StatusCode
            }
            return $true
        } else {
            Write-Host "  ❌ FAIL (Status: $($response.StatusCode))" -ForegroundColor Red
            $script:failed++
            $script:results += [PSCustomObject]@{
                Test = $Name
                Status = "❌ FAIL"
                Code = $response.StatusCode
            }
            return $false
        }
    } catch {
        Write-Host "  ❌ FAIL (Error: $($_.Exception.Message))" -ForegroundColor Red
        $script:failed++
        $script:results += [PSCustomObject]@{
            Test = $Name
            Status = "❌ FAIL"
            Code = "ERROR"
        }
        return $false
    }
}

Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PHASE 1: Health & Connectivity" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Test-Endpoint -Name "Health Check" -Endpoint "/health"

Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PHASE 2: Onboarding Endpoints" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Test-Endpoint -Name "Get Onboarding Flow" -Endpoint "/onboarding/flow"

$analysisBody = @{
    userData = @{
        careerGoal = "Software Engineer"
        experience = "3-5"
        skills = @("JavaScript", "React")
    }
} | ConvertTo-Json

Test-Endpoint -Name "Trigger Analysis" -Endpoint "/onboarding/analyze" -Method "POST" -Body $analysisBody

Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PHASE 3: Dashboard Endpoints" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Test-Endpoint -Name "Get Dashboard Data" -Endpoint "/dashboard"
Test-Endpoint -Name "Get Notifications" -Endpoint "/dashboard/notifications"

Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PHASE 4: Community Endpoints" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Test-Endpoint -Name "Get Community Posts" -Endpoint "/community/posts"
Test-Endpoint -Name "Get Posts (with pagination)" -Endpoint "/community/posts?page=1&pageSize=10"
Test-Endpoint -Name "Get Posts (with sort)" -Endpoint "/community/posts?sort=trending"
Test-Endpoint -Name "Get Posts (with filter)" -Endpoint "/community/posts?filter=Career%20Advice"

Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

$script:results | Format-Table -AutoSize

$total = $passed + $failed
$percentage = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 1) } else { 0 }

Write-Host "`n📊 Final Score: $passed/$total tests passed ($percentage%)" -ForegroundColor Cyan

if ($failed -eq 0) {
    Write-Host "`n✅ ALL TESTS PASSED! Backend is ready for app integration." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️  $failed test(s) failed. Check server logs for details." -ForegroundColor Yellow
    Write-Host "`nTroubleshooting:" -ForegroundColor Gray
    Write-Host "  1. Is the server running? (cd server && npm run dev)" -ForegroundColor Gray
    Write-Host "  2. Check server console for errors" -ForegroundColor Gray
    Write-Host "  3. Verify routes are registered in server/src/index.ts" -ForegroundColor Gray
    exit 1
}
