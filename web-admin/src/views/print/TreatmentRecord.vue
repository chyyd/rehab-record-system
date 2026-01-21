<template>
  <div class="print-container">
    <!-- 打印按钮 -->
    <div class="no-print">
      <div class="action-bar">
        <div class="action-buttons">
          <button class="action-button primary" @click="handlePrint">
            <svg xmlns="http://www.w3.org/2000/svg" class="button-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>打印</span>
          </button>
          <button class="action-button secondary" @click="handleClose">
            <svg xmlns="http://www.w3.org/2000/svg" class="button-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>关闭</span>
          </button>
        </div>
        <div class="status-messages">
          <div v-if="loading" class="status-message info">
            <svg xmlns="http://www.w3.org/2000/svg" class="status-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>正在加载治疗记录数据...</span>
          </div>
          <div v-if="error" class="status-message error">
            <svg xmlns="http://www.w3.org/2000/svg" class="status-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ error }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 打印内容 -->
    <div v-if="!loading && !error" class="print-content" id="print-area">
      <!-- 合规水印 -->
      <div class="compliance-stamp">虎林中医</div>

      <!-- 页眉 -->
      <div class="header">
        <div class="hospital-name">虎林市中医医院</div>
        <div class="department">康复医学科</div>
        <div class="document-title">康复治疗全程记录单</div>
        <div class="header-info">
          <div><strong>病历号：</strong> {{ patientInfo.medicalRecordNo }}</div>
          <div><strong>打印日期：</strong> {{ printDate }}</div>
        </div>
      </div>

      <!-- 患者基本信息 -->
      <div class="patient-card">
        <div class="patient-title">患者基本信息</div>
        <table class="patient-info-table">
          <tr>
            <td><span class="info-label">姓　　名：</span><span class="info-value">{{ patientInfo.name }}</span></td>
            <td><span class="info-label">性　　别：</span><span class="info-value">{{ patientInfo.gender }}</span></td>
            <td><span class="info-label">年　　龄：</span><span class="info-value">{{ patientInfo.age }}岁</span></td>
          </tr>
          <tr>
            <td><span class="info-label">医保类型：</span><span class="info-value">{{ patientInfo.insuranceType }}</span></td>
            <td><span class="info-label">入院日期：</span><span class="info-value">{{ formatDate(patientInfo.admissionDate) }}</span></td>
            <td><span class="info-label">出院日期：</span><span class="info-value">{{ formatDate(patientInfo.dischargeDate) }}</span></td>
          </tr>
          <tr>
            <td><span class="info-label">住院天数：</span><span class="info-value">{{ hospitalDays }}天</span></td>
            <td><span class="info-label">主管医师：</span><span class="info-value">{{ patientInfo.doctor }}</span></td>
            <td></td>
          </tr>
        </table>
        <!-- 主要诊断单独成行 -->
        <div class="diagnosis-row">
          <span class="diagnosis-label">主要诊断：</span>
          <span class="diagnosis-value">{{ patientInfo.diagnosis }}</span>
        </div>
      </div>

      <!-- 评估记录 - 只在有评估数据且患者需要评估时显示 -->
      <div class="assessment-section" v-if="(admissionAssessment || dischargeAssessment) && patientInfo.needsAssessment !== false">
        <div class="section-title">康复评估记录（入院/出院）</div>
        <div class="assessment-grid">
          <!-- 入院评估 -->
          <div class="assessment-card" v-if="admissionAssessment">
            <div class="assessment-header">
              <div class="assessment-type">入院评估</div>
              <div class="assessment-date">{{ formatDateTime(admissionAssessment.assessmentDate) }}</div>
            </div>
            <div class="assessment-content">
              <p><strong>功能状态：</strong></p>
              <div class="functional-score" v-if="admissionAssessment.barthelIndex">Barthel指数：{{ admissionAssessment.barthelIndex }}分</div>
              <div class="functional-score" v-if="admissionAssessment.brunnstromStage">Brunnstrom分期：{{ formatBrunnstrom(admissionAssessment.brunnstromStage) }}</div>
              <div class="functional-score" v-if="admissionAssessment.balanceFunction">平衡功能：{{ formatBalance(admissionAssessment.balanceFunction) }}</div>
              <div class="functional-score" v-if="admissionAssessment.muscleStrength">肌力评定：{{ formatMuscleStrength(admissionAssessment.muscleStrength) }}</div>
              <div class="functional-score" v-if="admissionAssessment.cognitiveMMSE">认知功能：MMSE评分{{ admissionAssessment.cognitiveMMSE }}分</div>
              <div class="functional-score" v-if="admissionAssessment.swallowingTest">吞咽功能：洼田饮水试验{{ admissionAssessment.swallowingTest }}级</div>
              <div class="functional-score" v-if="admissionAssessment.languageScore">语言功能：失语症评定{{ admissionAssessment.languageScore }}分</div>
              <p v-if="admissionAssessment.otherNotes"><strong>其他备注：</strong>{{ admissionAssessment.otherNotes }}</p>
              <p v-if="admissionAssessment.rehabGoal"><strong>康复目标：</strong>{{ admissionAssessment.rehabGoal }}</p>
            </div>
          </div>

          <!-- 出院评估 -->
          <div class="assessment-card" v-if="dischargeAssessment">
            <div class="assessment-header">
              <div class="assessment-type">出院评估</div>
              <div class="assessment-date">{{ formatDateTime(dischargeAssessment.assessmentDate) }}</div>
            </div>
            <div class="assessment-content">
              <p><strong>功能状态：</strong></p>
              <div class="functional-score" v-if="dischargeAssessment.barthelIndex">Barthel指数：{{ dischargeAssessment.barthelIndex }}分</div>
              <div class="functional-score" v-if="dischargeAssessment.brunnstromStage">Brunnstrom分期：{{ formatBrunnstrom(dischargeAssessment.brunnstromStage) }}</div>
              <div class="functional-score" v-if="dischargeAssessment.balanceFunction">平衡功能：{{ formatBalance(dischargeAssessment.balanceFunction) }}</div>
              <div class="functional-score" v-if="dischargeAssessment.muscleStrength">肌力评定：{{ formatMuscleStrength(dischargeAssessment.muscleStrength) }}</div>
              <div class="functional-score" v-if="dischargeAssessment.cognitiveMMSE">认知功能：MMSE评分{{ dischargeAssessment.cognitiveMMSE }}分</div>
              <div class="functional-score" v-if="dischargeAssessment.swallowingTest">吞咽功能：洼田饮水试验{{ dischargeAssessment.swallowingTest }}级</div>
              <div class="functional-score" v-if="dischargeAssessment.languageScore">语言功能：失语症评定{{ dischargeAssessment.languageScore }}分</div>
              <p v-if="dischargeAssessment.otherNotes"><strong>其他备注：</strong>{{ dischargeAssessment.otherNotes }}</p>
              <p v-if="dischargeAssessment.rehabEffect"><strong>康复效果：</strong>{{ dischargeAssessment.rehabEffect }}</p>
              <p v-if="dischargeAssessment.homeGuidance"><strong>家庭指导：</strong>{{ dischargeAssessment.homeGuidance }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 治疗记录表格 -->
      <div class="treatment-section">
        <div class="section-title-treatment">治疗记录明细</div>
        <div class="treatment-table-container">
          <table class="treatment-table">
            <thead>
              <tr>
                <th width="10%">日期</th>
                <th width="18%">治疗项目</th>
                <th width="12%">治疗操作</th>
                <th width="18%">治疗时间</th>
                <th width="10%">治疗时长</th>
                <th width="12%">患者签名</th>
                <th width="20%">备注</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(record, index) in recordsWithRandomTime" :key="record.id">
                <td>{{ formatDateOnly(record.treatmentDate) }}</td>
                <td><span class="treatment-type">{{ record.project?.name }}</span></td>
                <td>{{ record.therapist?.name }}</td>
                <td class="treatment-time-cell">
                  <span class="treatment-date">{{ formatDateOnly(record.treatmentDate) }}</span>
                  <span class="time-range">
                    <span class="start-time">{{ formatTime(record.startTime) }}</span>-<span class="end-time">{{ record.endTimeWithRandom }}</span>
                  </span>
                </td>
                <td>
                  <span class="time-badge">{{ record.durationMinutes }}分钟</span>
                </td>
                <td>
                  <img
                    v-if="record.photoFileName"
                    :src="getSignatureUrl(record.photoFileName)"
                    class="signature-img"
                    alt="签名"
                  />
                  <span v-else class="no-signature">无签名</span>
                </td>
                <td>{{ record.outcome || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 治疗统计 -->
      <div class="statistics-section">
        <div class="statistics-title">治疗统计汇总</div>
        <table class="statistics-table">
          <thead>
            <tr>
              <th v-for="(stat, key) in statistics" :key="key" width="20%">{{ key }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td v-for="(stat, key) in statistics" :key="key">{{ stat }}次</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 签名区域 -->
      <div class="signature-section">
        <div class="signature-title">责任签名确认</div>
        <div class="signature-grid">
          <div class="signature-item">
            <div class="signature-line"></div>
            <div class="signature-name">{{ patientInfo.name }}</div>
            <div class="signature-role">患者/家属</div>
            <div class="signature-date">{{ formatDateOnly(patientInfo.dischargeDate) }}</div>
          </div>
          <div class="signature-item">
            <div class="signature-line"></div>
            <div class="signature-name">{{ patientInfo.doctor }}</div>
            <div class="signature-role">住院医师</div>
            <div class="signature-date">{{ formatDateOnly(patientInfo.dischargeDate) }}</div>
          </div>
          <div class="signature-item">
            <div class="signature-line"></div>
            <div class="signature-name">{{ therapistSignatureText }}</div>
            <div class="signature-role">治疗操作者</div>
            <div class="signature-date">{{ formatDateOnly(patientInfo.dischargeDate) }}</div>
          </div>
        </div>
      </div>

      <!-- 页脚 -->
      <div class="footer">
        <p>虎林市中医医院康复医学科制 | 地址：黑龙江省虎林市建设西街488号 | 电话：0467-5848260</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import dayjs from 'dayjs'

const route = useRoute()
const patientId = ref<number>(parseInt(route.query.patientId as string))

const loading = ref(true)
const error = ref('')
const patientInfo = ref<any>({})
const treatmentRecords = ref<any[]>([])
const admissionAssessment = ref<any>(null)
const dischargeAssessment = ref<any>(null)

// 打印日期
const printDate = computed(() => {
  return dayjs().format('YYYY年MM月DD日')
})

// 住院天数
const hospitalDays = computed(() => {
  if (!patientInfo.value.admissionDate || !patientInfo.value.dischargeDate) {
    return 0
  }
  const admission = dayjs(patientInfo.value.admissionDate)
  const discharge = dayjs(patientInfo.value.dischargeDate)
  return discharge.diff(admission, 'day') + 1
})

// 治疗统计
const statistics = computed(() => {
  const stats: any = {}
  treatmentRecords.value.forEach((record: any) => {
    const projectName = record.project?.name || '其他'
    stats[projectName] = (stats[projectName] || 0) + 1
  })
  return stats
})

// 为每条记录计算随机结束时间和时长（用于打印显示）
const recordsWithRandomTime = computed(() => {
  return treatmentRecords.value.map((record: any) => {
    const baseEndTime = dayjs(record.endTime)
    const randomSeconds = Math.floor(Math.random() * 141) + 10 // 10-150秒
    const endTimeWithRandom = baseEndTime.add(randomSeconds, 'second')

    const durationMinutes = Math.round(
      endTimeWithRandom.diff(dayjs(record.startTime)) / 60000
    )

    return {
      ...record,
      endTimeWithRandom: endTimeWithRandom.format('HH:mm:ss'),
      durationMinutes
    }
  })
})

// 所有治疗师列表（去重）
const allTherapists = computed(() => {
  const therapistMap = new Map<number, any>()
  treatmentRecords.value.forEach((record: any) => {
    if (record.therapist && !therapistMap.has(record.therapist.id)) {
      therapistMap.set(record.therapist.id, record.therapist)
    }
  })
  return Array.from(therapistMap.values())
})

// 治疗师签名显示文本
const therapistSignatureText = computed(() => {
  return allTherapists.value.map(t => t.name).join(' / ')
})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = ''

  try {
    // 获取患者信息
    patientInfo.value = await request.get(`/patients/${patientId.value}`)

    // 获取治疗记录
    const records = await request.get(`/records?patientId=${patientId.value}`)

    // 扩展记录信息
    treatmentRecords.value = await Promise.all(
      records.map(async (record: any) => {
        const project = await request.get(`/projects/${record.projectId}`)
        const therapist = await request.get(`/users/${record.therapistId}`)
        return {
          ...record,
          project,
          therapist
        }
      })
    )

    // 排序：按治疗时间排序
    treatmentRecords.value.sort((a: any, b: any) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    })

    // 获取入院评估
    try {
      admissionAssessment.value = await request.get(`/assessments/patient/${patientId.value}/admission`)
    } catch (e) {
      // 没有入院评估，忽略
    }

    // 获取出院评估
    try {
      dischargeAssessment.value = await request.get(`/assessments/patient/${patientId.value}/discharge`)
    } catch (e) {
      // 没有出院评估，忽略
    }

  } catch (err: any) {
    console.error('加载数据失败:', err)
    error.value = err.message || '加载数据失败'
  } finally {
    loading.value = false
  }
}

function formatDate(date: string): string {
  return dayjs(date).format('YYYY年MM月DD日')
}

function formatDateTime(date: string): string {
  return dayjs(date).format('YYYY年MM月DD日 HH:mm')
}

function formatDateOnly(date: string): string {
  return dayjs(date).format('YYYY-MM-DD')
}

function formatTime(date: string): string {
  return dayjs(date).format('HH:mm:ss')
}

function getSignatureUrl(filename: string): string {
  return `/api/uploads/photos/${filename}`
}

// 格式化Brunnstrom分期
function formatBrunnstrom(data: any): string {
  if (!data) return ''
  const obj = typeof data === 'string' ? JSON.parse(data) : data
  const parts: string[] = []
  if (obj.upper) parts.push(`上肢${obj.upper}`)
  if (obj.hand) parts.push(`手${obj.hand}`)
  if (obj.lower) parts.push(`下肢${obj.lower}`)
  return parts.join('，')
}

// 格式化平衡功能
function formatBalance(data: any): string {
  if (!data) return ''
  const obj = typeof data === 'string' ? JSON.parse(data) : data
  const parts: string[] = []
  if (obj.sitting) parts.push(`坐位平衡${obj.sitting}`)
  if (obj.standing) parts.push(`立位平衡${obj.standing}`)
  return parts.join('，')
}

// 格式化肌力评定
function formatMuscleStrength(data: any): string {
  if (!data) return ''
  const obj = typeof data === 'string' ? JSON.parse(data) : data
  const parts: string[] = []
  if (obj.leftUpper) parts.push(`左上肢${obj.leftUpper}`)
  if (obj.leftLower) parts.push(`左下肢${obj.leftLower}`)
  if (obj.rightUpper) parts.push(`右上肢${obj.rightUpper}`)
  if (obj.rightLower) parts.push(`右下肢${obj.rightLower}`)
  return parts.join('，')
}

function handlePrint() {
  window.print()
}

function handleClose() {
  window.close()
}
</script>

<style lang="scss" scoped>
/* 打印按钮区域 */
.no-print {
  padding: 20px;
  background: #304156;
}

.action-bar {
  max-width: 210mm;
  margin: 0 auto;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-left: auto;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
}

.action-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-button.primary {
  background: white;
  color: #4b5563;
}

.action-button.primary:hover {
  background: #f9fafb;
  color: #1f2937;
}

.action-button.secondary {
  background: white;
  color: #4b5563;
}

.action-button.secondary:hover {
  background: #f9fafb;
  color: #1f2937;
}

.button-icon {
  width: 20px;
  height: 20px;
}

.status-messages {
  display: none;
}

/* 打印容器 - 参考模板样式 */
.print-container {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 20px;
}

.print-content {
  max-width: 210mm;
  margin: 0 auto;
  background: white;
  padding: 12px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

/* A4纸打印优化 */
@page {
  size: A4;
  margin: 15mm;
}

@media print {
  body {
    margin: 0;
    padding: 0;
    background: white !important;
  }
  .no-print {
    display: none !important;
  }
  .print-container {
    background: white !important;
    padding: 0 !important;
  }
  .print-content {
    max-width: 210mm;
    margin: 0 auto;
    padding: 12px;
    box-shadow: none;
  }
  * {
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
    color: black !important;
    background: white !important;
  }
  .compliance-stamp {
    opacity: 0.1 !important;
  }
}

/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "SimSun", "宋体", serif;
  font-size: 13px;
  line-height: 1.4;
}

/* 页眉 */
.header {
  text-align: center;
  margin-bottom: 12px;
  border-bottom: 1px solid black;
  padding-bottom: 8px;
}

.hospital-name {
  font-size: 16px;
  font-weight: bold;
  margin: 3px 0;
}

.department {
  font-size: 14px;
  font-weight: bold;
  margin: 3px 0;
}

.document-title {
  font-size: 14px;
  font-weight: bold;
  margin: 6px 0;
  text-decoration: underline;
}

.header-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-top: 6px;
}

/* 患者信息 */
.patient-card {
  padding: 8px 0;
  margin-bottom: 12px;
  font-size: 12px;
}

.patient-title {
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 6px;
  text-decoration: underline;
}

.patient-info-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.patient-info-table td {
  padding: 2px 4px;
  vertical-align: middle;
  border-bottom: 1px dotted #ccc;
  white-space: nowrap;
}

.info-label {
  display: inline-block;
  width: 70px;
  font-weight: bold;
  text-align: right;
  padding-right: 8px;
  white-space: nowrap;
}

.info-value {
  display: inline-block;
  font-weight: normal;
  white-space: nowrap;
}

.diagnosis-row {
  width: 100%;
  padding: 2px 4px;
  border-bottom: 1px dotted #ccc;
}

.diagnosis-label {
  display: inline-block;
  width: 70px;
  font-weight: bold;
  text-align: right;
  padding-right: 8px;
  white-space: nowrap;
  vertical-align: middle;
}

.diagnosis-value {
  display: inline-block;
  font-weight: normal;
  white-space: nowrap;
  vertical-align: middle;
}

/* 评估记录 */
.assessment-section {
  padding: 10px 0;
  margin-bottom: 12px;
}

.section-title {
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 8px;
  text-decoration: underline;
}

.assessment-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  font-size: 12px;
}

