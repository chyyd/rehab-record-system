<template>
  <view class="detail-container">
    <view class="loading" v-if="loading">
      <text>加载中...</text>
    </view>

    <view class="detail-content" v-else-if="record">
      <!-- 患者信息 -->
      <view class="section patient-info">
        <view class="section-title">患者信息</view>
        <view class="info-row">
          <text class="label">姓名</text>
          <text class="value">{{ record.patient?.name }}</text>
        </view>
        <view class="info-row">
          <text class="label">病历号</text>
          <text class="value">{{ record.patient?.medicalRecordNo }}</text>
        </view>
        <view class="info-row">
          <text class="label">性别</text>
          <text class="value">{{ record.patient?.gender }}</text>
        </view>
        <view class="info-row">
          <text class="label">年龄</text>
          <text class="value">{{ record.patient?.age }}</text>
        </view>
        <view class="info-row">
          <text class="label">医保类型</text>
          <text class="value">{{ record.patient?.insuranceType }}</text>
        </view>
      </view>

      <!-- 治疗信息 -->
      <view class="section treatment-info">
        <view class="section-title">治疗信息</view>
        <view class="info-row">
          <text class="label">治疗项目</text>
          <text class="value">{{ record.project?.name }}</text>
        </view>
        <view class="info-row">
          <text class="label">治疗日期</text>
          <text class="value">{{ formatDate(record.treatmentDate) }}</text>
        </view>
        <view class="info-row">
          <text class="label">开始时间</text>
          <text class="value">{{ formatTimeToMinute(record.startTime) }}</text>
        </view>
        <view class="info-row">
          <text class="label">结束时间</text>
          <text class="value">{{ formatTimeToMinute(record.endTime) }}</text>
        </view>
        <view class="info-row">
          <text class="label">治疗时长</text>
          <text class="value">{{ record.durationMinutes }}分钟</text>
        </view>
        <view class="info-row">
          <text class="label">治疗师</text>
          <text class="value">{{ record.therapist?.name }}</text>
        </view>
      </view>

      <!-- 患者签名 -->
      <view class="section photos" v-if="record.photoFileName">
        <view class="section-title">患者签名（点击查看大图）</view>
        <view class="photo-preview" @click="previewPhoto">
          <image
            class="preview-image"
            :src="getPhotoUrl(record.photoFileName)"
            mode="aspectFit"
            @error="onImageError"
            @load="onImageLoad"
          ></image>
          <view v-if="imageLoading" class="photo-loading">
            <text>加载中...</text>
          </view>
          <view v-if="imageError" class="photo-error">
            <text>签名图片加载失败</text>
          </view>
        </view>
      </view>

      <!-- 患者反应 -->
      <view class="section outcome">
        <view class="section-title">
          <view class="title-row">
            <text>患者反应</text>
            <button class="edit-btn" @click="startEditOutcome" v-if="!editingOutcome">
              <text>编辑</text>
            </button>
          </view>
        </view>

        <!-- 查看模式 -->
        <view v-if="!editingOutcome" class="outcome-display">
          <text class="outcome-text">{{ record.outcome }}</text>
        </view>

        <!-- 编辑模式 -->
        <view v-else class="outcome-edit">
          <view class="outcome-options">
            <view
              class="outcome-item"
              :class="{ active: tempOutcome === outcome }"
              v-for="outcome in outcomeOptions"
              :key="outcome"
              @click="selectOutcome(outcome)"
            >
              <text class="option-text">{{ outcome }}</text>
            </view>
          </view>
          <view class="custom-input" v-if="tempOutcome === '其他反应'">
            <textarea
              class="custom-textarea"
              v-model="customOutcome"
              placeholder="请详细描述患者反应..."
              placeholder-style="color: #94a3b8"
              maxlength="200"
            ></textarea>
            <text class="char-count">{{ customOutcome.length }}/200</text>
          </view>
          <view class="edit-actions">
            <button class="action-btn cancel" @click="cancelEditOutcome">取消</button>
            <button class="action-btn save" @click="saveOutcome">保存</button>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="actions">
        <button class="action-btn secondary" @click="goBack">返回</button>
      </view>
    </view>

    <view class="error" v-else>
      <text>记录不存在</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { request } from '@/utils/request'

const userStore = useUserStore()

const loading = ref(true)
const record = ref<any>(null)
const recordId = ref('')

const editingOutcome = ref(false)
const tempOutcome = ref('')
const customOutcome = ref('')
const savingOutcome = ref(false)

// 签名图片加载状态
const imageLoading = ref(true)
const imageError = ref(false)

const outcomeOptions = [
  '无不良反应',
  '轻微疲劳',
  '轻微头晕',
  '轻微恶心',
  '其他反应'
]

