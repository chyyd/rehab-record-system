<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="900px"
    @close="handleClose"
    destroy-on-close
    class="assessment-dialog"
  >
    <div class="assessment-container">
      <!-- 基本信息卡片 -->
      <div class="info-section">
        <div class="section-header">
          <h3 class="section-title">评估信息</h3>
        </div>
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-width="90px"
          class="compact-form"
          :disabled="isViewMode && !isEditMode"
        >
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="评估日期" prop="assessmentDate">
                <el-date-picker
                  v-model="formData.assessmentDate"
                  type="datetime"
                  placeholder="选择评估日期时间"
                  format="YYYY-MM-DD HH:mm"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="评估医师" prop="assessorId">
                <el-select
                  v-model="formData.assessorId"
                  placeholder="选择评估医师"
                  style="width: 100%;"
                >
                  <el-option
                    v-for="user in assessors"
                    :key="user.id"
                    :label="user.name"
                    :value="user.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- 评估内容卡片（编辑模式或新建模式显示） -->
      <div v-if="!isViewMode || isEditMode" class="assessment-section">
        <div class="section-header">
          <h3 class="section-title">评估内容</h3>
        </div>

        <div class="assessment-grid">
          <!-- Barthel指数 -->
          <div class="assessment-item">
            <div class="item-header">
              <span class="item-label">Barthel指数</span>
              <el-tag v-if="barthelIndex !== null" :type="getBarthelTagType(barthelIndex)" size="small">
                {{ getBarthelDesc(barthelIndex) }}
              </el-tag>
            </div>
            <el-input-number
              v-model="barthelIndex"
              :min="0"
              :max="105"
              placeholder="评分"
              :step="5"
              controls-position="right"
              style="width: 100%;"
            />
          </div>

          <!-- Brunnstrom分期 -->
          <div class="assessment-item full-width">
            <div class="item-header">
              <span class="item-label">Brunnstrom分期</span>
            </div>
            <div class="brunnstrom-grid">
              <el-select v-model="brunnstrom.upper" placeholder="上肢" class="stage-select">
                <el-option v-for="stage in brunnstromStages" :key="stage" :label="stage" :value="stage" />
              </el-select>
              <el-select v-model="brunnstrom.hand" placeholder="手" class="stage-select">
                <el-option v-for="stage in brunnstromStages" :key="stage" :label="stage" :value="stage" />
              </el-select>
              <el-select v-model="brunnstrom.lower" placeholder="下肢" class="stage-select">
                <el-option v-for="stage in brunnstromStages" :key="stage" :label="stage" :value="stage" />
              </el-select>
            </div>
          </div>

          <!-- 平衡功能 -->
          <div class="assessment-item full-width">
            <div class="item-header">
              <span class="item-label">平衡功能</span>
            </div>
            <div class="balance-grid">
              <el-select v-model="balance.sitting" placeholder="坐位平衡" class="balance-select">
                <el-option label="0级" value="0级" />
                <el-option label="I级" value="I级" />
                <el-option label="II级" value="II级" />
                <el-option label="III级" value="III级" />
              </el-select>
              <el-select v-model="balance.standing" placeholder="立位平衡" class="balance-select">
                <el-option label="0级" value="0级" />
                <el-option label="I级" value="I级" />
                <el-option label="II级" value="II级" />
                <el-option label="III级" value="III级" />
              </el-select>
            </div>
          </div>

          <!-- 肌力 -->
          <div class="assessment-item full-width">
            <div class="item-header">
              <span class="item-label">肌力评定</span>
            </div>
            <div class="muscle-grid">
              <el-select v-model="muscleStrength.leftUpper" placeholder="左上肢" class="muscle-select">
                <el-option v-for="level in muscleLevels" :key="level" :label="level" :value="level" />
              </el-select>
              <el-select v-model="muscleStrength.leftLower" placeholder="左下肢" class="muscle-select">
                <el-option v-for="level in muscleLevels" :key="level" :label="level" :value="level" />
              </el-select>
              <el-select v-model="muscleStrength.rightUpper" placeholder="右上肢" class="muscle-select">
                <el-option v-for="level in muscleLevels" :key="level" :label="level" :value="level" />
              </el-select>
              <el-select v-model="muscleStrength.rightLower" placeholder="右下肢" class="muscle-select">
                <el-option v-for="level in muscleLevels" :key="level" :label="level" :value="level" />
              </el-select>
            </div>
          </div>

          <!-- MMSE认知功能 -->
          <div class="assessment-item">
            <div class="item-header">
              <span class="item-label">认知功能 (MMSE)</span>
              <el-tag v-if="mmseScore !== null" :type="getMMSETagType(mmseScore)" size="small">
                {{ getMMSEDesc(mmseScore) }}
              </el-tag>
            </div>
            <el-input-number
              v-model="mmseScore"
              :min="0"
              :max="30"
              placeholder="评分"
              controls-position="right"
              style="width: 100%;"
            />
          </div>

          <!-- 吞咽功能 -->
          <div class="assessment-item">
            <div class="item-header">
              <span class="item-label">吞咽功能</span>
              <el-tag v-if="swallowingLevel !== null" :type="getSwallowingTagType(swallowingLevel)" size="small">
                {{ getSwallowingDesc(swallowingLevel) }}
              </el-tag>
            </div>
            <el-select v-model="swallowingLevel" placeholder="选择等级" style="width: 100%;">
              <el-option :value="1" :label="`1级 - ${getSwallowingDesc(1)}`" />
              <el-option :value="2" :label="`2级 - ${getSwallowingDesc(2)}`" />
              <el-option :value="3" :label="`3级 - ${getSwallowingDesc(3)}`" />
              <el-option :value="4" :label="`4级 - ${getSwallowingDesc(4)}`" />
              <el-option :value="5" :label="`5级 - ${getSwallowingDesc(5)}`" />
            </el-select>
          </div>

          <!-- 语言功能 -->
          <div class="assessment-item">
            <div class="item-header">
              <span class="item-label">语言功能</span>
              <el-tag v-if="languageScore !== null" :type="getLanguageTagType(languageScore)" size="small">
                {{ getLanguageDesc(languageScore) }}
              </el-tag>
            </div>
            <el-input-number
              v-model="languageScore"
              :min="0"
              :max="100"
              placeholder="评分"
              :step="5"
              controls-position="right"
              style="width: 100%;"
            />
          </div>

          <!-- 其他备注 -->
          <div class="assessment-item full-width">
            <div class="item-header">
              <span class="item-label">其他备注</span>
            </div>
            <el-input
              v-model="otherNotes"
              type="textarea"
              :rows="2"
              placeholder="输入其他评估内容或备注（选填）"
              show-word-limit
              maxlength="500"
            />
          </div>

          <!-- 入院评估：康复目标 -->
          <div v-if="assessmentType === 'admission'" class="assessment-item full-width">
            <div class="item-header">
              <span class="item-label required">康复目标</span>
            </div>
            <el-input
              v-model="formData.rehabGoal"
              type="textarea"
              :rows="3"
              placeholder="请输入康复目标，如：提高日常生活自理能力，改善左侧肢体运动功能，2周内达到可扶拐步行"
              show-word-limit
              maxlength="500"
            />
          </div>

          <!-- 出院评估：康复效果和家庭指导 -->
          <template v-if="assessmentType === 'discharge'">
            <div class="assessment-item full-width">
              <div class="item-header">
                <span class="item-label required">康复效果</span>
              </div>
              <el-input
                v-model="formData.rehabEffect"
                type="textarea"
                :rows="3"
                placeholder="请输入康复效果，如：日常生活大部分可自理，可持单拐步行50米，手功能明显改善，达到短期康复目标"
                show-word-limit
                maxlength="500"
              />
            </div>
            <div class="assessment-item full-width">
              <div class="item-header">
                <span class="item-label required">家庭指导</span>
              </div>
              <el-input
                v-model="formData.homeGuidance"
                type="textarea"
                :rows="3"
                placeholder="请输入家庭指导，如：继续家庭康复训练，1个月后门诊复诊"
                show-word-limit
                maxlength="500"
              />
            </div>
          </template>
        </div>
      </div>

      <!-- 查看模式：简洁报告 -->
      <div v-if="isViewMode && !isEditMode" class="report-section">
        <div class="report-header">
          <h3 class="report-title">评估报告</h3>
        </div>
        <div class="report-content">
          <div v-if="barthelIndex !== null" class="report-item">
            <span class="report-label">Barthel指数</span>
            <span class="report-value">{{ barthelIndex }}分</span>
            <el-tag :type="getBarthelTagType(barthelIndex)" size="small">
              {{ getBarthelDesc(barthelIndex) }}
            </el-tag>
          </div>
          <div v-if="brunnstrom.upper || brunnstrom.hand || brunnstrom.lower" class="report-item">
            <span class="report-label">Brunnstrom分期</span>
            <span class="report-value">
              <span v-if="brunnstrom.upper">上肢{{ brunnstrom.upper }}</span>
              <span v-if="brunnstrom.hand">，手{{ brunnstrom.hand }}</span>
              <span v-if="brunnstrom.lower">，下肢{{ brunnstrom.lower }}</span>
            </span>
          </div>
          <div v-if="balance.sitting || balance.standing" class="report-item">
            <span class="report-label">平衡功能</span>
            <span class="report-value">
              <span v-if="balance.sitting">坐位平衡{{ balance.sitting }}</span>
              <span v-if="balance.standing">，立位平衡{{ balance.standing }}</span>
            </span>
          </div>
          <div v-if="Object.values(muscleStrength).some(v => v)" class="report-item">
            <span class="report-label">肌力评定</span>
            <span class="report-value">
              <span v-if="muscleStrength.leftUpper">左上肢{{ muscleStrength.leftUpper }}</span>
              <span v-if="muscleStrength.leftLower">，左下肢{{ muscleStrength.leftLower }}</span>
              <span v-if="muscleStrength.rightUpper">，右上肢{{ muscleStrength.rightUpper }}</span>
              <span v-if="muscleStrength.rightLower">，右下肢{{ muscleStrength.rightLower }}</span>
            </span>
          </div>
          <div v-if="mmseScore !== null" class="report-item">
            <span class="report-label">认知功能</span>
            <span class="report-value">MMSE评分{{ mmseScore }}分</span>
            <el-tag :type="getMMSETagType(mmseScore)" size="small">
              {{ getMMSEDesc(mmseScore) }}
            </el-tag>
          </div>
          <div v-if="swallowingLevel !== null" class="report-item">
            <span class="report-label">吞咽功能</span>
            <span class="report-value">洼田饮水试验{{ swallowingLevel }}级</span>
            <el-tag :type="getSwallowingTagType(swallowingLevel)" size="small">
              {{ getSwallowingDesc(swallowingLevel) }}
            </el-tag>
          </div>
          <div v-if="languageScore !== null" class="report-item">
            <span class="report-label">语言功能</span>
            <span class="report-value">失语症评定{{ languageScore }}分</span>
            <el-tag :type="getLanguageTagType(languageScore)" size="small">
              {{ getLanguageDesc(languageScore) }}
            </el-tag>
          </div>
          <div v-if="otherNotes" class="report-item full-width">
            <span class="report-label">其他备注</span>
            <span class="report-value">{{ otherNotes }}</span>
          </div>
        </div>

        <!-- 入院/出院特定内容 -->
        <div v-if="assessmentType === 'admission' && formData.rehabGoal" class="report-extra">
          <div class="extra-label">康复目标</div>
          <div class="extra-content">{{ formData.rehabGoal }}</div>
        </div>
        <div v-if="assessmentType === 'discharge'">
          <div v-if="formData.rehabEffect" class="report-extra">
            <div class="extra-label">康复效果</div>
            <div class="extra-content">{{ formData.rehabEffect }}</div>
          </div>
          <div v-if="formData.homeGuidance" class="report-extra">
            <div class="extra-label">家庭指导</div>
            <div class="extra-content">{{ formData.homeGuidance }}</div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <!-- 查看模式：显示修改按钮 -->
        <template v-if="isViewMode && !isEditMode">
          <el-button @click="visible = false" size="large">关闭</el-button>
          <el-button type="primary" @click="handleEditMode" size="large">
            修改
          </el-button>
        </template>
        <!-- 编辑模式或新建模式：显示取消和保存按钮 -->
        <template v-else>
          <el-button @click="visible = false" size="large">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit" size="large">
            保存评估
          </el-button>
        </template>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import request from '@/utils/request'

