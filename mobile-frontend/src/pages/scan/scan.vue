<template>
  <view class="scan-container">
    <!-- H5环境扫码界面 -->
    <!-- #ifdef H5 -->
    <view class="h5-scan-wrapper">
      <!-- 权限引导界面 -->
      <view v-if="!isScanning" class="permission-guide">
        <view class="guide-icon">📷</view>
        <text class="guide-title">扫描患者二维码</text>
        <text class="guide-desc">请允许浏览器访问摄像头</text>
        <button class="grant-btn" @click="startScanning">
          开始扫码
        </button>
      </view>

      <!-- 扫码界面 -->
      <view v-else class="scan-wrapper">
        <div id="reader" class="qrcode-reader"></div>

        <!-- 提示文字 -->
        <view class="scan-tips">
          <text class="tips-text">将二维码对准摄像头</text>
        </view>

        <!-- 停止按钮 -->
        <view class="control-buttons">
          <button class="stop-btn" @click="stopScanning">停止扫码</button>
        </view>
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
import { onShow } from '@dcloudio/uni-app'

// #ifdef H5
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
// #endif

const scanResult = ref('')
const isSuccess = ref(false)

// #ifdef H5
// H5扫码相关状态
const isScanning = ref(false)
const html5QrCode = ref<Html5Qrcode | null>(null)
const errorMessage = ref('')
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

  // #ifndef H5
  // 真机环境可以选择自动扫码
  // autoScan()
  // #endif
})

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

// #ifdef H5
/**
 * 启动扫码
 */
async function startScanning() {
  console.log('🚀 ========== 按钮已点击，开始启动H5扫码 ==========')

  // 先设置状态，让DOM渲染
  isScanning.value = true
  console.log('🔄 已设置 isScanning = true，等待DOM渲染...')

  // 等待Vue完成DOM更新
  await nextTick()
  console.log('✅ Vue DOM已更新')

  // 再等待一小段时间确保浏览器完成渲染
  await new Promise(resolve => setTimeout(resolve, 100))
  console.log('✅ 浏览器渲染完成')

  // 检查DOM元素是否存在
  const readerElement = document.getElementById('reader')
  if (!readerElement) {
    console.error('❌ 扫码容器元素未找到')
    console.log('💡 提示：请确保#reader元素已渲染')
    isScanning.value = false // 恢复状态
    throw new Error('扫码容器元素未找到')
  }

  // 检查DOM元素是否存在

  console.log('✅ DOM元素已找到，容器尺寸:', {
    width: readerElement.clientWidth,
    height: readerElement.clientHeight
  })

  // 创建Html5Qrcode实例（带详细日志和格式支持）
  if (!html5QrCode.value) {
    console.log('📦 创建Html5Qrcode实例')
    html5QrCode.value = new Html5Qrcode('reader', {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], // 只扫描QR码
      verbose: true // 开启详细日志
    })
  }

  // Pro Mode标准配置（根据官方文档优化）
  const config = {
    fps: 10, // 每秒扫描帧数
    qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
      // 动态计算扫描区域大小，取最小边的70%
      const minEdgePercentage = 0.7
      const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight)
      const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage)

      console.log('📐 动态计算扫描区域:', {
        viewfinder: { width: viewfinderWidth, height: viewfinderHeight },
        qrboxSize
      })

      return {
        width: qrboxSize,
        height: qrboxSize
      }
    },
    aspectRatio: 1.777778, // 宽高比 16:9（移动端标准）
    disableFlip: false // 不禁用镜像（某些设备需要）
  }

  console.log('📋 扫码配置:', config)

  try {
    // 先枚举所有可用的摄像头
    console.log('📷 正在枚举可用摄像头...')
    const cameras = await Html5Qrcode.getCameras()
    console.log('📷 发现的摄像头列表:', cameras)

    let cameraId: string | { facingMode: string }

    if (cameras && cameras.length) {
      // 查找后置摄像头（优先选择包含'back'或'rear'标签的）
      const backCamera = cameras.find((camera: any) =>
        camera.label && (
          camera.label.toLowerCase().includes('back') ||
          camera.label.toLowerCase().includes('rear') ||
          camera.label.toLowerCase().includes('后置') ||
          camera.label.toLowerCase().includes('0') // 很多设备后置摄像头是camera0
        )
      )

      if (backCamera) {
        cameraId = backCamera.id
        console.log('✅ 找到后置摄像头:', {
          id: backCamera.id,
          label: backCamera.label
        })
      } else {
        // 如果没找到明确的后置摄像头，使用第一个摄像头
        cameraId = cameras[0].id
        console.log('⚠️ 未找到明确的后置摄像头，使用第一个摄像头:', {
          id: cameras[0].id,
          label: cameras[0].label
        })
      }
    } else {
      // 如果枚举失败，回退到facingMode方式
      cameraId = { facingMode: 'environment' }
      console.log('⚠️ 摄像头枚举失败，使用facingMode方式')
    }

    console.log('🎯 使用摄像头配置:', cameraId)

    // 启动摄像头
    await html5QrCode.value.start(
      cameraId,
      config,
      (decodedText: string, decodedResult: any) => {
        // 成功回调 - 标准签名：(decodedText, decodedResult)
        console.log('✅✅✅ 扫码成功触发！✅✅✅')
        console.log('📝 解码文本:', decodedText)
        console.log('📦 完整结果:', JSON.stringify(decodedResult, null, 2))

        // 震动反馈
        if (navigator.vibrate) {
          navigator.vibrate(200)
        }

        handleScanSuccess(decodedText)
      },
      (errorMessage: string) => {
        // 错误回调 - 扫码过程中的每一帧失败都会调用
        // 这是正常的，说明库正在持续扫描
        // 只在verbose模式下打印详细错误
        if (errorMessage.includes('No barcode or QR code detected')) {
          // 这是正常情况，说明正在扫描但还没找到二维码
          // 降低日志频率，避免刷屏
          if (Math.random() < 0.01) { // 只打印1%的日志
            console.log('🔍 正在扫描中...')
          }
        } else {
          console.warn('⚠️ 扫码警告:', errorMessage)
        }
      }
    )

    isScanning.value = true
    console.log('✅ 扫码已启动')

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
        console.log('🎬 Video样式已调整')
      } else {
        console.warn('⚠️ 未找到video元素')
      }
    }, 100)

  } catch (error: any) {
    console.error('❌ 启动扫码失败:', error)
    handleCameraError(error)
    throw error
  }
}

