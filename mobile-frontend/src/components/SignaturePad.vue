<template>
  <view class="signature-modal" v-if="visible">
    <view class="signature-landscape">
      <view class="signature-header">
        <text class="header-title">患者签字确认</text>
        <text class="header-close" @click="closeModal">✕</text>
      </view>

      <view class="canvas-wrapper" :id="canvasWrapperId">
        <!-- canvas将通过JS动态创建 -->
      </view>

      <view class="signature-tips">
        <text class="tips-text">请在此区域签字</text>
      </view>

      <view class="signature-actions">
        <view class="action-btn secondary" @click="clear">
          <text class="btn-text">清除</text>
        </view>
        <view class="action-btn primary" @click="confirm">
          <text class="btn-text">确认</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  confirm: [imageData: string]
  close: []
}>()

const canvasWrapperId = 'canvas-wrapper-' + Date.now()
const canvas = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)
const hasSigned = ref(false)
const isDrawing = ref(false)
const lastX = ref(0)
const lastY = ref(0)

watch(() => props.visible, (newVal) => {
  if (newVal) {
    nextTick(() => {
      setTimeout(() => {
        initCanvas()
      }, 300)
    })
  } else {
    // 关闭时清理canvas
    cleanupCanvas()
  }
})

function initCanvas() {
  console.log('开始初始化Canvas')

  const wrapper = document.getElementById(canvasWrapperId)
  if (!wrapper) {
    console.error('Canvas wrapper未找到')
    return
  }

  // 获取屏幕尺寸（假设手机横屏）
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight

  // 横屏模式：Canvas尺寸适配屏幕
  const width = screenWidth - 32
  const height = screenHeight - 180

  console.log('Canvas横屏尺寸:', { width, height, screenWidth, screenHeight })

  // 创建canvas元素
  const canvasEl = document.createElement('canvas')
  canvasEl.width = width
  canvasEl.height = height
  canvasEl.style.width = '100%'
  canvasEl.style.height = '100%'
  canvasEl.style.backgroundColor = '#fff'
  canvasEl.style.cursor = 'crosshair'
  canvasEl.id = 'signature-canvas'

  // 清空wrapper并添加canvas
  wrapper.innerHTML = ''
  wrapper.appendChild(canvasEl)

  canvas.value = canvasEl

  // 获取2D上下文
  const context = canvasEl.getContext('2d')
  if (!context) {
    console.error('无法获取Canvas 2D上下文')
    return
  }

  // 用白色填充背景（防止背景透明）
  context.fillStyle = '#FFFFFF'
  context.fillRect(0, 0, width, height)

  // 设置画笔样式
  context.strokeStyle = '#000000'
  context.lineWidth = 6
  context.lineCap = 'round'
  context.lineJoin = 'round'

  ctx.value = context

  // 绑定事件
  bindCanvasEvents(canvasEl)

  console.log('Canvas初始化成功')
}

function bindCanvasEvents(canvasEl: HTMLCanvasElement) {
  // 鼠标事件
  canvasEl.addEventListener('mousedown', (e: MouseEvent) => {
    console.log('Mouse Down事件触发')
    e.preventDefault()
    e.stopPropagation()

    isDrawing.value = true
    const rect = canvasEl.getBoundingClientRect()
    lastX.value = e.clientX - rect.left
    lastY.value = e.clientY - rect.top

    console.log('Mouse Down坐标:', { x: lastX.value, y: lastY.value, rect })

    // 画一个点
    if (ctx.value) {
      ctx.value.beginPath()
      ctx.value.arc(lastX.value, lastY.value, 3, 0, Math.PI * 2)
      ctx.value.fill()
    }
  })

  canvasEl.addEventListener('mousemove', (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isDrawing.value) return

    const rect = canvasEl.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top

    if (ctx.value) {
      ctx.value.beginPath()
      ctx.value.moveTo(lastX.value, lastY.value)
      ctx.value.lineTo(currentX, currentY)
      ctx.value.stroke()
    }

    lastX.value = currentX
    lastY.value = currentY
    hasSigned.value = true
  })

  canvasEl.addEventListener('mouseup', (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isDrawing.value = false
    console.log('Mouse Up')
  })

  canvasEl.addEventListener('mouseleave', (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isDrawing.value = false
    console.log('Mouse Leave')
  })

  // 触摸事件
  canvasEl.addEventListener('touchstart', (e: TouchEvent) => {
    console.log('Touch Start事件触发')
    e.preventDefault()
    e.stopPropagation()

    isDrawing.value = true
    const touch = e.touches[0]
    const rect = canvasEl.getBoundingClientRect()
    lastX.value = touch.clientX - rect.left
    lastY.value = touch.clientY - rect.top

    if (ctx.value) {
      ctx.value.beginPath()
      ctx.value.arc(lastX.value, lastY.value, 3, 0, Math.PI * 2)
      ctx.value.fill()
    }
  })

  canvasEl.addEventListener('touchmove', (e: TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isDrawing.value) return

    const touch = e.touches[0]
    const rect = canvasEl.getBoundingClientRect()
    const currentX = touch.clientX - rect.left
    const currentY = touch.clientY - rect.top

    if (ctx.value) {
      ctx.value.beginPath()
      ctx.value.moveTo(lastX.value, lastY.value)
      ctx.value.lineTo(currentX, currentY)
      ctx.value.stroke()
    }

    lastX.value = currentX
    lastY.value = currentY
    hasSigned.value = true
  })

  canvasEl.addEventListener('touchend', (e: TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isDrawing.value = false
    console.log('Touch End')
  })

  canvasEl.addEventListener('touchcancel', (e: TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isDrawing.value = false
  })

  console.log('Canvas事件绑定完成')
}