interface Props {
  modelValue: boolean
  patientId: number
  assessmentType: 'admission' | 'discharge'
  existingAssessment?: any
  selectedPatient?: any
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const dialogTitle = computed(() => {
  if (isViewMode.value && !isEditMode.value) {
    return props.assessmentType === 'admission' ? '入院评估报告' : '出院评估报告'
  }
  return props.assessmentType === 'admission' ? '入院评估' : '出院评估'
})

// 监听对话框显示状态，设置查看模式
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    if (props.existingAssessment) {
      isViewMode.value = true
      isEditMode.value = false
      loadExistingAssessment()
    } else {
      isViewMode.value = false
      isEditMode.value = false
      resetForm()
    }
  }
})

const formRef = ref<FormInstance>()
const submitting = ref(false)
const assessors = ref<any[]>([])
const isViewMode = ref(false)
const isEditMode = ref(false)

// 评估数据
const barthelIndex = ref<number | null>(null)
const brunnstrom = reactive({
  upper: '',
  hand: '',
  lower: ''
})
const balance = reactive({
  sitting: '',
  standing: ''
})
const muscleStrength = reactive({
  leftUpper: '',
  leftLower: '',
  rightUpper: '',
  rightLower: ''
})
const mmseScore = ref<number | null>(null)
const swallowingLevel = ref<number | null>(null)
const languageScore = ref<number | null>(null)
const otherNotes = ref('')

