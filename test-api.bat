@echo off
chcp 65001 >nul
echo ========================================
echo   虎林市中医医院康复科系统 - API测试
echo ========================================
echo.

cd backend

echo [1/5] 检查Node.js环境...
node --version
if %errorlevel% neq 0 (
    echo 错误：请先安装 Node.js
    pause
    exit /b 1
)
echo.

echo [2/5] 安装依赖（如果需要）...
if not exist "node_modules" (
    npm install
)
echo.

echo [3/5] 生成Prisma客户端...
npm run prisma:generate
echo.

echo [4/5] 运行数据库迁移...
if not exist "data\database.db" (
    npx prisma migrate dev --name init
    echo 初始化种子数据...
    npm run prisma:seed
)
echo.

echo [5/5] 启动服务器...
echo 服务器将在 http://localhost:3000 启动
echo API文档地址: http://localhost:3000/api-docs
echo.
echo 按 Ctrl+C 停止服务器
echo.

npm run start:dev