// 处理401错误，跳转到登录页
function handleUnauthorizedError() {
  uni.showToast({
    title: '登录已过期，请重新登录',
    icon: 'none',
    duration: 1500
  })
  userStore.logout()
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options

  if (options.id) {
    recordId.value = options.id
    loadRecord()
  }
})

async function loadRecord() {
  loading.value = true

  const token = userStore.getToken()
  if (!token) {
    handleUnauthorizedError()
    loading.value = false
    return
  }

  try {
    const response = await request({
      url: `/records/${recordId.value}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.statusCode === 200) {
      record.value = response.data
      tempOutcome.value = record.value.outcome
      // 重置图片加载状态
      imageLoading.value = true
      imageError.value = false
    } else if (response.statusCode === 401) {
      handleUnauthorizedError()
    }
  } catch (error) {
    console.error('加载记录失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取签名图片URL
function getPhotoUrl(fileName: string): string {
  if (!fileName) return ''
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  return `${API_BASE}/uploads/photos/${fileName}`
}

// 签名图片加载成功
function onImageLoad() {
  imageLoading.value = false
  imageError.value = false
}

// 签名图片加载失败
function onImageError() {
  imageLoading.value = false
  imageError.value = true
  console.error('签名图片加载失败:', getPhotoUrl(record.value?.photoFileName))
}

// 预览签名图片
function previewPhoto() {
  if (!record.value?.photoFileName) return

  const photoUrl = getPhotoUrl(record.value.photoFileName)
  uni.previewImage({
    current: 0,
    urls: [photoUrl]
  })
}

// 开始编辑患者反应
function startEditOutcome() {
  const currentOutcome = record.value?.outcome || '无不良反应'
  // 如果当前outcome不是预设选项，设为"其他反应"并填充到customOutcome
  if (!outcomeOptions.includes(currentOutcome)) {
    tempOutcome.value = '其他反应'
    customOutcome.value = currentOutcome
  } else {
    tempOutcome.value = currentOutcome
    customOutcome.value = ''
  }
  editingOutcome.value = true
}

// 取消编辑
function cancelEditOutcome() {
  tempOutcome.value = ''
  customOutcome.value = ''
  editingOutcome.value = false
}

// 选择反应
function selectOutcome(outcome: string) {
  tempOutcome.value = outcome
  if (outcome !== '其他反应') {
    customOutcome.value = ''
  }
}

// 保存患者反应
async function saveOutcome() {
  if (savingOutcome.value) return

  if (!tempOutcome.value) {
    uni.showToast({
      title: '请选择患者反应',
      icon: 'none'
    })
    return
  }

  // 如果选择了"其他反应"但没有填写详细内容
  if (tempOutcome.value === '其他反应' && !customOutcome.value.trim()) {
    uni.showToast({
      title: '请填写详细反应',
      icon: 'none'
    })
    return
  }

  savingOutcome.value = true
  uni.showLoading({
    title: '保存中...'
  })

  const token = userStore.getToken()
  if (!token) {
    handleUnauthorizedError()
    savingOutcome.value = false
    uni.hideLoading()
    return
  }

  try {
    // 确定最终保存的值
    const finalOutcome = tempOutcome.value === '其他反应'
      ? customOutcome.value.trim()
      : tempOutcome.value

    const response = await request({
      url: `/records/${recordId.value}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        outcome: finalOutcome
      }
    })

    if (response.statusCode === 200) {
      record.value = response.data
      tempOutcome.value = ''
      customOutcome.value = ''
      editingOutcome.value = false
      uni.hideLoading()
      uni.showToast({
        title: '保存成功',
        icon: 'success'
      })
    } else if (response.statusCode === 401) {
      handleUnauthorizedError()
    } else {
      throw new Error(response.data?.message || '保存失败')
    }
  } catch (error: any) {
    console.error('保存失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: error.message || '保存失败',
      icon: 'none'
    })
  } finally {
    savingOutcome.value = false
  }
}

// 格式化日期
function formatDate(dateStr: string): string {
  if (!dateStr) return '--'
  try {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  } catch (e) {
    console.error('日期格式化失败:', e)
    return dateStr
  }
}

// 格式化时间到分钟 (HH:MM)
function formatTimeToMinute(timeStr: string): string {
  if (!timeStr) return '--:--'

  try {
    const date = new Date(timeStr)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  } catch (e) {
    console.error('时间格式化失败:', e)
    return timeStr
  }
}

function goBack() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
/* 医疗专业配色 */
$medical-blue: #0ea5e9;
$medical-teal: #14b8a6;
$medical-green: #10b981;
$medical-cyan: #06b6d4;
$sky-light: #e0f2fe;
$teal-light: #ccfbf1;
$primary-dark: #0284c7;
$bg-page: #f8fafc;