// 选项数据
const brunnstromStages = ['I期', 'II期', 'III期', 'IV期', 'V期', 'VI期']
const muscleLevels = ['0级', '1级', '2级', '3级', '4级', '5级', '3-级', '3+级', '4-级', '4+级']

// 辅助函数：获取本地时间的格式化字符串
function getLocalDateTimeString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const formData = reactive<any>({
  assessmentDate: getLocalDateTimeString(),
  assessorId: null,
  rehabGoal: '',
  rehabEffect: '',
  homeGuidance: ''
})

const rules: FormRules = {
  assessmentDate: [{ required: true, message: '请选择评估日期', trigger: 'change' }],
  assessorId: [{ required: true, message: '请选择评估医师', trigger: 'change' }]
}

// 描述生成函数
function getBarthelDesc(score: number | null): string {
  if (score === null) return ''
  if (score <= 20) return '完全依赖'
  if (score <= 40) return '重度依赖'
  if (score <= 60) return '中度依赖'
  if (score <= 80) return '轻度依赖'
  if (score <= 99) return '极轻度依赖'
  return '完全独立'
}

function getBarthelTagType(score: number | null): any {
  if (score === null) return 'info'
  if (score <= 40) return 'danger'
  if (score <= 60) return 'warning'
  if (score <= 80) return 'success'
  return 'primary'
}

