# IP 地址自动更换工具

## 📖 简介

这个工具可以自动更换项目中的所有 IP 地址配置，无需手动修改多个文件。

## 🎯 功能特性

✅ **自动检测 IP** - 自动检测本机局域网 IP 地址
✅ **批量替换** - 一次性更新所有配置文件
✅ **证书生成** - 自动生成新的 SSL 证书
✅ **自动构建** - 自动重新构建前端项目
✅ **跨平台** - 支持 Windows、Linux、macOS

## 📋 将会修改的文件

| 文件 | 说明 |
|------|------|
| `mobile-frontend/.env.development` | 开发环境变量 |
| `mobile-frontend/.env.production` | 生产环境变量 |
| `mobile-frontend/vite.config.ts` | Vite 配置 |
| `mobile-frontend/certs/generate-cert.bat` | Windows 证书生成脚本 |
| `mobile-frontend/certs/generate-cert.sh` | Linux/Mac 证书生成脚本 |
| `backend/src/main.ts` | 后端日志显示 |

## 🚀 使用方法

### 方法 1：双击运行（推荐）

#### Windows
直接双击项目根目录的 `update-ip.bat` 文件，脚本会：
1. 自动检测本机 IP
2. 显示将要修改的文件列表
3. 等待确认后自动执行

#### Linux/Mac
```bash
chmod +x update-ip.sh
./update-ip.sh
```

### 方法 2：命令行运行

#### 自动检测 IP
```bash
# Windows
update-ip.bat

# Linux/Mac
./update-ip.sh

# 或使用 Node.js
node scripts/update-ip.js
```

#### 手动指定 IP
```bash
# Windows
update-ip.bat 192.168.1.100

# Linux/Mac
./update-ip.sh 192.168.1.100

# 或使用 Node.js
node scripts/update-ip.js 192.168.1.100
```

## 📝 执行流程

脚本会自动执行以下步骤：

### 步骤 1：更新配置文件
批量替换所有配置文件中的 IP 地址（`192.168.10.5` → `新IP`）

### 步骤 2：生成 SSL 证书
运行证书生成脚本，创建新 IP 的证书文件

### 步骤 3：重新构建前端
执行 `npm run build:h5` 重新构建前端项目

## ✅ 完成后

脚本执行成功后，需要手动：

1. **（可选）重启后端服务器**
   ```bash
   cd backend
   npm start
   ```

2. **启动前端开发服务器**
   ```bash
   cd mobile-frontend
   npm run dev:h5
   ```

3. **测试访问**
   - 在手机浏览器访问：`https://新IP:5173/`
   - 检查扫码功能是否正常
   - 检查创建记录功能是否正常

## ⚠️ 注意事项

### 1. Node.js 依赖
脚本需要 Node.js 环境，如果没有安装：
- **Windows**: 访问 https://nodejs.org/ 下载安装
- **Linux**: `sudo apt-get install nodejs npm`
- **macOS**: `brew install node`

### 2. OpenSSL 依赖（生成证书需要）
- **Windows**: 安装 [Git for Windows](https://git-scm.com/)（包含 OpenSSL）
- **Linux/macOS**: 通常已预装

### 3. 防火墙设置
确保防火墙允许以下端口：
- **5173** - Vite 开发服务器
- **3000** - 后端 API 服务器

### 4. IP 地址格式
只接受局域网 IP 地址：
- `192.168.x.x` ✅
- `10.x.x.x` ✅
- `172.16-31.x.x` ✅
- `127.0.0.1` ❌
- 公网 IP ❌

## 🐛 故障排除

### 问题 1：无法检测 IP
**解决方案**：手动指定 IP
```bash
update-ip.bat 192.168.1.100
```

### 问题 2：证书生成失败
**可能原因**：OpenSSL 未安装

**解决方案**：
- Windows: 安装 [Git for Windows](https://git-scm.com/download/win)
- Linux: `sudo apt-get install openssl`
- macOS: 已预装，无需安装

### 问题 3：构建失败
**可能原因**：依赖未安装

**解决方案**：
```bash
cd mobile-frontend
npm install
```

### 问题 4：手机无法访问
**检查清单**：
- [ ] 电脑和手机在同一 Wi-Fi
- [ ] 防火墙允许 5173 端口
- [ ] 开发服务器正在运行（`npm run dev:h5`）
- [ ] 手机浏览器访问 `https://新IP:5173/`

## 📊 脚本输出示例

```
========================================
   IP 地址自动更换工具
========================================

🔍 正在检测本机 IP 地址...
检测到 IP: 192.168.1.100

========================================
   即将更换 IP 地址
========================================

旧 IP: 192.168.10.5
新 IP: 192.168.1.100

即将修改以下文件：
  - mobile-frontend/.env.development
  - mobile-frontend/.env.production
  - mobile-frontend/vite.config.ts
  - mobile-frontend/certs/*.bat
  - mobile-frontend/certs/*.sh
  - backend/src/main.ts

将执行以下操作：
  1. 批量替换配置文件中的 IP
  2. 重新生成 SSL 证书
  3. 重新构建前端

按 Ctrl+C 取消，或按任意键继续...

🚀 开始执行...

📝 步骤 1: 更新配置文件...
   ✅ 开发环境变量
   ✅ 生产环境变量
   ✅ Vite 配置
   ...

🔐 步骤 2: 生成 SSL 证书...
✅ SSL 证书生成成功

🔨 步骤 3: 重新构建前端...
✅ 前端构建成功

✨ IP 地址更换完成！

📋 后续步骤：
   1. （可选）重启后端服务器
   2. 启动前端开发服务器：npm run dev:h5
   3. 在手机浏览器测试访问: https://192.168.1.100:5173/
```

## 🎓 高级用法

### 查看脚本帮助
```bash
node scripts/update-ip.js --help
```

### 只更新配置，不构建
修改 `scripts/update-ip.js`，注释掉 `await rebuildFrontend()` 这一行

### 自定义旧 IP
修改 `scripts/update-ip.js` 中的 `const OLD_IP = '192.168.10.5'`

## 💡 最佳实践

1. **测试环境验证**：在测试环境先运行脚本，确认无误后再在生产环境使用

2. **备份配置**：虽然脚本很安全，但建议在重要更改前备份项目

3. **版本控制**：提交到 Git 后，可以轻松回滚：
   ```bash
   git checkout .
   ```

## 📞 技术支持

如果遇到问题：
1. 查看控制台输出的错误信息
2. 检查 Node.js 版本：`node --version`（建议 v16+）
3. 查看快速开始指南：`IP更换工具-快速开始.md`

## 📄 许可证

MIT License
