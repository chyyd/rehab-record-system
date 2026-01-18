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
        <el-table-column label="操作" width="580" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="handleEdit(row)">
                编辑
              </el-button>
              <el-button
                v-if="!row.dischargeDate"
                type="info"
                size="small"
                @click="handleQRCode(row)"
                :disabled="!row.medicalRecordNo"
              >
                二维码
              </el-button>
              <el-button type="success" size="small" @click="handleViewRecords(row)">
                记录
              </el-button>
              <el-button
                v-if="row.needsAssessment !== false"
                :type="hasAssessment(row.id, 'admission') ? 'success' : 'info'"
                size="small"
                @click="handleAdmissionAssessment(row)"
              >
                入院评估
              </el-button>
              <el-button
                v-if="row.needsAssessment !== false"
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
              <el-button
                v-if="row.dischargeDate && isAdmin"
                type="warning"
                size="small"
                @click="handleRevokeDischarge(row)"
              >
                撤销出院
              </el-button>
              <el-button
                v-if="row.dischargeDate && isAdmin"
                type="danger"
                size="small"
                @click="handleDelete(row)"
              >
                删除
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

        <el-form-item label="是否需要评估">
          <el-switch
            v-model="formData.needsAssessment"
            active-text="需要"
            inactive-text="不需要"
          />
          <span style="margin-left: 10px; color: #909399; font-size: 12px;">
            关闭后将隐藏评估按钮和打印单中的评估部分
          </span>
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

    <!-- Delete Dialog -->
    <el-dialog
      v-model="deleteDialogVisible"
      :title="deleteStep === 1 ? '删除患者确认' : deleteStep === 2 ? '安全验证' : '删除完成'"
      width="550px"
      @close="handleDeleteDialogClose"
    >
      <!-- 第一步：显示删除预览 -->
      <div v-if="deleteStep === 1 && deletePreview">
        <el-alert
          title="警告"
          type="error"
          :closable="false"
          show-icon
          style="margin-bottom: 20px;"
        >
          您即将删除患者档案，此操作不可恢复
        </el-alert>

        <el-descriptions title="患者信息" :column="2" border style="margin-bottom: 20px;">
          <el-descriptions-item label="姓名">{{ deletePreview.patient.name }}</el-descriptions-item>
          <el-descriptions-item label="病历号">{{ deletePreview.patient.medicalRecordNo }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">以下数据将被永久删除</el-divider>

        <el-row :gutter="16" style="margin-top: 16px;">
          <el-col :span="12">
            <el-statistic title="康复评估" :value="deletePreview.statistics.assessments">
              <template #suffix>条</template>
            </el-statistic>
          </el-col>
          <el-col :span="12">
            <el-statistic title="治疗记录" :value="deletePreview.statistics.treatmentRecords">
              <template #suffix>条</template>
            </el-statistic>
          </el-col>
        </el-row>

        <el-row :gutter="16" style="margin-top: 16px;">
          <el-col :span="12">
            <el-statistic title="签名图片" :value="deletePreview.statistics.signaturePhotos">
              <template #suffix>张</template>
            </el-statistic>
          </el-col>
          <el-col :span="12">
            <el-statistic title="文件总数" :value="deletePreview.statistics.files">
              <template #suffix>个</template>
            </el-statistic>
          </el-col>
        </el-row>

        <el-alert
          type="warning"
          :closable="false"
          show-icon
          style="margin-top: 20px;"
        >
          为防止误操作，需要再次输入病历号确认
        </el-alert>
      </div>

      <!-- 第二步：输入病历号验证 -->
      <el-form
        v-if="deleteStep === 2"
        ref="deleteConfirmFormRef"
        :model="{ confirmInput: deleteConfirmInput }"
        :rules="deleteConfirmRules"
        label-width="100px"
      >
        <el-form-item label="患者姓名">
          <el-input :value="deletePreview?.patient.name" disabled />
        </el-form-item>
        <el-form-item label="病历号">
          <el-input :value="deletePreview?.patient.medicalRecordNo" disabled />
        </el-form-item>
        <el-form-item label="确认病历号" prop="confirmInput">
          <el-input
            v-model="deleteConfirmInput"
            placeholder="请输入病历号以确认删除"
            clearable
          />
        </el-form-item>
        <el-alert
          type="error"
          :closable="false"
          show-icon
        >
          请输入上方显示的病历号以确认删除操作
        </el-alert>
      </el-form>

      <!-- 第三步：删除成功 -->
      <div v-if="deleteStep === 3 && deleteResult">
        <el-result
          icon="success"
          title="删除成功"
          sub-title="患者档案及相关数据已全部清理"
        >
          <template #extra>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="康复评估">{{ deleteResult.statistics.assessments }} 条</el-descriptions-item>
              <el-descriptions-item label="治疗记录">{{ deleteResult.statistics.treatmentRecords }} 条</el-descriptions-item>
              <el-descriptions-item label="签名图片">{{ deleteResult.statistics.signaturePhotos }} 张</el-descriptions-item>
              <el-descriptions-item label="已清理文件">{{ deleteResult.deletedFiles }} 个</el-descriptions-item>
            </el-descriptions>
            <el-alert
              v-if="deleteResult.failedFiles > 0"
              :title="`${deleteResult.failedFiles} 个文件清理失败`"
              type="warning"
              :closable="false"
              show-icon
              style="margin-top: 16px;"
            />
          </template>
        </el-result>
      </div>

      <template #footer>
        <template v-if="deleteStep === 1">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="handleDeleteStep1">继续</el-button>
        </template>
        <template v-if="deleteStep === 2">
          <el-button @click="deleteStep = 1">返回</el-button>
          <el-button type="danger" :loading="deleting" @click="handleDeleteStep2">确认删除</el-button>
        </template>
        <template v-if="deleteStep === 3">
          <el-button type="primary" @click="deleteDialogVisible = false">确定</el-button>
        </template>
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

    <!-- 二维码对话框 -->
    <PatientQRCodeDialog
      v-model:visible="qrCodeDialogVisible"
      :patient="currentPatient"
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
import PatientQRCodeDialog from '@/components/PatientQRCodeDialog.vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 判断是否是管理员
const isAdmin = computed(() => userStore.hasRole('admin'))

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
const deleteConfirmFormRef = ref<FormInstance>()
const dischargeForm = reactive({
  dischargeDate: new Date()
})

// 二维码对话框状态
const qrCodeDialogVisible = ref(false)
const currentPatient = ref<any>(null)

// 评估相关
const assessmentDialogVisible = ref(false)
const currentAssessmentType = ref<'admission' | 'discharge'>('admission')
const currentAssessment = ref<any>(null)
const patientAssessments = ref<Record<number, any>>({})

// 删除相关
const deleteDialogVisible = ref(false)
const deleteStep = ref<1 | 2 | 3>(1)
const deletePreview = ref<any>(null)
const deleteConfirmInput = ref('')
const deleteResult = ref<any>(null)
const deleting = ref(false)

const dischargeRules: FormRules = {
  dischargeDate: [{ required: true, message: '请选择出院日期', trigger: 'change' }]
}

const deleteConfirmRules: FormRules = {
  confirmInput: [
    { required: true, message: '请输入病历号', trigger: 'blur' },
    {
      validator: (rule: any, value: any, callback: any) => {
        if (value !== deletePreview.value?.patient?.medicalRecordNo) {
          callback(new Error('病历号不匹配'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
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
  admissionDate: '',
  needsAssessment: true  // 默认需要评估
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
    admissionDate: '',
    needsAssessment: true  // 默认需要评估
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

// 撤销出院
async function handleRevokeDischarge(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定要撤销患者 ${row.name} 的出院状态吗？\n\n撤销后患者将重新回到在院患者列表，可以继续进行治疗。`,
      '撤销出院确认',
      {
        confirmButtonText: '确认撤销',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 调用API清空出院日期
    await request.put(`/patients/${row.id}`, {
      dischargeDate: null
    })

    ElMessage.success('撤销出院成功')
    await loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '撤销出院失败')
    }
  }
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

// 删除患者 - 打开对话框
async function handleDelete(row: any) {
  try {
    selectedPatient.value = row;
    // 获取删除预览
    const preview = await request.get(`/patients/${row.id}/delete-preview`);
    deletePreview.value = preview;
    deleteStep.value = 1;
    deleteConfirmInput.value = '';
    deleteResult.value = null;
    deleteDialogVisible.value = true;
  } catch (error: any) {
    ElMessage.error(error.message || '获取删除预览失败');
  }
}

// 删除第一步：继续到第二步
function handleDeleteStep1() {
  deleteStep.value = 2;
}

// 删除第二步：执行删除
async function handleDeleteStep2() {
  if (!deleteConfirmFormRef.value) return;

  await deleteConfirmFormRef.value.validate(async (valid) => {
    if (valid) {
      deleting.value = true;

      try {
        const result = await request.delete(`/patients/${selectedPatient.value.id}`);
        deleteResult.value = result;
        deleteStep.value = 3;
        deleting.value = false;

        // 刷新列表
        await loadData();
      } catch (error: any) {
        deleting.value = false;
        ElMessage.error(error.message || '删除失败');
      }
    }
  });
}

// 关闭删除对话框
function handleDeleteDialogClose() {
  deleteStep.value = 1;
  deletePreview.value = null;
  deleteConfirmInput.value = '';
  deleteResult.value = null;
}

// 打开二维码对话框
function handleQRCode(row: any) {
  if (!row.medicalRecordNo) {
    ElMessage.warning('该患者病历号缺失,无法生成二维码')
    return
  }
  currentPatient.value = row
  qrCodeDialogVisible.value = true
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
