<template>
  <view class="scan-container">
    <!-- H5环境提示 -->
    <!-- #ifdef H5 -->
    <view class="h5-scan-wrapper">
      <!-- 权限未申请状态 -->
      <view v-if="!permissionRequested" class="permission-guide">
        <view class="guide-icon">📷</view>
        <text class="guide-title">需要使用摄像头</text>
        <text class="guide-desc">请允许浏览器访问摄像头以扫描二维码</text>
        <button class="grant-btn" @click="requestCameraPermission">
          允许使用摄像头
        </button>
      </view>

      <!-- 扫码界面 -->
      <view v-else class="qrcode-wrapper">
        <div id="reader" class="qrcode-reader"></div>

        <!-- 扫描框覆盖层 -->
        <view class="scan-overlay">
          <view class="scan-frame"></view>
          <text class="scan-tips">将二维码放入框内</text>
        </view>
      </view>

      <!-- 错误提示 -->
      <view v-if="errorMessage" class="error-message">
        <text class="error-text">{{ errorMessage }}</text>
        <button class="retry-btn" @click="retryRequest">重试</button>
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
    </view>

    <!-- 扫码结果提示 -->
    <view v-if="scanResult" class="result-message" :class="{ success: isSuccess, error: !isSuccess }">
      <text class="result-text">{{ scanResult }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onUnmounted, nextTick } from 'vue'
import { onShow, onHide } from '@dcloudio/uni-app'

// #ifdef H5
import { Html5Qrcode } from 'html5-qrcode'
// #endif

const scanResult = ref('')
const isSuccess = ref(false)
const inputValue = ref('')

// #ifdef H5
// H5扫码相关状态
const permissionRequested = ref(false)  // 是否已请求权限
const isScanning = ref(false)           // 是否正在扫码
const html5QrCode = ref<Html5Qrcode | null>(null)  // Html5Qrcode实例
const errorMessage = ref('')            // 错误信息
const currentCamera = ref('environment') // 当前摄像头（后置/前置）
const lastScannedText = ref('')         // 上次扫描的文本（防重复）
const lastScannedTime = ref(0)          // 上次扫描时间（防重复）
// #endif

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

  // #ifdef H5
  // H5环境：如果之前已授权但扫码已停止，重置状态让用户重新启动
  if (permissionRequested.value && !isScanning.value && html5QrCode.value) {
    console.log('🔄 检测到扫码已停止，清理实例')
    // 清理旧实例
    stopScanning().catch(err => {
      console.warn('停止扫码失败:', err)
    })
    html5QrCode.value = null
    // 重置状态，显示权限引导界面，让用户重新点击启动
    permissionRequested.value = false
    isScanning.value = false
  }
  // #endif

  // #ifndef H5
  // 真机环境可以选择自动扫码
  // autoScan()
  // #endif
})

/**
 * 页面隐藏时停止扫码
 */
// #ifdef H5
onHide(async () => {
  console.log('📱 扫码页面隐藏，停止扫码')
  await stopScanning()
})
// #endif

/**
 * 组件卸载时清理资源
 */
