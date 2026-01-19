# H5扫码功能设计文档

**创建日期:** 2025-01-18
**功能分支:** feature/h5-qrcode
**设计目标:** 为医院内网H5应用添加基于摄像头的实时扫码功能

---

## 一、功能概述

### 1.1 核心功能

**H5扫码功能：**
- 医护人员通过手机浏览器访问内网IP（如 `https://192.168.10.5:5173`）
- 调用手机摄像头实时扫描PC端生成的患者二维码
- 自动解析二维码中的病历号信息
- 跳转到创建治疗记录页面
- 自动填充患者信息

### 1.2 技术挑战与解决方案

**挑战1：uni.scanCode不支持H5环境**
- ❌ 问题：`uni.scanCode` API仅支持App环境，H5浏览器无法调用
- ✅ 解决：使用 `html5-qrcode.js` 纯JavaScript库

**挑战2：浏览器摄像头API需要HTTPS**
- ❌ 问题：`navigator.mediaDevices.getUserMedia()` 要求HTTPS环境
- ✅ 解决：为内网IP生成自签名SSL证书

**挑战3：内网环境无域名**
- ❌ 问题：通常SSL证书绑定域名，内网只有IP地址
- ✅ 解决：生成支持IP地址的SAN证书

---

## 二、技术架构

### 2.1 技术选型

**前端技术栈：**
- **html5-qrcode** - 纯JavaScript扫码库
- **Vite Dev Server** - 开发服务器，配置HTTPS
- **OpenSSL** - 生成自签名SSL证书
- **uni-app** - 跨平台移动应用框架

**部署环境：**
- **内网IP：** 192.168.10.5（可配置）
- **HTTPS端口：** 5173
- **访问方式：** 手机浏览器直接输入IP

### 2.2 系统架构

```
手机浏览器
    ↓
访问 https://192.168.10.5:5173
    ↓
H5应用加载（HTTPS + 自签名证书）
    ↓
用户点击"扫一扫"
    ↓
请求摄像头权限
    ↓
html5-qrcode调用摄像头API
    ↓
实时扫码识别
    ↓
识别成功 → 解析病历号
    ↓
跳转到创建治疗记录页面
    ↓
自动填充患者信息
```

### 2.3 浏览器兼容性

**支持的浏览器：**
- ✅ Chrome Mobile 90+ (Android)
- ✅ Safari 11+ (iOS)
- ✅ Firefox Mobile
- ✅ Edge Mobile

**不支持的浏览器：**
- ❌ 微信内置浏览器（需要使用微信JS-SDK单独实现）

**系统要求：**
- HTTPS环境（必须有SSL证书）
- 摄像头权限
- 现代浏览器（支持ES6+）

---

## 三、SSL证书配置

### 3.1 自签名证书生成

**证书参数：**
- **IP地址：** 192.168.10.5
- **有效期：** 10年（3650天）
- **密钥类型：** RSA 2048位
- **扩展：** SAN（Subject Alternative Name）支持IP地址

**生成脚本：**
```batch
# Windows: generate-cert.bat
openssl genrsa -out 192.168.10.5-key.pem 2048

openssl req -new -x509 -key 192.168.10.5-key.pem \
  -out 192.168.10.5-cert.pem \
  -days 3650 \
  -subj "/C=CN/ST=State/L=City/O=Hospital/CN=192.168.10.5" \
  -config req.cnf -extensions v3_req
```

### 3.2 Vite HTTPS配置

```typescript
// vite.config.ts
import fs from 'fs'
import path from 'path'

const IP_ADDRESS = '192.168.10.5'

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, `certs/${IP_ADDRESS}-key.pem`)),
      cert: fs.readFileSync(path.resolve(__dirname, `certs/${IP_ADDRESS}-cert.pem`))
    },
    host: IP_ADDRESS,
    port: 5173,
    strictPort: true
  }
})
```

### 3.3 证书信任配置

