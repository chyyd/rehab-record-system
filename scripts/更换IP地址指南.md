# 更换 IP 地址快速指南

## 📋 需要修改的配置文件清单

当更换电脑或 IP 地址变更时，需要修改以下文件：

### 1. 🔑 SSL 证书（必须重新生成）

**问题**：证书绑定了特定 IP 地址，必须重新生成

**步骤**：
```bash
# Windows
cd mobile-frontend\certs
# 编辑 generate-cert.bat，修改第 2 行
set IP_ADDRESS=你的新IP

# 重新生成证书
generate-cert.bat
```

```bash
# Linux/Mac
cd mobile-frontend/certs
# 编辑 generate-cert.sh，修改第 3 行
IP_ADDRESS="你的新IP"

# 重新生成证书
bash generate-cert.sh
```

**预期输出**：
- `新IP-key.pem`
- `新IP-cert.pem`

---

### 2. ⚙️ 环境变量配置

#### 文件：`mobile-frontend/.env.development`
```env
# 修改第 2 行和第 6 行
VITE_INTERNAL_IP=你的新IP
VITE_API_BASE_URL=http://你的新IP:3000
```

#### 文件：`mobile-frontend/.env.production`
```env
# 修改第 2 行和第 6 行
VITE_INTERNAL_IP=你的新IP
VITE_API_BASE_URL=http://你的新IP:3000
```

---

### 3. 🌐 Vite 开发服务器配置

#### 文件：`mobile-frontend/vite.config.ts`
```typescript
// 修改第 8 行
const IP_ADDRESS = '你的新IP'  // 可修改为实际内网IP
```

---

### 4. 📡 Caddy 配置

#### 文件：`Caddyfile`（项目根目录）
```caddy
# 修改第 17 行证书路径
tls C:\Users\youda\Desktop\new\mobile-frontend\certs\新IP-cert.pem C:\Users\youda\Desktop\new\mobile-frontend\certs\新IP-key.pem
```

**Windows 路径示例**：
```caddy
tls C:\Users\用户名\Desktop\new\mobile-frontend\certs\192.168.1.100-cert.pem C:\Users\用户名\Desktop\new\mobile-frontend\certs\192.168.1.100-key.pem
```

---

### 5. 🔧 后端服务器（可选）

#### 文件：`backend/src/main.ts`
```typescript
// 修改第 66 行（仅用于日志显示）
console.log(`📡 局域网访问: http://你的新IP:${port}`);
```

---

## 🚀 快速更换步骤（完整流程）

### 步骤 1：查看新 IP 地址

**Windows**：
```bash
ipconfig
```

**Linux/Mac**：
```bash
ifconfig
# 或
ip addr show
```

### 步骤 2：批量替换配置文件中的 IP

创建一个批处理脚本 `replace-ip.bat`（Windows）：

```batch
@echo off
set NEW_IP=%1
if "%NEW_IP%"=="" (
    echo 用法: replace-ip.bat 新IP地址
    echo 示例: replace-ip.bat 192.168.1.100
    exit /b 1
)

echo 正在替换 IP 地址为 %NEW_IP%...

# 替换环境变量文件
powershell -Command "(gc mobile-frontend\.env.development) -replace '192\.168\.10\.5', '%NEW_IP%' | Out-File -encoding UTF8 mobile-frontend\.env.development"
powershell -Command "(gc mobile-frontend\.env.production) -replace '192\.168\.10\.5', '%NEW_IP%' | Out-File -encoding UTF8 mobile-frontend\.env.production"

# 替换 Vite 配置
powershell -Command "(gc mobile-frontend\vite.config.ts) -replace '192\.168\.10\.5', '%NEW_IP%' | Out-File -encoding UTF8 mobile-frontend\vite.config.ts"

# 替换证书生成脚本
powershell -Command "(gc mobile-frontend\certs\generate-cert.bat) -replace '192\.168\.10\.5', '%NEW_IP%' | Out-File -encoding UTF8 mobile-frontend\certs\generate-cert.bat"

# 替换后端日志
powershell -Command "(gc backend\src\main.ts) -replace '192\.168\.10\.5', '%NEW_IP%' | Out-File -encoding UTF8 backend\src\main.ts"

