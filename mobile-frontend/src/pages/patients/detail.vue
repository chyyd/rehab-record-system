<template>
  <view class="detail-container">
    <view class="loading" v-if="loading">
      <text>加载中...</text>
    </view>

    <view class="detail-content" v-else-if="patient">
      <!-- 患者基本信息 -->
      <view class="section basic-info">
        <view class="section-title">基本信息</view>
        <view class="info-row">
          <text class="label">姓名</text>
          <text class="value">{{ patient.name }}</text>
        </view>
        <view class="info-row">
          <text class="label">性别</text>
          <text class="value">{{ patient.gender }}</text>
        </view>
        <view class="info-row">
          <text class="label">年龄</text>
          <text class="value">{{ patient.age }}</text>
        </view>
        <view class="info-row">
          <text class="label">医保类型</text>
          <text class="value">{{ patient.insuranceType }}</text>
        </view>
      </view>

      <!-- 住院信息 -->
      <view class="section hospital-info">
        <view class="section-title">住院信息</view>
        <view class="info-row">
          <text class="label">病历号</text>
          <text class="value">{{ patient.medicalRecordNo }}</text>
        </view>
        <view class="info-row">
          <text class="label">主管医师</text>
          <text class="value">{{ patient.doctor }}</text>
        </view>
        <view class="info-row">
          <text class="label">入院日期</text>
          <text class="value">{{ formatDate(patient.admissionDate) }}</text>
        </view>
        <view class="info-row" v-if="patient.dischargeDate">
          <text class="label">出院日期</text>
          <text class="value">{{ formatDate(patient.dischargeDate) }}</text>
        </view>
        <view class="info-row">
          <text class="label">主要诊断</text>
          <text class="value">{{ patient.diagnosis }}</text>
        </view>
      </view>

      <!-- 今日治疗任务 -->
      <view class="section today-tasks" v-if="todayTasks.length > 0">
        <view class="section-title">今日治疗任务</view>
        <view class="task-list">
          <view
            class="task-item"
            v-for="task in todayTasks"
            :key="task.id"
            @click="startTreatment(task)"
          >
            <view class="task-header">
              <text class="task-name">{{ task.projectName }}</text>
              <text :class="['task-status', task.status]">{{ getStatusText(task.status) }}</text>
            </view>
            <view class="task-info">
              <text class="task-duration">{{ task.defaultDuration }}分钟</text>
              <text class="task-frequency">{{ task.frequency }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="actions">
        <button class="action-btn primary" @click="createRecord">创建治疗记录</button>
        <button class="action-btn secondary" @click="goBack">返回</button>
      </view>
    </view>

    <view class="error" v-else>
      <text>患者不存在</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { request } from '@/utils/request'

const userStore = useUserStore()

const loading = ref(true)
const patient = ref<any>(null)
const todayTasks = ref<any[]>([])
const patientId = ref('')

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options

  if (options.id) {
    patientId.value = options.id
    loadPatient()
  }
})

async function loadPatient() {
  loading.value = true

  try {
    // 加载患者信息
    const patientRes = await request({
      url: `/patients/${patientId.value}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userStore.getToken()}`
      }
    })

    if (patientRes.statusCode === 200) {
      patient.value = patientRes.data
    }

    // 加载今日治疗任务
    const tasksRes = await request({
      url: `/patients/${patientId.value}/today`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userStore.getToken()}`
      }
    })

    if (tasksRes.statusCode === 200) {
      todayTasks.value = tasksRes.data
    }
  } catch (error) {
    console.error('加载患者信息失败:', error)
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getStatusText(status: string) {
  const statusMap: Record<string, string> = {
    pending: '待治疗',
    in_progress: '治疗中',
    completed: '已完成'
  }
  return statusMap[status] || status
}

function startTreatment(task: any) {
  uni.navigateTo({
    url: `/pages/record/create?patientId=${patientId.value}&projectId=${task.projectId}`
  })
}

function createRecord() {
  uni.navigateTo({
    url: `/pages/record/create?patientId=${patientId.value}`
  })
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

.task-list {
  .task-item {
    padding: 28rpx;
    background: linear-gradient(135deg, $sky-light 0%, rgba(224, 242, 254, 0.5) 100%);
    border-radius: 20rpx;
    margin-bottom: 20rpx;
    border-left: 4rpx solid $medical-blue;
    transition: all 0.2s;

    &:last-child {
      margin-bottom: 0;
    }

    &:active {
      transform: scale(0.98);
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16rpx;

      .task-name {
        font-size: 32rpx;
        font-weight: 600;
        color: #1e293b;
      }

      .task-status {
        font-size: 24rpx;
        padding: 8rpx 20rpx;
        border-radius: 20rpx;
        font-weight: 500;

        &.pending {
          background-color: #fef3c7;
          color: #d97706;
        }

        &.in_progress {
          background-color: #dbeafe;
          color: #1d4ed8;
        }

        &.completed {
          background-color: #d1fae5;
          color: #059669;
        }
      }
    }

    .task-info {
      display: flex;
      gap: 30rpx;
      font-size: 26rpx;
      color: #64748b;
    }
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
    margin-bottom: 20rpx;

    &.primary {
      background: linear-gradient(135deg, $medical-blue 0%, $primary-dark 100%);
      color: #fff;
      box-shadow: 0 8rpx 24rpx rgba(14, 165, 233, 0.3);
    }

    &.secondary {
      background-color: #f1f5f9;
      color: #475569;
    }
  }
}
</style>
