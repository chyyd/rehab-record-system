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
      <button class="add-patient-btn" @click="goToAddPatient">
        <text class="add-icon">+</text>
        <text class="add-text">新增</text>
      </button>
      <view class="search-input">
        <text class="search-icon">🔍</text>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="搜索患者（姓名/拼音/病历号）"
          placeholder-style="color: #999"
          @input="handleSearch"
        />
        <text v-if="searchQuery" class="clear-btn" @click="clearSearch">×</text>
      </view>
    </view>

    <!-- 患者列表容器 -->
    <view class="patient-list-container" v-if="patients.length > 0">
      <!-- 患者列表 -->
      <scroll-view
        class="patient-list-scroll"
        scroll-y
        :scroll-into-view="scrollIntoViewId"
        scroll-with-animation
      >
        <view class="patient-list">
          <!-- 按字母分组显示患者 -->
          <view
            v-for="letter in alphabet"
            :key="letter"
            :id="'section-' + letter"
            class="patient-section"
          >
            <!-- 字母标题 -->
            <view
              v-if="indexedPatients.get(letter) && indexedPatients.get(letter)!.length > 0"
              class="section-header"
            >
              <text class="section-letter">{{ letter }}</text>
            </view>

            <!-- 该字母下的患者列表 -->
            <view
              class="patient-item"
              v-for="patient in (indexedPatients.get(letter) || [])"
              :key="patient.id"
              @click="viewPatient(patient)"
            >
              <view class="patient-header">
                <view class="patient-name-row">
                  <text class="patient-name">{{ patient.name }}</text>
                  <view class="patient-tag age-tag">{{ patient.age }}岁</view>
                  <view class="patient-tag">{{ patient.gender }}</view>
                </view>
                <text class="medical-record">{{ patient.medicalRecordNo }}</text>
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
        </view>
      </scroll-view>

      <!-- 字母索引条 -->
      <view
        class="alphabet-index"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <view
          v-for="letter in activeLetters"
          :key="letter"
          :data-letter="letter"
          class="index-item"
          @click="handleLetterClick(letter)"
          @touchstart.stop="handleTouchStart($event, letter)"
        >
          <text class="index-letter">{{ letter }}</text>
        </view>
      </view>

      <!-- 字母指示器 -->
      <view class="letter-indicator" v-if="showLetterIndicator">
        <text class="indicator-letter">{{ currentLetter }}</text>
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
import { ref, onMounted, computed, nextTick } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { usePatientStore } from '@/stores/patient'
import { request } from '@/utils/request'
import { pinyin } from 'pinyin-pro'

const userStore = useUserStore()
const patientStore = usePatientStore()

const searchQuery = ref('')
const patients = ref<any[]>([])
const loading = ref(false)
const allPatients = ref<any[]>([])

// 防抖计时器
let searchTimer: any = null

// 弹窗相关
const showHistoryModal = ref(false)
const selectedPatientId = ref<number>(0)
const todayPatientRecords = ref<any[]>([])

// 字母索引相关
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const currentLetter = ref('')
const showLetterIndicator = ref(false)
const indexedPatients = ref<Map<string, any[]>>(new Map())
const scrollIntoViewId = ref('')

// 获取患者的拼音首字母
function getPatientPinyin(patient: any): string {
  const name = patient.name || ''
  if (!name) return '#'

  try {
    const firstChar = name.charAt(0)
    // 如果是英文字母，直接返回大写
    if (/^[a-zA-Z]$/.test(firstChar)) {
      return firstChar.toUpperCase()
    }
    // 否则使用拼音
    const py = pinyin(firstChar, { pattern: 'first', type: 'array' }) as string[]
    return py && py.length > 0 ? py[0].toUpperCase() : '#'
  } catch (e) {
    console.error('拼音转换失败:', e)
    return '#'
  }
}

// 按字母分组患者
function groupPatientsByLetter(patientList: any[]) {
  const groups = new Map<string, any[]>()

  // 初始化所有字母的空数组
  alphabet.forEach(letter => {
    groups.set(letter, [])
  })
  groups.set('#', [])

  patientList.forEach(patient => {
    const letter = getPatientPinyin(patient)
    const group = groups.get(letter) || groups.get('#')!
    group.push(patient)
  })

  return groups
}

// 计算有患者的字母列表
const activeLetters = computed(() => {
  return alphabet.filter(letter => {
    const group = indexedPatients.value.get(letter)
    return group && group.length > 0
  })
})

// 点击字母索引
function handleLetterClick(letter: string) {
  currentLetter.value = letter
  showLetterIndicator.value = true
  scrollIntoViewId.value = `section-${letter}`

  // 2秒后隐藏指示器
  setTimeout(() => {
    showLetterIndicator.value = false
  }, 2000)
}

// 触摸字母索引开始
function handleTouchStart(event: any, letter: string) {
  handleLetterClick(letter)
}

// 触摸字母索引移动
function handleTouchMove(event: any) {
  const touch = event.touches[0]
  const element = document.elementFromPoint(touch.clientX, touch.clientY)

  if (element && element.dataset.letter) {
    const letter = element.dataset.letter
    // 检查是否是活跃字母
    if (letter && activeLetters.value.includes(letter)) {
      handleLetterClick(letter)
    }
  }
}

