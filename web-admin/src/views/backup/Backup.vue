<template>
  <div class="backup-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>📁 备份与恢复</span>
          <div>
            <el-button type="primary" @click="handleManualBackup">立即备份</el-button>
          </div>
        </div>
      </template>

      <!-- 备份状态概览 -->
      <div class="backup-overview">
        <el-descriptions :column="4" border>
          <el-descriptions-item label="最后备份">
            {{ lastBackupTime || '未备份' }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="backupStatusType">{{ backupStatusText }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="数据库大小">
            {{ formatFileSize(databaseSize) }}
          </el-descriptions-item>
          <el-descriptions-item label="签名图片">
            {{ photosCount }} 个
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 备份历史表格 -->
      <div class="backup-history">
        <h3>📋 备份历史</h3>
        <el-table :data="backupLogs" stripe>
          <el-table-column prop="backupDate" label="备份时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.backupDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="backupType" label="类型" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ getBackupTypeName(row.backupType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
                {{ row.status === 'success' ? '✅' : '❌' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="fileSize" label="文件大小">
            <template #default="{ row }">
              {{ row.fileSize ? formatFileSize(row.fileSize) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="fileCount" label="文件数量">
            <template #default="{ row }">
              {{ row.fileCount || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="耗时" width="100">
            <template #default="{ row }">
              {{ row.duration ? `${row.duration}秒` : '-' }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import dayjs from 'dayjs'

const lastBackupTime = ref('')
const backupStatusText = ref('未知')
const backupStatusType = ref('info')
const databaseSize = ref(0)
const photosCount = ref(0)
const backupLogs = ref([])

onMounted(() => {
  loadBackupStatus()
  loadBackupLogs()
})

async function loadBackupStatus() {
  try {
    const status = await request.get('/backup/status')
    lastBackupTime.value = status.lastBackupTime ? formatDate(status.lastBackupTime) : ''

    if (status.backupStatus === 'ok') {
      backupStatusText.value = '✅ 正常'
      backupStatusType.value = 'success'
    } else if (status.backupStatus === 'failed') {
      backupStatusText.value = '❌ 失败'
      backupStatusType.value = 'danger'
    } else {
      backupStatusText.value = '⚠️ 警告'
      backupStatusType.value = 'warning'
    }

    databaseSize.value = status.databaseSize || 0
    photosCount.value = status.photosCount || 0
  } catch (error) {
    console.error('Failed to load backup status:', error)
  }
}

async function loadBackupLogs() {
  try {
    const logs = await request.get('/backup/logs')
    backupLogs.value = logs
  } catch (error) {
    console.error('Failed to load backup logs:', error)
  }
}

async function handleManualBackup() {
  try {
    await ElMessageBox.confirm('确认立即执行备份？', '提示', {
      type: 'info',
    })

    await request.post('/backup/backup-now', {
      backupTypes: ['database', 'config', 'photos'],
    })

    ElMessage.success('备份完成')
    loadBackupStatus()
    loadBackupLogs()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('备份失败: ' + error.message)
    }
  }
}

function formatDate(date: string): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function getBackupTypeName(type: string): string {
  const names: Record<string, string> = {
    database: '数据库',
    config: '配置文件',
    photos: '签名图片',
  }
  return names[type] || type
}
</script>

<style lang="scss" scoped>
.backup-page {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 16px;
  }

  .backup-overview {
    margin-bottom: 20px;
  }

  .backup-history {
    h3 {
      margin-bottom: 16px;
      font-size: 16px;
      font-weight: 600;
    }
  }
}
</style>
