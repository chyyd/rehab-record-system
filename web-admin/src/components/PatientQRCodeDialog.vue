<template>
  <el-dialog
    v-model="dialogVisible"
    title="患者二维码"
    width="450px"
    @close="handleClose"
  >
    <div class="qrcode-container">
      <!-- 二维码展示区域 -->
      <div class="qrcode-wrapper" :class="{ 'printing': isPrinting }">
        <canvas ref="qrCanvas" class="qrcode-canvas"></canvas>
        <p class="patient-name">{{ patient?.name }}</p>
      </div>

      <!-- 尺寸选择(打印时隐藏) -->
      <div class="size-selector" v-show="!isPrinting">
        <span class="label">尺寸选择：</span>
        <el-radio-group v-model="selectedSize" @change="handleSizeChange">
          <el-radio-button label="1.5cm">1.5cm</el-radio-button>
          <el-radio-button label="2cm">2cm</el-radio-button>
          <el-radio-button label="3cm">3cm</el-radio-button>
          <el-radio-button label="4cm">4cm</el-radio-button>
          <el-radio-button label="5cm">5cm</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 操作按钮(打印时隐藏) -->
      <div class="action-buttons" v-show="!isPrinting">
        <el-button @click="handleDownload" :loading="downloading">
          <el-icon><Download /></el-icon>
          下载
        </el-button>
        <el-button @click="handleCopy" :loading="copying">
          <el-icon><CopyDocument /></el-icon>
          复制
        </el-button>
        <el-button type="primary" @click="handlePrint">
          <el-icon><Printer /></el-icon>
          打印
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, CopyDocument, Printer } from '@element-plus/icons-vue'
import QRCode from 'qrcode'
import { debounce } from 'lodash-es'

// Props
interface Props {
  visible: boolean
  patient: {
    id?: number
    medicalRecordNo?: string
    name?: string
  } | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

// 状态
const dialogVisible = ref(false)
const selectedSize = ref('3cm')
const qrCanvas = ref<HTMLCanvasElement | null>(null)
const downloading = ref(false)
const copying = ref(false)
const isPrinting = ref(false)

// 二维码缓存
const qrCache = new Map<string, string>()

// 尺寸映射(cm转px,假设DPI=96,1cm≈37.8px)
const SIZE_MAP: Record<string, number> = {
  '1.5cm': 57,
  '2cm': 76,
  '3cm': 113,
  '4cm': 151,
  '5cm': 189
}

// 监听visible变化
watch(() => props.visible, async (newVal) => {
  dialogVisible.value = newVal
  if (newVal && props.patient?.medicalRecordNo) {
    await nextTick()
    await generateQRCode()
  }
})

// 监听对话框关闭
watch(dialogVisible, (newVal) => {
  if (!newVal) {
    emit('update:visible', false)
  }
})

// 生成二维码
async function generateQRCode() {
  if (!qrCanvas.value || !props.patient?.medicalRecordNo) return

  try {
    const cacheKey = `${props.patient.medicalRecordNo}_${selectedSize.value}`

    // 检查缓存
    if (qrCache.has(cacheKey)) {
      console.log('从缓存加载二维码:', cacheKey)
      const cachedDataUrl = qrCache.get(cacheKey)!

      // 创建图片对象从缓存加载
      const img = new Image()
      img.onload = () => {
        const ctx = qrCanvas.value?.getContext('2d')
        if (ctx) {
          const pxSize = SIZE_MAP[selectedSize.value]
          ctx.clearRect(0, 0, qrCanvas.value!.width, qrCanvas.value!.height)
          ctx.drawImage(img, 0, 0)

          // 添加姓名文本
          ctx.font = '12px Arial'
          ctx.textAlign = 'center'
          ctx.fillStyle = '#000000'
          ctx.fillText(props.patient.name || '', pxSize / 2, pxSize + 15)
        }
      }
      img.src = cachedDataUrl
      return
    }

    // 获取移动端H5地址(从环境变量配置)
    const mobileH5Url = import.meta.env.VITE_MOBILE_H5_URL || 'http://localhost:5173'

    // 生成完整的H5 URL
    const qrData = `${mobileH5Url}/#/pages/record/create?medicalNo=${props.patient.medicalRecordNo}`

    console.log('生成新二维码URL:', qrData, '尺寸:', selectedSize.value)

    const pxSize = SIZE_MAP[selectedSize.value]

    // 生成二维码到canvas
    await QRCode.toCanvas(qrCanvas.value, qrData, {
      width: pxSize,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // 添加患者姓名文本
    const ctx = qrCanvas.value.getContext('2d')
    if (ctx) {
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#000000'
      ctx.fillText(props.patient.name || '', pxSize / 2, pxSize + 15)
    }

    // 缓存生成的二维码
    const dataUrl = qrCanvas.value.toDataURL('image/png')
    qrCache.set(cacheKey, dataUrl)
    console.log('二维码已缓存:', cacheKey)
  } catch (error) {
    console.error('QR Code generation failed:', error)
    ElMessage.error('二维码生成失败,请重试')
  }
}

// 创建防抖函数(200ms延迟)
const debouncedGenerate = debounce(generateQRCode, 200)

// 尺寸变化处理
function handleSizeChange() {
  debouncedGenerate()
}

// 下载二维码
async function handleDownload() {
  if (!qrCanvas.value) return

  downloading.value = true
  try {
    const dataUrl = qrCanvas.value.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${props.patient?.name}_${props.patient?.medicalRecordNo}_qrcode.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('已下载')
  } catch (error) {
    console.error('Download failed:', error)
    ElMessage.error('下载失败,请重试')
  } finally {
    downloading.value = false
  }
}

// 复制到剪贴板
async function handleCopy() {
  if (!qrCanvas.value) return

  // 检测浏览器支持
  if (!navigator.clipboard) {
    ElMessage.warning('当前浏览器不支持复制功能,请使用下载')
    return
  }

  copying.value = true
  try {
    const dataUrl = qrCanvas.value.toDataURL('image/png')
    const response = await fetch(dataUrl)
    const blob = await response.blob()

    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ])

    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    console.error('Copy failed:', error)
    ElMessage.error('复制失败,请使用下载功能')
  } finally {
    copying.value = false
  }
}

// 打印二维码
function handlePrint() {
  if (typeof window.print === 'undefined') {
    ElMessage.error('当前浏览器不支持打印功能')
    return
  }

  isPrinting.value = true
  setTimeout(() => {
    window.print()
    isPrinting.value = false
  }, 100)
}

// 关闭对话框
function handleClose() {
  dialogVisible.value = false
}
</script>

<style scoped>
.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.qrcode-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.qrcode-canvas {
  display: block;
  margin-bottom: 10px;
}

.patient-name {
  margin: 10px 0 0 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  text-align: center;
}

.size-selector {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
}

.size-selector .label {
  margin-right: 10px;
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  gap: 10px;
  width: 100%;
}

.action-buttons .el-button {
  flex: 1;
}

/* 打印样式 */
@media print {
  .size-selector,
  .action-buttons {
    display: none !important;
  }

  .qrcode-wrapper {
    page-break-inside: avoid;
    background: white;
    border: none;
  }
}
</style>
