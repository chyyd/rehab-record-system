<template>
  <div class="statistics">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>统计报表</span>
        </div>
      </template>

      <!-- Date Range Filter -->
      <el-form :inline="true" class="filter-form">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 240px;"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="loadStatistics">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- Statistics Cards -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">总治疗人次</div>
            <div class="stat-value">{{ statistics.totalRecords }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">总治疗时长(小时)</div>
            <div class="stat-value">{{ statistics.totalDuration }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">治疗患者数</div>
            <div class="stat-value">{{ statistics.totalPatients }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">活跃治疗师</div>
            <div class="stat-value">{{ statistics.activeTherapists }}</div>
          </div>
        </el-col>
      </el-row>

      <!-- Charts -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>按项目统计</span>
              </div>
            </template>

            <el-table :data="projectStats" stripe>
              <el-table-column prop="projectName" label="治疗项目" />
              <el-table-column prop="count" label="治疗次数" width="120" />
              <el-table-column prop="percentage" label="占比" width="120">
                <template #default="{ row }">
                  {{ row.percentage }}%
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>治疗师工作量</span>
              </div>
            </template>

            <el-table :data="therapistStats" stripe>
              <el-table-column prop="therapistName" label="治疗师" />
              <el-table-column prop="count" label="治疗次数" width="120" />
              <el-table-column prop="duration" label="时长(小时)" width="120" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="24">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>患者治疗统计</span>
              </div>
            </template>

            <el-table :data="patientStats" stripe>
              <el-table-column prop="patientName" label="患者姓名" />
              <el-table-column prop="medicalRecordNo" label="病历号" width="120" />
              <el-table-column prop="count" label="治疗次数" width="100" />
              <el-table-column prop="totalDuration" label="总时长(小时)" width="150" />
              <el-table-column prop="projects" label="参与项目" show-overflow-tooltip />
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const dateRange = ref<any[]>([])

const statistics = reactive({
  totalRecords: 0,
  totalDuration: 0,
  totalPatients: 0,
  activeTherapists: 0
})

const projectStats = ref<any[]>([])
const therapistStats = ref<any[]>([])
const patientStats = ref<any[]>([])

onMounted(async () => {
  // Set default date range to current month
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  dateRange.value = [
    firstDay.toISOString().split('T')[0],
    today.toISOString().split('T')[0]
  ]

  await loadStatistics()
})

async function loadStatistics() {
  if (!dateRange.value || dateRange.value.length !== 2) {
    ElMessage.warning('请选择日期范围')
    return
  }

  try {
    const params = {
      startDate: dateRange.value[0],
      endDate: dateRange.value[1]
    }

    const data = await request.get('/records/statistics', { params })
    const records = data.records || []

    // Calculate overall statistics
    statistics.totalRecords = records.length
    statistics.totalDuration = (records.reduce((sum: number, r: any) => sum + (r.durationMinutes || 0), 0) / 60).toFixed(1)
    statistics.totalPatients = new Set(records.map((r: any) => r.patientId)).size
    statistics.activeTherapists = new Set(records.map((r: any) => r.therapistId)).size

    // Calculate project statistics
    const projectMap = new Map()
    records.forEach((record: any) => {
      const projectName = record.project?.name || '未知'
      if (!projectMap.has(projectName)) {
        projectMap.set(projectName, { count: 0, projectName })
      }
      projectMap.get(projectName).count++
    })

    projectStats.value = Array.from(projectMap.values())
      .map((item: any) => ({
        ...item,
        percentage: ((item.count / records.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count)

    // Calculate therapist statistics
    const therapistMap = new Map()
    records.forEach((record: any) => {
      const therapistName = record.therapist?.name || '未知'
      if (!therapistMap.has(therapistName)) {
        therapistMap.set(therapistName, { count: 0, duration: 0, therapistName })
      }
      const therapist = therapistMap.get(therapistName)
      therapist.count++
      therapist.duration += record.durationMinutes || 0
    })

    therapistStats.value = Array.from(therapistMap.values())
      .map((item: any) => ({
        ...item,
        duration: (item.duration / 60).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count)

    // Calculate patient statistics
    const patientMap = new Map()
    records.forEach((record: any) => {
      if (!patientMap.has(record.patientId)) {
        patientMap.set(record.patientId, {
          count: 0,
          totalDuration: 0,
          patientName: record.patient?.name || '未知',
          medicalRecordNo: record.patient?.medicalRecordNo || '-',
          projects: new Set()
        })
      }
      const patient = patientMap.get(record.patientId)
      patient.count++
      patient.totalDuration += record.durationMinutes || 0
      patient.projects.add(record.project?.name || '未知')
    })

    patientStats.value = Array.from(patientMap.values())
      .map((item: any) => ({
        ...item,
        totalDuration: (item.totalDuration / 60).toFixed(1),
        projects: Array.from(item.projects).join('、')
      }))
      .sort((a, b) => b.count - a.count)

  } catch (error) {
    console.error('Failed to load statistics:', error)
    ElMessage.error('加载统计数据失败')
  }
}

function handleReset() {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  dateRange.value = [
    firstDay.toISOString().split('T')[0],
    today.toISOString().split('T')[0]
  ]
  loadStatistics()
}
</script>

<style lang="scss" scoped>
.statistics {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }

  .filter-form {
    margin-bottom: 20px;
  }

  .stats-row {
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      padding: 30px;
      text-align: center;
      color: #fff;

      .stat-label {
        font-size: 14px;
        margin-bottom: 10px;
        opacity: 0.9;
      }

      .stat-value {
        font-size: 36px;
        font-weight: bold;
      }
    }
  }
}
</style>