.detail-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f9ff 0%, $bg-page 100%);
  padding: 24rpx;
}

.loading,
.error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80vh;
  color: #94a3b8;
  font-size: 28rpx;
}

.section {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);

  .section-title {
    font-size: 34rpx;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 28rpx;
    padding-bottom: 20rpx;
    border-bottom: 2rpx solid #f1f5f9;
    position: relative;
    padding-left: 20rpx;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 6rpx;
      height: 32rpx;
      background: linear-gradient(180deg, $medical-blue 0%, $medical-cyan 100%);
      border-radius: 3rpx;
    }
  }

  .info-row {
    display: flex;
    margin-bottom: 24rpx;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      width: 180rpx;
      color: #64748b;
      font-size: 28rpx;
    }

    .value {
      flex: 1;
      color: #1e293b;
      font-size: 28rpx;
      font-weight: 500;
    }
  }
}

.photos {
  .photo-preview {
    width: 100%;
    height: 400rpx;
    background: #f8fafc;
    border-radius: 16rpx;
    overflow: hidden;
    border: 2rpx solid #e2e8f0;
    position: relative;

    .preview-image {
      width: 100%;
      height: 100%;
      display: block;
    }

    .photo-loading,
    .photo-error {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      font-size: 28rpx;
      color: #94a3b8;
    }

    .photo-error {
      color: #ef4444;
    }
  }
}

.outcome {
  .title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    .edit-btn {
      padding: 8rpx 20rpx;
      background: linear-gradient(135deg, $medical-blue 0%, $primary-dark 100%);
      color: #fff;
      border-radius: 20rpx;
      font-size: 24rpx;
      border: none;
      box-shadow: 0 4rpx 12rpx rgba(14, 165, 233, 0.3);
    }
  }

  .outcome-display {
    padding: 24rpx;
    background: #f8fafc;
    border-radius: 16rpx;
    border-left: 4rpx solid $medical-blue;

    .outcome-text {
      font-size: 28rpx;
      color: #475569;
      line-height: 1.8;
    }
  }

  .outcome-edit {
    .outcome-options {
      display: flex;
      flex-wrap: wrap;
      gap: 12rpx;
      margin-bottom: 24rpx;

      .outcome-item {
        padding: 16rpx 24rpx;
        background: #f8fafc;
        border-radius: 32rpx;
        border: 2rpx solid #e2e8f0;
        transition: all 0.2s;

        &.active {
          background: linear-gradient(135deg, $medical-blue 0%, $primary-dark 100%);
          border-color: $medical-blue;
          box-shadow: 0 4rpx 12rpx rgba(14, 165, 233, 0.3);

          .option-text {
            color: #fff;
          }
        }

        .option-text {
          font-size: 26rpx;
          color: #475569;
          font-weight: 500;
        }
      }
    }

    .custom-input {
      position: relative;
      margin-bottom: 24rpx;

      .custom-textarea {
        width: 100%;
        min-height: 160rpx;
        padding: 20rpx;
        background: #f8fafc;
        border: 2rpx solid #e2e8f0;
        border-radius: 16rpx;
        font-size: 28rpx;
        color: #1e293b;
        line-height: 1.6;
        transition: border-color 0.2s;

        &:focus {
          border-color: $medical-blue;
          background: #fff;
        }
      }

      .char-count {
        position: absolute;
        bottom: 16rpx;
        right: 20rpx;
        font-size: 22rpx;
        color: #94a3b8;
      }
    }

    .edit-actions {
      display: flex;
      gap: 16rpx;

      .action-btn {
        flex: 1;
        height: 72rpx;
        border-radius: 16rpx;
        font-size: 28rpx;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;

        &.cancel {
          background: #f1f5f9;
          color: #475569;
        }

        &.save {
          background: linear-gradient(135deg, $medical-blue 0%, $primary-dark 100%);
          color: #fff;
          box-shadow: 0 4rpx 12rpx rgba(14, 165, 233, 0.3);
        }
      }
    }
  }
}

.notes {
  .notes-text {
    font-size: 28rpx;
    color: #475569;
    line-height: 1.8;
    background: #f8fafc;
    padding: 24rpx;
    border-radius: 16rpx;
    border-left: 4rpx solid $medical-blue;
  }
}

.actions {
  margin-top: 40rpx;

  .action-btn {
    width: 100%;
    height: 90rpx;
    border-radius: 24rpx;
    font-size: 32rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;

    &.secondary {
      background-color: #f1f5f9;
      color: #475569;
    }
  }
}
</style>
