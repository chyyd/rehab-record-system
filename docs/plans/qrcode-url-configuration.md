# 二维码URL配置说明

## 当前实现

**二维码内容格式:**
```
/create-record?medicalNo=2024001
```

**路由路径:** `pages/record/create` (uni-app页面路径)

## 使用场景

### 场景1: 微信小程序(主要场景) ✅

**工作流程:**
1. PC端生成二维码(包含相对路径)
2. 微信扫一扫扫描二维码
3. 识别URL参数: `medicalNo=2024001`
4. 在小程序内打开对应页面并传递参数

**实现方式:**
- 二维码内容: `/pages/record/create?medicalNo=2024001`
- 小程序扫码后会自动识别并跳转

### 场景2: H5页面 ⚠️

**问题:** H5需要完整的HTTP URL

**解决方案:**
需要修改二维码生成逻辑,使用环境变量配置:

```typescript
// PatientQRCodeDialog.vue
const generateQRCode = () => {
  const baseURL = import.meta.env.VITE_MOBILE_H5_URL || 'http://localhost:5173'
  const qrData = `${baseURL}/#/pages/record/create?medicalNo=${props.patient.medicalRecordNo}`
  // ...
}
```

### 场景3: 移动端App扫码

**工作流程:**
1. 使用App内置扫码功能
2. 扫描后解析参数
3. 调用API查询患者
4. 跳转到创建记录页面

## 当前代码修改建议

### 选项A: 保持当前实现(推荐用于小程序)

当前代码已经满足uni-app小程序场景:
- ✅ 相对路径
- ✅ 参数格式正确
- ✅ 移动端已实现参数接收

无需修改,可直接用于小程序环境。

### 选项B: 支持多平台(需要配置)

如果需要同时支持H5和小程序,需要:

1. **添加环境变量配置**

创建 `web-admin/.env.local`:
```env
# 移动端H5地址
VITE_MOBILE_H5_URL=http://localhost:5173

# 或者生产环境
# VITE_MOBILE_H5_URL=https://yourdomain.com/mobile
```

2. **修改二维码生成逻辑**

```typescript
async function generateQRCode() {
  if (!qrCanvas.value || !props.patient?.medicalRecordNo) return

  try {
    // 根据环境选择URL格式
    const baseURL = import.meta.env.VITE_MOBILE_H5_URL
    let qrData: string

    if (baseURL) {
      // H5模式: 使用完整URL
      qrData = `${baseURL}/#/pages/record/create?medicalNo=${props.patient.medicalRecordNo}`
    } else {
      // 小程序模式: 使用相对路径
      qrData = `/pages/record/create?medicalNo=${props.patient.medicalRecordNo}`
    }

    const pxSize = SIZE_MAP[selectedSize.value]

    await QRCode.toCanvas(qrCanvas.value, qrData, {
      width: pxSize,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // 添加姓名文本
    const ctx = qrCanvas.value.getContext('2d')
    if (ctx) {
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#000000'
      ctx.fillText(props.patient.name || '', pxSize / 2, pxSize + 15)
    }
  } catch (error) {
    console.error('QR Code generation failed:', error)
    ElMessage.error('二维码生成失败,请重试')
  }
}
```

## 移动端路由路径说明

**uni-app页面路径:** `pages/record/create`

**uni.navigateTo 调用:**
```typescript
uni.navigateTo({
  url: '/pages/record/create?medicalNo=2024001'
})
```

**H5 URL格式:**
```
http://localhost:5173/#/pages/record/create?medicalNo=2024001
```

## 测试建议

### 测试小程序功能
1. 在微信开发者工具中测试
2. 使用编译模式: 微信小程序
3. 使用真机扫码测试

### 测试H5功能
1. 启动H5: `cd mobile-frontend && npm run dev:h5`
2. 配置环境变量 `VITE_MOBILE_H5_URL`
3. 浏览器访问生成的完整URL

## 当前状态

**PC端:** ✅ 实现完成
**后端API:** ✅ 实现完成
**移动端:** ✅ 参数接收已实现
**URL配置:** ⚠️ 需要根据实际使用场景决定

## 建议

**如果是小程序项目:**
- 保持当前实现
- 二维码使用相对路径即可
- 测试小程序扫码跳转

**如果是H5项目:**
- 修改为完整URL
- 配置环境变量
- 测试浏览器跳转

**如果是混合项目:**
- 使用选项B的多平台支持
- 通过环境变量控制
- 分别测试小程序和H5