function clear() {
  if (canvas.value && ctx.value) {
    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
    hasSigned.value = false
    console.log('Canvas已清空')
  }
}

function confirm() {
  if (!hasSigned.value) {
    uni.showToast({
      title: '请先签字',
      icon: 'none',
      duration: 2000
    })
    return
  }

  if (!canvas.value) {
    uni.showToast({
      title: 'Canvas未初始化',
      icon: 'none',
      duration: 2000
    })
    return
  }

  try {
    // 旋转Canvas 90度（顺时针）
    const originalCanvas = canvas.value
    const rotatedCanvas = document.createElement('canvas')
    // 旋转后：宽=原高，高=原宽
    rotatedCanvas.width = originalCanvas.height
    rotatedCanvas.height = originalCanvas.width

    const rotatedCtx = rotatedCanvas.getContext('2d')
    if (!rotatedCtx) {
      throw new Error('无法获取旋转Canvas的上下文')
    }

    // 旋转并绘制原图（逆时针90度）
    rotatedCtx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2)
    rotatedCtx.rotate(-90 * Math.PI / 180)
    rotatedCtx.drawImage(originalCanvas, -originalCanvas.width / 2, -originalCanvas.height / 2)

    // 转换为图片
    const dataUrl = rotatedCanvas.toDataURL('image/png')
    console.log('签名图片旋转后生成成功，长度:', dataUrl.length)
    emit('confirm', dataUrl)
  } catch (error) {
    console.error('生成签名图片失败:', error)
    uni.showToast({
      title: '生成签名失败',
      icon: 'none',
      duration: 2000
    })
  }
}

function cleanupCanvas() {
  const wrapper = document.getElementById(canvasWrapperId)
  if (wrapper) {
    wrapper.innerHTML = ''
  }
  canvas.value = null
  ctx.value = null
  hasSigned.value = false
  isDrawing.value = false
}

function closeModal() {
  cleanupCanvas()
  emit('close')
}
</script>

<style lang="scss" scoped>
.signature-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #fff;
  z-index: 9999;
  overflow: hidden;
}

.signature-landscape {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 32rpx;
}

.signature-header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 20rpx 0;
  margin-bottom: 16rpx;
  height: 80rpx;

  .header-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #1e293b;
  }

  .header-close {
    position: absolute;
    right: 20rpx;
    top: 50%;
    transform: translateY(-50%);
    font-size: 48rpx;
    color: #64748b;
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
}

.canvas-wrapper {
  flex: 1;
  border: 4rpx solid #e2e8f0;
  border-radius: 16rpx;
  overflow: hidden;
  background-color: #fafafa;
  margin-bottom: 16rpx;
  position: relative;
}

.signature-tips {
  text-align: center;
  margin-bottom: 16rpx;
  height: 40rpx;

  .tips-text {
    font-size: 26rpx;
    color: #94a3b8;
  }
}

.signature-actions {
  display: flex;
  gap: 16rpx;
  height: 88rpx;

  .action-btn {
    flex: 1;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;

    &.secondary {
      background-color: #f1f5f9;

      &:active {
        background-color: #e2e8f0;
      }
    }

    &.primary {
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      box-shadow: 0 4rpx 12rpx rgba(14, 165, 233, 0.3);

      &:active {
        opacity: 0.8;
      }
    }

    .btn-text {
      font-size: 30rpx;
      font-weight: 600;
      color: #64748b;

      .primary & {
        color: #fff;
      }
    }
  }
}
</style>
