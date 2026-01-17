@echo off
chcp 65001 > nul
echo ========================================
echo   虎林市中医医院康复科
echo   三个阶段功能全面测试
echo ========================================
echo.

echo [1/2] 检查依赖...
if not exist "node_modules\axios" (
    echo 正在安装 axios...
    call npm install axios
    if errorlevel 1 (
        echo 安装失败！请检查网络连接或npm配置。
        pause
        exit /b 1
    )
)
echo ✓ 依赖检查完成
echo.

echo [2/2] 启动测试...
echo.
node test-api.js

echo.
echo ========================================
echo   测试完成！
echo ========================================
pause
