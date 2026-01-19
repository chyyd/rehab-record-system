<template>
  <view class="create-record-container">
    <!-- 患者信息 -->
    <view class="patient-card" v-if="patientInfo">
      <view class="patient-avatar">
        <text class="avatar-text">{{ patientInfo.name?.substring(0, 1) }}</text>
      </view>
      <view class="patient-detail">
        <text class="patient-name">{{ patientInfo.name }}</text>
        <text class="patient-no">{{ patientInfo.medicalRecordNo }}</text>
      </view>
    </view>

    <!-- 🔥 最近使用（快捷方式） -->
    <view class="section" v-if="recentProjects.length > 0">
      <view class="section-title">
        <text class="title-icon">⚡</text>
        <text>最近使用</text>
      </view>

      <view class="recent-projects-grid">
        <view
          class="recent-project-card"
          :class="{ active: selectedProject?.id === project.projectId }"
          v-for="project in recentProjects"
          :key="project.projectId"
          @click="quickSelectAndStart(project)"
        >
          <view class="recent-project-icon">
            <text class="icon-fire">⚡</text>
          </view>
          <view class="recent-project-info">
            <text class="recent-project-name">{{ project.projectName }}</text>
            <text class="recent-project-count">已使用 {{ project.count }} 次</text>
          </view>
        </view>
      </view>

      <view class="expand-all-btn" @click="toggleProjectsView">
        <text class="expand-text">{{ showAllProjects ? '▼ 收起全部项目' : '📋 展开全部项目' }}</text>
      </view>
    </view>

    <!-- 治疗项目选择 -->
    <view class="section" v-show="showAllProjects || recentProjects.length === 0">
      <view class="section-title">
        <text class="required">*</text>
        <text>选择治疗项目</text>
      </view>

      <scroll-view scroll-x class="project-scroll" v-if="projects.length > 0">
        <view
          class="project-item"
          :class="{ active: selectedProject?.id === project.id }"
          v-for="project in projects"
          :key="project.id"
          @click="selectAndStartTreatment(project)"
        >
          <text class="project-name">{{ project.name }}</text>
          <text class="project-duration">{{ project.defaultDuration }}分钟</text>
        </view>
      </scroll-view>

      <view class="empty-projects" v-else>
        <text>暂无可操作项目</text>
      </view>
    </view>

    <!-- 签名弹窗 -->
    <SignaturePad
      :visible="showSignature"
      @confirm="handleSignatureConfirm"
      @close="handleSignatureClose"
    />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { request } from '@/utils/request'
import SignaturePad from '@/components/SignaturePad.vue'

const userStore = useUserStore()
const token = userStore.getToken()

const patientId = ref<number>(0)
const patientInfo = ref<any>(null)

const projects = ref<any[]>([])
const selectedProject = ref<any>(null)
const recentProjects = ref<any[]>([])
const showAllProjects = ref(false)
const recentProjectCache = ref<any>(null)

const saved = ref(false)
const saving = ref(false)
const showSignature = ref(false)
const signatureImage = ref('')

// 🆕 记录页面来源（用于决定返回逻辑）
const fromPage = ref('')

onLoad(async (options: any) => {
  console.log('📱 治疗记录页面 onLoad, options:', options)

  // 🆕 保存页面来源
  if (options.from) {
    fromPage.value = options.from
    console.log('📌 页面来源:', fromPage.value)
  }

  if (options.patientId) {
    patientId.value = parseInt(options.patientId)
    console.log('✅ 接收到患者ID:', patientId.value)
    loadPatientInfo()
  } else if (options.medicalNo) {
    // 🆕 支持扫码传入病历号
    console.log('✅ 接收到病历号:', options.medicalNo)
    await loadPatientByMedicalNo(options.medicalNo)
  } else {
    console.log('❌ 未接收到patientId或medicalNo参数')
  }

  // 🔄 先加载当前用户可操作的项目，再加载最近使用（需要筛选）
  await loadProjects()
  loadRecentProjects()
})

