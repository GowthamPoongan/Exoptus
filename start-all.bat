@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   EXOPTUS - Admin Dashboard Launcher
echo ========================================
echo.

cd /d %~dp0

REM Check if node_modules exists in root
if not exist "node_modules\" (
    echo Installing root dependencies...
    call npm install
    if errorlevel 1 (
        echo Error installing dependencies
        pause
        exit /b 1
    )
)

REM Check if node_modules exists in web-dashboard
if not exist "apps\web-dashboard\node_modules\" (
    echo Installing admin dashboard dependencies...
    cd apps\web-dashboard
    call npm install
    cd ..\..
    if errorlevel 1 (
        echo Error installing admin dashboard dependencies
        pause
        exit /b 1
    )
)

echo.
echo Starting EXOPTUS services...
echo.
echo 🌐 Admin Dashboard: http://localhost:5173
echo 📱 Mobile App: http://localhost:8081
echo 🖥️  Server API: http://10.175.216.47:3000
echo.
echo Admin Key: admin-secret-key-change-in-prod
echo.
echo Press Ctrl+C to stop all services
echo.

REM Start all services
call npm run dev

pause
