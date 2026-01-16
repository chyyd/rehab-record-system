<template>
  <div class="records">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>治疗记录管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            补记录
          </el-button>
        </div>
      </template>

      <!-- Filter Form -->
      <!-- 当前筛选提示 -->
      <el-alert
        v-if="filters.patientId && currentPatient"
        type="info"
        :closable="false"
        style="margin-bottom: 15px;"
      >
        <template #title>
          当前筛选患者：{{ currentPatient.name }}（病历号：{{ currentPatient.medicalRecordNo }}）
        </template>
      </el-alert>

      <el-form :inline="true" class="filter-form">
        <el-form-item label="患者">
          <el-select
            v-model="filters.patientId"
            placeholder="选择患者"
            clearable
            filterable
            @change="handlePatientChange"
            style="width: 200px;"
          >
            <el-option
              v-for="patient in patients"
              :key="patient.id"
              :label="`${patient.name} (${patient.medicalRecordNo})`"
              :value="patient.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="治疗项目">
          <el-select
            v-model="filters.projectId"
            placeholder="选择项目"
            clearable
            style="width: 200px;"
          >
            <el-option
              v-for="project in projects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="治疗师">
          <el-select
            v-model="filters.therapistId"
            placeholder="选择治疗师"
            clearable
            style="width: 200px;"
          >
            <el-option
              v-for="user in therapists"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>

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
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- Tabs -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="在院患者记录" name="admitted">
          <!-- Table -->
          <el-table :data="admittedRecords" stripe v-loading="loading">
            <el-table-column prop="patient.name" label="患者姓名" width="120" />
            <el-table-column prop="project.name" label="治疗项目" width="150" />
            <el-table-column prop="therapist.name" label="治疗师" width="120" />
            <el-table-column label="治疗时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.startTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="durationMinutes" label="时长(分钟)" width="120" />
            <el-table-column prop="outcome" label="患者反应" show-overflow-tooltip />
            <el-table-column label="签名" width="80">
              <template #default="{ row }">
                <el-tag :type="row.photoFileName || row.signatureData ? 'success' : 'info'" size="small">
                  {{ row.photoFileName || row.signatureData ? '已签名' : '未签名' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="handleEdit(row)">
                  编辑
                </el-button>
                <el-button type="info" size="small" @click="handleView(row)">
                  查看
                </el-button>
                <el-button type="danger" size="small" @click="handleDelete(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="已出院患者记录" name="discharged">
          <el-table :data="dischargedRecords" stripe v-loading="loading">
            <el-table-column prop="patient.name" label="患者姓名" width="120" />
            <el-table-column prop="patient.medicalRecordNo" label="病历号" width="120" />
            <el-table-column prop="project.name" label="治疗项目" width="150" />
            <el-table-column prop="therapist.name" label="治疗师" width="120" />
            <el-table-column label="治疗时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.startTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="durationMinutes" label="时长(分钟)" width="120" />
            <el-table-column prop="outcome" label="患者反应" show-overflow-tooltip />
            <el-table-column label="签名" width="80">
              <template #default="{ row }">
                <el-tag :type="row.photoFileName || row.signatureData ? 'success' : 'info'" size="small">
                  {{ row.photoFileName || row.signatureData ? '已签名' : '未签名' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="info" size="small" @click="handleView(row)">
                  查看
                </el-button>
                <el-button type="danger" size="small" @click="handleDelete(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>

      <!-- Pagination -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="患者" prop="patientId">
          <el-select
            v-model="formData.patientId"
            placeholder="选择患者"
            filterable
            style="width: 100%;"
          >
            <el-option
              v-for="patient in patients"
              :key="patient.id"
              :label="`${patient.name} (${patient.medicalRecordNo})`"
              :value="patient.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="治疗项目" prop="projectId">
          <el-select
            v-model="formData.projectId"
            placeholder="选择治疗项目"
            @change="handleProjectChange"
            style="width: 100%;"
          >
            <el-option
              v-for="project in projects"
              :key="project.id"
              :label="`${project.name} (${project.defaultDuration}分钟)`"
              :value="project.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="治疗师" prop="therapistId">
          <el-select
            v-model="formData.therapistId"
            placeholder="选择治疗师"
            style="width: 100%;"
          >
            <el-option
              v-for="therapist in therapists"
              :key="therapist.id"
              :label="therapist.name"
              :value="therapist.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="治疗日期" prop="treatmentDate">
          <el-date-picker
            v-model="formData.treatmentDate"
            type="date"
            placeholder="选择治疗日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item label="开始时间" prop="startTime">
          <el-time-picker
            v-model="formData.startTime"
            placeholder="选择开始时间"
            format="HH:mm:ss"
            value-format="HH:mm:ss"
            @change="updateEndTime"
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item label="结束时间" prop="endTime">
          <el-time-picker
            v-model="formData.endTime"
            placeholder="选择结束时间"
            format="HH:mm:ss"
            value-format="HH:mm:ss"
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item label="治疗时长" prop="durationMinutes">
          <el-input-number
            v-model="formData.durationMinutes"
            :min="1"
            :max="180"
            @change="updateEndTime"
            style="width: 100%;"
          />
          <span style="margin-left: 10px;">分钟（结束时间将自动计算）</span>
        </el-form-item>

        <el-form-item label="额外秒数" prop="extraSeconds">
          <el-input-number
            v-model="formData.extraSeconds"
            :min="0"
            :max="59"
            @change="updateEndTime"
            style="width: 100%;"
          />
          <span style="margin-left: 10px;">秒</span>
        </el-form-item>

        <el-form-item label="患者反应" prop="outcome">
          <el-select v-model="formData.outcome" placeholder="选择患者反应" style="width: 100%;">
            <el-option label="无不良反应" value="无不良反应" />
            <el-option label="轻微疲劳" value="轻微疲劳" />
            <el-option label="轻微头晕" value="轻微头晕" />
            <el-option label="轻微疼痛" value="轻微疼痛" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>

        <el-form-item label="备注" prop="notes">
          <el-input
            v-model="formData.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>

        <el-form-item label="患者签名">
          <SignaturePad ref="signaturePadRef" @confirm="handleSignatureConfirm" />
          <div v-if="formData.signatureData" style="margin-top: 10px;">
            <el-button size="small" @click="viewSignature">查看签名</el-button>
            <el-button size="small" type="danger" @click="clearSignature">清除签名</el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- View Dialog -->
    <el-dialog v-model="viewDialogVisible" title="记录详情" width="900px">
      <el-descriptions :column="2" border v-if="currentRecord" style="margin-bottom: 20px;">
        <el-descriptions-item label="患者姓名">
          {{ currentRecord.patient?.name }}
        </el-descriptions-item>
        <el-descriptions-item label="病历号">
          {{ currentRecord.patient?.medicalRecordNo }}
        </el-descriptions-item>
        <el-descriptions-item label="治疗项目">
          {{ currentRecord.project?.name }}
        </el-descriptions-item>
        <el-descriptions-item label="治疗师">
          {{ currentRecord.therapist?.name }}
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">
          {{ formatDateTime(currentRecord.startTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="结束时间">
          {{ formatDateTime(currentRecord.endTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="治疗时长">
          {{ currentRecord.durationMinutes }} 分钟
        </el-descriptions-item>
        <el-descriptions-item label="患者反应">
          {{ currentRecord.outcome || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ currentRecord.notes || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- Signature Display -->
      <div v-if="currentRecord.signatureData || currentRecord.photoFileName">
        <div style="font-weight: bold; margin-bottom: 10px;">患者签名</div>
        <div style="width: 100%; display: flex; justify-content: center; background: #f5f7fa; border-radius: 8px; padding: 20px;">
          <el-image
            :src="currentRecord.signatureData || getPhotoUrl(currentRecord.photoFileName)"
            :preview-src-list="[currentRecord.signatureData || getPhotoUrl(currentRecord.photoFileName)]"
            fit="contain"
            style="max-width: 100%; max-height: 400px; width: auto; height: auto; object-fit: contain;"
            :hide-on-click-modal="true"
            :preview-teleported="true"
          >
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
                <span>签名加载失败</span>
              </div>
            </template>
          </el-image>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Picture } from '@element-plus/icons-vue'
import SignaturePad from '@/components/SignaturePad.vue'
import request from '@/utils/request'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const tableData = ref<any[]>([])
const activeTab = ref('admitted')

const patients = ref<any[]>([])
const projects = ref<any[]>([])
const therapists = ref<any[]>([])

const filters = reactive({
  patientId: null,
  projectId: null,
  therapistId: null
})

const dateRange = ref<any[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 当前筛选的患者
const currentPatient = computed(() => {
  return patients.value.find((p: any) => p.id === filters.patientId)
})

const dialogVisible = ref(false)
const dialogTitle = computed(() => (formData.id ? '编辑记录' : '补记录'))
const submitting = ref(false)

const viewDialogVisible = ref(false)
const currentRecord = ref<any>(null)
const signaturePadRef = ref<InstanceType<typeof SignaturePad> | null>(null)

const formRef = ref<FormInstance>()
const formData = reactive<any>({
  id: null,
  patientId: null,
  projectId: null,
  therapistId: null,
  treatmentDate: dayjs().format('YYYY-MM-DD'),
  startTime: dayjs().format('HH:mm:ss'),
  endTime: dayjs().add(30, 'minute').format('HH:mm:ss'),
  durationMinutes: 30,
  extraSeconds: 0,
  outcome: '无不良反应',
  notes: '',
  signatureData: '',
  photoFileName: '' // 保留用于兼容旧数据
})

const rules: FormRules = {
  patientId: [{ required: true, message: '请选择患者', trigger: 'change' }],
  projectId: [{ required: true, message: '请选择治疗项目', trigger: 'change' }],
  therapistId: [{ required: true, message: '请选择治疗师', trigger: 'change' }],
  treatmentDate: [{ required: true, message: '请选择治疗日期', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  durationMinutes: [{ required: true, message: '请输入治疗时长', trigger: 'blur' }]
}

// 计算属性：在院患者和已出院患者的记录
const admittedRecords = computed(() => {
  return tableData.value.filter(r => !r.patient.dischargeDate)
})

const dischargedRecords = computed(() => {
  return tableData.value
    .filter(r => r.patient.dischargeDate)
    .sort((a: any, b: any) => {
      // 按出院日期从远到近排序（从早到晚）
      const dateA = new Date(a.patient.dischargeDate).getTime()
      const dateB = new Date(b.patient.dischargeDate).getTime()
      return dateA - dateB
    })
})

onMounted(async () => {
  await loadPatients()
  await loadProjects()
  await loadTherapists()

  // 检查URL参数，如果有patientId则自动筛选
  const patientIdFromUrl = route.query.patientId
  const isDischarged = route.query.discharged === 'true'

  if (patientIdFromUrl) {
    // 如果是已出院患者，切换到已出院标签
    if (isDischarged) {
      activeTab.value = 'discharged'
    }

    filters.patientId = parseInt(patientIdFromUrl as string)
    await loadData()

    // 显示提示信息
    if (currentPatient.value) {
      const statusText = isDischarged ? '已出院患者' : '在院患者'
      ElMessage.success(`已自动筛选${statusText}：${currentPatient.value.name}`)
    }
  } else {
    await loadData()
  }
})

// 监听路由参数变化
watch(() => route.query, async (query) => {
  if (query.patientId) {
    // 检查是否需要切换标签
    const isDischarged = query.discharged === 'true'
    if (isDischarged && activeTab.value !== 'discharged') {
      activeTab.value = 'discharged'
    } else if (!isDischarged && activeTab.value !== 'admitted') {
      activeTab.value = 'admitted'
    }

    filters.patientId = parseInt(query.patientId as string)
    await loadData()
  }
}, { deep: true })

async function loadPatients() {
  try {
    const data = await request.get('/patients')
    // 加载所有患者，包括已出院的
    patients.value = data
  } catch (error) {
    console.error('Failed to load patients:', error)
  }
}

async function loadProjects() {
  try {
    const data = await request.get('/projects')
    projects.value = data.filter((p: any) => p.isActive)
  } catch (error) {
    console.error('Failed to load projects:', error)
  }
}

async function loadTherapists() {
  try {
    const data = await request.get('/users')
    therapists.value = data.filter((u: any) =>
      (u.role === 'therapist' || u.role === 'physician' || u.role === 'nurse') && u.isActive
    )
  } catch (error) {
    console.error('Failed to load therapists:', error)
  }
}

async function loadData() {
  loading.value = true

  try {
    const params: any = {}

    if (filters.patientId) params.patientId = filters.patientId
    if (filters.projectId) params.projectId = filters.projectId
    if (filters.therapistId) params.therapistId = filters.therapistId
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }

    const data = await request.get('/records', { params })

    // Expand data with relations
    tableData.value = await Promise.all(
      data.map(async (record: any) => {
        const patient = await request.get(`/patients/${record.patientId}`)
        const project = await request.get(`/projects/${record.projectId}`)
        const therapist = await request.get(`/users/${record.therapistId}`)

        return {
          ...record,
          patient,
          project,
          therapist
        }
      })
    )

    pagination.total = data.length
  } catch (error) {
    console.error('Failed to load records:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1

  // 更新URL参数，保持patientId和discharged
  const query: any = {}
  if (filters.patientId) query.patientId = filters.patientId
  if (activeTab.value === 'discharged') query.discharged = 'true'

  router.push({ path: '/records', query })

  loadData()
}

function handleReset() {
  filters.patientId = null
  filters.projectId = null
  filters.therapistId = null
  dateRange.value = []
  pagination.page = 1

  // 清除URL中的patientId参数
  if (route.query.patientId) {
    router.push({ path: '/records', query: {} })
  }

  loadData()
}

function handlePatientChange() {
  // 患者筛选变化时更新URL
  handleSearch()
}

function handleTabChange() {
  // 标签切换时更新URL参数
  const query: any = {}
  if (filters.patientId) query.patientId = filters.patientId
  if (activeTab.value === 'discharged') query.discharged = 'true'

  router.push({ path: '/records', query })
}

function handleAdd() {
  Object.assign(formData, {
    id: null,
    patientId: null,
    projectId: null,
    therapistId: null,
    treatmentDate: dayjs().format('YYYY-MM-DD'),
    startTime: dayjs().format('HH:mm:ss'),
    endTime: dayjs().add(30, 'minute').format('HH:mm:ss'),
    durationMinutes: 30,
    extraSeconds: 0,
    outcome: '无不良反应',
    notes: '',
    signatureData: '',
    photoFileName: ''
  })
  dialogVisible.value = true
  // 确保结束时间根据默认时长计算
  updateEndTime()
}

function handleProjectChange(projectId: number) {
  const project = projects.value.find((p: any) => p.id === projectId)
  if (project) {
    formData.durationMinutes = project.defaultDuration
    updateEndTime()
  }
}

function handleEdit(row: any) {
  Object.assign(formData, {
    ...row,
    treatmentDate: dayjs(row.treatmentDate).format('YYYY-MM-DD'),
    startTime: dayjs(row.startTime).format('HH:mm:ss'),
    endTime: dayjs(row.endTime).format('HH:mm:ss')
  })
  dialogVisible.value = true
}

function handleView(row: any) {
  currentRecord.value = row
  viewDialogVisible.value = true
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm('确定要删除该记录吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await request.delete(`/records/${row.id}`)
    ElMessage.success('删除成功')
    await loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true

      try {
        // 组合日期和时间
        const treatmentDateTime = formData.treatmentDate
        const startDateTime = `${treatmentDateTime}T${formData.startTime}`
        const endDateTime = `${treatmentDateTime}T${formData.endTime}`

        // 如果有签名数据，转换为Blob并上传
        let photoFileName = formData.photoFileName
        if (formData.signatureData) {
          const signatureBlob = dataURLtoBlob(formData.signatureData)
          const formData_upload = new FormData()
          formData_upload.append('photo', signatureBlob, 'signature.png')
          formData_upload.append('isSignature', 'true')

          const uploadResponse = await request.post('/photos/upload', formData_upload, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })

          photoFileName = uploadResponse.filename
        }

        const data = {
          patientId: formData.patientId,
          projectId: formData.projectId,
          therapistId: formData.therapistId,
          treatmentDate: treatmentDateTime,
          startTime: startDateTime,
          endTime: endDateTime,
          durationMinutes: formData.durationMinutes,
          extraSeconds: formData.extraSeconds || 0,
          outcome: formData.outcome,
          notes: formData.notes,
          photoFileName: photoFileName
        }

        if (formData.id) {
          await request.put(`/records/${formData.id}`, data)
          ElMessage.success('更新成功')
        } else {
          await request.post('/records', data)
          ElMessage.success('添加成功')
        }

        dialogVisible.value = false
        await loadData()
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

// 将Base64转换为Blob
function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',')
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

function handleDialogClose() {
  formRef.value?.resetFields()
}

// 签名相关方法
function handleSignatureConfirm(imageData: string) {
  formData.signatureData = imageData
  ElMessage.success('签名已确认')
}

function viewSignature() {
  if (formData.signatureData) {
    // 打开新窗口显示签名
    const win = window.open('')
    if (win) {
      win.document.write(`<img src="${formData.signatureData}" style="max-width: 100%; height: auto;" />`)
    }
  }
}

function clearSignature() {
  formData.signatureData = ''
  formData.photoFileName = ''
  ElMessage.success('签名已清除')
}

function formatDateTime(date: string): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

function updateEndTime() {
  if (formData.startTime && formData.durationMinutes) {
    const [hours, minutes, seconds] = formData.startTime.split(':').map(Number)
    const endDate = dayjs().hour(hours).minute(minutes).second(seconds).add(formData.durationMinutes, 'minute').add(formData.extraSeconds || 0, 'second')
    formData.endTime = endDate.format('HH:mm:ss')
  }
}

function getPhotoUrl(filename: string): string {
  return `/api/uploads/photos/${filename}`
}
</script>

<style lang="scss" scoped>
.records {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }

  .filter-form {
    margin-bottom: 20px;
  }

  .image-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    background: #f5f7fa;
    color: #909399;
    font-size: 14px;

    .el-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }
  }
}
</style>