async function loadPatientInfo() {
  try {
    console.log('🔄 开始加载患者信息，ID:', patientId.value)
    const response = await request({
      url: `/patients/${patientId.value}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.statusCode === 200) {
      patientInfo.value = response.data
      console.log('✅ 患者信息加载成功:', patientInfo.value)
    } else {
      console.error('❌ 患者信息加载失败，状态码:', response.statusCode)
    }
  } catch (error) {
    console.error('❌ 加载患者信息异常:', error)
  }
}

/**
 * 根据病历号加载患者信息(用于扫码功能)
 */
async function loadPatientByMedicalNo(medicalNo: string) {
  try {
    uni.showLoading({ title: '加载中...' })

    const response = await request({
      url: `/patients/by-medical-no/${medicalNo}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.statusCode === 200) {
      const patient = response.data
      patientId.value = patient.id
      patientInfo.value = patient

      uni.hideLoading()
      uni.showToast({
        title: '患者信息已加载',
        icon: 'success'
      })
      console.log('✅ 通过病历号加载患者信息成功:', patient)
    } else {
      throw new Error(response.data?.message || '加载失败')
    }
  } catch (error: any) {
    uni.hideLoading()
    console.error('❌ 通过病历号加载患者信息失败:', error)

    // 显示友好的错误提示
    const errorMsg = error.data?.message || error.message || '加载患者信息失败'
    uni.showToast({
      title: errorMsg,
      icon: 'none',
      duration: 3000
    })

    // 延迟返回上一页
    setTimeout(() => {
      uni.navigateBack()
    }, 2000)
  }
}

async function loadProjects() {
  try {
    const response = await request({
      url: '/projects/my',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.statusCode === 200) {
      projects.value = response.data
    }
  } catch (error) {
    console.error('加载项目失败:', error)
  }
}

async function loadRecentProjects() {
  // 如果没有患者ID，不加载快捷项目
  if (!patientId.value) {
    recentProjects.value = []
    return
  }

  console.log('加载患者最近使用的项目，患者ID:', patientId.value)

  try {
    // 计算最近7天的日期范围
    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)

    const startDate = sevenDaysAgo.toISOString().split('T')[0] // YYYY-MM-DD
    const endDate = today.toISOString().split('T')[0]

    console.log('查询日期范围:', startDate, '至', endDate)

    // 获取该患者最近7天的治疗记录
    const response = await request({
      url: `/records?patientId=${patientId.value}&startDate=${startDate}&endDate=${endDate}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    console.log('📊 API响应状态码:', response.statusCode)
    console.log('📊 响应数据:', response.data)
    console.log('📊 数据类型:', typeof response.data)
    console.log('📊 是否为数组:', Array.isArray(response.data))
    console.log('📊 数据长度:', response.data?.length)

    if (response.statusCode === 200 && response.data && response.data.length > 0) {
      console.log('✅ 进入统计逻辑，患者最近7天治疗记录:', response.data.length)
      console.log('📋 原始记录数据:', response.data)

      // 统计每个项目的使用次数
      const projectStats = new Map<number, { count: number; name: string; code: string }>()

      response.data.forEach((record: any) => {
        console.log('处理记录:', record)
        const projectId = record.project?.id
        console.log('  - 项目ID:', projectId, '项目名称:', record.project?.name)
        if (projectId) {
          const existing = projectStats.get(projectId)
          if (existing) {
            existing.count++
            console.log('  - 增加计数，当前次数:', existing.count)
          } else {
            projectStats.set(projectId, {
              count: 1,
              name: record.project?.name || '未知项目',
              code: record.project?.code || ''
            })
            console.log('  - 首次添加到统计')
          }
        }
      })

      console.log('📈 统计结果 Map 大小:', projectStats.size)
      console.log('📈 统计结果 Map 内容:', Array.from(projectStats.entries()))

      // 转换为数组并按使用次数排序
      let sortedProjects = Array.from(projectStats.entries())
        .map(([projectId, data]) => ({
          projectId,
          projectName: data.name,
          count: data.count
        }))
        .sort((a, b) => b.count - a.count)

      console.log('📊 排序后的项目列表（筛选前）:', sortedProjects.length, '个')

      // 🔑 关键步骤：筛选出当前用户可操作的项目
      if (projects.value && projects.value.length > 0) {
        const userProjectIds = new Set(projects.value.map((p) => p.id))
        console.log('👤 当前用户可操作项目ID列表:', Array.from(userProjectIds))

        const beforeFilter = sortedProjects.length
        sortedProjects = sortedProjects.filter((p) => userProjectIds.has(p.projectId))
        console.log('🔒 筛选后项目数:', sortedProjects.length, '个（过滤了', beforeFilter - sortedProjects.length, '个）')
      } else {
        console.log('⚠️ 用户可操作项目列表为空，跳过筛选')
      }

      // 只取前6个
      sortedProjects = sortedProjects.slice(0, 6)

      recentProjects.value = sortedProjects
      console.log('✅ 患者常用项目统计（最终结果）:', sortedProjects)
    } else {
      recentProjects.value = []
      console.log('⚠️ 该患者最近7天无治疗记录或数据为空')
      console.log('  - statusCode:', response.statusCode)
      console.log('  - data存在:', !!response.data)
      console.log('  - data.length:', response.data?.length)
    }
  } catch (error) {
    console.error('加载患者最近项目失败:', error)
    recentProjects.value = []
  }
}

function toggleProjectsView() {
  showAllProjects.value = !showAllProjects.value
  if (showAllProjects.value && projects.value.length === 0) {
    loadProjects()
  }
}

function selectProject(project: any) {
  selectedProject.value = project
}

// 选择项目并直接开始治疗
async function selectAndStartTreatment(project: any) {
  selectedProject.value = project
  await startTreatment()
}

function selectProjectById(projectId: number) {
  const project = projects.value.find((p) => p.id === projectId)
  if (project) {
    selectedProject.value = project
  } else {
    // 如果全部项目列表还没加载，先从快捷项目临时设置
    const recentProject = recentProjects.value.find((p) => p.projectId === projectId)
    if (recentProject) {
      selectedProject.value = {
        id: recentProject.projectId,
        name: recentProject.projectName,
        defaultDuration: 30 // 默认值，后续会从完整项目列表更新
      }
    }
  }
}

// 快捷选择项目并直接开始治疗
async function quickSelectAndStart(project: any) {
  // 先设置选中的项目
  await selectProjectById(project.projectId)

  // 确保从完整项目列表中获取正确的项目信息（包括defaultDuration）
  if (projects.value.length === 0) {
    await loadProjects()
  }

  const fullProject = projects.value.find((p) => p.id === project.projectId)
  if (fullProject) {
    selectedProject.value = fullProject
  }

  // 直接开始治疗（验证时间冲突并显示签名）
  await startTreatment()
}

async function startTreatment() {
  if (!selectedProject.value) {
    uni.showToast({
      title: '请先选择治疗项目',
      icon: 'none'
    })
    return
  }

  // 显示加载提示
  uni.showLoading({
    title: '验证中...'
  })

  try {
    // 验证时间冲突（使用当前时间作为开始时间）
    const startTime = new Date()

    const response = await request({
      url: '/records/validate-time-conflict',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        patientId: patientId.value,
        startTime: startTime.toISOString()
      }
    })

    console.log('⏰ 时间冲突验证响应:', response)
    console.log('  - statusCode:', response.statusCode)
    console.log('  - hasConflict:', response.data?.hasConflict)
    console.log('  - message:', response.data?.message)
    console.log('  - 完整data:', response.data)

    uni.hideLoading()

    // 检查是否有冲突
    if (response.data?.hasConflict) {
      // 有冲突，显示警告弹窗
      uni.showModal({
        title: '时间冲突警告',
        content: response.data.message || '该患者当前时间段已有治疗记录，请选择其他时间',
        showCancel: false,
        confirmText: '我知道了',
        confirmColor: '#ef4444'
      })
      return
    }

    // 无冲突，显示签名弹窗
    showSignature.value = true
  } catch (error: any) {
    console.error('验证时间冲突失败:', error)
    uni.hideLoading()

    // 验证失败也允许继续（避免网络问题阻塞治疗）
    uni.showModal({
      title: '验证失败',
      content: '无法验证时间冲突，是否继续治疗记录？',
      confirmText: '继续',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          showSignature.value = true
        }
      }
    })
  }
}

// 签名确认
async function handleSignatureConfirm(imageData: string) {
  signatureImage.value = imageData
  showSignature.value = false

  saving.value = true
  uni.showLoading({
    title: '保存中...'
  })

  try {
    // 上传签名图片，传递病历号、时间和项目信息
    const startTime = new Date()
    const uploadResponse = await uploadSignature(
      imageData,
      patientInfo.value.medicalRecordNo,
      startTime.toISOString(),
      selectedProject.value.name
    )

    if (!uploadResponse || !uploadResponse.filename) {
      throw new Error('签名上传失败')
    }

    // 创建治疗记录
    const response = await request({
      url: '/records',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        patientId: patientId.value,
        projectId: selectedProject.value.id,
        treatmentDate: startTime.toISOString(),
        startTime: startTime.toISOString(),
        outcome: '无不良反应',
        notes: '',
        photoCount: 1,
        photoFileName: uploadResponse.filename
      }
    })

    if (response.statusCode === 201) {
      saved.value = true
      uni.hideLoading()

      uni.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 1500
      })

      setTimeout(() => {
        // 🆕 根据来源决定跳转逻辑
        if (fromPage.value === 'scan') {
          // 从扫码页面来的，跳转到患者列表
          console.log('🔄 从扫码页面来，跳转到患者列表')
          uni.redirectTo({
            url: '/pages/patients/list'
          })
        } else {
          // 从其他页面来的，返回上一页
          console.log('🔄 返回上一页')
          uni.navigateBack()
        }
      }, 1500)
    } else {
      throw new Error(response.data?.message || '保存失败')
    }
  } catch (error: any) {
    console.error('保存记录失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: error.message || '保存失败',
      icon: 'none',
      duration: 2000
    })
    saving.value = false
  }
}

// 签名弹窗关闭
function handleSignatureClose() {
  showSignature.value = false
}

// 上传签名图片到服务器
async function uploadSignature(
  base64Data: string,
  medicalRecordNo: string,
  treatmentTime: string,
  projectName: string
): Promise<any> {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  const token = userStore.getToken()

  // 将base64转换为Blob
  const base64String = base64Data.split(',')[1] // 移除 data:image/png;base64, 前缀
  const byteCharacters = atob(base64String)
  const byteArrays = []

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512)
    const byteNumbers = new Array(slice.length)

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    byteArrays.push(byteArray)
  }

  const blob = new Blob(byteArrays, { type: 'image/png' })

  // 创建FormData
  const formData = new FormData()
  formData.append('photo', blob, 'signature.png')
  formData.append('isSignature', 'true') // 标记为签名图片
  formData.append('medicalRecordNo', medicalRecordNo) // 病历号
  formData.append('treatmentTime', treatmentTime) // 治疗时间
  formData.append('projectName', projectName) // 项目名称

  try {
    const response = await fetch(`${API_BASE}/photos/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })

    if (response.status === 201) {
      const data = await response.json()
      return data
    } else {
      throw new Error('上传失败')
    }
  } catch (error) {
    console.error('上传签名失败:', error)
    throw error
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

.create-record-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f9ff 0%, $bg-page 100%);
  padding: 24rpx;
  padding-bottom: 180rpx;
}

.patient-card {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, $medical-blue 0%, $medical-cyan 100%);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(14, 165, 233, 0.15);

  .patient-avatar {
    width: 110rpx;
    height: 110rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(10rpx);
    border: 3rpx solid rgba(255, 255, 255, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;

    .avatar-text {
      font-size: 44rpx;
      color: #fff;
      font-weight: 600;
    }
  }

  .patient-detail {
    display: flex;
    flex-direction: column;

    .patient-name {
      font-size: 36rpx;
      font-weight: 600;
      color: #fff;
      margin-bottom: 8rpx;
    }

    .patient-no {
      font-size: 26rpx;
      color: rgba(255, 255, 255, 0.85);
      background: rgba(255, 255, 255, 0.2);
      padding: 6rpx 16rpx;
      border-radius: 20rpx;
      align-self: flex-start;
    }
  }
}

.section {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);

  .section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 24rpx;
    position: relative;
    padding-left: 20rpx;
    display: flex;
    align-items: center;
    gap: 8rpx;

    .title-icon {
      font-size: 28rpx;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.8;
        transform: scale(1.1);
      }
    }

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

    .required {
      color: #ef4444;
      margin-right: 5rpx;
    }
  }
}

