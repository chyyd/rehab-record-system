<template>
  <view class="signature-modal" v-if="visible">
    <view class="signature-landscape">
      <view class="signature-header">
        <text class="header-title">患者签字确认</text>
        <text class="header-close" @click="closeModal">✕</text>
      </view>

      <view class="canvas-wrapper">
        <view class="canvas-inner" :id="canvasWrapperId">
          <!-- canvas将由smooth-signature管理 -->
        </view>
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
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import SmoothSignature from 'smooth-signature'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  confirm: [imageData: string]
  close: []
}>()

const canvasWrapperId = 'canvas-wrapper-' + Date.now()
const signature = ref<SmoothSignature | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)

watch(() => props.visible, (newVal) => {
  if (newVal) {
    nextTick(() => {
      setTimeout(() => {
        initSignature()
      }, 300)
    })
  } else {
    cleanupSignature()
  }
})

function initSignature() {
  console.log('开始初始化SmoothSignature')

  const wrapper = document.getElementById(canvasWrapperId)
  if (!wrapper) {
    console.error('Canvas wrapper未找到')
    return
  }

  // 等待下一帧，获取wrapper的实际渲染尺寸
  requestAnimationFrame(() => {
    const rect = wrapper.getBoundingClientRect()
    console.log('Wrapper实际尺寸:', rect)

    // 使用wrapper的实际尺寸作为canvas尺寸
    const width = rect.width
    const height = rect.height

    console.log('Canvas尺寸:', { width, height })

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

    try {
      // 初始化SmoothSignature
      signature.value = new SmoothSignature(canvasEl, {
        width: width,
        height: height,
        scale: window.devicePixelRatio || 2, // 提高清晰度
        minWidth: 4,
        maxWidth: 10,
        color: '#000000',
        bgColor: '#ffffff',
        openSmooth: true // 开启笔锋效果
      })

      console.log('✓ SmoothSignature初始化成功')
    } catch (error) {
      console.error('SmoothSignature初始化失败:', error)
    }
  })
}

function clear() {
  if (signature.value) {
    signature.value.clear()
    console.log('Canvas已清空')
  }
}

function confirm() {
  if (!signature.value) {
    uni.showToast({
      title: '签名未初始化',
      icon: 'none',
      duration: 2000
    })
    return
  }

  // 检查是否为空
  if (signature.value.isEmpty()) {
    uni.showToast({
      title: '请先签字',
      icon: 'none',
      duration: 2000
    })
    return
  }

  try {
    // 获取旋转后的Canvas（逆时针90度）
    const rotatedCanvas = signature.value.getRotateCanvas(-90)

    if (!rotatedCanvas) {
      throw new Error('旋转Canvas失败')
    }

    // 转换为图片
    const dataUrl = rotatedCanvas.toDataURL('image/png')
    console.log('签名图片生成成功，长度:', dataUrl.length)
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

function cleanupSignature() {
  const wrapper = document.getElementById(canvasWrapperId)
  if (wrapper) {
    wrapper.innerHTML = ''
  }
  signature.value = null
  canvas.value = null
}

function closeModal() {
  cleanupSignature()
  emit('close')
}

onBeforeUnmount(() => {
  cleanupSignature()
})
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

// 整个签名界面顺时针旋转90度
.signature-landscape {
  width: 100vh;
  height: 100vw;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(90deg);
  transform-origin: center center;
  display: flex;
  flex-direction: column;
  padding: 32rpx;
  box-sizing: border-box;
}

.signature-header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 8rpx 0;
  margin-bottom: 8rpx;
  height: 56rpx;

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
  margin-bottom: 8rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.canvas-inner {
  // 旋转后宽高互换，设置足够大的尺寸以填充整个wrapper
  width: 200vmin;
  height: 200vmin;
  // 反向旋转90度，抵消容器的旋转，使canvas坐标正常
  // 居中对齐并旋转
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-90deg);
}

.signature-actions {
  display: flex;
  gap: 16rpx;
  height: 72rpx;

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
