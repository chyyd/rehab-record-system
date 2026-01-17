<template>
  <view class="create-container">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">新增患者</text>
    </view>

    <!-- 表单 -->
    <view class="form-container">
      <!-- 基本信息 -->
      <view class="form-section">
        <view class="section-title">
          <text class="required">*</text>
          <text>基本信息</text>
        </view>

        <view class="form-item">
          <text class="form-label">姓名</text>
          <input
            class="form-input"
            type="text"
            v-model="formData.name"
            placeholder="请输入患者姓名"
            placeholder-style="color: #999"
            @input="generatePinyin"
          />
          <text v-if="pinyinPreview" class="pinyin-hint">拼音: {{ pinyinPreview }}</text>
        </view>

        <view class="form-item">
          <text class="form-label">病历号</text>
          <input
            class="form-input"
            type="number"
            v-model="formData.medicalRecordNo"
            placeholder="请输入病历号"
            placeholder-style="color: #999"
          />
        </view>

        <view class="form-item">
          <text class="form-label">性别</text>
          <view class="radio-group">
            <view
              class="radio-item"
              :class="{ active: formData.gender === '男' }"
              @click="formData.gender = '男'"
            >
              <text class="radio-text">男</text>
            </view>
            <view
              class="radio-item"
              :class="{ active: formData.gender === '女' }"
              @click="formData.gender = '女'"
            >
              <text class="radio-text">女</text>
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">年龄</text>
          <input
            class="form-input"
            type="number"
            v-model="formData.age"
            placeholder="请输入年龄"
            placeholder-style="color: #999"
          />
        </view>

        <view class="form-item">
          <text class="form-label">医保类型</text>
          <picker
            mode="selector"
            :range="insuranceTypes"
            :value="insuranceTypeIndex"
            @change="onInsuranceTypeChange"
          >
            <view class="picker-input">
              <text :class="['picker-text', { placeholder: !formData.insuranceType }]">
                {{ formData.insuranceType || '请选择医保类型' }}
              </text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>
        </view>
      </view>

      <!-- 住院信息 -->
      <view class="form-section">
        <view class="section-title">
          <text class="required">*</text>
          <text>住院信息</text>
        </view>

        <view class="form-item">
          <text class="form-label">主管医生</text>
          <input
            class="form-input"
            type="text"
            v-model="formData.doctor"
            placeholder="请输入主管医生"
            placeholder-style="color: #999"
          />
        </view>

        <view class="form-item">
          <text class="form-label">入院日期</text>
          <picker
            mode="date"
            :value="formData.admissionDate"
            @change="onAdmissionDateChange"
          >
            <view class="picker-input">
              <text :class="['picker-text', { placeholder: !formData.admissionDate }]">
                {{ formData.admissionDate || '请选择入院日期' }}
              </text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">主要诊断</text>
          <textarea
            class="form-textarea"
            v-model="formData.diagnosis"
            placeholder="请输入主要诊断"
            placeholder-style="color: #999"
            :maxlength="200"
          />
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-actions">
      <button class="submit-btn primary" @click="handleSubmit">保存患者</button>
      <button class="submit-btn secondary" @click="goBack">取消</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { usePatientStore } from '@/stores/patient'
import { request } from '@/utils/request'
import { pinyin } from 'pinyin-pro'

const userStore = useUserStore()
const patientStore = usePatientStore()
const token = userStore.getToken()

// 表单数据
const formData = ref({
  name: '',
  medicalRecordNo: '',
  gender: '男',
  age: '',
  insuranceType: '',
  doctor: '',
  admissionDate: '',
  diagnosis: '',
})

// 拼音预览
const pinyinPreview = ref('')

// 医保类型选项
const insuranceTypes = ['城镇职工基本医疗保险', '城乡居民基本医疗保险', '铁路医保', '异地医保', '自费']

// 医保类型索引
const insuranceTypeIndex = computed(() => {
  return insuranceTypes.indexOf(formData.value.insuranceType)
})

// 初始化：设置入院日期为今天
function initFormData() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  formData.value.admissionDate = `${year}-${month}-${day}`
}

// 页面加载时初始化
initFormData()

