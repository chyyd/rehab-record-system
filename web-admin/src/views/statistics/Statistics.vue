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
        <el-col :xs="12" :sm="12" :md="6">
          <div class="stat-card stat-card-1">
            <div class="stat-icon">
              <el-icon :size="32"><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">总治疗人次</div>
              <div class="stat-value">{{ statistics.totalRecords }}</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6">
          <div class="stat-card stat-card-2">
            <div class="stat-icon">
              <el-icon :size="32"><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">总治疗时长(小时)</div>
              <div class="stat-value">{{ statistics.totalDuration }}</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6">
          <div class="stat-card stat-card-3">
            <div class="stat-icon">
              <el-icon :size="32"><User /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">治疗患者数</div>
              <div class="stat-value">{{ statistics.totalPatients }}</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6">
          <div class="stat-card stat-card-4">
            <div class="stat-icon">
              <el-icon :size="32"><UserFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">活跃治疗师</div>
              <div class="stat-value">{{ statistics.activeTherapists }}</div>
            </div>
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
import { Document, Clock, User, UserFilled, Search, Refresh, Calendar } from '@element-plus/icons-vue'
import request from '@/utils/request'
import dayjs from 'dayjs'

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
</script>

<style lang="scss" scoped>
.statistics {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
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

    .stat-card {
      display: flex;
      align-items: center;
      padding: 24px;
      border-radius: 12px;
      color: #fff;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      }

      .stat-icon {
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        margin-right: 20px;
        flex-shrink: 0;
      }

      .stat-content {
        flex: 1;
        min-width: 0;

        .stat-label {
          font-size: 14px;
          margin-bottom: 8px;
          opacity: 0.95;
          font-weight: 500;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          line-height: 1;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      }

      // 渐变色主题
      &.stat-card-1 {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      &.stat-card-2 {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      &.stat-card-3 {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }

      &.stat-card-4 {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      }
    }
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
    .stats-row {
      .stat-card {
        padding: 16px;

        .stat-icon {
          width: 48px;
          height: 48px;
          margin-right: 12px;
        }

        .stat-content {
          .stat-value {
            font-size: 24px;
          }
        }
      }
    }

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
