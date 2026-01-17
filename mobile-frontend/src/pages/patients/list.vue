<template>
  <view class="patients-container">
    <!-- 治疗记录弹窗 -->
    <view class="history-modal" v-if="showHistoryModal" @click="closeHistoryModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">治疗记录（最近7天）</text>
          <text class="modal-close" @click="closeHistoryModal">✕</text>
        </view>
        <view class="modal-body">
          <view v-if="todayPatientRecords.length > 0">
            <view
              class="record-item"
              v-for="record in todayPatientRecords"
              :key="record.id"
              @click="viewRecordDetail(record)"
            >
              <view class="record-info">
                <text class="record-project">{{ record.project?.name }}</text>
                <text class="record-time">{{ formatTimeToMinute(record.startTime) }}</text>
              </view>
              <view class="record-meta">
                <text class="record-duration">{{ record.durationMinutes }}分钟</text>
                <text class="record-therapist">{{ record.therapist?.name }}</text>
              </view>
            </view>
          </view>
          <view v-else class="modal-empty">
            <text>该患者最近7天暂无治疗记录</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input">
        <text class="iconfont icon-search"></text>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="搜索患者（姓名/拼音/病历号）"
          placeholder-style="color: #999"
          @confirm="handleSearch"
        />
        <text v-if="searchQuery" class="iconfont icon-clear" @click="clearSearch"></text>
      </view>
      <button class="add-patient-btn" @click="goToAddPatient">
        <text class="add-icon">+</text>
        <text class="add-text">新增</text>
      </button>
    </view>

    <!-- 患者列表 -->
    <view class="patient-list" v-if="patients.length > 0">
      <view
        class="patient-item"
        v-for="patient in patients"
        :key="patient.id"
        @click="viewPatient(patient)"
      >
        <view class="patient-header">
          <view class="patient-name-row">
            <text class="patient-name">{{ patient.name }}</text>
            <view class="patient-tag">{{ patient.gender }}</view>
          </view>
          <text class="medical-record">{{ patient.medicalRecordNo }}</text>
        </view>

        <view class="patient-info">
          <view class="info-item">
            <text class="info-label">年龄:</text>
            <text class="info-value">{{ patient.age }}岁</text>
          </view>
          <view class="info-item">
            <text class="info-label">医保:</text>
            <text class="info-value">{{ patient.insuranceType }}</text>
          </view>
        </view>

        <view class="patient-diagnosis">
          <text class="diagnosis-label">诊断:</text>
          <text class="diagnosis-text">{{ patient.diagnosis }}</text>
        </view>

        <view class="patient-actions">
          <button class="action-btn primary" size="mini" @click.stop="createRecord(patient)">
            创建记录
          </button>
          <button class="action-btn" size="mini" @click.stop="viewHistory(patient)">
            历史记录
          </button>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <view class="empty-icon">
        <text>👥</text>
      </view>
      <text class="empty-text">{{ searchQuery ? '未找到相关患者' : '暂无患者数据' }}</text>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { usePatientStore } from '@/stores/patient'
import { request } from '@/utils/request'

const userStore = useUserStore()
const patientStore = usePatientStore()

const searchQuery = ref('')
const patients = ref<any[]>([])
const loading = ref(false)
const allPatients = ref<any[]>([])

// 弹窗相关
const showHistoryModal = ref(false)
const selectedPatientId = ref<number>(0)
const todayPatientRecords = ref<any[]>([])

// 处理401错误，跳转到登录页
function handleUnauthorizedError() {
  uni.showToast({
    title: '登录已过期，请重新登录',
    icon: 'none',
    duration: 1500
  })
  userStore.logout()
}

onMounted(async () => {
  console.log('🟢 ========== 患者列表页面 onMounted ==========')
  console.log('patientStore:', patientStore)
  console.log('patientStore.hasPendingSearch():', patientStore.hasPendingSearch())
  console.log('patientStore.pendingSearchQuery:', patientStore.pendingSearchQuery)

  await loadPatients()

  // 检查是否有待搜索的患者
  console.log('检查是否有待搜索内容...')
  if (patientStore.hasPendingSearch()) {
    const query = patientStore.getAndClearPendingSearch()
    console.log('✅ 发现已设置的待搜索内容:', query)
    searchQuery.value = query
    await handleSearch()
    uni.showToast({
      title: `已搜索: ${query}`,
      icon: 'none',
      duration: 1500
    })
  } else {
    console.log('❌ 没有待搜索内容')
  }
})