function getMMSEDesc(score: number | null): string {
  if (score === null) return ''
  if (score >= 27) return '正常'
  if (score >= 21) return '轻度认知障碍'
  if (score >= 11) return '中度认知障碍'
  return '重度认知障碍'
}

function getMMSETagType(score: number | null): any {
  if (score === null) return 'info'
  if (score >= 27) return 'success'
  if (score >= 21) return 'warning'
  if (score >= 11) return 'danger'
  return 'danger'
}

function getSwallowingDesc(level: number | null): string {
  const descriptions: Record<number, string> = {
    1: '正常',
    2: '可疑',
    3: '轻度吞咽困难',
    4: '中度吞咽困难',
    5: '重度吞咽困难'
  }
  return descriptions[level ?? 0] || ''
}

function getSwallowingTagType(level: number | null): any {
  if (level === null) return 'info'
  if (level === 1) return 'success'
  if (level === 2) return 'primary'
  if (level === 3) return 'warning'
  return 'danger'
}

function getLanguageDesc(score: number | null): string {
  if (score === null) return ''
  if (score >= 80) return '正常'
  if (score >= 60) return '轻度失语'
  if (score >= 40) return '中度失语'
  if (score >= 20) return '重度失语'
  return '完全失语'
}

function getLanguageTagType(score: number | null): any {
  if (score === null) return 'info'
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  if (score >= 40) return 'danger'
  return 'danger'
}

