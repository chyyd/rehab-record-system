@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo   Rehab System API Server
echo ========================================
echo.

cd backend

if not exist "node_modules" (
    echo [1/5] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed
        pause
        exit /b 1
    )
) else (
    echo [1/5] Dependencies already installed
)
echo.

echo [2/5] Generating Prisma client...
call npm run prisma:generate
if errorlevel 1 (
    echo ERROR: prisma generate failed
    pause
    exit /b 1
)
echo.

echo [3/5] Running database migration...
if not exist "data\database.db" (
    call npx prisma migrate dev --name init
    if errorlevel 1 (
        echo ERROR: prisma migrate failed
        pause
        exit /b 1
    )

    echo [4/5] Seeding database...
    call npm run prisma:seed
    if errorlevel 1 (
        echo ERROR: prisma seed failed
        pause
        exit /b 1
    )
) else (
    echo [4/5] Database already exists
)
echo.

echo [5/5] Starting server...
echo.
echo Server will start at: http://localhost:3000
echo API Documentation: http://localhost:3000/api-docs
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run start:dev
