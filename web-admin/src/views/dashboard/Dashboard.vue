<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card-wrapper" @click="navigateTo('/patients')">
          <div class="stat-card">
            <div class="stat-icon" style="background-color: #409eff;">
              <el-icon :size="30"><User /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.patientCount }}</div>
              <div class="stat-label">在院患者</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="stat-card-wrapper" @click="navigateTo('/records')">
          <div class="stat-card">
            <div class="stat-icon" style="background-color: #67c23a;">
              <el-icon :size="30"><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.recordCount }}</div>
              <div class="stat-label">今日记录</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="stat-card-wrapper" @click="navigateTo('/projects')">
          <div class="stat-card">
            <div class="stat-icon" style="background-color: #e6a23c;">
              <el-icon :size="30"><Grid /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.projectCount }}</div>
              <div class="stat-label">治疗项目</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="stat-card-wrapper" @click="navigateTo('/users')">
          <div class="stat-card">
            <div class="stat-icon" style="background-color: #f56c6c;">
              <el-icon :size="30"><UserFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.userCount }}</div>
              <div class="stat-label">系统用户</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>待完成评估</span>
              <el-tag type="warning" size="small">{{ pendingAssessments.length }} 人</el-tag>
            </div>
          </template>

          <el-empty v-if="pendingAssessments.length === 0" description="暂无待完成评估的患者" />
          <div v-else class="pending-assessments">
            <div
              v-for="item in pendingAssessments"
              :key="item.id"
              class="assessment-item"
              @click="goToPatient(item)"
            >
              <div class="assessment-info">
                <div class="patient-name">{{ item.name }}</div>
                <div class="patient-meta">
                  <span class="meta-item">{{ item.medicalRecordNo }}</span>
                  <el-tag :type="item.pendingType === 'admission' ? 'danger' : 'warning'" size="small">
                    {{ item.pendingType === 'admission' ? '缺入院评估' : '缺出院评估' }}
                  </el-tag>
                </div>
              </div>
              <el-icon class="arrow-icon"><ArrowRight /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>近七日出院患者</span>
              <el-tag type="info" size="small">{{ dischargedPatients.length }} 人</el-tag>
            </div>
          </template>

          <el-empty v-if="dischargedPatients.length === 0" description="近七日无出院患者" />
          <div v-else class="discharged-patients">
            <div
              v-for="patient in dischargedPatients"
              :key="patient.id"
              class="discharged-item"
            >
              <div class="patient-info" @click="goToPatient(patient)">
                <div class="patient-name">{{ patient.name }}</div>
                <div class="patient-meta">
                  <span class="meta-item">{{ patient.medicalRecordNo }}</span>
                  <span class="meta-date">{{ formatDate(patient.dischargeDate) }}</span>
                </div>
              </div>
              <el-button
                type="primary"
                size="small"
                @click.stop="handlePrint(patient)"
                class="print-btn"
              >
                打印治疗单
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近记录</span>
            </div>
          </template>

          <el-table :data="recentRecords" stripe>
            <el-table-column prop="patientName" label="患者姓名" />
            <el-table-column prop="projectName" label="治疗项目" />
            <el-table-column prop="therapistName" label="治疗师" />
            <el-table-column prop="treatmentDate" label="治疗时间" width="180" />
            <el-table-column prop="outcome" label="患者反应" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import request from '@/utils/request'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()

const stats = ref({
  patientCount: 0,
  recordCount: 0,
  projectCount: 0,
  userCount: 0
})

const dischargedPatients = ref<any[]>([])
const recentRecords = ref<any[]>([])
const pendingAssessments = ref<any[]>([])
const patientAssessments = ref<Record<number, any>>({})

onMounted(() => {
  loadStats()
  loadRecentRecords()
  loadDischargedPatients()
  loadPendingAssessments()
})

async function loadStats() {
  try {
    // Load patient count
    const patients = await request.get('/patients')
    stats.value.patientCount = patients.filter((p: any) => !p.dischargeDate).length

    // Load project count
    const projects = await request.get('/projects')
    stats.value.projectCount = projects.length

    // Load user count (admin only)
    try {
      const users = await request.get('/users')
      stats.value.userCount = users.length
    } catch (error) {
      stats.value.userCount = 0
    }

    // Load today's records count (从凌晨4点开始统计)
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 4, 0, 0) // 今日凌晨4点
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 4, 0, 0) // 次日凌晨4点

    // 如果当前时间在凌晨4点之前，则使用昨天的4点作为起点
    const startDate = now.getHours() < 4
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 4, 0, 0)
      : startOfToday

    const records = await request.get('/records', {
      params: {
        startDate: startDate.toISOString(),
        endDate: startOfTomorrow.toISOString()
      }
    })
    stats.value.recordCount = records.length
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

async function loadDischargedPatients() {
  try {
    const patients = await request.get('/patients')
    const sevenDaysAgo = dayjs().subtract(7, 'day').startOf('day')

    // Filter patients discharged in the last 7 days
    const discharged = patients
      .filter((p: any) => p.dischargeDate && dayjs(p.dischargeDate).isAfter(sevenDaysAgo))
      .sort((a: any, b: any) => {
        // Sort by discharge date from oldest to newest (从远到近)
        return dayjs(a.dischargeDate).isBefore(dayjs(b.dischargeDate)) ? -1 : 1
      })

    dischargedPatients.value = discharged
  } catch (error) {
    console.error('Failed to load discharged patients:', error)
  }
}