// 生成拼音（使用pinyin-pro库）
function generatePinyin() {
  const name = formData.value.name.trim()
  if (!name) {
    pinyinPreview.value = ''
    return
  }

  try {
    // 使用pinyin-pro库生成拼音首字母
    const result = pinyin(name, { pattern: 'first', toneType: 'none' })
    const pinyinStr = result.toLowerCase().replace(/\s+/g, '')

    // 同时生成完整拼音用于预览
    const fullPinyin = pinyin(name, { pattern: 'pinyin', toneType: 'none' })
    const fullPinyinStr = fullPinyin.toLowerCase().replace(/\s+/g, ' ')

    pinyinPreview.value = `${pinyinStr} (${fullPinyinStr})`
  } catch (error) {
    console.error('生成拼音失败:', error)
    pinyinPreview.value = ''
  }
}

// 选择医保类型
function onInsuranceTypeChange(e: any) {
  formData.value.insuranceType = insuranceTypes[e.detail.value]
}

// 选择入院日期
function onAdmissionDateChange(e: any) {
  formData.value.admissionDate = e.detail.value
}

// 验证表单
function validateForm(): boolean {
  if (!formData.value.name.trim()) {
    uni.showToast({
      title: '请输入患者姓名',
      icon: 'none'
    })
    return false
  }

  if (!formData.value.medicalRecordNo.trim()) {
    uni.showToast({
      title: '请输入病历号',
      icon: 'none'
    })
    return false
  }

  if (!formData.value.gender) {
    uni.showToast({
      title: '请选择性别',
      icon: 'none'
    })
    return false
  }

  if (!formData.value.age || parseInt(formData.value.age) <= 0) {
    uni.showToast({
      title: '请输入有效的年龄',
      icon: 'none'
    })
    return false
  }

  if (!formData.value.insuranceType) {
    uni.showToast({
      title: '请选择医保类型',
      icon: 'none'
    })
    return false
  }

  if (!formData.value.doctor.trim()) {
    uni.showToast({
      title: '请输入主管医生',
      icon: 'none'
    })
    return false
  }

  if (!formData.value.admissionDate) {
    uni.showToast({
      title: '请选择入院日期',
      icon: 'none'
    })
    return false
  }

  if (!formData.value.diagnosis.trim()) {
    uni.showToast({
      title: '请输入主要诊断',
      icon: 'none'
    })
    return false
  }

  return true
}

// 提交表单
async function handleSubmit() {
  console.log('🔵 ========== 开始提交表单 ==========')
  console.log('patientStore 是否存在:', !!patientStore)
  console.log('patientStore 方法:', typeof patientStore.setPendingSearch)

  if (!validateForm()) {
    return
  }

  uni.showLoading({
    title: '保存中...'
  })

  try {
    // 生成最终拼音（只取首字母）
    const result = pinyin(formData.value.name, { pattern: 'first', toneType: 'none' })
    const finalPinyin = result.toLowerCase().replace(/\s+/g, '')

    const response = await request({
      url: '/patients',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        name: formData.value.name,
        medicalRecordNo: formData.value.medicalRecordNo,
        gender: formData.value.gender,
        age: String(formData.value.age), // 转换为字符串以匹配数据库schema
        insuranceType: formData.value.insuranceType,
        doctor: formData.value.doctor,
        admissionDate: formData.value.admissionDate,
        diagnosis: formData.value.diagnosis,
        pinyin: finalPinyin,
        needsAssessment: false // 手机端新增患者默认不需要评估
      }
    })

    uni.hideLoading()

    if (response.statusCode === 201) {
      const newPatient = response.data
      const medicalRecordNo = newPatient.medicalRecordNo
      console.log('✅ 患者创建成功:', newPatient)

      // 保存待搜索的病历号到store
      patientStore.setPendingSearch(medicalRecordNo)
      console.log('📌 已设置待搜索病历号:', medicalRecordNo)

      // 显示保存成功提示，然后跳转到患者列表并搜索该患者
      uni.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 1000
      })

      // 延迟跳转，确保toast显示
      setTimeout(() => {
        // 跳转到患者列表（tabBar页面）
        uni.switchTab({
          url: '/pages/patients/list',
          success: () => {
            console.log('✅ 跳转到患者列表成功')
          },
          fail: (err) => {
            console.error('❌ 跳转失败:', err)
          }
        })
      }, 500)
    } else {
      throw new Error(response.data?.message || '保存失败')
    }
  } catch (error: any) {
    console.error('保存患者失败:', error)
    uni.hideLoading()

    uni.showToast({
      title: error.message || '保存失败',
      icon: 'none',
      duration: 2000
    })
  }
}

