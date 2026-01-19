# PWA 全屏功能使用指南

## 📱 什么是 PWA？

PWA（Progressive Web App）是一种使用现代 Web 技术构建的应用程序，可以提供类似原生应用的体验，包括：

- ✅ **全屏显示**：隐藏浏览器地址栏和导航栏
- ✅ **添加到主屏幕**：可以像原生 App 一样安装
- ✅ **离线工作**：支持离线访问部分功能
- ✅ **快速启动**：加载速度快，体验流畅

## 🚀 如何使用 PWA 全屏功能

### 方法一：Android Chrome（推荐）

1. **在 Chrome 浏览器中打开 H5 页面**
   ```
   https://your-domain.com
   ```

2. **查看浏览器提示**
   - 页面加载后，Chrome 会自动显示"添加到主屏幕"或"安装应用"的提示
   - 点击"添加"或"安装"

3. **如果没有看到提示**
   - 点击浏览器菜单（右上角三个点 ⋮）
   - 选择"添加到主屏幕"或"安装应用"

4. **从主屏幕打开**
   - 返回手机主屏幕
   - 找到"康复记录"图标
   - 点击打开 → **自动全屏运行！**

### 方法二：iOS Safari（iPhone/iPad）

1. **在 Safari 浏览器中打开 H5 页面**

2. **点击分享按钮**
   - 底部导航栏的分享图标 📤

3. **向下滚动找到"添加到主屏幕"**
   - 点击该选项

4. **点击"添加"**
   - 可以自定义名称（默认为"康复记录"）
   - 点击右上角"添加"按钮

5. **从主屏幕打开**
   - 返回主屏幕
   - 找到新添加的图标
   - 点击打开 → **全屏运行！**

## ⚙️ 配置说明

### 已配置的功能

#### 1. **全屏模式** (display: standalone)
```json
{
  "display": "standalone"
}
```
- 隐藏浏览器地址栏
- 隐藏前进/后退按钮
- 保留系统状态栏（时间、电量）

#### 2. **竖屏显示**
```json
{
  "orientation": "portrait"
}
```
- 锁定竖屏方向
- 适合扫码功能

#### 3. **主题色**
```json
{
  "theme_color": "#0ea5e9"
}
```
- 系统UI使用品牌色
- 提升视觉一致性

#### 4. **离线缓存**
- 图片：CacheFirst 策略，缓存 30 天
- 静态资源：StaleWhileRevalidate 策略
- 提升加载速度

## 🔨 开发环境 vs 生产环境

### 开发环境
```typescript
devOptions: {
  enabled: false  // PWA 功能禁用
}
```
- 开发时不会生成 Service Worker
- 方便调试热更新

### 生产环境
```bash
npm run build:h5
```
- 自动生成 PWA manifest
- 自动生成 Service Worker
- 支持离线缓存

## 📦 构建和部署

### 1. 构建项目
```bash
cd mobile-frontend
npm run build:h5
```

### 2. 部署要求
- ✅ **必须使用 HTTPS**（PWA 要求）
- ✅ Service Worker 文件会自动生成到 `dist/build/h5/` 目录
- ✅ manifest.webmanifest 会自动注入到 HTML

### 3. 验证 PWA
打开 Chrome DevTools：
- **Application 标签**
- 检查 **Manifest**：应显示应用信息
- 检查 **Service Workers**：应显示已激活
- 检查 **Lighthouse**：运行 PWA 审计

## 🎨 图标配置（重要）

### 当前状态
- ✅ 已创建 SVG 占位图标
- ⚠️ 需要添加 PNG 图标以获得最佳效果

### 需要添加的图标

在 `mobile-frontend/public/` 目录下添加：

1. **pwa-192x192.png** (192x192 像素)
   - Android 主屏幕图标

2. **pwa-512x512.png** (512x512 像素)
   - 高分辨率设备图标

### 生成图标的方法

#### 在线工具
访问：https://realfavicongenerator.net/
1. 上传您的 Logo
2. 自动生成所有尺寸
3. 下载并放入 `public/` 目录

#### 命令行工具
```bash
npm install -g pwa-asset-generator
pwa-asset-generator your-logo.png ./public
```

## 🔧 常见问题

### Q1: 添加到主屏幕后仍然有地址栏？
**A:** 检查以下几点：
- 确认是从主屏幕图标打开，而非浏览器书签
- 检查 manifest 是否正确加载（DevTools → Application → Manifest）
- iOS Safari：确认已添加到主屏幕，而非收藏夹

### Q2: 没有看到"添加到主屏幕"的提示？
**A:**
- **Android**: 手动点击菜单 → "添加到主屏幕"
- **iOS**: 点击分享按钮 → "添加到主屏幕"

### Q3: PWA 功能在开发环境不工作？
**A:** 这是正常的，PWA 在开发环境已禁用（`devOptions.enabled: false`）。
构建生产环境后才能看到完整效果：
```bash
npm run build:h5
```

### Q4: iOS Safari 没有全屏？
**A:** iOS Safari 的全屏需要满足：
- 使用 `apple-mobile-web-app-capable` meta 标签 ✅
- 从主屏幕打开（不是浏览器）
- iOS 11.3+ 支持 standalone 模式

## 📊 效果对比

| 方式 | 地址栏 | 导航栏 | 体验 |
|------|--------|--------|------|
| 浏览器直接打开 | ✅ 显示 | ✅ 显示 | ⭐⭐ |
| PWA Standalone | ❌ 隐藏 | ❌ 隐藏 | ⭐⭐⭐⭐⭐ |

## 🔗 参考文档

- [vite-plugin-pwa 官方文档](https://github.com/vite-pwa/vite-plugin-pwa)
- [PWA Manifest 规范](https://www.w3.org/TR/appmanifest/)
- [MDN - Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest)

## 💡 最佳实践

1. **引导用户添加到主屏幕**
   - 在首页添加提示："添加到主屏幕，获得更好的体验"

2. **提供图标**
   - 使用专业设计的图标
   - 确保在各种背景下清晰可见

3. **测试**
   - 在真机上测试（Android + iOS）
   - 验证全屏效果
   - 检查离线功能

4. **HTTPS**
   - PWA 必须在 HTTPS 环境下工作
   - localhost 除外

---

**配置完成时间**: 2025-01-19
**配置工具**: vite-plugin-pwa (Context7 文档)