.project-scroll {
  white-space: nowrap;

  .project-item {
    display: inline-block;
    padding: 20rpx 28rpx;
    background-color: #f8fafc;
    border-radius: 16rpx;
    margin-right: 16rpx;
    border: 2rpx solid transparent;
    transition: all 0.2s;

    &.active {
      background: linear-gradient(135deg, $medical-blue 0%, $primary-dark 100%);
      border-color: $medical-blue;
      box-shadow: 0 4rpx 12rpx rgba(14, 165, 233, 0.3);

      .project-name,
      .project-duration {
        color: #fff;
      }
    }

    .project-name {
      font-size: 28rpx;
      color: #1e293b;
      display: block;
      margin-bottom: 8rpx;
      font-weight: 500;
    }

    .project-duration {
      font-size: 24rpx;
      color: #64748b;
    }
  }
}

.time-display {
  display: flex;
  justify-content: space-between;
  background: linear-gradient(135deg, $sky-light 0%, rgba(224, 242, 254, 0.5) 100%);
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;

  .time-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    .time-label {
      font-size: 24rpx;
      color: #64748b;
      margin-bottom: 10rpx;
    }

    .time-value {
      font-size: 34rpx;
      font-weight: 600;
      color: $medical-blue;
    }
  }
}

.time-actions {
  .time-btn {
    width: 100%;
    height: 88rpx;
    border-radius: 20rpx;
    font-size: 32rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;

    &.primary {
      background: linear-gradient(135deg, $medical-blue 0%, $primary-dark 100%);
      color: #fff;
      box-shadow: 0 6rpx 20rpx rgba(14, 165, 233, 0.3);
    }

    &.danger {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: #fff;
      box-shadow: 0 6rpx 20rpx rgba(239, 68, 68, 0.3);
    }
  }

  &.recording {
    .recording-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      padding: 24rpx;
      border-radius: 20rpx;
      margin-bottom: 20rpx;
      border-left: 4rpx solid #f59e0b;

      .recording-text {
        font-size: 28rpx;
        color: #92400e;
        font-weight: 500;
      }

      .recording-duration {
        font-size: 30rpx;
        font-weight: 600;
        color: #dc2626;
      }
    }
  }
}