**iOS Safari：**
1. 访问 `https://192.168.10.5:5173`
2. 看到警告时点击"详情"
3. 点击"访问此网站"
4. 滚动到底部，点击证书详情
5. 点击"信任此证书"

**Android Chrome：**
1. 访问 `https://192.168.10.5:5173`
2. 看到"您的连接不是私密连接"警告
3. 点击"ADVANCED"
4. 点击"Proceed to 192.168.10.5 (unsafe)"

---

## 四、UI/UX设计

### 4.1 界面布局

**权限申请阶段：**
```
┌─────────────────────────────┐
│                             │
│        📷                   │
│   需要使用摄像头             │
│                             │
│ 请允许浏览器访问摄像头       │
│ 以扫描二维码                 │
│                             │
│  [允许使用摄像头]            │
│                             │
└─────────────────────────────┘
```

**扫码阶段：**
```
┌─────────────────────────────┐
│                             │
│  ┌─────────────────────┐   │
│  │ ┌─────────────────┐ │   │
│  │ │                 │ │   │
│  │ │   摄像头预览    │ │   │
│  │ │                 │ │   │
│  │ └─────────────────┘ │   │
│  │    扫描框           │   │
│  └─────────────────────┘   │
│   将二维码放入框内          │
│                             │
│ [停止码] [切换摄像头]       │
└─────────────────────────────┘
```

### 4.2 交互流程

1. **打开扫码页面** → 检测权限状态
2. **无权限** → 显示引导界面 → 点击"允许"
3. **浏览器弹窗** → 用户点击"允许"
4. **启动扫码** → 显示摄像头预览
5. **扫描二维码** → 自动识别
6. **识别成功** → 震动反馈 + 提示音
7. **停止扫码** → 跳转到创建治疗记录
8. **自动填充** → 显示患者信息

### 4.3 错误处理

**摄像头权限被拒绝：**
```
┌─────────────────────────────┐
│  ❌ 无法访问摄像头           │
│                             │
│ 请在浏览器地址栏点击锁图标， │
│ 允许访问摄像头               │
│                             │
│      [重试]                 │
└─────────────────────────────┘
```

**摄像头被占用：**
```
┌─────────────────────────────┐
│  ⚠️ 摄像头可能被其他应用占用 │
│                             │
│ 请关闭其他使用摄像头的应用后 │
│ 重试                         │
│                             │
│      [重试]                 │
└─────────────────────────────┘
```

---

## 五、技术实现细节

### 5.1 html5-qrcode集成

**安装依赖：**
```bash
npm install html5-qrcode
```

**组件导入：**
```typescript
import { Html5Qrcode } from 'html5-qrcode'
```

**初始化实例：**
```typescript
const html5QrCode = new Html5Qrcode('reader')
```

### 5.2 智能权限请求

**检测权限状态：**
```typescript
async function checkCameraPermission(): Promise<boolean> {
  try {
    if (navigator.permissions) {
      const result = await navigator.permissions.query({ name: 'camera' })
      return result.state === 'granted'
    }
    return false
  } catch {
    return false
  }
}
```

**启动扫码：**
```typescript
await html5QrCode.start(
  { facingMode: 'environment' },  // 后置摄像头
  { fps: 10, qrbox: { width: 250, height: 250 } },
  (decodedText) => handleScanSuccess(decodedText),
  (errorMessage) => console.warn(errorMessage)
)
```

### 5.3 扫码成功处理

**震动反馈：**
```typescript
if (navigator.vibrate) {
  navigator.vibrate(200)
}
```

**提示音：**
```typescript
function playBeepSound() {
  const audio = new Audio('/static/beep.mp3')
  audio.play().catch(console.error)
}
```

**数据处理：**
```typescript
function handleScanSuccess(decodedText: string) {
  const match = decodedText.match(/medicalNo[=:]([^&]+)//)
  if (match && match[1]) {
    uni.navigateTo({
      url: `/pages/record/create?medicalNo=${match[1]}`
    })
  }
}
```

### 5.4 资源清理

