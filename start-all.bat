@echo off
REM CRM System - Full Stack Startup (Windows)

echo ==========================================
echo CRM SYSTEM - FULL STACK STARTUP
echo ==========================================
echo.

REM Check MySQL
echo Checking MySQL...
sc query MySQL80 | find "RUNNING" > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] MySQL is not running!
    echo Please start MySQL from Services
    pause
    exit /b 1
)
echo [OK] MySQL is running
echo.

REM Start Backend
echo Starting Backend...
start "CRM Backend" cmd /k "cd /d %~dp0backend && echo === CRM BACKEND === && mvn spring-boot:run"
timeout /t 5 /nobreak > nul

REM Start Frontend
echo Starting Frontend...
start "CRM Frontend" cmd /k "cd /d %~dp0frontend && echo === CRM FRONTEND === && npm run dev"

echo.
echo ==========================================
echo CRM SYSTEM STARTED!
echo ==========================================
echo.
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:5173
echo.
echo Default Login:
echo   Admin: admin@crm.com / admin123
echo   User:  user@crm.com / user123
echo.
echo Close terminal windows to stop services
echo.
pause