async function loadPendingAssessments() {
  try {
    const patients = await request.get('/patients')
    const pending: any[] = []

    // 加载所有患者的评估状态
    for (const patient of patients) {
      try {
        const admission = await request.get(`/assessments/patient/${patient.id}/admission`)
        const discharge = await request.get(`/assessments/patient/${patient.id}/discharge`)
        patientAssessments.value[patient.id] = {
          admission: admission || null,
          discharge: discharge || null
        }
      } catch (error) {
        patientAssessments.value[patient.id] = {
          admission: null,
          discharge: null
        }
      }
    }

    // 检查每个患者缺少的评估
    for (const patient of patients) {
      // 跳过不需要评估的患者
      if (patient.needsAssessment === false) {
        continue
      }

      const assessments = patientAssessments.value[patient.id]

      // 在院患者缺少入院评估
      if (!patient.dischargeDate && !assessments.admission) {
        pending.push({
          ...patient,
          pendingType: 'admission'
        })
      }

      // 出院患者缺少出院评估
      if (patient.dischargeDate && !assessments.discharge) {
        pending.push({
          ...patient,
          pendingType: 'discharge'
        })
      }
    }

    pendingAssessments.value = pending
  } catch (error) {
    console.error('Failed to load pending assessments:', error)
  }
}

async function loadRecentRecords() {
  try {
    const records = await request.get('/records', {
      params: {
        limit: 10
      }
    })

    recentRecords.value = records.slice(0, 10).map((record: any) => ({
      patientName: record.patient?.name || '-',
      projectName: record.project?.name || '-',
      therapistName: record.therapist?.name || '-',
      treatmentDate: new Date(record.treatmentDate).toLocaleString('zh-CN'),
      outcome: record.outcome || '-'
    }))
  } catch (error) {
    console.error('Failed to load recent records:', error)
  }
}

function formatDate(date: string): string {
  return dayjs(date).format('YYYY-MM-DD')
}

function calculateDays(admissionDate: string, dischargeDate: string): number {
  return dayjs(dischargeDate).diff(dayjs(admissionDate), 'day') + 1
}

function handlePrint(patient: any) {
  // 打开打印页面
  const printUrl = `/print/treatment-record?patientId=${patient.id}`
  window.open(printUrl, '_blank')
}

function goToPatient(item: any) {
  // Navigate to patients page with search query and tab
  const tab = item.pendingType
    ? (item.pendingType === 'discharge' ? 'discharged' : 'admitted')
    : (item.dischargeDate ? 'discharged' : 'admitted')

  router.push({
    path: '/patients',
    query: {
      search: item.medicalRecordNo,
      tab: tab
    }
  })
}

function navigateTo(path: string) {
  router.push(path)
}
</script>

<style lang="scss" scoped>
.dashboard {
  .stat-card-wrapper {
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    :deep(.el-card__body) {
      padding: 20px;
    }
  }

  .stat-card {
    display: flex;
    align-items: center;

    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      margin-right: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

      &:nth-child(1) {
        background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      }

      &:nth-child(2) {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      }

      &:nth-child(3) {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      }

      &:nth-child(4) {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      }
    }

    .stat-content {
      flex: 1;

      .stat-value {
        font-size: 32px;
        font-weight: 700;
        background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 5px;
      }

      .stat-label {
        font-size: 14px;
        color: #64748b;
        font-weight: 500;
      }
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 16px;
    color: #1e293b;
  }

  .quick-actions {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .el-button {
      width: 100%;
      height: 48px;
      border-radius: 12px;
      font-weight: 500;
    }
  }

  .pending-assessments {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;

    .assessment-item {
      display: flex;
      flex-direction: column;
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 3px solid #f59e0b;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #f3f4f6;
        border-left-color: #d97706;
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .assessment-info {
        .patient-name {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .patient-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;

          .meta-item {
            font-size: 12px;
            color: #64748b;
          }
        }
      }

      .arrow-icon {
        display: none;
      }
    }
  }

  .discharged-patients {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;

    .discharged-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 3px solid #409eff;
      transition: all 0.2s;

      &:hover {
        background: #f3f4f6;
        border-left-color: #0284c7;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .patient-info {
        flex: 1;
        cursor: pointer;
      }

      .patient-name {
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 8px;
      }

      .patient-meta {
        display: flex;
        align-items: center;
        gap: 12px;

        .meta-item {
          font-size: 12px;
          color: #64748b;
        }

        .meta-date {
          font-size: 12px;
          color: #94a3b8;
        }
      }

      .print-btn {
        flex-shrink: 0;
        margin-left: 12px;
      }
    }
  }

  .todo-list {
    .todo-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;
      transition: all 0.2s;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: #f8fafc;
        margin: 0 -16px;
        padding: 12px 16px;
        border-radius: 8px;
      }

      .todo-text {
        margin-left: 12px;
        font-size: 14px;
        color: #1e293b;
        font-weight: 500;
      }
    }
  }
}
</style>
