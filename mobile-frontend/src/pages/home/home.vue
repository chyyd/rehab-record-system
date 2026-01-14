<template>
  <view class="home-container">
    <!-- 顶部用户信息 -->
    <view class="user-header">
      <view class="user-info">
        <view class="avatar">
          <text class="avatar-text">{{ userInfo?.name?.charAt(0) || '?' }}</text>
        </view>
        <view class="user-detail">
          <text class="user-name">{{ userInfo?.name }}</text>
          <text class="user-role">{{ getRoleName(userInfo?.role) }}</text>
        </view>
      </view>
      <view class="logout-btn" @click="handleLogout">
        <text>退出</text>
      </view>
    </view>

    <!-- 今日治疗历史 -->
    <view class="todo-section">
      <view class="section-header">
        <text class="section-title">今日治疗历史</text>
      </view>

      <view class="todo-list" v-if="todayRecords.length > 0">
        <view
          class="todo-item"
          v-for="record in todayRecords"
          :key="record.id"
          @click="viewRecordDetail(record)"
        >
          <view class="todo-patient">
            <text class="patient-name">{{ record.patient?.name }}</text>
            <text class="patient-info">{{ record.project?.name }}</text>
          </view>
          <view class="todo-project">
            <text class="project-time">{{ formatTimeToMinute(record.startTime) }}</text>
          </view>
          <view class="todo-duration">
            <text>{{ record.durationMinutes }}分钟</text>
          </view>
        </view>
      </view>

      <view class="empty-state" v-else>
        <view class="empty-icon">
          <text>📋</text>
        </view>
        <text class="empty-text">今日暂无治疗记录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { request } from '@/utils/request'

const userStore = useUserStore()

const userInfo = ref(userStore.userInfo)

const todayRecords = ref<any[]>([])

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
  await loadTodayRecords()
})

async function loadTodayRecords() {
  const token = userStore.getToken()
  if (!token) {
    handleUnauthorizedError()
    return
  }

  try {
    // 获取今天的日期范围
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

    const response = await request({
      url: `/records?startDate=${startOfDay}&endDate=${endOfDay}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.statusCode === 200) {
      todayRecords.value = response.data
    } else if (response.statusCode === 401) {
      handleUnauthorizedError()
    }
  } catch (error) {
    console.error('加载今日记录失败:', error)
  }
}

function getRoleName(role?: string): string {
  const roleMap: Record<string, string> = {
    admin: '管理员',
    physician: '医师',
    therapist: '治疗师',
    nurse: '护士'
  }
  return roleMap[role || ''] || '未知角色'
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
  uni.navigateTo({
    url: `/pages/record/detail?id=${record.id}`
  })
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗?',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
      }
    }
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

.home-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f9ff 0%, $bg-page 100%);
  padding: 24rpx;
}

.user-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, $medical-blue 0%, $medical-cyan 100%);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(14, 165, 233, 0.15);

  .user-info {
    display: flex;
    align-items: center;

    .avatar {
      width: 110rpx;
      height: 110rpx;
      border-radius: 50%;
      margin-right: 24rpx;
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(10rpx);
      border: 3rpx solid rgba(255, 255, 255, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;

      .avatar-text {
        font-size: 44rpx;
        font-weight: 600;
        color: #fff;
      }
    }

    .user-detail {
      display: flex;
      flex-direction: column;

      .user-name {
        font-size: 34rpx;
        font-weight: 600;
        color: #fff;
        margin-bottom: 8rpx;
        text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
      }

      .user-role {
        font-size: 26rpx;
        color: rgba(255, 255, 255, 0.9);
        background: rgba(255, 255, 255, 0.2);
        padding: 6rpx 16rpx;
        border-radius: 20rpx;
      }
    }
  }

  .logout-btn {
    padding: 16rpx 24rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20rpx;
    font-size: 28rpx;
    color: #fff;
    backdrop-filter: blur(10rpx);
    transition: all 0.2s;

    &:active {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(0.96);
    }
  }
}

.todo-section {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;
    padding-bottom: 20rpx;
    border-bottom: 2rpx solid #f1f5f9;

    .section-title {
      font-size: 34rpx;
      font-weight: 600;
      color: #1e293b;
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
  }

  .todo-list {
    .todo-item {
      display: flex;
      align-items: center;
      padding: 24rpx 20rpx;
      background: #f8fafc;
      border-radius: 16rpx;
      margin-bottom: 16rpx;
      transition: all 0.2s;

      &:last-child {
        margin-bottom: 0;
      }

      &:active {
        background: #f1f5f9;
        transform: scale(0.98);
      }

      .todo-patient {
        flex: 1;
        display: flex;
        flex-direction: column;

        .patient-name {
          font-size: 32rpx;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8rpx;
        }

        .patient-info {
          font-size: 24rpx;
          color: $medical-blue;
        }
      }

      .todo-project {
        margin-right: 16rpx;

        .project-time {
          font-size: 26rpx;
          color: #64748b;
          padding: 10rpx 16rpx;
          background: #f1f5f9;
          border-radius: 12rpx;
          font-weight: 500;
        }
      }

      .todo-duration {
        font-size: 24rpx;
        padding: 10rpx 16rpx;
        border-radius: 12rpx;
        background: $sky-light;
        color: $medical-blue;
        font-weight: 500;
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 100rpx 0;

    .empty-icon {
      width: 220rpx;
      height: 220rpx;
      margin-bottom: 32rpx;
      opacity: 0.4;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 120rpx;
      background: $sky-light;
      border-radius: 50%;
    }

    .empty-text {
      font-size: 28rpx;
      color: #94a3b8;
    }
  }
}
</style>
