# 🚀 IP 地址自动更换工具 - 快速开始

## ⚡ 3 秒快速使用

### Windows
```bash
# 方法 1：双击运行
双击 update-ip.bat

# 方法 2：命令行
update-ip.bat
```

### Linux/Mac
```bash
./update-ip.sh
```

### 手动指定 IP
```bash
# Windows
update-ip.bat 192.168.1.100

# Linux/Mac
./update-ip.sh 192.168.1.100
```

## 📦 文件清单

| 文件 | 说明 | 平台 |
|------|------|------|
| `update-ip.bat` | Windows 批处理脚本 | Windows |
| `update-ip.sh` | Shell 脚本 | Linux/Mac |
| `scripts/update-ip.js` | Node.js 主脚本 | 跨平台 |
| `scripts/README.md` | 详细使用说明 | - |

## ✨ 功能特性

- ✅ **自动检测 IP** - 无需手动输入
- ✅ **批量替换** - 一次更新所有配置
- ✅ **生成证书** - 自动创建 SSL 证书
- ✅ **重新构建** - 自动构建前端
- ✅ **安全可靠** - 基于正则表达式精确替换

## 📊 将修改的文件

```
mobile-frontend/.env.development     ← 开发环境 API 地址
mobile-frontend/.env.production      ← 生产环境 API 地址
mobile-frontend/vite.config.ts        ← Vite 服务器配置
mobile-frontend/certs/*.bat           ← 证书生成脚本
mobile-frontend/certs/*.sh            ← 证书生成脚本
backend/src/main.ts                    ← 后端日志（可选）
```

## 🎯 执行流程

```
1. 检测/输入新 IP 地址
       ↓
2. 批量替换配置文件中的 IP
       ↓
3. 重新生成 SSL 证书
       ↓
4. 重新构建前端项目
       ↓
✅ 完成！
```

## 📋 完成后操作

执行完脚本后，**可选**操作：

```bash
# 重启后端服务器（如果需要）
cd backend && npm start
```

## 🔍 测试验证

在手机浏览器访问：
```
https://新IP:5173/
```

确认：
- ✅ 页面正常加载
- ✅ 扫码功能正常
- ✅ 创建记录功能正常

## ⚠️ 常见问题

### Q: 脚本无法运行？
**A**: 检查是否安装 Node.js：`node --version`

### Q: 证书生成失败？
**A**: 安装 OpenSSL：
- Windows: 安装 [Git for Windows](https://git-scm.com/)
- Linux: `sudo apt-get install openssl`

### Q: 手机无法访问？
**A**: 检查：
1. 电脑和手机在同一 Wi-Fi
2. 防火墙允许 5173 端口
3. 开发服务器正在运行（`npm run dev:h5`）

## 📚 详细文档

- 完整使用说明：`scripts/README.md`
- 手动更换指南：`更换IP地址指南.md`

## 💡 提示

- 脚本会自动备份吗？不会，但可以使用 Git 回滚：`git checkout .`
- 支持哪些 IP？局域网 IP：`192.168.x.x`、`10.x.x.x`、`172.16-31.x.x`
- 需要多长时间？通常 1-2 分钟

## 🎉 开始使用

```bash
# Windows 用户
update-ip.bat

# Linux/Mac 用户
./update-ip.sh
```

就这么简单！🚀
