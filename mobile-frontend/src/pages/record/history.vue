<template>
  <view class="history-container">
    <view class="record-list">
      <view
        class="record-item"
        v-for="record in records"
        :key="record.id"
        @click="viewDetail(record)"
      >
        <view class="record-header">
          <text class="record-date">{{ formatDate(record.treatmentDate) }}</text>
          <text class="record-time">{{ formatTimeToMinute(record.startTime) }}</text>
        </view>
        <view class="record-body">
          <view class="record-info">
            <text class="label">项目：</text>
            <text class="value">{{ record.project?.name }}</text>
          </view>
          <view class="record-info">
            <text class="label">时长：</text>
            <text class="value">{{ record.durationMinutes }}分钟</text>
          </view>
          <view class="record-info">
            <text class="label">治疗师：</text>
            <text class="value">{{ record.therapist?.name }}</text>
          </view>
        </view>
        <view class="record-footer" v-if="record.outcome">
          <text class="outcome-label">反应：</text>
          <text class="outcome-text">{{ record.outcome }}</text>
        </view>
      </view>

      <view class="empty-tip" v-if="records.length === 0">
        <text>该患者暂无治疗记录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { request } from '@/utils/request'

const userStore = useUserStore()

const patientId = ref<number>(0)
const records = ref<any[]>([])

// 处理401错误，跳转到登录页
function handleUnauthorizedError() {
  uni.showToast({
    title: '登录已过期，请重新登录',
    icon: 'none',
    duration: 1500
  })
  userStore.logout()
}

onLoad((options: any) => {
  if (options.patientId) {
    patientId.value = parseInt(options.patientId)
    loadRecords()
  }
})

async function loadRecords() {
  const token = userStore.getToken()
  if (!token) {
    handleUnauthorizedError()
    return
  }

  try {
    const response = await request({
      url: `/records?patientId=${patientId.value}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.statusCode === 200) {
      records.value = response.data
    } else if (response.statusCode === 401) {
      handleUnauthorizedError()
    }
  } catch (error) {
    console.error('加载记录失败:', error)
  }
}

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

function viewDetail(record: any) {
  uni.navigateTo({
    url: `/pages/record/detail?id=${record.id}`
  })
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

.history-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f9ff 0%, $bg-page 100%);
}

.record-list {
  padding: 24rpx;
}

.record-item {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  transition: all 0.2s;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  }

  .record-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    padding-bottom: 20rpx;
    border-bottom: 2rpx solid #f1f5f9;

    .record-date {
      font-size: 32rpx;
      font-weight: 600;
      color: #1e293b;
    }

    .record-time {
      font-size: 26rpx;
      color: $medical-blue;
      font-weight: 500;
      padding: 8rpx 16rpx;
      background: $sky-light;
      border-radius: 12rpx;
    }
  }

  .record-body {
    .record-info {
      display: flex;
      margin-bottom: 12rpx;
      font-size: 28rpx;

      .label {
        color: #64748b;
        min-width: 120rpx;
      }

      .value {
        color: #1e293b;
        flex: 1;
        font-weight: 500;
      }
    }
  }

  .record-footer {
    margin-top: 20rpx;
    padding-top: 20rpx;
    border-top: 2rpx solid #f1f5f9;
    display: flex;
    gap: 8rpx;

    .outcome-label {
      font-size: 26rpx;
      color: #64748b;
      flex-shrink: 0;
    }

    .outcome-text {
      font-size: 26rpx;
      color: #475569;
      flex: 1;
      background: #f8fafc;
      padding: 12rpx 16rpx;
      border-radius: 12rpx;
      border-left: 3rpx solid $medical-blue;
    }
  }
}

.empty-tip {
  text-align: center;
  padding: 120rpx 0;
  color: #94a3b8;
  font-size: 28rpx;
}
</style>