.outcome-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;

  .outcome-item {
    padding: 16rpx 24rpx;
    background-color: #f8fafc;
    border-radius: 32rpx;
    border: 2rpx solid transparent;
    transition: all 0.2s;

    &.active {
      background: linear-gradient(135deg, $medical-blue 0%, $primary-dark 100%);
      border-color: $medical-blue;
      box-shadow: 0 4rpx 12rpx rgba(14, 165, 233, 0.3);

      .outcome-text {
        color: #fff;
      }
    }

    .outcome-text {
      font-size: 26rpx;
      color: #475569;
      font-weight: 500;
    }
  }
}

.remark-input {
  width: 100%;
  min-height: 160rpx;
  padding: 24rpx;
  background-color: #f8fafc;
  border-radius: 20rpx;
  font-size: 28rpx;
  color: #1e293b;
  border: 2rpx solid #e2e8f0;
  transition: border-color 0.2s;

  &:focus {
    border-color: $medical-blue;
  }
}

/* 快捷项目样式 */
.recent-projects-grid {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.recent-project-card {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: linear-gradient(135deg, $sky-light 0%, rgba(224, 242, 254, 0.7) 100%);
  border-radius: 20rpx;
  border: 3rpx solid rgba(14, 165, 233, 0.15);
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 16rpx rgba(14, 165, 233, 0.18);
  position: relative;
  overflow: hidden;
  cursor: pointer;

  // 添加微妙的渐变光泽效果
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%);
    pointer-events: none;
  }

  &.active {
    background: linear-gradient(135deg, $medical-blue 0%, $medical-cyan 100%);
    border-color: $medical-blue;
    box-shadow: 0 8rpx 24rpx rgba(14, 165, 233, 0.35);
    transform: translateY(-2rpx);

    .recent-project-name,
    .recent-project-count,
    .icon-fire {
      color: #fff;
    }

    .recent-project-icon {
      background: rgba(255, 255, 255, 0.25);
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
    }
  }

  .recent-project-icon {
    width: 88rpx;
    height: 88rpx;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.5) 100%);
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;
    box-shadow: 0 4rpx 12rpx rgba(14, 165, 233, 0.15);
    position: relative;
    z-index: 1;

    .icon-fire {
      font-size: 44rpx;
      filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.1));
    }
  }

  .recent-project-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 1;

    .recent-project-name {
      font-size: 32rpx;
      font-weight: 700;
      color: #0369a1;
      margin-bottom: 8rpx;
      letter-spacing: 0.5rpx;
    }

    .recent-project-count {
      font-size: 24rpx;
      color: #0284c7;
      font-weight: 500;
      background: rgba(2, 132, 199, 0.1);
      padding: 4rpx 12rpx;
      border-radius: 12rpx;
      align-self: flex-start;
    }
  }
}

.expand-all-btn {
  margin-top: 24rpx;
  padding: 24rpx;
  background: linear-gradient(135deg, $sky-light 0%, rgba(224, 242, 254, 0.6) 100%);
  border-radius: 20rpx;
  text-align: center;
  border: 2rpx dashed $medical-blue;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(14, 165, 233, 0.1);
  cursor: pointer;

  &:active {
    opacity: 0.85;
    transform: scale(0.98);
    box-shadow: 0 1rpx 4rpx rgba(14, 165, 233, 0.15);
  }

  .expand-text {
    font-size: 28rpx;
    color: $medical-blue;
    font-weight: 600;
    letter-spacing: 0.5rpx;
  }
}
</style>