**组件卸载：**
```typescript
onUnmounted(async () => {
  if (html5QrCode && isScanning.value) {
    await html5QrCode.stop()
  }
})
```

---

## 六、错误处理与边界情况

### 6.1 常见错误处理

**NotAllowedError（权限被拒绝）：**
```typescript
if (error.name === 'NotAllowedError') {
  errorMessage.value = '请在浏览器地址栏点击锁图标，允许访问摄像头'
}
```

**NotFoundError（无摄像头）：**
```typescript
if (error.name === 'NotFoundError') {
  errorMessage.value = '未检测到摄像头设备'
}
```

**NotReadableError（摄像头被占用）：**
```typescript
if (error.name === 'NotReadableError') {
  errorMessage.value = '摄像头可能被其他应用占用，请关闭后重试'
}
```

### 6.2 边界情况处理

**HTTPS环境检测：**
```typescript
if (location.protocol !== 'https:') {
  ElMessage.warning('扫码功能需要HTTPS环境，请使用https://访问')
  return
}
```

**浏览器兼容性检测：**
```typescript
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  ElMessage.error('当前浏览器不支持摄像头API，请使用Chrome或Safari')
  return
}
```

**重复识别处理：**
```typescript
let lastScannedText = ''
let lastScannedTime = 0

function handleScanSuccess(decodedText: string) {
  const now = Date.now()
  if (decodedText === lastScannedText && now - lastScannedTime < 2000) {
    return  // 防止重复识别
  }
  lastScannedText = decodedText
  lastScannedTime = now
  // 处理扫码结果...
}
```

---

## 七、性能优化

### 7.1 扫码性能优化

**帧数设置：**
- fps: 10（每秒10帧，平衡性能和识别率）

**扫码框大小：**
- 250x250px（适合各种屏幕尺寸）

**自动停止：**
- 识别成功后立即停止扫码，节省电量

### 7.2 内存优化

**资源释放：**
```typescript
onUnmounted(async () => {
  await stopScanning()
  html5QrCode.value = null
})
```

**错误清理：**
```typescript
try {
  await startScanning()
} catch (error) {
  // 清理可能创建的实例
  if (html5QrCode.value) {
    await html5QrCode.value.clear()
  }
}
```

### 7.3 用户体验优化

**加载状态：**
```typescript
const loading = ref(true)
// 启动扫码前显示loading
// 扫码启动后隐藏
```

**震动反馈：**
```typescript
if (navigator.vibrate) {
  navigator.vibrate([100, 50, 100])  // 震动模式
}
```

**声音反馈：**
```typescript
const audio = new Audio('/static/beep.mp3')
audio.volume = 0.5
audio.play()
```

---

## 八、测试策略

### 8.1 功能测试

**SSL证书测试：**
- [ ] 证书文件生成成功
- [ ] Vite服务器以HTTPS启动
- [ ] 内网设备可以访问
- [ ] 浏览器显示证书信息

**摄像头权限测试：**
- [ ] 首次请求显示引导
- [ ] 点击"允许"浏览器弹窗
- [ ] 拒绝权限显示错误提示
- [ ] 允许权限自动启动扫码

**扫码功能测试：**
- [ ] 摄像头预览正常
- [ ] 扫描患者二维码识别成功
- [ ] URL参数正确解析
- [ ] 跳转到创建治疗记录
- [ ] 患者信息自动填充

### 8.2 兼容性测试

**移动浏览器：**
- [ ] Chrome Mobile (Android 10+)
- [ ] Safari (iOS 13+)
- [ ] Firefox Mobile
- [ ] Samsung Internet

**系统版本：**
- [ ] Android 10+
- [ ] iOS 13+

**网络环境：**
- [ ] 内网WiFi
- [ ] 4G/5G热点（内网穿透）

### 8.3 性能测试

**扫码性能：**
- [ ] 识别响应时间 < 2秒
- [ ] CPU占用率正常
- [ ] 内存占用合理

**电池消耗：**
- [ ] 连续扫码10分钟电量消耗 < 10%

