@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ========================================
echo    IP 地址自动更换工具
echo ========================================
echo.

REM 检查 Node.js 是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未检测到 Node.js
    echo.
    echo 请先安装 Node.js：
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM 获取参数
set NEW_IP=%1

if "%NEW_IP%"=="" (
    echo 🔍 正在检测本机 IP 地址...
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
        set IP_LINE=%%a
        set IP_LINE=!IP_LINE: =!
        echo 检测到 IP: !IP_LINE!

        REM 检查是否为局域网 IP
        echo !IP_LINE! | findstr /r "192\.168\." >nul
        if !errorlevel! equ 0 (
            set NEW_IP=!IP_LINE!
            goto :ip_found
        )
    )
    echo ❌ 无法自动检测局域网 IP
    echo.
    echo 请手动指定 IP 地址：
    echo    update-ip.bat 192.168.1.100
    echo.
    pause
    exit /b 1
)

:ip_found
echo.
echo ========================================
echo    即将更换 IP 地址
echo ========================================
echo.
echo 旧 IP: 192.168.10.5
echo 新 IP: %NEW_IP%
echo.
echo 即将修改以下文件：
echo   - mobile-frontend/.env.development
echo   - mobile-frontend/.env.production
echo   - mobile-frontend/vite.config.ts
echo   - mobile-frontend/certs/*.bat
echo   - mobile-frontend/certs/*.sh
echo   - backend/src/main.ts
echo.
echo 将执行以下操作：
echo   1. 批量替换配置文件中的 IP
echo   2. 重新生成 SSL 证书
echo   3. 重新构建前端
echo.
echo 按 Ctrl+C 取消，或按任意键继续...
pause >nul

echo.
echo 🚀 开始执行...
echo.

REM 执行 Node.js 脚本
node scripts/update-ip.js %NEW_IP%

if %errorlevel% neq 0 (
    echo.
    echo ❌ 脚本执行失败！
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo    ✅ 完成！
echo ========================================
echo.
echo 后续步骤：
echo.
echo 1. （可选）重启后端服务器
echo.
echo 2. 在手机浏览器测试访问
echo    https://%NEW_IP%:5173/
echo.
pause