echo IP 地址替换完成！
echo 接下来请：
echo 1. 手动修改 Caddyfile 中的证书路径
echo 2. 运行证书生成脚本
pause
```

**使用方法**：
```bash
replace-ip.bat 192.168.1.100
```

### 步骤 3：重新生成 SSL 证书

```bash
cd mobile-frontend/certs
generate-cert.bat  # Windows
# 或
bash generate-cert.sh  # Linux/Mac
```

### 步骤 4：更新 Caddyfile

**手动编辑** `Caddyfile`：
```caddy
:8443 {
    tls C:\完整路径\mobile-frontend\certs\新IP-cert.pem C:\完整路径\mobile-frontend\certs\新IP-key.pem
    root * C:\完整路径\mobile-frontend\dist\build\h5
    # ... 其他配置
}
```

### 步骤 5：重新构建前端

```bash
cd mobile-frontend
npm run build:h5
```

### 步骤 6：重启服务

1. **停止当前 Caddy**（Ctrl+C）
2. **重启 Caddy**：
   ```bash
   caddy run
   ```

3. **重启后端服务器**（如果需要）

### 步骤 7：测试访问

在手机浏览器访问：
```
https://新IP:8443/
```

---

## 📝 配置文件速查表

| 文件路径 | 行号 | 修改内容 |
|---------|------|---------|
| `mobile-frontend/.env.development` | 2, 6 | `VITE_INTERNAL_IP` 和 `VITE_API_BASE_URL` |
| `mobile-frontend/.env.production` | 2, 6 | `VITE_INTERNAL_IP` 和 `VITE_API_BASE_URL` |
| `mobile-frontend/vite.config.ts` | 8 | `IP_ADDRESS` 常量 |
| `mobile-frontend/certs/generate-cert.bat` | 2 | `IP_ADDRESS` 变量 |
| `mobile-frontend/certs/generate-cert.sh` | 3 | `IP_ADDRESS` 变量 |
| `Caddyfile` | 17 | TLS 证书文件路径 |
| `backend/src/main.ts` | 66 | 日志中的 IP 地址（可选） |

---

## ⚠️ 常见问题

### Q1：证书生成失败怎么办？

**A**：确保安装了 OpenSSL：
- Windows：下载 [Git for Windows](https://git-scm.com/download/win)（包含 OpenSSL）
- 或下载独立的 [OpenSSL](https://slproweb.com/products/Win32OpenSSL.html)

### Q2：手机无法访问新 IP？

**A**：检查：
1. ✅ 电脑和手机在同一 Wi-Fi
2. ✅ 防火墙允许 8443 端口
3. ✅ Caddy 正在运行
4. ✅ 证书路径正确

### Q3：Caddyfile 路径错误？

**A**：使用绝对路径，路径分隔符使用正斜杠 `/` 或双反斜杠 `\\`：
```caddy
# ✅ 正确
tls C:/Users/Admin/Desktop/new/mobile-frontend/certs/192.168.1.100-cert.pem

# ✅ 正确
tls C:\\Users\\Admin\\Desktop\\new\\mobile-frontend\\certs\\192.168.1.100-cert.pem

# ❌ 错误
tls C:\Users\Admin\Desktop\new\mobile-frontend\certs\192.168.1.100-cert.pem
```

---

## 🎯 最佳实践

### 1. 使用域名替代 IP（推荐）

如果可能，配置内网域名（DNS）：

**方法 1：使用 hosts 文件**

在电脑 `C:\Windows\System32\drivers\etc\hosts` 添加：
```
192.168.1.100  rehab.local
```

**方法 2：使用路由器 DNS**

在路由器中配置 DNS 解析：
```
rehab.local → 192.168.1.100
```

**好处**：
- ✅ IP 变更只需修改 DNS 记录
- ✅ 证书可以使用域名（更稳定）
- ✅ 更专业、易记

### 2. 配置中心化

创建 `config/IP.json`：
```json
{
  "internalIP": "192.168.1.100",
  "apiPort": 3000,
  "webPort": 8443
}
```

在代码中读取：
```typescript
import config from '../config/IP.json'
const IP = config.internalIP
```

### 3. 环境变量自动化

在 `.env` 文件中统一管理：
```env
# 网络配置
VITE_INTERNAL_IP=192.168.1.100
VITE_API_BASE_URL=http://192.168.1.100:3000
VITE_WEB_URL=https://192.168.1.100:8443
```

---

## 📞 快速参考

### 查看当前 IP
```bash
# Windows
ipconfig | findstr IPv4

# Linux/Mac
ifconfig | grep "inet "
```

### 测试网络连通性
```bash
# 从电脑测试
ping 192.168.1.100

# 从手机测试
# 在浏览器访问：http://192.168.1.100:3000/api/health
```

### 查看端口占用
```bash
# Windows
netstat -ano | findstr :8443

# Linux/Mac
lsof -i :8443
```

---

## 🎉 完成检查清单

更换 IP 后，请确认：

- [ ] SSL 证书已重新生成（新 IP 的证书文件）
- [ ] `.env.development` 已更新
- [ ] `.env.production` 已更新
- [ ] `vite.config.ts` 已更新
- [ ] `Caddyfile` 证书路径已更新
- [ ] 证书生成脚本已更新
- [ ] 前端已重新构建（`npm run build:h5`）
- [ ] Caddy 已重启
- [ ] 手机浏览器可以访问 `https://新IP:8443/`
- [ ] 扫码功能正常
- [ ] 创建记录功能正常

完成以上所有步骤后，系统应该可以在新 IP 下正常运行！🚀