function getAssessorName(assessorId: number): string {
  const assessor = assessors.value.find((u: any) => u.id === assessorId)
  return assessor?.name || '-'
}

function formatDateTime(date: string | Date | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 加载评估医师列表
async function loadAssessors() {
  try {
    const data = await request.get('/users')
    assessors.value = data.filter((u: any) =>
      (u.role === 'therapist' || u.role === 'physician') && u.isActive
    )
  } catch (error) {
    console.error('Failed to load assessors:', error)
  }
}

// 加载现有评估数据
function loadExistingAssessment() {
  if (!props.existingAssessment) return

  Object.assign(formData, props.existingAssessment)

  // 将 ISO 8601 格式的时间转换为本地时间字符串格式
  if (props.existingAssessment.assessmentDate) {
    const d = new Date(props.existingAssessment.assessmentDate)
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      const seconds = String(d.getSeconds()).padStart(2, '0')
      formData.assessmentDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }
  }

  barthelIndex.value = props.existingAssessment.barthelIndex || null
  mmseScore.value = props.existingAssessment.cognitiveMMSE || null
  swallowingLevel.value = props.existingAssessment.swallowingTest || null
  languageScore.value = props.existingAssessment.languageScore || null
  otherNotes.value = props.existingAssessment.otherNotes || ''

  if (props.existingAssessment.brunnstromStage) {
    const data = typeof props.existingAssessment.brunnstromStage === 'string'
      ? JSON.parse(props.existingAssessment.brunnstromStage)
      : props.existingAssessment.brunnstromStage
    Object.assign(brunnstrom, data)
  }

  if (props.existingAssessment.balanceFunction) {
    const data = typeof props.existingAssessment.balanceFunction === 'string'
      ? JSON.parse(props.existingAssessment.balanceFunction)
      : props.existingAssessment.balanceFunction
    Object.assign(balance, data)
  }

  if (props.existingAssessment.muscleStrength) {
    const data = typeof props.existingAssessment.muscleStrength === 'string'
      ? JSON.parse(props.existingAssessment.muscleStrength)
      : props.existingAssessment.muscleStrength
    Object.assign(muscleStrength, data)
  }
}

// 重置表单
function resetForm() {
  barthelIndex.value = null
  Object.assign(brunnstrom, { upper: '', hand: '', lower: '' })
  Object.assign(balance, { sitting: '', standing: '' })
  Object.assign(muscleStrength, { leftUpper: '', leftLower: '', rightUpper: '', rightLower: '' })
  mmseScore.value = null
  swallowingLevel.value = null
  languageScore.value = null
  otherNotes.value = ''
  Object.assign(formData, {
    assessmentDate: getLocalDateTimeString(),
    assessorId: null,
    rehabGoal: '',
    rehabEffect: '',
    homeGuidance: ''
  })
}

loadAssessors()