async function loadPatients() {
  loading.value = true

  try {
    const token = userStore.getToken()
    if (!token) {
      handleUnauthorizedError()
      return
    }

    const response = await request({
      url: '/patients',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.statusCode === 200) {
      allPatients.value = response.data
      patients.value = response.data
    } else if (response.statusCode === 401) {
      handleUnauthorizedError()
    } else {
      throw new Error('加载失败')
    }
  } catch (error) {
    console.error('加载患者列表失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

async function handleSearch() {
  if (!searchQuery.value.trim()) {
    patients.value = allPatients.value
    return
  }

  loading.value = true

  try {
    const token = userStore.getToken()
    if (!token) {
      handleUnauthorizedError()
      return
    }

    const response = await uni.request({
      url: `http://localhost:3000/patients/search?q=${searchQuery.value}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      }
    }) as any

    if (response.statusCode === 200) {
      patients.value = response.data
    } else if (response.statusCode === 401) {
      handleUnauthorizedError()
    } else {
      throw new Error('搜索失败')
    }
  } catch (error) {
    console.error('搜索失败:', error)
    uni.showToast({
      title: '搜索失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

function clearSearch() {
  searchQuery.value = ''
  patients.value = allPatients.value
}

function viewPatient(patient: any) {
  uni.navigateTo({
    url: `/pages/patients/detail?id=${patient.id}`
  })
}

function createRecord(patient: any) {
  uni.navigateTo({
    url: `/pages/record/create?patientId=${patient.id}&patientName=${patient.name}`
  })
}

async function viewHistory(patient: any) {
  selectedPatientId.value = patient.id
  showHistoryModal.value = true

  // 加载该患者最近7天的治疗记录
  try {
    const token = userStore.getToken()
    if (!token) {
      handleUnauthorizedError()
      return
    }

    // 获取最近7天的日期范围
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const response = await request({
      url: `/records?patientId=${patient.id}&startDate=${sevenDaysAgo.toISOString()}&endDate=${now.toISOString()}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.statusCode === 200) {
      todayPatientRecords.value = response.data
    } else if (response.statusCode === 401) {
      handleUnauthorizedError()
    } else {
      todayPatientRecords.value = []
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
    todayPatientRecords.value = []
  }
}

function closeHistoryModal() {
  showHistoryModal.value = false
  selectedPatientId.value = 0
  todayPatientRecords.value = []
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

function viewRecordDetail(record: any) {
  closeHistoryModal()
  uni.navigateTo({
    url: `/pages/record/detail?id=${record.id}`
  })
}

function goToAddPatient() {
  uni.navigateTo({
    url: '/pages/patients/create'
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

.patients-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f9ff 0%, $bg-page 100%);
}

.history-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 9999;
  animation: fadeIn 0.2s;

  .modal-content {
    width: 100%;
    max-height: 70vh;
    background: #fff;
    border-radius: 32rpx 32rpx 0 0;
    animation: slideUp 0.3s;
    display: flex;
    flex-direction: column;

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 32rpx;
      border-bottom: 2rpx solid #f1f5f9;

      .modal-title {
        font-size: 34rpx;
        font-weight: 600;
        color: #1e293b;
      }

      .modal-close {
        font-size: 40rpx;
        color: #94a3b8;
        padding: 8rpx;
      }
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 24rpx 32rpx;

      .record-item {
        background: #f8fafc;
        border-radius: 20rpx;
        padding: 24rpx;
        margin-bottom: 16rpx;
        transition: all 0.2s;

        &:last-child {
          margin-bottom: 0;
        }

        &:active {
          background: #f1f5f9;
          transform: scale(0.98);
        }

        .record-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16rpx;

          .record-project {
            font-size: 30rpx;
            font-weight: 600;
            color: #1e293b;
          }

          .record-time {
            font-size: 24rpx;
            color: $medical-blue;
            padding: 8rpx 16rpx;
            background: $sky-light;
            border-radius: 12rpx;
            font-weight: 500;
          }
        }

        .record-meta {
          display: flex;
          gap: 24rpx;
          font-size: 26rpx;

          .record-duration {
            color: #64748b;
          }

          .record-therapist {
            color: #64748b;
          }
        }
      }

      .modal-empty {
        text-align: center;
        padding: 80rpx 0;
        color: #94a3b8;
        font-size: 28rpx;
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.search-bar {
  padding: 24rpx;
  background: linear-gradient(135deg, $medical-blue 0%, $medical-cyan 100%);
  box-shadow: 0 4rpx 16rpx rgba(14, 165, 233, 0.12);
  display: flex;
  align-items: center;
  gap: 16rpx;

  .search-input {
    flex: 1;
    display: flex;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10rpx);
    border-radius: 28rpx;
    padding: 0 32rpx;
    height: 80rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);

    .iconfont {
      font-size: 34rpx;
      color: #94a3b8;
      margin-right: 16rpx;
    }

    input {
      flex: 1;
      font-size: 30rpx;
      height: 100%;
      color: #1e293b;
    }

    .icon-clear {
      margin-left: 16rpx;
      margin-right: 0;
      color: #94a3b8;
    }
  }

  .add-patient-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100rpx;
    height: 80rpx;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10rpx);
    border-radius: 20rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    padding: 0;
    border: none;
    transition: all 0.2s;

    &:active {
      transform: scale(0.95);
      opacity: 0.8;
    }

    .add-icon {
      font-size: 32rpx;
      color: $medical-blue;
      font-weight: 600;
      line-height: 1;
      margin-bottom: 4rpx;
    }

    .add-text {
      font-size: 20rpx;
      color: $medical-blue;
      font-weight: 500;
      line-height: 1;
    }
  }
}

.patient-list {
  padding: 24rpx;

  .patient-item {
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

    .patient-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24rpx;
      padding-bottom: 20rpx;
      border-bottom: 2rpx solid #f1f5f9;

      .patient-name-row {
        display: flex;
        align-items: center;

        .patient-name {
          font-size: 36rpx;
          font-weight: 600;
          color: #1e293b;
          margin-right: 16rpx;
        }

        .patient-tag {
          font-size: 22rpx;
          padding: 8rpx 16rpx;
          background: $sky-light;
          color: $medical-blue;
          border-radius: 12rpx;
          font-weight: 500;
        }
      }

      .medical-record {
        font-size: 26rpx;
        color: $medical-blue;
        font-weight: 600;
        padding: 8rpx 16rpx;
        background: $sky-light;
        border-radius: 12rpx;
      }
    }

    .patient-info {
      display: flex;
      margin-bottom: 20rpx;

      .info-item {
        margin-right: 40rpx;

        .info-label {
          font-size: 26rpx;
          color: #64748b;
          margin-right: 8rpx;
        }

        .info-value {
          font-size: 28rpx;
          color: #1e293b;
          font-weight: 500;
        }
      }
    }

    .patient-diagnosis {
      background: linear-gradient(135deg, $sky-light 0%, rgba(224, 242, 254, 0.5) 100%);
      padding: 20rpx 24rpx;
      border-radius: 16rpx;
      margin-bottom: 24rpx;
      border-left: 4rpx solid $medical-blue;

      .diagnosis-label {
        font-size: 26rpx;
        color: #64748b;
        margin-right: 10rpx;
      }

      .diagnosis-text {
        font-size: 28rpx;
        color: #1e293b;
        font-weight: 500;
      }
    }

    .patient-actions {
      display: flex;
      gap: 16rpx;

      .action-btn {
        flex: 1;
        font-size: 28rpx;
        border-radius: 16rpx;
        font-weight: 500;
        height: 70rpx;
        display: flex;
        align-items: center;
        justify-content: center;

        &.primary {
          background: linear-gradient(135deg, $medical-blue 0%, $primary-dark 100%);
          color: #fff;
          box-shadow: 0 4rpx 12rpx rgba(14, 165, 233, 0.3);
        }

        &:not(.primary) {
          background-color: #f1f5f9;
          color: #475569;
        }
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 180rpx 0;

  .empty-icon {
    width: 320rpx;
    height: 320rpx;
    margin-bottom: 40rpx;
    opacity: 0.3;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 140rpx;
    background: $sky-light;
    border-radius: 50%;
  }

  .empty-text {
    font-size: 30rpx;
    color: #94a3b8;
    font-weight: 500;
  }
}

.loading-state {
  padding: 60rpx 0;
  text-align: center;

  .loading-text {
    font-size: 28rpx;
    color: #94a3b8;
  }
}
</style>
