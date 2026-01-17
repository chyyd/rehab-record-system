@echo off
chcp 65001 >nul 2>&1
title Rehab System - Start All Services

echo ========================================
echo   Rehab System - Start All Services
echo ========================================
echo.

echo [1/3] Starting Backend Service...
cd /d %~dp0backend
start "Backend-Service" cmd /k "npm run start:dev"
timeout /t 3 /nobreak >nul
echo [OK] Backend Started
echo.

echo [2/3] Starting Web Admin...
cd /d %~dp0web-admin
start "Web-Admin" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul
echo [OK] Web Admin Started
echo.

echo [3/3] Starting Mobile Frontend...
cd /d %~dp0mobile-frontend
start "Mobile-Frontend" cmd /k "npm run dev:h5"
timeout /t 2 /nobreak >nul
echo [OK] Mobile Started
echo.

echo ========================================
echo   All Services Started
echo ========================================
echo.
echo Service URLs:
echo   - Backend API:     http://localhost:3000
echo   - API Docs:        http://localhost:3000/api-docs
echo   - Web Admin:       http://localhost:5173
echo   - Mobile:          http://localhost:8080
echo.
pause
