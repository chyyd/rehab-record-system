#!/bin/bash

# IP 地址自动更换工具
# 使用方法: ./update-ip.sh [新IP地址]
# 示例: ./update-ip.sh 192.168.1.100

set -e

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "========================================"
echo "   IP 地址自动更换工具"
echo "========================================"
echo -e "${NC}"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 错误：未检测到 Node.js${NC}"
    echo ""
    echo "请先安装 Node.js："
    echo "  Ubuntu/Debian: sudo apt-get install nodejs npm"
    echo "  CentOS/RHEL:   sudo yum install nodejs npm"
    echo "  macOS:         brew install node"
    echo ""
    exit 1
fi

# 获取参数
NEW_IP=$1

# 如果没有提供 IP，自动检测
if [ -z "$NEW_IP" ]; then
    echo -e "${YELLOW}🔍 正在检测本机 IP 地址...${NC}"

    # Linux 检测 IP
    if command -v ip &> /dev/null; then
        DETECTED_IP=$(ip addr show | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d/ -f1 | head -n 1)
    # macOS 检测 IP
    elif command -v ifconfig &> /dev/null; then
        DETECTED_IP=$(ifconfig | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | head -n 1)
    fi

    if [ -n "$DETECTED_IP" ]; then
        NEW_IP=$DETECTED_IP
        echo -e "${GREEN}检测到 IP: $NEW_IP${NC}"
    else
        echo -e "${RED}❌ 无法自动检测 IP 地址${NC}"
        echo ""
        echo "请手动指定 IP 地址："
        echo "  ./update-ip.sh 192.168.1.100"
        echo ""
        exit 1
    fi
fi

# 验证 IP 格式
if [[ ! $NEW_IP =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}❌ 无效的 IP 地址格式: $NEW_IP${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}========================================"
echo "   即将更换 IP 地址"
echo "========================================${NC}"
echo ""
echo -e "旧 IP: ${RED}192.168.10.5${NC}"
echo -e "新 IP: ${GREEN}$NEW_IP${NC}"
echo ""
echo "即将修改以下文件："
echo "  - mobile-frontend/.env.development"
echo "  - mobile-frontend/.env.production"
echo "  - mobile-frontend/vite.config.ts"
echo "  - mobile-frontend/certs/*.bat"
echo "  - mobile-frontend/certs/*.sh"
echo "  - backend/src/main.ts"
echo ""
echo "将执行以下操作："
echo "  1. 批量替换配置文件中的 IP"
echo "  2. 重新生成 SSL 证书"
echo "  3. 重新构建前端"
echo ""
echo -e "${YELLOW}按 Ctrl+C 取消，或按回车继续...${NC}"
read

echo ""
echo -e "${GREEN}🚀 开始执行...${NC}"
echo ""

# 执行 Node.js 脚本
node scripts/update-ip.js "$NEW_IP"

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ 脚本执行失败！${NC}"
    echo ""
    exit 1
fi

echo ""
echo -e "${GREEN}========================================"
echo "   ✅ 完成！"
echo "========================================${NC}"
echo ""
echo "后续步骤："
echo ""
echo "1. （可选）重启后端服务器"
echo ""
echo "2. 在手机浏览器测试访问"
echo "   https://$NEW_IP:5173/"
echo ""