onUnmounted(async () => {
  // #ifdef H5
  await stopScanning()
  if (html5QrCode.value) {
    try {
      await html5QrCode.value.clear()
    } catch (err) {
      console.warn('清理扫码实例失败:', err)
    }
    html5QrCode.value = null
  }
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

/**
 * 检测摄像头权限状态
 */
async function checkCameraPermission(): Promise<boolean> {
  try {
    if (navigator.permissions) {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
      return result.state === 'granted'
    }
    return false
  } catch {
    return false
  }
}

/**
 * 请求摄像头权限并启动扫码
 */
async function requestCameraPermission() {
  permissionRequested.value = true
  errorMessage.value = ''

  // 等待DOM更新，确保#reader元素已渲染
  await nextTick()

  // 再等待一小段时间，确保浏览器完全渲染
  await new Promise(resolve => setTimeout(resolve, 100))

  try {
    await startScanning()
  } catch (error: any) {
    console.error('摄像头启动失败:', error)
    handleCameraError(error)
  }
}

/**
 * 启动扫码
 */
async function startScanning() {
  // 检查DOM元素是否存在
  const readerElement = document.getElementById('reader')
  if (!readerElement) {
    throw new Error('扫码容器元素未找到')
  }

  if (!html5QrCode.value) {
    html5QrCode.value = new Html5Qrcode('reader')
  }

  // 获取容器的实际尺寸
  const containerWidth = readerElement.clientWidth || window.innerWidth
  const containerHeight = readerElement.clientHeight || window.innerHeight
  const scanSize = Math.min(containerWidth, containerHeight) * 0.7

  const config = {
    fps: 10,
    qrbox: {
      width: Math.floor(scanSize),
      height: Math.floor(scanSize)
    },
    aspectRatio: 1.0
  }

  await html5QrCode.value.start(
    { facingMode: currentCamera.value },
    config,
    (decodedText: string) => {
      handleScanSuccess(decodedText)
    },
    (errorMessage: string) => {
      console.warn('扫码警告:', errorMessage)
    }
  )

  isScanning.value = true

  // 启动后调整video样式，确保完全填充
  setTimeout(() => {
    const video = readerElement.querySelector('video')
    if (video) {
      video.style.objectFit = 'cover'
      video.style.width = '100%'
      video.style.height = '100%'
      video.style.position = 'absolute'
      video.style.top = '0'
      video.style.left = '0'
    }
  }, 100)

  console.log('✅ 扫码已启动')
}

/**
 * 扫码成功处理
 */
function handleScanSuccess(decodedText: string) {
  const now = Date.now()

  // 防止重复识别（2秒内相同内容）
  if (decodedText === lastScannedText.value && now - lastScannedTime.value < 2000) {
    console.log('⏭️ 跳过重复识别')
    return
  }

  lastScannedText.value = decodedText
  lastScannedTime.value = now

  console.log('✅ 扫码成功:', decodedText)

  // 震动反馈
  if (navigator.vibrate) {
    navigator.vibrate(200)
  }

  // 播放提示音
  playBeepSound()

  // 停止扫码
  stopScanning()

  // 处理二维码数据（复用现有逻辑）
  processQRCodeData(decodedText)
}

/**
 * 播放提示音
 */
function playBeepSound() {
  // 暂时跳过提示音
  console.log('🔊 提示音播放（跳过）')
  return
}

/**
 * 停止扫码
 */
async function stopScanning() {
  if (html5QrCode.value && isScanning.value) {
    try {
      await html5QrCode.value.stop()
      isScanning.value = false
      console.log('⏹️ 扫码已停止')
    } catch (error) {
      console.error('停止扫码失败:', error)
    }
  }
}

/**
 * 切换摄像头
 */
async function switchCamera() {
  await stopScanning()
  currentCamera.value = currentCamera.value === 'environment' ? 'user' : 'environment'
  await startScanning()
}

/**
 * 重试请求
 */
async function retryRequest() {
  errorMessage.value = ''
  permissionRequested.value = false
  await requestCameraPermission()
}

/**
 * 处理摄像头错误
 */
function handleCameraError(error: any) {
  console.error('摄像头错误:', error)

  if (error.name === 'NotAllowedError') {
    errorMessage.value = '请在浏览器地址栏点击锁图标，允许访问摄像头'
  } else if (error.name === 'NotFoundError') {
    errorMessage.value = '未检测到摄像头设备'
  } else if (error.name === 'NotReadableError') {
    errorMessage.value = '摄像头可能被其他应用占用，请关闭后重试'
  } else if (error.name === 'OverconstrainedError') {
    errorMessage.value = '摄像头不满足要求'
  } else {
    errorMessage.value = `无法访问摄像头: ${error.message || '未知错误'}`
  }
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

/* H5环境扫码样式 */
.h5-scan-wrapper {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #000;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.permission-guide {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  background: #f5f5f5;
  min-height: 100vh;
}

.guide-icon {
  font-size: 100rpx;
  margin-bottom: 32rpx;
}

.guide-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 16rpx;
  text-align: center;
}

.guide-desc {
  font-size: 26rpx;
  color: #666;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 48rpx;
  max-width: 600rpx;
}

.grant-btn {
  width: 80%;
  max-width: 500rpx;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
  border: none;
  cursor: pointer;
}

.qrcode-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.qrcode-reader {
  width: 100%;
  height: 100%;
  position: relative;
  background: #000;
}

/* 强制video元素完全填充容器 */
.qrcode-reader :deep(#reader) {
  width: 100% !important;
  height: 100% !important;
  position: relative !important;
}

.qrcode-reader :deep(#reader video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  transform: none !important;
}

/* 隐藏html5-qrcode自带的扫描区域指示器 */
.qrcode-reader :deep(#reader__dashboard_section_csr) {
  display: none !important;
}

.qrcode-reader :deep(#reader__dashboard) {
  display: none !important;
}

.scan-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 100;
}

.scan-frame {
  position: relative;
  width: 70vw;
  max-width: 500rpx;
  height: 70vw;
  max-height: 500rpx;
  box-sizing: border-box;
  background: transparent;
  opacity: 0;
}

.scan-tips {
  margin-top: 0;
  font-size: 26rpx;
  color: #fff;
  text-align: center;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}

.control-buttons {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 16rpx;
  pointer-events: auto;
  padding: 32rpx;
  padding-bottom: max(32rpx, env(safe-area-inset-bottom));
  box-sizing: border-box;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, transparent 100%);
}

.stop-btn,
.switch-btn {
  flex: 1;
  max-width: 220rpx;
  height: 80rpx;
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  border-radius: 40rpx;
  font-size: 28rpx;
  border: none;
  cursor: pointer;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
}

.error-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.9);
  padding: 48rpx 32rpx;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
  max-width: 80%;
  z-index: 1000;
}

.error-text {
  font-size: 28rpx;
  color: #fff;
  text-align: center;
  line-height: 1.6;
}

.retry-btn {
  width: 200rpx;
  height: 72rpx;
  background: #667eea;
  color: #fff;
  border-radius: 36rpx;
  font-size: 28rpx;
  border: none;
  cursor: pointer;
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
