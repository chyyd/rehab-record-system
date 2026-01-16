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
        <el-form-item label="快速选择">
          <el-button-group>
            <el-button
              :type="selectedRange === 'today' ? 'primary' : ''"
              @click="selectDateRange('today')"
            >
              今日
            </el-button>
            <el-button
              :type="selectedRange === 'week' ? 'primary' : ''"
              @click="selectDateRange('week')"
            >
              本周
            </el-button>
            <el-button
              :type="selectedRange === 'month' ? 'primary' : ''"
              @click="selectDateRange('month')"
            >
              本月
            </el-button>
            <el-button
              :type="selectedRange === 'billing' ? 'primary' : ''"
              @click="selectDateRange('billing')"
            >
              本账期
            </el-button>
            <el-button
              :type="selectedRange === 'year' ? 'primary' : ''"
              @click="selectDateRange('year')"
            >
              本年
            </el-button>
          </el-button-group>
        </el-form-item>

        <el-form-item label="自定义范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 280px;"
            @change="handleDateRangeChange"
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="loadStatistics" :loading="loading">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <!-- Date Range Info -->
      <div v-if="dateRange && dateRange.length === 2" class="date-range-info">
        <el-icon><Calendar /></el-icon>
        <span class="date-text">
          统计时间：{{ dateRange[0] }} 至 {{ dateRange[1] }}
          <el-tag v-if="selectedRange" type="info" size="small" style="margin-left: 8px;">
            {{ rangeLabels[selectedRange] }}
          </el-tag>
        </span>
      </div>

      <!-- Statistics Cards -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card-wrapper">
            <div class="stat-card">
              <div class="stat-icon">
                <el-icon :size="30"><Document /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ statistics.totalRecords }}</div>
                <div class="stat-label">总治疗人次</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card shadow="hover" class="stat-card-wrapper">
            <div class="stat-card">
              <div class="stat-icon">
                <el-icon :size="30"><Clock /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ statistics.totalDuration }}</div>
                <div class="stat-label">总治疗时长(小时)</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card shadow="hover" class="stat-card-wrapper">
            <div class="stat-card">
              <div class="stat-icon">
                <el-icon :size="30"><User /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ statistics.totalPatients }}</div>
                <div class="stat-label">治疗患者数</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card shadow="hover" class="stat-card-wrapper">
            <div class="stat-card">
              <div class="stat-icon">
                <el-icon :size="30"><UserFilled /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ statistics.activeTherapists }}</div>
                <div class="stat-label">活跃工作人员</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Charts -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="6">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>按项目统计</span>
              </div>
            </template>

            <el-table :data="projectStats" stripe>
              <el-table-column prop="projectName" label="治疗项目" show-overflow-tooltip />
              <el-table-column prop="count" label="次数" width="70" />
              <el-table-column prop="percentage" label="占比" width="70">
                <template #default="{ row }">
                  {{ row.percentage }}%
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>工作人员工作量</span>
              </div>
            </template>

            <el-table :data="therapistStats" stripe>
              <el-table-column prop="therapistName" label="工作人员" show-overflow-tooltip />
              <el-table-column prop="count" label="次数" width="70" sortable />
            </el-table>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>每日治疗趋势</span>
              </div>
            </template>

            <el-table :data="dailyStats" stripe>
              <el-table-column prop="date" label="日期" width="110" />
              <el-table-column prop="recordCount" label="人次" width="70" sortable />
              <el-table-column prop="patientCount" label="患者数" width="70" sortable />
              <el-table-column prop="topProjects" label="主要项目" show-overflow-tooltip />
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
              <el-table-column prop="patientName" label="患者姓名" width="120" />
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
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Document, Clock, User, UserFilled, Search, Refresh, Calendar } from '@element-plus/icons-vue'
import request from '@/utils/request'
import dayjs from 'dayjs'

const router = useRouter()

const dateRange = ref<any[]>([])
const selectedRange = ref<string>('month')
const loading = ref(false)

// 日期范围标签
const rangeLabels: Record<string, string> = {
  today: '今日',
  week: '本周',
  month: '本月',
  billing: '本账期',
  year: '本年'
}

const statistics = reactive({
  totalRecords: 0,
  totalDuration: 0,
  totalPatients: 0,
  activeTherapists: 0
})

const projectStats = ref<any[]>([])
const therapistStats = ref<any[]>([])
const patientStats = ref<any[]>([])
const dailyStats = ref<any[]>([])

onMounted(async () => {
  // 默认选择本月
  selectDateRange('month')
})

/**
 * 选择日期范围
 * @param range 日期范围类型
 */
