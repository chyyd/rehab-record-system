#!/bin/bash

IP_ADDRESS="192.168.10.5"

echo "========================================"
echo "生成内网IP SSL证书"
echo "证书IP: $IP_ADDRESS"
echo "========================================"
echo

# 检查openssl是否安装
if ! command -v openssl &> /dev/null; then
    echo "错误: 未检测到OpenSSL"
    echo "请先安装OpenSSL: brew install openssl (Mac) 或 apt install openssl (Linux)"
    exit 1
fi

# 生成私钥
echo "[1/3] 生成私钥..."
openssl genrsa -out ${IP_ADDRESS}-key.pem 2048
if [ $? -ne 0 ]; then
    echo "错误: 私钥生成失败"
    exit 1
fi

# 生成证书签名请求配置文件
echo "[2/3] 生成证书配置..."
cat > req.cnf << EOF
[req]
default_req_ext = v3_req
distinguished_name = req_distinguished_name
[req_distinguished_name]
[v3_req]
subjectAltName = @alt_names
[alt_names]
IP.1 = ${IP_ADDRESS}
EOF

# 生成自签名证书（10年有效期）
echo "[3/3] 生成自签名证书..."
openssl req -new -x509 -key ${IP_ADDRESS}-key.pem -out ${IP_ADDRESS}-cert.pem -days 3650 -subj "/C=CN/ST=State/L=City/O=Hospital/CN=${IP_ADDRESS}" -config req.cnf -extensions v3_req
if [ $? -ne 0 ]; then
    echo "错误: 证书生成失败"
    exit 1
fi

# 清理临时文件
rm req.cnf

echo
echo "========================================"
echo "证书生成完成！"
echo "========================================"
echo "证书文件: ${IP_ADDRESS}-cert.pem"
echo "私钥文件: ${IP_ADDRESS}-key.pem"
echo "有效期: 10年"
echo "========================================"
echo
echo "重要提示:"
echo "1. 证书已生成在当前目录"
echo "2. 请勿将私钥文件提交到Git仓库"
echo "3. 手机浏览器首次访问需手动信任证书"
echo
echo "iOS Safari:"
echo "  - 点击'详情' → '访问详情'"
echo "  - 滚动到底部，点击'信任此证书'"
echo
echo "Android Chrome:"
echo "  - 点击'ADVANCED' → 'Proceed to ${IP_ADDRESS} (unsafe)'"
echo "========================================"
echo
