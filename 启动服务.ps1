# 虎林市中医医院康复科系统 - 启动脚本

Write-Host "========================================" -ForegroundColor Green
Write-Host "  康复科系统 API 服务器" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$ErrorActionPreference = "Stop"

# 检查Node.js
Write-Host "[1/5] 检查Node.js环境..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ 错误：请先安装Node.js" -ForegroundColor Red
    Write-Host "下载地址: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "按Enter键退出"
    exit 1
}

# 进入backend目录
Write-Host ""
Write-Host "[2/5] 进入项目目录..." -ForegroundColor Cyan
Set-Location backend
Write-Host "✓ 当前目录: $PWD" -ForegroundColor Green

# 安装依赖
Write-Host ""
Write-Host "[3/5] 检查并安装依赖..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "正在安装依赖..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 依赖安装完成" -ForegroundColor Green
    } else {
        Write-Host "✗ 依赖安装失败" -ForegroundColor Red
        Read-Host "按Enter键退出"
        exit 1
    }
} else {
    Write-Host "✓ 依赖已安装" -ForegroundColor Green
}

# 生成Prisma客户端
Write-Host ""
Write-Host "[4/5] 生成Prisma客户端..." -ForegroundColor Cyan
npm run prisma:generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma客户端生成完成" -ForegroundColor Green
} else {
    Write-Host "✗ Prisma客户端生成失败" -ForegroundColor Red
    Read-Host "按Enter键退出"
    exit 1
}

# 运行数据库迁移
Write-Host ""
if (-not (Test-Path "data\database.db")) {
    Write-Host "[5/6] 初始化数据库..." -ForegroundColor Cyan
    npx prisma migrate dev --name init
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 数据库迁移完成" -ForegroundColor Green
    } else {
        Write-Host "✗ 数据库迁移失败" -ForegroundColor Red
        Read-Host "按Enter键退出"
        exit 1
    }

    Write-Host "正在初始化种子数据..." -ForegroundColor Yellow
    npm run prisma:seed
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 种子数据初始化完成" -ForegroundColor Green
    } else {
        Write-Host "✗ 种子数据初始化失败" -ForegroundColor Red
        Read-Host "按Enter键退出"
        exit 1
    }
} else {
    Write-Host "[5/5] 数据库已存在，跳过初始化" -ForegroundColor Green
}

# 启动服务器
Write-Host ""
Write-Host "[6/6] 启动开发服务器..." -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "服务器信息:" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ API地址: http://localhost:3000" -ForegroundColor White
Write-Host "✓ API文档: http://localhost:3000/api-docs" -ForegroundColor White
Write-Host ""
Write-Host "测试账号:" -ForegroundColor Yellow
Write-Host "  管理员 - admin / 123456" -ForegroundColor White
Write-Host "  医师   - doc001 / 123456" -ForegroundColor White
Write-Host "  护士   - nurse001 / 123456" -ForegroundColor White
Write-Host "  治疗师 - therapist001 / 123456" -ForegroundColor White
Write-Host ""
Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

npm run start:dev
