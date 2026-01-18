<template>
  <view class="scan-container">
    <!-- 扫码区域 -->
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

    <!-- 操作按钮 -->
    <view class="action-buttons">
      <button class="scan-btn" @click="handleScan">
        <text class="btn-icon">📷</text>
        <text>点击扫码</text>
      </button>

      <button class="manual-btn" @click="handleManualInput">
        <text class="btn-icon">✏️</text>
        <text>手动输入</text>
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

// 页面显示时自动扫码
onShow(() => {
  console.log('📱 扫码页面显示')
  // 可以选择自动调用扫码，或者等待用户点击按钮
  // autoScan()
})

/**
 * 自动扫码
 */
function autoScan() {
  handleScan()
}

/**
 * 处理扫码
 */
function handleScan() {
  console.log('🔄 开始扫码')

  uni.scanCode({
    success: (res: any) => {
      console.log('✅ 扫码成功:', res)
      handleScanSuccess(res.result)
    },
    fail: (err: any) => {
      console.error('❌ 扫码失败:', err)
      handleScanError(err)
    }
  })
}

/**
 * 扫码成功处理
 */
function handleScanSuccess(result: string) {
  console.log('📦 扫码结果:', result)

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
  justify-content: center;
  padding: 48rpx;
}

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
