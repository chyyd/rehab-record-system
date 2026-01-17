@echo off
chcp 65001 >nul 2>&1
title Rehab System - Force Stop

echo ========================================
echo   Force Stop All Services
echo ========================================
echo.
echo WARNING: This will close ALL node processes
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

echo.
echo Stopping all services...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq Backend*" >nul 2>&1
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq Web*" >nul 2>&1
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq Mobile*" >nul 2>&1

echo.
echo ========================================
echo   All Services Stopped
echo ========================================
echo.
timeout /t 2 /nobreak >nul
