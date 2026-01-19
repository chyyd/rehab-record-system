# PWA 图标说明

## 需要的图标文件

为了完整支持 PWA 功能，请在 `public` 目录下放置以下图标文件：

### 必需的图标：

1. **pwa-192x192.png** (192x192 像素)
   - 用于 Android 主屏幕图标
   - PNG 格式，透明或白色背景

2. **pwa-512x512.png** (512x512 像素)
   - 用于高分辨率设备
   - PNG 格式，透明或白色背景

### 可选的图标：

3. **favicon.ico** (favicon)
   - 网站图标

4. **apple-touch-icon.png** (180x180 像素)
   - iOS 设备图标

5. **masked-icon.svg** (任意大小，SVG 格式)
   - 自适应图标

## 如何生成图标

### 方法 1：在线工具
访问 https://realfavicongenerator.net/ 上传您的 Logo，自动生成所有尺寸的图标

### 方法 2：使用设计软件
使用 Photoshop、Figma、Sketch 等工具创建以下尺寸的 PNG：
- 512x512 (高分辨率)
- 192x192 (标准 PWA)
- 180x180 (iOS)
- 192x192 (Android 自适应)

### 方法 3：使用命令行工具
```bash
npm install -g pwa-asset-generator
pwa-asset-generator your-logo.png ./public
```

## 临时解决方案

如果没有图标，PWA 仍然可以工作，但会使用默认图标。
建议尽快添加自定义图标以提升品牌识别度。

## 图标设计建议

1. **简洁**：PWA 图标尺寸较小，保持设计简洁
2. **高对比度**：确保在各种背景下清晰可见
3. **无文字**：避免在图标中添加文字
4. **正方形**：使用 1:1 比例
5. **主题色**：使用 `#0ea5e9` 作为主色调