/**
 * 扫码成功处理
 */
function handleScanSuccess(decodedText: string) {
  console.log('✅ 扫码成功识别:', decodedText)

  // 震动反馈
  if (navigator.vibrate) {
    navigator.vibrate(200)
  }

  // 停止扫码
  stopScanning()

  // 处理二维码数据（复用现有逻辑）
  processQRCodeData(decodedText)
}

/**
 * 停止扫码
 */
async function stopScanning() {
  console.log('⏹️ 停止扫码')
  if (html5QrCode.value && isScanning.value) {
    try {
      await html5QrCode.value.stop()
      isScanning.value = false
      console.log('✅ 扫码已停止')
    } catch (error) {
      console.error('❌ 停止扫码失败:', error)
    }
  }
}

/**
 * 处理摄像头错误
 */
function handleCameraError(error: any) {
  console.error('❌ 摄像头错误:', error)

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

  // 显示错误提示
  uni.showToast({
    title: errorMessage.value,
    icon: 'none',
    duration: 3000
  })
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

.scan-wrapper {
  flex: 1;
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
  overflow: hidden;
}

/* 确保html5-qrcode容器完全填充 */
.qrcode-reader :deep(#reader) {
  width: 100% !important;
  height: 100% !important;
  position: relative !important;
}

/* 强制video元素完全填充容器 */
.qrcode-reader :deep(video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* 隐藏html5-qrcode自带的扫描区域指示器 */
.qrcode-reader :deep(#reader__dashboard_section_csr) {
  display: none !important;
}

.qrcode-reader :deep(#reader__dashboard) {
  display: none !important;
}

.control-buttons {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16rpx;
  pointer-events: auto;
  padding: 32rpx;
  padding-bottom: max(32rpx, env(safe-area-inset-bottom));
  box-sizing: border-box;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, transparent 100%);
}

.scan-tips {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  pointer-events: none;
}

.scan-tips .tips-text {
  font-size: 32rpx;
  color: #fff;
  text-align: center;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.8);
  white-space: nowrap;
}

.stop-btn {
  width: 80%;
  max-width: 400rpx;
  height: 88rpx;
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  border-radius: 44rpx;
  font-size: 32rpx;
  border: none;
  cursor: pointer;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
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