.assessment-card {
  border: 1px solid #000;
  padding: 8px;
}

.assessment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-weight: bold;
}

.assessment-type {
  font-size: 13px;
}

.assessment-date {
  font-size: 12px;
}

.assessment-content {
  margin-top: 6px;
}

.functional-score {
  background: #f0f0f0;
  padding: 2px 6px;
  margin: 2px 0;
  font-size: 12px;
}

/* 治疗记录表格 */
.treatment-section {
  padding: 10px 0;
  margin-bottom: 12px;
}

.section-title-treatment {
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 8px;
  text-decoration: underline;
}

.treatment-table-container {
  width: 100%;
  overflow: hidden;
}

.treatment-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 11px;
}

.treatment-table th {
  font-weight: bold;
  padding: 4px 2px;
  text-align: center;
  border: 1px solid #000;
  background: #f0f0f0;
}

.treatment-table td {
  padding: 4px 2px;
  border: 1px solid #000;
  vertical-align: middle;
  text-align: center;
  word-wrap: break-word;
}

.treatment-table tr:nth-child(even) {
  background: #f9f9f9;
}

.treatment-type {
  font-weight: bold;
}

.time-badge {
  font-weight: bold;
}

/* 签名图片样式 */
.signature-img {
  max-width: 100%;
  max-height: 40px;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

.no-signature {
  color: #999;
  font-size: 11px;
}

/* 治疗时间单元格 */
.treatment-time-cell {
  text-align: center;
  line-height: 1.2;
  padding: 3px 2px;
}

.treatment-date {
  font-weight: bold;
  display: block;
  margin-bottom: 1px;
  font-size: 11px;
}

.time-range {
  display: block;
  font-size: 11px;
}

.start-time, .end-time {
  font-weight: bold;
}

/* 治疗统计 */
.statistics-section {
  padding: 10px 0;
  margin-bottom: 12px;
  font-size: 12px;
}

.statistics-title {
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 8px;
  text-decoration: underline;
}

.statistics-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.statistics-table th,
.statistics-table td {
  border: 1px solid #000;
  padding: 4px;
  text-align: center;
}

.statistics-table th {
  background: #f0f0f0;
  font-weight: bold;
}

/* 签名区域 */
.signature-section {
  padding: 15px 0 10px 0;
  text-align: center;
  margin-bottom: 10px;
}

.signature-title {
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 12px;
  text-decoration: underline;
}

.signature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.signature-item {
  text-align: center;
}

.signature-line {
  border-top: 1px solid #000;
  width: 80%;
  margin: 12px auto;
  padding-top: 2px;
}

.signature-name {
  font-weight: bold;
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.3;
  word-wrap: break-word;
  hyphens: auto;
}

.signature-role {
  font-size: 11px;
  margin-top: 1px;
}

.signature-date {
  font-size: 11px;
  margin-top: 1px;
}

/* 页脚 */
.footer {
  text-align: center;
  margin-top: 10px;
  padding-top: 6px;
  border-top: 1px solid #000;
  font-size: 11px;
  line-height: 1.3;
}

.compliance-stamp {
  position: absolute;
  top: 30mm;
  right: 30mm;
  opacity: 0.03;
  font-size: 50px;
  font-weight: bold;
  transform: rotate(15deg);
  z-index: -1;
}
</style>