async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true

      try {
        const isUpdate = !!props.existingAssessment?.id

        const data: any = {
          assessmentDate: formData.assessmentDate ? new Date(formData.assessmentDate).toISOString() : new Date().toISOString(),
          selectedItems: ['simplified']
        }

        if (!isUpdate) {
          data.patientId = props.patientId
          data.assessorId = formData.assessorId
          data.assessmentType = props.assessmentType
        }

        if (barthelIndex.value !== null) data.barthelIndex = barthelIndex.value
        if (mmseScore.value !== null) data.cognitiveMMSE = mmseScore.value
        if (swallowingLevel.value !== null) data.swallowingTest = swallowingLevel.value
        if (languageScore.value !== null) data.languageScore = languageScore.value
        if (otherNotes.value) data.otherNotes = otherNotes.value

        if (brunnstrom.upper || brunnstrom.hand || brunnstrom.lower) {
          data.brunnstromStage = brunnstrom
        }
        if (balance.sitting || balance.standing) {
          data.balanceFunction = balance
        }
        if (Object.values(muscleStrength).some(v => v)) {
          data.muscleStrength = muscleStrength
        }

        if (props.assessmentType === 'admission') {
          data.rehabGoal = formData.rehabGoal
        }

        if (props.assessmentType === 'discharge') {
          data.rehabEffect = formData.rehabEffect
          data.homeGuidance = formData.homeGuidance
        }

        if (isUpdate) {
          await request.put(`/assessments/${props.existingAssessment.id}`, data)
          ElMessage.success('更新成功')
        } else {
          await request.post('/assessments', data)
          ElMessage.success('保存成功')
        }

        emit('success')
        visible.value = false
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

function handleClose() {
  formRef.value?.resetFields()
  isViewMode.value = false
  isEditMode.value = false
  resetForm()
}

function handleEditMode() {
  isViewMode.value = false
  isEditMode.value = true
}
</script>

<style lang="scss" scoped>
.assessment-dialog {
  :deep(.el-dialog__body) {
    max-height: 70vh;
    overflow-y: auto;
    padding: 24px;
    background: #f8f9fa;
  }

  :deep(.el-dialog__header) {
    padding: 20px 24px;
    background: white;
    border-bottom: 1px solid #e5e7eb;
  }

  :deep(.el-dialog__title) {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px;
    background: white;
    border-top: 1px solid #e5e7eb;
  }
}

.assessment-container {
  .info-section,
  .assessment-section {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-header {
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid #409eff;

    .section-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
  }

  .compact-form {
    :deep(.el-form-item) {
      margin-bottom: 0;
    }

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: #4b5563;
    }
  }

  .assessment-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    .assessment-item {
      display: flex;
      flex-direction: column;
      gap: 12px;

      &.full-width {
        grid-column: 1 / -1;
      }

      .item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .item-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          position: relative;
          padding-left: 10px;

          &.required::before {
            content: '*';
            position: absolute;
            left: 0;
            color: #ef4444;
          }
        }
      }

      :deep(.el-input-number) {
        width: 100%;

        .el-input__wrapper {
          box-shadow: 0 0 0 1px #d1d5db inset;
          transition: all 0.2s;

          &:hover {
            box-shadow: 0 0 0 1px #409eff inset;
          }
        }
      }

      :deep(.el-select) {
        .el-input__wrapper {
          box-shadow: 0 0 0 1px #d1d5db inset;
          transition: all 0.2s;

          &:hover {
            box-shadow: 0 0 0 1px #409eff inset;
          }
        }
      }

      :deep(.el-textarea__inner) {
        box-shadow: 0 0 0 1px #d1d5db inset;
        transition: all 0.2s;

        &:hover {
          box-shadow: 0 0 0 1px #409eff inset;
        }

        &:focus {
          box-shadow: 0 0 0 2px #409eff inset;
        }
      }
    }

    .brunnstrom-grid,
    .balance-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;

      .stage-select,
      .balance-select {
        width: 100%;
      }
    }

    .muscle-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;

      .muscle-select {
        width: 100%;
      }
    }
  }

  // 简洁报告样式
  .report-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .report-header {
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #409eff;

      .report-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
      }
    }

    .report-content {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .report-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: #f9fafb;
        border-radius: 8px;
        border-left: 3px solid #409eff;
        transition: all 0.2s;

        &:hover {
          background: #f3f4f6;
        }

        &.full-width {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .report-label {
          font-size: 13px;
          font-weight: 600;
          color: #4b5563;
          min-width: 100px;
        }

        .report-value {
          font-size: 14px;
          color: #1f2937;
          flex: 1;
        }
      }
    }

    .report-extra {
      margin-top: 20px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 3px solid #10b981;

      .extra-label {
        font-size: 13px;
        font-weight: 600;
        color: #4b5563;
        margin-bottom: 8px;
      }

      .extra-content {
        font-size: 14px;
        color: #1f2937;
        line-height: 1.6;
        white-space: pre-wrap;
      }
    }

    .report-footer {
      display: flex;
      gap: 32px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;

      .footer-item {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .footer-label {
          font-size: 12px;
          color: #9ca3af;
        }

        .footer-value {
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    .el-button {
      min-width: 100px;
      padding: 10px 24px;
      font-weight: 500;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }
  }
}

// Element Plus 样式优化
:deep(.el-tag) {
  font-weight: 500;
  border: none;
}

:deep(.el-input__wrapper),
:deep(.el-select .el-input__wrapper) {
  border-radius: 6px;
  transition: all 0.2s;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  border-radius: 6px;
}

:deep(.el-button) {
  border-radius: 6px;
}
</style>