---

## 九、部署指南

### 9.1 开发环境部署

**步骤1：生成证书**
```bash
cd mobile-frontend/certs
.\generate-cert.bat  # Windows
# 或
bash generate-cert.sh  # Linux/Mac
```

**步骤2：配置Vite**
```bash
cd mobile-frontend
# 修改 vite.config.ts 中的 IP_ADDRESS
```

**步骤3：启动服务**
```bash
npm run dev:mp-weixin
# 或其他平台命令
```

**步骤4：手机访问**
```
1. 确保手机和电脑在同一WiFi
2. 打开手机浏览器
3. 访问 https://192.168.10.5:5173
4. 信任证书
5. 允许摄像头权限
```

### 9.2 生产环境部署

**服务器配置：**
```nginx
server {
    listen 443 ssl;
    server_name 192.168.10.5;

    ssl_certificate /path/to/192.168.10.5-cert.pem;
    ssl_certificate_key /path/to/192.168.10.5-key.pem;

    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**构建部署：**
```bash
npm run build
# 将 dist 目录部署到服务器
```

---

## 十、故障排查

### 10.1 常见问题

**问题1：无法访问HTTPS网站**
```
解决方案：
1. 检查IP地址是否正确
2. 确认设备在同一内网
3. 检查防火墙设置
4. 重新生成证书
```

**问题2：摄像头无法启动**
```
解决方案：
1. 确认是HTTPS环境
2. 检查浏览器权限
3. 关闭其他占用摄像头的应用
4. 重启浏览器
```

**问题3：扫码不识别**
```
解决方案：
1. 调整扫描距离
2. 确保光线充足
3. 等待对焦清晰
4. 检查二维码是否清晰
```

**问题4：iOS无法信任证书**
```
解决方案：
1. 完全关闭Safari
2. 重新访问网站
3. 点击"详情" → "访问此网站"
4. 在证书详情中点击"信任"
```

---

## 十一、安全考虑

### 11.1 内网隔离

- ✅ 仅在内网环境使用
- ✅ 不暴露到公网
- ✅ 使用内网IP

### 11.2 证书管理

- ✅ 私钥文件严格保密
- ✅ 不提交到Git仓库
- ✅ 定期更换证书（建议每年）

### 11.3 权限控制

- ✅ 仅在扫码时请求摄像头权限
- ✅ 使用完毕立即释放
- ✅ 记录权限请求日志

---

## 十二、后续优化方向

### 12.1 功能扩展

**微信内置浏览器支持：**
- 集成微信JS-SDK
- 使用 `wx.scanCode` API
- 需要微信公众号配置

**批量扫码：**
- 连续扫描多个患者二维码
- 批量创建治疗记录

**扫码历史：**
- 记录扫码历史
- 快速重新扫码

### 12.2 性能优化

**Web Worker：**
- 将扫码处理放到Worker线程
- 避免阻塞主线程

**离线支持：**
- Service Worker缓存
- 支持离线使用

### 12.3 用户体验优化

**智能对焦：**
- 自动检测二维码位置
- 调整摄像头焦距

**手势操作：**
- 点击屏幕对焦
- 双指缩放

---

## 十三、总结

本功能通过html5-qrcode库和自签名SSL证书，成功解决了H5环境无法使用`uni.scanCode`的问题。医护人员可以在内网环境中使用手机浏览器扫码，快速创建治疗记录，大大提高了工作效率。

**核心优势：**
- ✅ 纯前端实现，无需App
- ✅ 内网部署，数据安全
- ✅ 跨平台支持（Android + iOS）
- ✅ 用户友好，操作简单

**技术亮点：**
- ✅ 自签名SSL证书支持IP地址
- ✅ 智能权限请求
- ✅ 优雅的错误处理
- ✅ 良好的用户体验

**预期收益：**
- 减少手动输入错误率 95%
- 治疗记录创建时间缩短 60%
- 提升医护人员满意度
- 支持多种移动设备
