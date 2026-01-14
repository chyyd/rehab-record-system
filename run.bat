@echo off
cd backend

echo ========================================
echo   Rehab System API Server
echo ========================================
echo.

if not exist "node_modules" (
    echo [1/5] Installing dependencies...
    call npm install
    if errorlevel 1 goto error
) else (
    echo [1/5] Dependencies installed
)
echo.

echo [2/5] Generating Prisma client...
call npm run prisma:generate
if errorlevel 1 goto error
echo.

echo [3/5] Running database migration...
if not exist "data\database.db" (
    call npx prisma migrate dev --name init
    if errorlevel 1 goto error

    echo [4/5] Seeding database...
    call npm run prisma:seed
    if errorlevel 1 goto error
) else (
    echo [4/5] Database exists
)
echo.

echo [5/5] Starting server...
echo.
echo Server: http://localhost:3000
echo API Docs: http://localhost:3000/api-docs
echo.
echo Press Ctrl+C to stop
echo.

call npm run start:dev
goto end

:error
echo.
echo ERROR: Startup failed
pause
exit /b 1

:end