// 触摸结束
function handleTouchEnd() {
  setTimeout(() => {
    showLetterIndicator.value = false
  }, 500)
}

// 处理401错误，跳转到登录页
function handleUnauthorizedError() {
  uni.showToast({
    title: '登录已过期，请重新登录',
    icon: 'none',
    duration: 1500
  })
  userStore.logout()
}

// 页面首次加载
onMounted(async () => {
  console.log('🟢 onMounted: 首次加载患者列表')
  await loadPatients()
})

// 每次显示页面时检查（包括从其他页面返回）
onShow(async () => {
  console.log('🟡 ========== onShow: 患者列表显示 ==========')
  console.log('patientStore.hasPendingSearch():', patientStore.hasPendingSearch())
  console.log('patientStore.pendingSearchQuery:', patientStore.pendingSearchQuery)

  // 检查是否有待搜索的患者
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
      // 更新字母分组
      indexedPatients.value = groupPatientsByLetter(response.data)
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

// 带防抖的搜索函数
function handleSearch() {
  // 清除之前的计时器
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  // 如果搜索框为空，显示所有患者
  if (!searchQuery.value.trim()) {
    patients.value = allPatients.value
    indexedPatients.value = groupPatientsByLetter(allPatients.value)
    return
  }

  // 设置新的计时器，500ms 后执行搜索
  searchTimer = setTimeout(async () => {
    console.log('🔍 执行搜索:', searchQuery.value)
    loading.value = true

    try {
      const token = userStore.getToken()
      if (!token) {
        handleUnauthorizedError()
        return
      }

      const response = await request({
        url: `/patients/search?q=${encodeURIComponent(searchQuery.value)}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.statusCode === 200) {
        patients.value = response.data
        // 更新字母分组
        indexedPatients.value = groupPatientsByLetter(response.data)
        console.log('✅ 搜索结果:', response.data.length, '个患者')
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
  }, 300) // 300ms 防抖延迟
}

function clearSearch() {
  // 清除搜索计时器
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }

  searchQuery.value = ''
  patients.value = allPatients.value
  console.log('🗑️ 已清空搜索')
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

    .search-icon {
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

    .clear-btn {
      margin-left: 16rpx;
      margin-right: 0;
      color: $medical-blue;
      font-size: 40rpx;
      line-height: 1;
      padding: 0 8rpx;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: bold;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      &:active {
        color: $primary-dark;
        transform: scale(0.9);
      }
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
  padding-bottom: 24rpx;

  .patient-section {
    .section-header {
      background: linear-gradient(135deg, $sky-light 0%, rgba(224, 242, 254, 0.5) 100%);
      padding: 16rpx 32rpx;
      margin: 0 0 16rpx 0;
      position: sticky;
      top: 0;
      z-index: 10;

      .section-letter {
        font-size: 32rpx;
        font-weight: 700;
        color: $medical-blue;
        letter-spacing: 2rpx;
      }
    }
  }

  .patient-item {
    background-color: #fff;
    border-radius: 24rpx;
    padding: 32rpx;
    margin: 0 24rpx 20rpx 24rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
    transition: all 0.2s;
    /* 为右侧索引条预留空间 */
    margin-right: 80rpx;

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
          margin-right: 8rpx;
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

// 患者列表容器（包含列表和字母索引）
.patient-list-container {
  position: relative;
  display: flex;
  height: calc(100vh - 160rpx); /* 减去搜索栏高度 */
}

// 患者列表滚动区域
.patient-list-scroll {
  flex: 1;
  height: 100%;
  overflow-y: auto;
}

// 字母索引条
.alphabet-index {
  position: fixed;
  right: 8rpx;
  top: 160rpx; /* 避开顶部搜索栏，增加更多缓冲 */
  bottom: 140rpx; /* 避开底部TabBar，增加更多缓冲 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: calc((100vh - 160rpx - 140rpx) * 0.075) 0; /* 上下各留7.5%，总计15%，内容占85% */

  .index-item {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1; /* 自动平均分配空间 */
    width: 100%;
    min-height: 20rpx; /* 最小高度 */
    max-height: 80rpx; /* 最大高度 */
    transition: all 0.2s;

    &:active {
      transform: scale(1.1);
    }

    .index-letter {
      font-size: clamp(14rpx, 3vh, 32rpx); /* 动态字体大小：最小14rpx，最大32rpx，随视口高度调整 */
      color: $medical-blue;
      font-weight: 600;
      transition: all 0.2s;
    }
  }
}

// 字母指示器（中央大字母显示）
.letter-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200rpx;
  height: 200rpx;
  background: rgba(14, 165, 233, 0.95);
  backdrop-filter: blur(20rpx);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 40rpx rgba(14, 165, 233, 0.4);
  z-index: 9999;
  animation: indicatorPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);

  .indicator-letter {
    font-size: 120rpx;
    font-weight: 700;
    color: #fff;
    letter-spacing: 4rpx;
  }
}

@keyframes indicatorPop {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}
</style>
