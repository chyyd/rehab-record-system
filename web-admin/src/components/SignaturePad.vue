<template>
  <div class="signature-pad-wrapper">
    <div class="canvas-container" ref="containerRef" :id="containerId">
      <!-- canvas将由smooth-signature管理 -->
    </div>
    <div class="signature-actions">
      <el-button size="small" @click="handleClear">清除</el-button>
      <el-button type="primary" size="small" @click="handleConfirm">确认</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import SmoothSignature from 'smooth-signature'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  patientInfo?: {
    name: string
    medicalRecordNo: string
  }
  projectName?: string
  treatmentTime?: string
}>()

const emit = defineEmits<{
  confirm: [imageData: string]
}>()

const containerId = `signature-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
const containerRef = ref<HTMLDivElement | null>(null)
const signature = ref<SmoothSignature | null>(null)

onMounted(async () => {
  await nextTick()
  setTimeout(() => {
    initSignature()
  }, 100)
})

function initSignature() {
  const container = containerRef.value
  if (!container) {
    console.error('Container未找到')
    return
  }

  // 获取容器尺寸
  const width = container.clientWidth
  const height = 300

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

  // 清空container并添加canvas
  container.innerHTML = ''
  container.appendChild(canvasEl)

  try {
    // 初始化SmoothSignature（与手机端配置一致）
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
}

function handleClear() {
  if (signature.value) {
    signature.value.clear()
    console.log('Canvas已清空')
  }
}

function handleConfirm() {
  if (!signature.value) {
    ElMessage.warning('签名未初始化')
    return
  }

  // 检查是否为空
  if (signature.value.isEmpty()) {
    ElMessage.warning('请先签字')
    return
  }

  try {
    // 获取签名图片（管理后台不需要旋转）
    const canvas = signature.value.canvas
    if (!canvas) {
      throw new Error('Canvas不存在')
    }

    const dataUrl = canvas.toDataURL('image/png')
    console.log('签名图片生成成功，长度:', dataUrl.length)
    emit('confirm', dataUrl)
  } catch (error) {
    console.error('生成签名图片失败:', error)
    ElMessage.error('生成签名失败')
  }
}

defineExpose({
  clear: handleClear,
  confirm: handleConfirm
})
</script>

<style lang="scss" scoped>
.signature-pad-wrapper {
  width: 100%;
}

.canvas-container {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #ffffff;
  overflow: hidden;
  height: 300px;
  position: relative;
}

.signature-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
</style>
