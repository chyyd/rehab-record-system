<template>
  <view class="scan-container">
    <!-- H5环境提示 -->
    <!-- #ifdef H5 -->
    <view class="h5-notice">
      <view class="notice-icon">ℹ️</view>
      <text class="notice-title">H5浏览器环境</text>
      <text class="notice-desc">当前为浏览器环境，请使用以下方式：</text>

      <view class="method-list">
        <view class="method-item">
          <text class="method-icon">1️⃣</text>
          <view class="method-content">
            <text class="method-title">使用手机扫码工具</text>
            <text class="method-desc">用微信扫一扫、手机相机等扫描PC端二维码</text>
          </view>
        </view>

        <view class="method-item">
          <text class="method-icon">2️⃣</text>
          <view class="method-content">
            <text class="method-title">复制二维码内容</text>
            <text class="method-desc">在PC端查看控制台，复制JSON数据粘贴到下方</text>
          </view>
        </view>

        <view class="method-item">
          <text class="method-icon">3️⃣</text>
          <view class="method-content">
            <text class="method-title">手动输入病历号</text>
            <text class="method-desc">直接输入6位病历号</text>
          </view>
        </view>
      </view>

      <!-- 输入框 -->
      <view class="input-section">
        <view class="input-group">
          <input
            class="qr-input"
            v-model="inputValue"
            placeholder="粘贴二维码内容或输入病历号"
            @confirm="handleInputConfirm"
          />
          <button class="confirm-btn" @click="handleInputConfirm">确认</button>
        </view>
        <text class="input-hint">输入示例: {"type":"patient","medicalNo":"2024001","name":"张三"}</text>
      </view>
    </view>
    <!-- #endif -->

    <!-- 真机环境：扫码区域 -->
    <!-- #ifndef H5 -->
    <view class="scan-area">
      <view class="scan-frame">
        <view class="scan-corner top-left"></view>
        <view class="scan-corner top-right"></view>
        <view class="scan-corner bottom-left"></view>
        <view class="scan-corner bottom-right"></view>
        <view class="scan-line"></view>
      </view>

      <view class="scan-tips">
        <text class="tips-text">将二维码放入框内即可自动扫描</text>
      </view>
    </view>
    <!-- #endif -->

    <!-- 操作按钮 -->
    <view class="action-buttons">
      <!-- #ifndef H5 -->
      <button class="scan-btn" @click="handleScan">
        <text class="btn-icon">📷</text>
        <text>点击扫码</text>
      </button>
      <!-- #endif -->

      <button class="manual-btn" @click="handleManualInput">
        <text class="btn-icon">✏️</text>
        <text>手动输入病历号</text>
      </button>
    </view>

    <!-- 扫码结果提示 -->
    <view v-if="scanResult" class="result-message" :class="{ success: isSuccess, error: !isSuccess }">
      <text class="result-text">{{ scanResult }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const scanResult = ref('')
const isSuccess = ref(false)
const inputValue = ref('')

// 检测当前环境
// #ifdef H5
console.log('🌐 当前环境: H5浏览器')
// #endif

// #ifndef H5
console.log('📱 当前环境: 真机/App')
// #endif

// 页面显示
onShow(() => {
  console.log('📱 扫码页面显示')
  // #ifndef H5
  // 真机环境可以选择自动扫码
  // autoScan()
  // #endif
})

/**
 * H5环境：确认输入
 */
// #ifdef H5
function handleInputConfirm() {
  const value = inputValue.value.trim()

  if (!value) {
    uni.showToast({
      title: '请输入内容',
      icon: 'none'
    })
    return
  }

  console.log('📝 用户输入:', value)
  processQRCodeData(value)
}
// #endif

/**
 * 自动扫码（仅真机）
 */
function autoScan() {
  handleScan()
}

/**
 * 处理扫码（仅真机）
 */
// #ifndef H5
function handleScan() {
  console.log('🔄 开始扫码')

  uni.scanCode({
    success: (res: any) => {
      console.log('✅ 扫码成功:', res)
      processQRCodeData(res.result)
    },
    fail: (err: any) => {
      console.error('❌ 扫码失败:', err)
      handleScanError(err)
    }
  })
}
// #endif

/**
 * 处理二维码数据（通用）
 */
function processQRCodeData(result: string) {
  console.log('📦 处理二维码数据:', result)

  try {
    // 尝试解析JSON数据
    const data = JSON.parse(result)

    if (data.type === 'patient' && data.medicalNo) {
      // 是患者二维码
      console.log('✅ 识别到患者二维码, 病历号:', data.medicalNo)

      uni.showToast({
        title: '扫码成功',
        icon: 'success'
      })

      // 跳转到创建记录页面
      setTimeout(() => {
        uni.navigateTo({
          url: `/pages/record/create?medicalNo=${data.medicalNo}`
        })
      }, 500)
    } else {
      throw new Error('无效的二维码类型')
    }
  } catch (error: any) {
    console.error('❌ 解析二维码失败:', error)

    // 可能是旧格式的URL，尝试从中提取病历号
    const match = result.match(/medicalNo[=:]([^&]+)/)

    if (match && match[1]) {
      console.log('✅ 从URL提取到病历号:', match[1])

      uni.showToast({
        title: '扫码成功',
        icon: 'success'
      })

      setTimeout(() => {
        uni.navigateTo({
          url: `/pages/record/create?medicalNo=${match[1]}`
        })
      }, 500)
    } else {
      // 尝试直接作为病历号
      if (/^\d{6}$/.test(result)) {
        console.log('✅ 识别到病历号:', result)

        uni.showToast({
          title: '扫码成功',
          icon: 'success'
        })

        setTimeout(() => {
          uni.navigateTo({
            url: `/pages/record/create?medicalNo=${result}`
          })
        }, 500)
      } else {
        scanResult.value = '无效的二维码'
        isSuccess.value = false

        uni.showToast({
          title: '无效的二维码',
          icon: 'none',
          duration: 2000
        })

        setTimeout(() => {
          scanResult.value = ''
        }, 3000)
      }
    }
  }
}

/**
 * 扫码失败处理
 */
function handleScanError(err: any) {
  console.error('扫码失败:', err)

  scanResult.value = '扫码失败: ' + (err.errMsg || '未知错误')
  isSuccess.value = false

  uni.showToast({
    title: '扫码失败',
    icon: 'none',
    duration: 2000
  })

  setTimeout(() => {
    scanResult.value = ''
  }, 3000)
}

/**
 * 手动输入病历号
 */
function handleManualInput() {
  console.log('✏️ 手动输入')

  uni.showModal({
    title: '输入病历号',
    editable: true,
    placeholderText: '请输入6位病历号',
    success: (res: any) => {
      if (res.confirm && res.content) {
        const medicalNo = res.content.trim()

        if (/^\d{6}$/.test(medicalNo)) {
          console.log('✅ 输入病历号:', medicalNo)

          uni.navigateTo({
            url: `/pages/record/create?medicalNo=${medicalNo}`
          })
        } else {
          uni.showToast({
            title: '病历号格式错误\n请输入6位数字',
            icon: 'none',
            duration: 2000
          })
        }
      }
    }
  })
}
</script>

<style lang="scss" scoped>
/* 医疗专业配色 */
$medical-blue: #0ea5e9;
$medical-teal: #14b8a6;
$bg-page: #f8fafc;
$text-primary: #1e293b;
$text-secondary: #64748b;
$text-hint: #94a3b8;

.scan-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f9ff 0%, $bg-page 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx;
}