function goBack() {
  // 跳转到患者列表页面
  uni.switchTab({
    url: '/pages/patients/list'
  })
}
</script>

<style lang="scss" scoped>
/* 医疗专业配色 */
$medical-blue: #0ea5e9;
$medical-teal: #14b8a6;
$medical-green: #10b981;
$medical-cyan: #06b6d4;
$sky-light: #e0f2fe;
$teal-light: #ccfbf1;
$primary-dark: #0284c7;
$bg-page: #f8fafc;

.create-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f9ff 0%, $bg-page 100%);
  padding-bottom: 180rpx;
}

.page-header {
  background: linear-gradient(135deg, $medical-blue 0%, $medical-cyan 100%);
  padding: 40rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(14, 165, 233, 0.12);

  .page-title {
    font-size: 40rpx;
    font-weight: 600;
    color: #fff;
  }
}

.form-container {
  padding: 24rpx;
}

.form-section {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);

  .section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 28rpx;
    position: relative;
    padding-left: 20rpx;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 6rpx;
      height: 32rpx;
      background: linear-gradient(180deg, $medical-blue 0%, $medical-cyan 100%);
      border-radius: 3rpx;
    }

    .required {
      color: #ef4444;
      margin-right: 5rpx;
    }
  }
}

.form-item {
  margin-bottom: 28rpx;

  &:last-child {
    margin-bottom: 0;
  }

  .form-label {
    display: block;
    font-size: 28rpx;
    color: #475569;
    margin-bottom: 16rpx;
    font-weight: 500;
  }

  .form-input {
    width: 100%;
    height: 80rpx;
    padding: 0 24rpx;
    background-color: #f8fafc;
    border: 2rpx solid #e2e8f0;
    border-radius: 16rpx;
    font-size: 28rpx;
    color: #1e293b;
    transition: border-color 0.2s;

    &:focus {
      border-color: $medical-blue;
      background-color: #fff;
    }
  }

  .radio-group {
    display: flex;
    gap: 24rpx;

    .radio-item {
      flex: 1;
      height: 80rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f8fafc;
      border: 2rpx solid #e2e8f0;
      border-radius: 16rpx;
      transition: all 0.2s;

      .radio-text {
        font-size: 28rpx;
        color: #475569;
      }

      &.active {
        background: linear-gradient(135deg, $medical-blue 0%, $medical-cyan 100%);
        border-color: $medical-blue;
        box-shadow: 0 4rpx 12rpx rgba(14, 165, 233, 0.2);

        .radio-text {
          color: #fff;
          font-weight: 600;
        }
      }
    }
  }

  .pinyin-hint {
    display: block;
    margin-top: 12rpx;
    font-size: 24rpx;
    color: #0ea5e9;
    font-weight: 500;
  }

  .form-textarea {
    width: 100%;
    min-height: 160rpx;
    padding: 20rpx 24rpx;
    background-color: #f8fafc;
    border: 2rpx solid #e2e8f0;
    border-radius: 16rpx;
    font-size: 28rpx;
    color: #1e293b;
    transition: border-color 0.2s;

    &:focus {
      border-color: $medical-blue;
      background-color: #fff;
    }
  }

  .picker-input {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 80rpx;
    padding: 0 24rpx;
    background-color: #f8fafc;
    border: 2rpx solid #e2e8f0;
    border-radius: 16rpx;

    .picker-text {
      font-size: 28rpx;
      color: #1e293b;

      &.placeholder {
        color: #94a3b8;
      }
    }

    .picker-arrow {
      font-size: 40rpx;
      color: #94a3b8;
      font-weight: 300;
    }
  }
}

.submit-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx;
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
  display: flex;
  gap: 16rpx;

  .submit-btn {
    flex: 1;
    height: 88rpx;
    border-radius: 24rpx;
    font-size: 32rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;

    &.primary {
      background: linear-gradient(135deg, $medical-blue 0%, $primary-dark 100%);
      color: #fff;
      box-shadow: 0 6rpx 20rpx rgba(14, 165, 233, 0.3);
    }

    &.secondary {
      background-color: #f1f5f9;
      color: #475569;
    }
  }
}
</style>