function selectDateRange(range: string) {
  selectedRange.value = range
  const today = dayjs()
  let startDate: dayjs.Dayjs
  let endDate: dayjs.Dayjs = today

  switch (range) {
    case 'today':
      // 今日：当天0点至当天23点59分
      startDate = today.startOf('day')
      endDate = today.endOf('day')
      break

    case 'week':
      // 本周：周一至周日
      startDate = today.startOf('week')
      endDate = today.endOf('week')
      break

    case 'month':
      // 本月：1号至月底
      startDate = today.startOf('month')
      endDate = today.endOf('month')
      break

    case 'billing':
      // 本账期：本月21日0点至下月20日23点59分
      const currentDay = today.date()
      if (currentDay >= 21) {
        // 当前日期在21日之后，账期为本月21日至下月20日
        startDate = today.date(21).startOf('day')
        endDate = today.add(1, 'month').date(20).endOf('day')
      } else {
        // 当前日期在20日之前，账期为上月21日至本月20日
        startDate = today.subtract(1, 'month').date(21).startOf('day')
        endDate = today.date(20).endOf('day')
      }
      break

    case 'year':
      // 本年：1月1日至12月31日
      startDate = today.startOf('year')
      endDate = today.endOf('year')
      break

    default:
      startDate = today.startOf('month')
      endDate = today.endOf('month')
  }

  dateRange.value = [
    startDate.format('YYYY-MM-DD'),
    endDate.format('YYYY-MM-DD')
  ]

  // 自动加载数据
  loadStatistics()
}

/**
 * 自定义日期范围改变时清除快速选择标记
 */
function handleDateRangeChange() {
  if (dateRange.value && dateRange.value.length === 2) {
    selectedRange.value = ''
  }
}

async function loadStatistics() {
  if (!dateRange.value || dateRange.value.length !== 2) {
    ElMessage.warning('请选择日期范围')
    return
  }

  loading.value = true

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
        percentage: records.length > 0 ? ((item.count / records.length) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.count - a.count)

    // Calculate therapist statistics
    const therapistMap = new Map()
    records.forEach((record: any) => {
      const therapistName = record.therapist?.name || '未知'
      if (!therapistMap.has(therapistName)) {
        therapistMap.set(therapistName, { count: 0, therapistName })
      }
      therapistMap.get(therapistName).count++
    })

    therapistStats.value = Array.from(therapistMap.values())
      .sort((a, b) => b.count - a.count)

    // Calculate daily statistics
    const dailyMap = new Map()
    records.forEach((record: any) => {
      const dateKey = dayjs(record.treatmentDate).format('YYYY-MM-DD')
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateKey,
          recordCount: 0,
          patientCount: new Set(),
          projectCounts: new Map()
        })
      }
      const daily = dailyMap.get(dateKey)
      daily.recordCount++
      daily.patientCount.add(record.patientId)

      // 统计每个项目的次数
      const projectName = record.project?.name || '未知'
      daily.projectCounts.set(
        projectName,
        (daily.projectCounts.get(projectName) || 0) + 1
      )
    })

    dailyStats.value = Array.from(dailyMap.values())
      .map((item: any) => {
        // 找出前3个项目
        const sortedProjects = Array.from(item.projectCounts.entries())
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 3)
          .map((item: any) => `${item[0]}×${item[1]}`)
          .join(', ')

        return {
          date: item.date,
          recordCount: item.recordCount,
          patientCount: item.patientCount.size,
          topProjects: sortedProjects || '-'
        }
      })
      .sort((a, b) => b.date.localeCompare(a.date)) // 按日期降序

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

    ElMessage.success('统计数据加载成功')
  } catch (error) {
    console.error('Failed to load statistics:', error)
    ElMessage.error('加载统计数据失败')
  } finally {
    loading.value = false
  }
}

function handleReset() {
  selectDateRange('month')
}

function navigateTo(path: string) {
  router.push(path)
}
</script>

<style lang="scss" scoped>
.statistics {
  .stat-card-wrapper {
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

  .filter-form {
    margin-bottom: 20px;

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: #475569;
    }

    .el-button-group {
      .el-button {
        transition: all 0.2s;

        &:hover {
          transform: translateY(-1px);
        }
      }
    }
  }

  .date-range-info {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: #f8fafc;
    border-left: 3px solid #409eff;
    border-radius: 6px;
    margin-bottom: 20px;
    color: #475569;
    font-size: 14px;

    .el-icon {
      margin-right: 8px;
      color: #409eff;
      font-size: 16px;
    }

    .date-text {
      flex: 1;
      font-weight: 500;
    }
  }

  .stats-row {
    margin-bottom: 20px;
  }

  // 表格卡片样式优化
  :deep(.el-card) {
    border-radius: 12px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    .el-card__header {
      border-bottom: 1px solid #e2e8f0;
      padding: 16px 20px;
    }

    .el-card__body {
      padding: 20px;
    }
  }

  :deep(.el-table) {
    .el-table__header th {
      background-color: #f8fafc;
      color: #475569;
      font-weight: 600;
    }

    .el-table__body tr:hover > td {
      background-color: #f8fafc;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .statistics {
    .filter-form {
      :deep(.el-form-item) {
        display: block;
        margin-right: 0;
        margin-bottom: 16px;

        .el-button-group {
          display: flex;
          flex-wrap: wrap;

          .el-button {
            flex: 1;
            min-width: 60px;
          }
        }
      }
    }
  }
}
</style>
