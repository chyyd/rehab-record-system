<template>
  <div class="patients">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>患者管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增患者
          </el-button>
        </div>
      </template>

      <!-- Tabs: 在院/已出院 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="在院患者" name="admitted"></el-tab-pane>
        <el-tab-pane label="已出院" name="discharged"></el-tab-pane>
      </el-tabs>

      <!-- Search -->
      <el-form :inline="true" class="search-form">
        <el-form-item label="搜索">
          <el-input
            v-model="searchQuery"
            placeholder="姓名/拼音/病历号"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- Table -->
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            <el-tag :type="row.gender === '男' ? 'primary' : 'danger'" size="small">
              {{ row.gender }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="80" />
        <el-table-column prop="medicalRecordNo" label="病历号" width="120" />
        <el-table-column prop="insuranceType" label="医保类型" width="200" />
        <el-table-column prop="diagnosis" label="诊断" show-overflow-tooltip />
        <el-table-column prop="doctor" label="主管医师" width="120" />
        <el-table-column prop="admissionDate" label="入院日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.admissionDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="dischargeDate" label="出院日期" width="120">
          <template #default="{ row }">
            {{ row.dischargeDate ? formatDate(row.dischargeDate) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="480" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="handleEdit(row)">
                编辑
              </el-button>
              <el-button type="success" size="small" @click="handleViewRecords(row)">
                记录
              </el-button>
              <el-button
                :type="hasAssessment(row.id, 'admission') ? 'success' : 'info'"
                size="small"
                @click="handleAdmissionAssessment(row)"
              >
                入院评估
              </el-button>
              <el-button
                :type="hasAssessment(row.id, 'discharge') ? 'success' : 'warning'"
                size="small"
                @click="handleDischargeAssessment(row)"
              >
                出院评估
              </el-button>
              <el-button
                v-if="row.dischargeDate"
                type="primary"
                size="small"
                @click="handlePrint(row)"
              >
                打印治疗单
              </el-button>
              <el-button
                v-if="!row.dischargeDate"
                type="danger"
                size="small"
                @click="handleDischarge(row)"
              >
                出院
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

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
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" placeholder="请输入患者姓名" @input="handleNameChange" />
        </el-form-item>

        <el-form-item label="拼音" prop="pinyin" v-if="formData.id">
          <el-input v-model="formData.pinyin" placeholder="自动生成" disabled />
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="formData.gender">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="年龄" prop="age">
          <el-input v-model="formData.age" placeholder="请输入年龄" />
        </el-form-item>

        <el-form-item label="病历号" prop="medicalRecordNo">
          <el-input v-model="formData.medicalRecordNo" placeholder="请输入病历号" :disabled="!!formData.id" />
        </el-form-item>

        <el-form-item label="医保类型" prop="insuranceType">
          <el-select v-model="formData.insuranceType" placeholder="请选择医保类型" style="width: 100%;">
            <el-option label="城镇职工基本医疗保险" value="城镇职工基本医疗保险" />
            <el-option label="城乡居民基本医疗保险" value="城乡居民基本医疗保险" />
            <el-option label="铁路医保" value="铁路医保" />
            <el-option label="异地医保" value="异地医保" />
            <el-option label="自费" value="自费" />
          </el-select>
        </el-form-item>

        <el-form-item label="主管医师" prop="doctor">
          <el-input v-model="formData.doctor" placeholder="请输入主管医师" />
        </el-form-item>

        <el-form-item label="主要诊断" prop="diagnosis">
          <el-input
            v-model="formData.diagnosis"
            type="textarea"
            :rows="3"
            placeholder="请输入主要诊断"
          />
        </el-form-item>

        <el-form-item label="入院日期" prop="admissionDate">
          <el-date-picker
            v-model="formData.admissionDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item label="出院日期" prop="dischargeDate" v-if="formData.dischargeDate">
          <el-date-picker
            v-model="formData.dischargeDate"
            type="date"
            placeholder="出院日期"
            style="width: 100%;"
            disabled
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- Discharge Dialog -->
    <el-dialog
      v-model="dischargeDialogVisible"
      title="患者出院"
      width="500px"
    >
      <el-form
        ref="dischargeFormRef"
        :model="dischargeForm"
        :rules="dischargeRules"
        label-width="100px"
      >
        <el-form-item label="患者姓名">
          <el-input :value="selectedPatient?.name" disabled />
        </el-form-item>
        <el-form-item label="病历号">
          <el-input :value="selectedPatient?.medicalRecordNo" disabled />
        </el-form-item>
        <el-form-item label="出院日期" prop="dischargeDate">
          <el-date-picker
            v-model="dischargeForm.dischargeDate"
            type="date"
            placeholder="选择出院日期"
            style="width: 100%;"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dischargeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="discharging" @click="handleConfirmDischarge">
          确认出院
        </el-button>
      </template>
    </el-dialog>

    <!-- Assessment Dialog -->
    <AssessmentDialog
      v-model="assessmentDialogVisible"
      :patient-id="selectedPatient?.id"
      :assessment-type="currentAssessmentType"
      :existing-assessment="currentAssessment"
      :selected-patient="selectedPatient"
      @success="handleAssessmentSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import request from '@/utils/request'
import dayjs from 'dayjs'
import { pinyin } from 'pinyin-pro'
import AssessmentDialog from '@/components/AssessmentDialog.vue'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const searchQuery = ref('')
const activeTab = ref('admitted')
const tableData = ref<any[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const dialogVisible = ref(false)
const dialogTitle = computed(() => (formData.id ? '编辑患者' : '新增患者'))
const submitting = ref(false)

const dischargeDialogVisible = ref(false)
const discharging = ref(false)
const selectedPatient = ref<any>(null)
const dischargeFormRef = ref<FormInstance>()
const dischargeForm = reactive({
  dischargeDate: new Date()
})

// 评估相关
const assessmentDialogVisible = ref(false)
const currentAssessmentType = ref<'admission' | 'discharge'>('admission')
const currentAssessment = ref<any>(null)
const patientAssessments = ref<Record<number, any>>({})

const dischargeRules: FormRules = {
  dischargeDate: [{ required: true, message: '请选择出院日期', trigger: 'change' }]
}

const formRef = ref<FormInstance>()
const formData = reactive<any>({
  id: null,
  name: '',
  pinyin: '',
  gender: '男',
  age: '',
  medicalRecordNo: '',
  insuranceType: '',
  doctor: '',
  diagnosis: '',
  admissionDate: ''
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入患者姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  age: [{ required: true, message: '请输入年龄', trigger: 'blur' }],
  medicalRecordNo: [
    { required: true, message: '请输入病历号', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '病历号必须为6位数字', trigger: 'blur' }
  ],
  insuranceType: [{ required: true, message: '请选择医保类型', trigger: 'change' }],
  doctor: [{ required: true, message: '请输入主管医师', trigger: 'blur' }],
  diagnosis: [{ required: true, message: '请输入主要诊断', trigger: 'blur' }],
  admissionDate: [{ required: true, message: '请选择入院日期', trigger: 'change' }]
}

// 姓名变化时自动生成拼音
function handleNameChange() {
  if (formData.name) {
    const result = pinyin(formData.name, { pattern: 'first', toneType: 'none' })
    formData.pinyin = result.toLowerCase().replace(/\s+/g, '')
  }
}

onMounted(() => {
  // Check if there's a search query from URL
  if (route.query.search) {
    searchQuery.value = route.query.search as string
  }

  // Check if there's a tab parameter from URL
  if (route.query.tab) {
    activeTab.value = route.query.tab as string
  }

  loadData()
})

// Watch for route query changes
watch(() => route.query.search, (newSearch) => {
  if (newSearch) {
    searchQuery.value = newSearch as string
    handleSearch()
  }
})

// Watch for tab changes in route
watch(() => route.query.tab, (newTab) => {
  if (newTab && newTab !== activeTab.value) {
    activeTab.value = newTab as string
    handleTabChange()
  }
})

// 检查患者是否有某种类型的评估
function hasAssessment(patientId: number, type: 'admission' | 'discharge'): boolean {
  return !!(patientAssessments.value[patientId]?.[type])
}

// 获取评估按钮文字
function getAssessmentButtonText(type: 'admission' | 'discharge'): string {
  if (type === 'admission') {
    return '入院评估'
  } else {
    return '出院评估'
  }
}

async function loadData() {
  loading.value = true

  try {
    let data

    if (searchQuery.value) {
      data = await request.get('/patients/search', {
        params: { q: searchQuery.value }
      })
    } else {
      data = await request.get('/patients')
    }

    // 根据Tab筛选在院/出院患者
    if (activeTab.value === 'admitted') {
      tableData.value = data.filter((p: any) => !p.dischargeDate)
    } else {
      tableData.value = data.filter((p: any) => p.dischargeDate)
    }

    pagination.total = tableData.value.length

    // 加载所有患者的评估状态
    for (const patient of tableData.value) {
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
  } catch (error) {
    console.error('Failed to load patients:', error)
  } finally {
    loading.value = false
  }
}

function handleTabChange() {
  pagination.page = 1
  loadData()
}

async function handleSearch() {
  pagination.page = 1
  await loadData()
}

async function handleReset() {
  searchQuery.value = ''
  pagination.page = 1
  await loadData()
}

function handleAdd() {
  Object.assign(formData, {
    id: null,
    name: '',
    pinyin: '',
    gender: '男',
    age: '',
    medicalRecordNo: '',
    insuranceType: '',
    doctor: '',
    diagnosis: '',
    admissionDate: ''
  })
  dialogVisible.value = true
}

function handleEdit(row: any) {
  Object.assign(formData, {
    ...row,
    admissionDate: row.admissionDate ? new Date(row.admissionDate) : '',
    dischargeDate: row.dischargeDate ? new Date(row.dischargeDate) : undefined
  })
  dialogVisible.value = true
}

function handleViewRecords(row: any) {
  // 如果是已出院患者，传递discharged参数
  if (row.dischargeDate) {
    router.push(`/records?patientId=${row.id}&discharged=true`)
  } else {
    router.push(`/records?patientId=${row.id}`)
  }
}

function handleDischarge(row: any) {
  selectedPatient.value = row
  dischargeForm.dischargeDate = new Date()
  dischargeDialogVisible.value = true
}

// 入院评估
async function handleAdmissionAssessment(row: any) {
  selectedPatient.value = row
  currentAssessmentType.value = 'admission'

  // 检查是否已有入院评估
  try {
    const assessment = await request.get(`/assessments/patient/${row.id}/admission`)
    currentAssessment.value = assessment
  } catch (error) {
    currentAssessment.value = null
  }

  assessmentDialogVisible.value = true
}

// 出院评估
async function handleDischargeAssessment(row: any) {
  selectedPatient.value = row
  currentAssessmentType.value = 'discharge'

  // 检查是否已有出院评估
  try {
    const assessment = await request.get(`/assessments/patient/${row.id}/discharge`)
    currentAssessment.value = assessment
  } catch (error) {
    currentAssessment.value = null
  }

  assessmentDialogVisible.value = true
}

// 打印治疗单
async function handlePrint(row: any) {
  try {
    // 打开新窗口，传递患者ID
    const printUrl = `/print/treatment-record?patientId=${row.id}`
    window.open(printUrl, '_blank')
  } catch (error: any) {
    ElMessage.error(error.message || '打开打印页面失败')
  }
}

// 评估保存成功
async function handleAssessmentSuccess() {
  ElMessage.success('评估保存成功')
  // 重新加载患者评估状态
  await loadPatientAssessments()
}

// 加载患者评估状态
async function loadPatientAssessments() {
  for (const patient of tableData.value) {
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
}

async function handleConfirmDischarge() {
  if (!dischargeFormRef.value) return

  await dischargeFormRef.value.validate(async (valid) => {
    if (valid) {
      discharging.value = true

      try {
        await request.put(`/patients/${selectedPatient.value.id}`, {
          dischargeDate: dayjs(dischargeForm.dischargeDate).format('YYYY-MM-DD')
        })

        ElMessage.success('出院成功')
        dischargeDialogVisible.value = false
        await loadData()
      } catch (error: any) {
        ElMessage.error(error.message || '出院失败')
      } finally {
        discharging.value = false
      }
    }
  })
}

async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true

      try {
        const data = {
          ...formData,
          admissionDate: formData.admissionDate
            ? dayjs(formData.admissionDate).format('YYYY-MM-DD')
            : ''
        }

        if (formData.id) {
          await request.put(`/patients/${formData.id}`, data)
          ElMessage.success('更新成功')
        } else {
          await request.post('/patients', data)
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

function handleDialogClose() {
  formRef.value?.resetFields()
}

function formatDate(date: string): string {
  return dayjs(date).format('YYYY-MM-DD')
}
</script>

<style lang="scss" scoped>
.patients {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }

  .search-form {
    margin-bottom: 20px;
  }

  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;

    .el-button {
      margin: 0 !important;
      padding: 5px 12px;
      font-size: 13px;
    }

    .el-button--small {
      height: 28px;
    }
  }
}
</style>
