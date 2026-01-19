# Caddy 部署指南 - Windows 10 内网 HTTPS 部署

## 📖 文档说明

本指南提供完整的 Caddy 服务器部署步骤，将康复治疗记录系统（H5版本）部署到内网 Windows 10 电脑，实现 HTTPS 访问，支持扫码、PWA 等所有功能。

**适用场景**：内网环境，IP 地址：`192.168.10.5`

**🚀 核心优势**：Caddy 支持自动生成和管理自签名证书，无需手动生成证书文件！

---

## 📋 目录

1. [快速开始（5分钟）](#快速开始5分钟)
2. [详细步骤](#详细步骤)
   - [下载和安装 Caddy](#步骤-1下载和安装-caddy)
   - [配置 Caddy](#步骤-2配置-caddy)
   - [启动 Caddy 服务器](#步骤-3启动-caddy-服务器)
   - [测试 HTTPS 访问](#步骤-4测试-https-访问)
3. [常见问题](#常见问题)
4. [方案对比](#方案对比)
5. [手机访问配置](#手机访问配置)

---

## 📱 快速开始（5分钟）

### 步骤 1：下载和安装 Caddy

1. 访问：https://caddyserver.com/
2. 点击 **"Download"**
3. 选择 **Windows x64** 版本下载（约50MB）
4. 解压并将整个文件夹复制到：`C:\Program Files\Caddy\`
5. （可选）添加到系统环境变量

### 步骤 2：创建 Caddyfile

在 `C:\Users\youda\Desktop\new\` 创建 `Caddyfile`（无扩展名）：

```caddy
# ====================================
# Caddy 配置文件 - 自动签名证书
# 作用：内网 HTTPS 部署康复治疗记录系统 H5 版本
# ====================================

# 监听 HTTPS 端口 8443
:8443 {
	# 使用 Caddy 内部 CA 自动生成证书
	tls internal

	# 网站根目录
	root * C:\Users\youda\Desktop\new\mobile-frontend\dist\build\h5

	# SPA 单页应用路由：所有路径重定向到 index.html
	try_files {uri} /index.html

	# 启用 gzip 和 Brotli 压缩
	encode gzip br

	# 静态资源缓存（图片缓存 7 天）
	@static {
		file_hash
	}
	header @static Cache-Control "public, max-age=604800"
}
```

### 步骤 3：启动 Caddy

以**管理员身份**打开命令提示符：

```bash
# 切换到项目目录
cd C:\Users\youda\Desktop\new

# 启动 Caddy
caddy run
```

看到以下日志表示成功：

```
INFO    using config from file: Caddyfile
INFO    admin   admin endpoint started
INFO    tls     cleaned up storage units
INFO    tls     finished cleaning storage units
INFO    automatically installing certificate
INFO    serving files on HTTPS
```

### 步骤 4：访问测试

在浏览器访问：

```
https://192.168.10.5:8443/
```

第一次访问会提示证书不安全，点击"高级" → "继续访问"即可。

---

## 📝 详细步骤

### 步骤 1：下载和安装 Caddy

#### 1.1 下载 Caddy

1. 访问官网：https://caddyserver.com/
2. 点击 **"Download"** 按钮
3. 选择 **Windows x64** 版本（文件名：`caddy_windows_amd64.zip`，约50MB）
4. 下载完成后解压

#### 1.2 安装 Caddy

1. 将解压后的整个文件夹复制到系统目录：
   ```
   C:\Program Files\Caddy\
   ```

2. （推荐）添加到系统环境变量：
   - 右键"此电脑" → "属性"
   - 点击"高级系统设置" → "环境变量"
   - 在"系统变量"中找到 `Path`，点击"编辑"
   - 添加新条目：`C:\Program Files\Caddy`
   - 点击"确定"保存

---

### 步骤 2：配置 Caddy

#### 2.1 创建 Caddyfile

在项目根目录 `C:\Users\youda\Desktop\new\` 创建名为 `Caddyfile` 的文件（注意：无扩展名）

#### 2.2 Caddyfile 配置说明

```caddy
# 监听端口和自动签名
:8443 {
	tls internal           # 自动生成和续期证书
	root * <网站根目录>   # 指定网站文件目录
	try_files {uri} /index.html  # SPA 路由支持
	encode gzip br         # 启用压缩
}
```

**核心配置项说明**：
- **`tls internal`**：使用 Caddy 内部 CA 自动生成证书，无需手动配置
- **`root *`**：指定网站根目录（H5 构建输出目录）
- **`try_files`**：支持 Vue/React 等单页应用的客户端路由
- **`encode`**：启用 gzip 和 Brotli 压缩，提升加载速度

---

### 步骤 3：启动 Caddy 服务器

#### 方式 1：命令行启动（推荐用于测试）

1. 按 `Win + R`，输入 `cmd`
2. **以管理员身份运行**命令提示符
3. 切换到项目目录：
   ```bash
   cd C:\Users\youda\Desktop\new
   ```
4. 启动 Caddy：
   ```bash
   caddy run
   ```

#### 方式 2：后台服务启动（推荐用于生产）

```bash
# 注册为 Windows 服务（需管理员权限）
caddy install-service

# 启动服务
caddy start

# 停止服务
caddy stop

# 卸载服务
caddy uninstall-service
```

#### 验证启动成功

看到以下日志表示成功：

```
INFO    using config from file: Caddyfile
INFO    admin   admin endpoint started  on 127.0.0.1:2019
INFO    tls.cache.maintenance   started background certificate maintenance
INFO    automatically installing certificate
INFO    serving files on HTTPS
```

---

### 步骤 4：测试 HTTPS 访问

#### 4.1 桌面浏览器测试

1. 打开浏览器访问：`https://192.168.10.5:8443/`
2. 第一次访问会显示安全警告：
   - Chrome: 点击"高级" → "继续访问"
   - Edge: 点击"高级" → "前往 xxx (不安全)"
3. 验证功能：
   - ✅ 登录功能正常
   - ✅ 扫码功能正常（HTTPS 环境可调用摄像头）
   - ✅ 创建记录功能正常
   - ✅ PWA 安装提示正常

#### 4.2 永久信任证书（可选）

**Windows 桌面版**：

1. 访问 `https://192.168.10.5:8443/`
2. 点击地址栏左侧的锁图标
3. 点击"连接是安全的" → "证书有效"
4. 点击"详细信息" → "复制到文件"
5. 打开"管理计算机证书"（Win + R 搜索 `certmgr.msc`）
6. 导入证书到"受信任的根证书颁发机构"

---

## 🔧 常见问题

### Q1：端口被占用

**错误信息**：
```
listen tcp 0.0.0.0:8443: bind: address already in use
```

**解决方案**：

```bash
# 查看 8443 端口占用情况
netstat -ano | findstr :8443

# 找到占用端口的进程 PID（最后一列）
# 停止该进程
taskkill /F /PID <进程ID>
```

### Q2：证书警告

**现象**：浏览器提示"连接不安全"或"证书无效"

**说明**：内网环境使用自签名证书的正常现象

**解决方法**：
- **测试环境**：点击"高级" → "继续访问"即可
- **生产环境**：将证书导入到系统的"受信任的根证书颁发机构"

### Q3：无法访问网站

**检查清单**：

1. ✅ Caddy 是否正在运行？
   ```bash
   netstat -ano | findstr :8443
   ```

2. ✅ 防火墙是否允许 8443 端口？
   ```bash
   # Windows 防火墙 - 入站规则 - 新建规则
   # 端口 8443，允许连接
   ```

3. ✅ Caddyfile 路径是否正确？
   ```bash
   # 检查网站根目录是否存在
   dir "C:\Users\youda\Desktop\new\mobile-frontend\dist\build\h5"
   ```

4. ✅ 手机和电脑是否在同一网络？
   ```bash
   # 查看电脑 IP 地址
   ipconfig
   ```

### Q4：配置文件语法错误

**错误信息**：
```
adapting config to caddy's native format: adapting config using caddyfile: ...
```

**解决方法**：
- 检查 Caddyfile 缩进（使用 Tab，不要用空格）
- 检查大括号是否配对
- 检查路径是否用引号包裹（包含空格时）

---

## 📊 方案对比

### Caddy vs 其他部署方案

| 特性 | Caddy | IIS | Python http.server | npm run dev:h5 |
|------|-------|-----|-------------------|----------------|
| **安装难度** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ |
| **配置难度** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| **自动 HTTPS** | ✅ 自动 | ❌ 需手动配置 | ❌ 需配置证书 | ✅ 自动 |
| **证书管理** | ✅ 自动管理 | ❌ 需手动配置 | ❌ 需配置证书 | ✅ 自动管理 |
| **性能** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐⭐⭐⭐ |
| **内网部署** | ✅ 完美支持 | ✅ 支持 | ✅ 支持 | ⭐⭐⭐ |
| **生产环境** | ✅ 推荐 | ✅ 支持 | ❌ 不推荐 | ❌ 不推荐 |
| **跨平台** | ✅ Windows/Linux/macOS | ❌ 仅 Windows | ✅ 跨平台 | ✅ 跨平台 |

**推荐方案**：
- **内网测试**：Caddy 或 `npm run dev:h5`
- **内网生产**：Caddy（自动 HTTPS + 高性能）
- **公网生产**：Caddy + Let's Encrypt（免费正式证书）

---

## 📱 手机访问配置

### Android 设备

1. **确保同一网络**：手机和电脑连接同一 Wi-Fi
2. **打开 Chrome 浏览器**
3. **访问地址**：
   ```
   https://192.168.10.5:8443/
   ```
4. **信任证书**：
   - 首次访问会提示"您的连接不是私密连接"
   - 点击"高级" → "继续访问"

### iOS 设备（iPhone/iPad）

1. **打开 Safari 浏览器**
2. **访问地址**：
   ```
   https://192.168.10.5:8443/
   ```
3. **信任证书**（如需消除警告）：
   - 首次访问后，打开"设置" → "通用" → "关于本机" → "证书信任设置"
   - 找到对应证书，开启"针对根证书启用完全信任"

---

## 🎯 总结

### ✅ Caddy 自动签名功能优势

- **零配置证书**：只需 `tls internal` 一行配置
- **自动生成**：首次启动自动生成证书和私钥
- **自动续期**：证书快到期时自动续期
- **HTTPS 支持**：完美支持摄像头、麦克风、PWA 等需要 HTTPS 的功能
- **内网友好**：无需域名，直接使用 IP 地址

### 🚀 快速部署命令

```bash
# 1. 下载 Caddy：https://caddyserver.com/
# 2. 创建 Caddyfile（见上方配置）
# 3. 启动服务
cd C:\Users\youda\Desktop\new
caddy run

# 4. 访问
# 浏览器打开：https://192.168.10.5:8443/
```

### 📚 相关资源

- [Caddy 官方文档](https://caddyserver.com/docs/)
- [Caddyfile 配置参考](https://caddyserver.com/docs/caddyfile/concepts)
- [自动 HTTPS 文档](https://caddyserver.com/docs/automatic-https)
- [tls 指令文档](https://caddyserver.com/docs/caddyfile/directives/tls)

---

## 💡 最佳实践建议

### 测试环境配置

- **服务器**：Caddy 或 `npm run dev:h5`
- **端口**：5173（dev）或 8443（Caddy）
- **访问地址**：
  - `https://192.168.10.5:5173`（npm dev）
  - `https://192.168.10.5:8443`（Caddy）

### 生产环境配置

- **服务器**：Caddy（推荐）或 Nginx
- **端口**：443（标准 HTTPS 端口，可省略端口号）
- **访问地址**：`https://192.168.10.5/`
- **证书**：
  - 内网：`tls internal`（自签名）
  - 公网：默认配置（Let's Encrypt 免费证书）

### 性能优化建议

1. **启用压缩**：`encode gzip br`（已在配置中）
2. **静态资源缓存**：配置 Cache-Control 头
3. **HTTP/2**：Caddy 默认启用，提升加载速度
4. **日志管理**：生产环境可配置日志轮转

---

**🎉 部署完成后，你将拥有：**
- ✅ 自动 HTTPS 的内网服务器
- ✅ 支持扫码、PWA 等现代 Web 功能
- ✅ 高性能、零配置的部署方案
- ✅ 跨平台的统一部署体验

**使用 Caddy + `tls internal` 是最简单、最现代的内网 HTTPS 部署方案！** 🚀