/* H5环境提示样式 */
.h5-notice {
  width: 100%;
  max-width: 640rpx;
  background: white;
  border-radius: 24rpx;
  padding: 48rpx;
  margin-bottom: 48rpx;
  box-shadow: 0 8rpx 32rpx rgba(14, 165, 233, 0.15);
}

.notice-icon {
  font-size: 120rpx;
  text-align: center;
  margin-bottom: 24rpx;
}

.notice-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: $text-primary;
  text-align: center;
  margin-bottom: 16rpx;
}

.notice-desc {
  display: block;
  font-size: 28rpx;
  color: $text-secondary;
  text-align: center;
  margin-bottom: 32rpx;
}

.method-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.method-item {
  display: flex;
  gap: 24rpx;
  padding: 24rpx;
  background: #f8fafc;
  border-radius: 16rpx;
}

.method-icon {
  font-size: 48rpx;
  flex-shrink: 0;
}

.method-content {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.method-title {
  font-size: 28rpx;
  font-weight: 600;
  color: $text-primary;
}

.method-desc {
  font-size: 24rpx;
  color: $text-secondary;
  line-height: 1.5;
}

.input-section {
  margin-top: 32rpx;
}

.input-group {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.qr-input {
  flex: 1;
  height: 80rpx;
  padding: 0 24rpx;
  background: white;
  border: 2rpx solid #e2e8f0;
  border-radius: 12rpx;
  font-size: 26rpx;
}

.confirm-btn {
  height: 80rpx;
  padding: 0 32rpx;
  background: linear-gradient(135deg, $medical-blue 0%, $medical-teal 100%);
  color: white;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.input-hint {
  display: block;
  font-size: 22rpx;
  color: $text-hint;
  text-align: center;
}

/* 真机环境样式 */
.scan-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}

.scan-frame {
  position: relative;
  width: 560rpx;
  height: 560rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(14, 165, 233, 0.15);
}

.scan-corner {
  position: absolute;
  width: 80rpx;
  height: 80rpx;
  border-color: $medical-blue;
  border-style: solid;
}

.top-left {
  top: 24rpx;
  left: 24rpx;
  border-width: 8rpx 0 0 8rpx;
  border-radius: 8rpx 0 0 0;
}

.top-right {
  top: 24rpx;
  right: 24rpx;
  border-width: 8rpx 8rpx 0 0;
  border-radius: 0 8rpx 0 0;
}

.bottom-left {
  bottom: 24rpx;
  left: 24rpx;
  border-width: 0 0 8rpx 8rpx;
  border-radius: 0 0 0 8rpx;
}

.bottom-right {
  bottom: 24rpx;
  right: 24rpx;
  border-width: 0 8rpx 8rpx 0;
  border-radius: 0 0 8rpx 0;
}

.scan-line {
  position: absolute;
  width: 80%;
  height: 4rpx;
  background: linear-gradient(90deg, transparent, $medical-teal, transparent);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% {
    top: 10%;
  }
  50% {
    top: 90%;
  }
  100% {
    top: 10%;
  }
}

.scan-tips {
  margin-top: 48rpx;
  text-align: center;
}

.tips-text {
  font-size: 28rpx;
  color: $text-secondary;
  line-height: 1.6;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  width: 100%;
  max-width: 560rpx;
}

.scan-btn,
.manual-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  height: 96rpx;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
}

.scan-btn {
  background: linear-gradient(135deg, $medical-blue 0%, $medical-teal 100%);
  color: white;
  box-shadow: 0 8rpx 24rpx rgba(14, 165, 233, 0.3);
}

.manual-btn {
  background: white;
  color: $medical-blue;
  border: 2rpx solid $medical-blue;
}

.btn-icon {
  font-size: 40rpx;
}

/* 结果提示 */
.result-message {
  position: fixed;
  top: 120rpx;
  left: 50%;
  transform: translateX(-50%);
  padding: 24rpx 48rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 500;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  animation: slideDown 0.3s ease-out;
  z-index: 999;
}

.result-message.success {
  background: #dcfce7;
  color: #166534;
}

.result-message.error {
  background: #fee2e2;
  color: #991b1b;
}

.result-text {
  white-space: nowrap;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20rpx);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
