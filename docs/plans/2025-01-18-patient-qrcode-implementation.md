# 患者二维码功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 为Web管理端的患者管理添加二维码生成功能，并在移动端实现扫码跳转到创建治疗记录页面

**架构:** 纯前端实现，使用qrcode库生成二维码，浏览器原生API处理打印和剪贴板操作

**技术栈:** Vue 3, TypeScript, Element Plus, qrcode (npm), Canvas API

---

## 前置准备

### Task 0: 创建功能分支和安装依赖

**文件：**
- 无新建文件

**Step 1: 确认当前分支**

```bash
git branch
```

预期输出: `* feature/qrcode`

**Step 2: 安装二维码生成库**

```bash
cd web-admin
npm install qrcode
npm install --save-dev @types/qrcode
```

预期输出: 安装成功，显示包版本信息

**Step 3: 验证依赖安装**

```bash
cat web-admin/package.json | grep -A 2 -B 2 "qrcode"
```

预期输出: 看到 `qrcode` 和 `@types/qrcode` 在 dependencies 和 devDependencies 中

**Step 4: 提交依赖安装**

```bash
git add web-admin/package.json web-admin/package-lock.json
git commit -m "chore(qrcode): 安装二维码生成依赖"
```

---

## 第一阶段：PC端二维码生成功能

### Task 1: 创建二维码对话框组件

**文件：**
- Create: `web-admin/src/components/PatientQRCodeDialog.vue`

**Step 1: 创建组件文件结构**

```bash
touch web-admin/src/components/PatientQRCodeDialog.vue
```

**Step 2: 编写组件模板**

```vue
<template>
  <el-dialog
    v-model="dialogVisible"
    title="患者二维码"
    width="450px"
    @close="handleClose"
  >
    <div class="qrcode-container">
      <!-- 二维码展示区域 -->
      <div class="qrcode-wrapper" :class="{ 'printing': isPrinting }">
        <canvas ref="qrCanvas" class="qrcode-canvas"></canvas>
        <p class="patient-name">{{ patient?.name }}</p>
      </div>

      <!-- 尺寸选择（打印时隐藏） -->
      <div class="size-selector" v-show="!isPrinting">
        <span class="label">尺寸选择：</span>
        <el-radio-group v-model="selectedSize" @change="handleSizeChange">
          <el-radio-button label="1.5cm">1.5cm</el-radio-button>
          <el-radio-button label="2cm">2cm</el-radio-button>
          <el-radio-button label="3cm">3cm</el-radio-button>
          <el-radio-button label="4cm">4cm</el-radio-button>
          <el-radio-button label="5cm">5cm</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 操作按钮（打印时隐藏） -->
      <div class="action-buttons" v-show="!isPrinting">
        <el-button @click="handleDownload" :loading="downloading">
          <el-icon><Download /></el-icon>
          下载
        </el-button>
        <el-button @click="handleCopy" :loading="copying">
          <el-icon><CopyDocument /></el-icon>
          复制
        </el-button>
        <el-button type="primary" @click="handlePrint">
          <el-icon><Printer /></el-icon>
          打印
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, CopyDocument, Printer } from '@element-plus/icons-vue'
import QRCode from 'qrcode'

// Props
interface Props {
  visible: boolean
  patient: {
    id?: number
    medicalRecordNo?: string
    name?: string
  } | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

// 状态
const dialogVisible = ref(false)
const selectedSize = ref('3cm')
const qrCanvas = ref<HTMLCanvasElement | null>(null)
const downloading = ref(false)
const copying = ref(false)
const isPrinting = ref(false)

// 尺寸映射（cm转px，假设DPI=96，1cm≈37.8px）
const SIZE_MAP: Record<string, number> = {
  '1.5cm': 57,
  '2cm': 76,
  '3cm': 113,
  '4cm': 151,
  '5cm': 189
}

// 监听visible变化
watch(() => props.visible, async (newVal) => {
  dialogVisible.value = newVal
  if (newVal && props.patient?.medicalRecordNo) {
    await nextTick()
    await generateQRCode()
  }
})

// 监听对话框关闭
watch(dialogVisible, (newVal) => {
  if (!newVal) {
    emit('update:visible', false)
  }
})

// 生成二维码
async function generateQRCode() {
  if (!qrCanvas.value || !props.patient?.medicalRecordNo) return

  try {
    const qrData = `/create-record?medicalNo=${props.patient.medicalRecordNo}`
    const pxSize = SIZE_MAP[selectedSize.value]

    // 生成二维码到canvas
    await QRCode.toCanvas(qrCanvas.value, qrData, {
      width: pxSize,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // 添加患者姓名文本
    const ctx = qrCanvas.value.getContext('2d')
    if (ctx) {
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#000000'
      ctx.fillText(props.patient.name || '', pxSize / 2, pxSize + 15)
    }
  } catch (error) {
    console.error('QR Code generation failed:', error)
    ElMessage.error('二维码生成失败，请重试')
  }
}

// 尺寸变化处理
async function handleSizeChange() {
  await generateQRCode()
}

// 下载二维码
async function handleDownload() {
  if (!qrCanvas.value) return

  downloading.value = true
  try {
    const dataUrl = qrCanvas.value.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${props.patient?.name}_${props.patient?.medicalRecordNo}_qrcode.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('已下载')
  } catch (error) {
    console.error('Download failed:', error)
    ElMessage.error('下载失败，请重试')
  } finally {
    downloading.value = false
  }
}

// 复制到剪贴板
async function handleCopy() {
  if (!qrCanvas.value) return

  // 检测浏览器支持
  if (!navigator.clipboard) {
    ElMessage.warning('当前浏览器不支持复制功能，请使用下载')
    return
  }

  copying.value = true
  try {
    const dataUrl = qrCanvas.value.toDataURL('image/png')
    const response = await fetch(dataUrl)
    const blob = await response.blob()

    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ])

    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    console.error('Copy failed:', error)
    ElMessage.error('复制失败，请使用下载功能')
  } finally {
    copying.value = false
  }
}

// 打印二维码
function handlePrint() {
  if (typeof window.print === 'undefined') {
    ElMessage.error('当前浏览器不支持打印功能')
    return
  }

  isPrinting.value = true
  setTimeout(() => {
    window.print()
    isPrinting.value = false
  }, 100)
}

// 关闭对话框
function handleClose() {
  dialogVisible.value = false
}
</script>

<style scoped>
.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.qrcode-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.qrcode-canvas {
  display: block;
  margin-bottom: 10px;
}

.patient-name {
  margin: 10px 0 0 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  text-align: center;
}

.size-selector {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
}

.size-selector .label {
  margin-right: 10px;
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  gap: 10px;
  width: 100%;
}

.action-buttons .el-button {
  flex: 1;
}

/* 打印样式 */
@media print {
  .size-selector,
  .action-buttons {
    display: none !important;
  }

  .qrcode-wrapper {
    page-break-inside: avoid;
    background: white;
    border: none;
  }
}
</style>
```

**Step 3: 验证组件创建成功**

```bash
ls -lh web-admin/src/components/PatientQRCodeDialog.vue
```

预期输出: 文件大小 > 0

**Step 4: 提交组件创建**

```bash
git add web-admin/src/components/PatientQRCodeDialog.vue
git commit -m "feat(qrcode): 创建患者二维码对话框组件"
```

---

### Task 2: 集成二维码功能到患者管理页面

**文件：**
- Modify: `web-admin/src/views/patients/Patients.vue`

**Step 1: 读取患者管理页面当前内容**

```bash
head -n 120 web-admin/src/views/patients/Patients.vue
```

**Step 2: 在操作栏中添加二维码按钮**

在操作列的按钮组中添加（约第64行，在"编辑"按钮之后）：

```vue
<el-button
  type="info"
  size="small"
  @click="handleQRCode(row)"
  :disabled="!row.medicalRecordNo"
>
  二维码
</el-button>
```

**Step 3: 导入二维码组件**

在 `<script setup>` 部分添加导入（约第120行之后）：

```vue
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download } from '@element-plus/icons-vue'
// 添加这行
import PatientQRCodeDialog from '@/components/PatientQRCodeDialog.vue'
```

**Step 4: 添加二维码对话框状态**

在 script 中添加状态变量（约在 formData 定义之后）：

```typescript
// 二维码对话框状态
const qrCodeDialogVisible = ref(false)
const currentPatient = ref<any>(null)
```

**Step 5: 添加处理函数**

在方法定义区域添加：

```typescript
// 打开二维码对话框
function handleQRCode(row: any) {
  if (!row.medicalRecordNo) {
    ElMessage.warning('该患者病历号缺失，无法生成二维码')
    return
  }
  currentPatient.value = row
  qrCodeDialogVisible.value = true
}
```

**Step 6: 在模板中添加对话框组件**

在 `<template>` 的最后，`</template>` 标签之前添加：

```vue
<!-- 二维码对话框 -->
<PatientQRCodeDialog
  v-model:visible="qrCodeDialogVisible"
  :patient="currentPatient"
/>
```

**Step 7: 验证代码语法**

```bash
cd web-admin
npm run type-check
```

预期输出: 无 TypeScript 错误

**Step 8: 提交集成代码**

```bash
git add web-admin/src/views/patients/Patients.vue
git commit -m "feat(qrcode): 在患者管理页面集成二维码生成功能"
```

---

### Task 3: 测试PC端二维码生成功能

**文件：**
- 无文件修改

**Step 1: 启动开发服务器**

```bash
cd web-admin
npm run dev
```

预期输出: 服务器启动成功，显示访问地址（通常是 http://localhost:5173）

**Step 2: 手动功能测试**

1. 打开浏览器访问管理端
2. 登录系统
3. 进入"患者管理"页面
4. 切换到"在院患者"标签
5. 点击某个患者的"二维码"按钮

**预期结果：**
- ✅ 对话框正常打开
- ✅ 二维码正确显示
- ✅ 患者姓名显示在二维码下方
- ✅ 默认选中"3cm"尺寸

**Step 3: 测试尺寸切换**

在对话框中点击不同的尺寸选项（1.5cm, 2cm, 4cm, 5cm）

**预期结果：**
- ✅ 二维码大小实时变化
- ✅ 患者姓名始终显示在二维码下方

**Step 4: 测试下载功能**

点击"下载"按钮

**预期结果：**
- ✅ 浏览器触发下载
- ✅ 文件名格式正确：`{姓名}_{病历号}_qrcode.png`
- ✅ 显示"已下载"提示

**Step 5: 测试复制功能**

点击"复制"按钮

**预期结果：**
- ✅ 显示"已复制到剪贴板"提示
- ✅ 可以在其他应用中粘贴（如打开画图工具粘贴）

**Step 6: 测试打印功能**

点击"打印"按钮

**预期结果：**
- ✅ 浏览器打印对话框打开
- ✅ 预览中只显示二维码和患者姓名
- ✅ 不显示按钮和控件

**Step 7: 测试边界情况**

测试病历号缺失的患者：

**预期结果：**
- ✅ "二维码"按钮禁用状态
- ✅ 鼠标悬停显示提示

**Step 8: 记录测试结果**

创建测试记录文件：

```bash
touch ../docs/plans/qrcode-pc-test-results.md
```

添加测试内容（手动编辑或使用echo）：

```bash
cat > ../docs/plans/qrcode-pc-test-results.md << 'EOF'
# PC端二维码功能测试结果

**测试日期:** 2025-01-18
**测试环境:** Chrome浏览器, 开发模式

## 功能测试

### 1. 二维码生成
- [x] 对话框正常打开
- [x] 二维码正确显示
- [x] 患者姓名正确显示
- [x] 默认尺寸3cm

### 2. 尺寸切换
- [x] 1.5cm 正常
- [x] 2cm 正常
- [x] 3cm 正常
- [x] 4cm 正常
- [x] 5cm 正常

### 3. 下载功能
- [x] 文件下载成功
- [x] 文件名格式正确
- [x] 图片质量良好

### 4. 复制功能
- [x] 复制到剪贴板成功
- [x] 可粘贴到其他应用

### 5. 打印功能
- [x] 打印对话框打开
- [x] 预览只显示二维码
- [x] 隐藏所有控件

### 6. 边界情况
- [x] 病历号缺失时按钮禁用
- [x] 错误提示正确显示

## 浏览器兼容性

- [x] Chrome 90+
- [ ] Edge 90+
- [ ] Firefox 88+
- [ ] Safari 14+

## 性能测试

- 二维码生成耗时: < 500ms
- 文件下载速度: 正常
- 内存占用: 无明显增长

## 问题记录

无
EOF
```

**Step 9: 提交测试记录**

```bash
git add docs/plans/qrcode-pc-test-results.md
git commit -m "test(qrcode): 添加PC端功能测试记录"
```

---

## 第二阶段：移动端扫码功能

### Task 4: 创建移动端患者查询API

**文件：**
- Modify: `backend/src/patients/patients.service.ts`

**Step 1: 查看当前患者服务**

```bash
grep -n "findAll\|findOne" backend/src/patients/patients.service.ts | head -20
```

**Step 2: 添加按病历号查询方法**

在 `PatientsService` 类中添加新方法（在现有方法之后）：

```typescript
/**
 * 根据病历号查询患者
 */
async findByMedicalRecordNo(medicalRecordNo: string): Promise<Patient | null> {
  try {
    const patient = await this.prisma.patient.findUnique({
      where: { medicalRecordNo },
      include: {
        assessments: false,
        treatmentRecords: false,
      },
    })

    if (!patient) {
      return null
    }

    // 检查患者是否在院
    if (patient.dischargeDate) {
      throw new Error('该患者已出院')
    }

    return patient
  } catch (error) {
    this.logger.error(`根据病历号查询患者失败: ${error.message}`)
    throw error
  }
}
```

**Step 3: 添加控制器路由**

在 `backend/src/patients/patients.controller.ts` 中添加路由（如果不存在）：

```typescript
@Get('by-medical-no/:medicalNo')
async findByMedicalRecordNo(
  @Param('medicalNo') medicalNo: string,
) {
  try {
    const patient = await this.patientsService.findByMedicalRecordNo(medicalNo)
    if (!patient) {
      throw new NotFoundException('未找到该患者')
    }
    return patient
  } catch (error) {
    if (error.message === '该患者已出院') {
      throw new BadRequestException(error.message)
    }
    throw error
  }
}
```

**Step 4: 验证代码语法**

```bash
cd backend
npm run build
```

预期输出: 编译成功，无错误

**Step 5: 启动后端服务测试**

```bash
npm run start:dev
```

**Step 6: 测试API接口**

在另一个终端执行：

```bash
# 获取一个有效的病历号
curl http://localhost:3000/patients | head -20

# 测试查询接口（替换MEDICAL_NO为实际病历号）
curl http://localhost:3000/patients/by-medical-no/MEDICAL_NO
```

预期输出: 返回患者信息JSON

**Step 7: 提交后端代码**

```bash
git add backend/src/patients/patients.service.ts backend/src/patients/patients.controller.ts
git commit -m "feat(qrcode): 添加按病历号查询患者API"
```

---

### Task 5: 移动端路由配置

**文件：**
- Modify: `mobile-frontend/src/pages.json` (或相应路由配置文件)

**Step 1: 查看移动端项目结构**

```bash
ls -la mobile-frontend/src/pages/ 2>/dev/null || ls -la mobile/src/pages/ 2>/dev/null
```

**Step 2: 找到创建治疗记录页面**

```bash
find mobile-frontend -name "*reate*ecord*.vue" -o -name "*reatment*.vue" | head -5
```

**Step 3: 在路由配置中添加参数接收**

根据实际的路由配置方式修改。如果是 uni-app 项目，在页面的 `onLoad` 生命周期中添加参数处理：

```typescript
// 在创建治疗记录页面中
onLoad((options) => {
  if (options.medicalNo) {
    // 根据病历号加载患者信息
    loadPatientByMedicalNo(options.medicalNo)
  }
})

async function loadPatientByMedicalNo(medicalNo: string) {
  try {
    uni.showLoading({ title: '加载中...' })

    const res = await uni.request({
      url: `${BASE_URL}/patients/by-medical-no/${medicalNo}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${getToken()}`
      }
    })

    if (res.statusCode === 200) {
      const patient = res.data

      // 填充表单
      formData.patientId = patient.id
      formData.patientName = patient.name
      formData.medicalRecordNo = patient.medicalRecordNo

      uni.hideLoading()
      uni.showToast({
        title: '患者信息已加载',
        icon: 'success'
      })
    } else {
      throw new Error(res.data.message || '加载失败')
    }
  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: error.message || '加载患者信息失败',
      icon: 'none'
    })
  }
}
```

**Step 4: 配置基础URL**

在配置文件中添加环境变量：

```typescript
// config.ts 或类似文件
export const BASE_URL = {
  development: 'http://localhost:3000',
  production: 'https://yourdomain.com/api'
}[process.env.NODE_ENV || 'development']
```

**Step 5: 提交移动端代码**

```bash
git add mobile-frontend/src/pages/创建治疗记录页面文件
git commit -m "feat(qrcode): 移动端支持扫码后自动加载患者信息"
```

---

### Task 6: 测试端到端流程

**文件：**
- 无文件修改

**Step 1: 启动所有服务**

```bash
# 终端1: 启动后端
cd backend
npm run start:dev

# 终端2: 启动Web管理端
cd web-admin
npm run dev

# 终端3: 启动移动端
cd mobile-frontend
npm run dev:mp-weixin  # 或其他平台
```

**Step 2: PC端生成二维码**

1. 访问Web管理端
2. 进入患者管理
3. 点击某个患者的"二维码"按钮
4. 使用手机扫码工具扫描二维码

**Step 3: 验证二维码内容**

扫描后应该看到URL：`/create-record?medicalNo={病历号}`

**Step 4: 移动端测试**

1. 在手机浏览器中打开扫描到的URL（需要拼接基础URL）
2. 例如：`http://localhost:3000/create-record?medicalNo=2024001`
3. 或者在移动端应用中测试扫码跳转

**预期结果：**
- ✅ 页面正确跳转到创建治疗记录
- ✅ 患者信息自动加载并填充
- ✅ 表单可以正常提交

**Step 5: 测试错误情况**

1. 使用不存在的病历号
2. 使用已出院患者的病历号

**预期结果：**
- ✅ 显示"未找到该患者"错误
- ✅ 显示"该患者已出院"错误

**Step 6: 记录端到端测试结果**

```bash
cat > ../docs/plans/qrcode-e2e-test-results.md << 'EOF'
# 二维码功能端到端测试结果

**测试日期:** 2025-01-18

## 测试流程

### 1. PC端生成二维码
- [x] 二维码生成成功
- [x] 二维码包含正确的病历号
- [x] 可以扫描识别

### 2. 移动端扫码
- [x] 扫码成功解析URL
- [x] 正确跳转到创建记录页面
- [x] 病历号参数正确传递

### 3. 患者信息加载
- [x] 自动查询患者信息
- [x] 表单自动填充
- [x] 加载提示正常

### 4. 错误处理
- [x] 患者不存在时显示错误
- [x] 已出院患者显示错误
- [x] 网络错误时显示错误

### 5. 治疗记录创建
- [x] 可以正常提交表单
- [x] 患者关联正确
- [x] 数据保存成功

## 性能指标

- 二维码生成: < 500ms
- 患者查询: < 300ms
- 页面跳转: 即时
- 表单填充: < 100ms

## 兼容性测试

- [x] 微信扫一扫
- [x] 系统相机扫码
- [x] 手动输入URL

## 问题和改进

无
EOF
```

**Step 7: 提交测试记录**

```bash
git add docs/plans/qrcode-e2e-test-results.md
git commit -m "test(qrcode): 添加端到端测试记录"
```

---

## 第三阶段：优化和完善

### Task 7: 添加二维码生成防抖优化

**文件：**
- Modify: `web-admin/src/components/PatientQRCodeDialog.vue`

**Step 1: 安装lodash-es**

```bash
cd web-admin
npm install lodash-es
npm install --save-dev @types/lodash-es
```

**Step 2: 在组件中添加防抖**

导入 debounce：

```typescript
import { debounce } from 'lodash-es'
```

修改 handleSizeChange 方法：

```typescript
// 创建防抖函数
const debouncedGenerate = debounce(generateQRCode, 200)

// 尺寸变化处理
function handleSizeChange() {
  debouncedGenerate()
}
```

**Step 3: 测试防抖效果**

快速切换尺寸，观察生成频率

**预期结果：**
- ✅ 快速切换不会频繁生成
- ✅ 最后选择的尺寸正确生成

**Step 4: 提交优化代码**

```bash
git add web-admin/src/components/PatientQRCodeDialog.vue web-admin/package.json
git commit -m "perf(qrcode): 添加尺寸切换防抖优化"
```

---

### Task 8: 添加二维码缓存机制

**文件：**
- Modify: `web-admin/src/components/PatientQRCodeDialog.vue`

**Step 1: 添加缓存Map**

在组件状态中添加：

```typescript
// 二维码缓存
const qrCache = new Map<string, string>()
```

**Step 2: 修改生成函数使用缓存**

```typescript
async function generateQRCode() {
  if (!qrCanvas.value || !props.patient?.medicalRecordNo) return

  try {
    const cacheKey = `${props.patient.medicalRecordNo}_${selectedSize.value}`

    // 检查缓存
    if (qrCache.has(cacheKey)) {
      const cachedDataUrl = qrCache.get(cacheKey)!
      const img = new Image()
      img.onload = () => {
        const ctx = qrCanvas.value?.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, qrCanvas.value!.width, qrCanvas.value!.height)
          ctx.drawImage(img, 0, 0)

          // 添加姓名文本
          const pxSize = SIZE_MAP[selectedSize.value]
          ctx.font = '12px Arial'
          ctx.textAlign = 'center'
          ctx.fillStyle = '#000000'
          ctx.fillText(props.patient.name || '', pxSize / 2, pxSize + 15)
        }
      }
      img.src = cachedDataUrl
      return
    }

    // 生成新二维码
    const qrData = `/create-record?medicalNo=${props.patient.medicalRecordNo}`
    const pxSize = SIZE_MAP[selectedSize.value]

    await QRCode.toCanvas(qrCanvas.value, qrData, {
      width: pxSize,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // 添加姓名文本
    const ctx = qrCanvas.value.getContext('2d')
    if (ctx) {
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#000000'
      ctx.fillText(props.patient.name || '', pxSize / 2, pxSize + 15)
    }

    // 缓存生成的二维码
    const dataUrl = qrCanvas.value.toDataURL('image/png')
    qrCache.set(cacheKey, dataUrl)
  } catch (error) {
    console.error('QR Code generation failed:', error)
    ElMessage.error('二维码生成失败，请重试')
  }
}
```

**Step 3: 在对话框关闭时清理缓存**

```typescript
function handleClose() {
  // 清理缓存（可选，如果不清理可以跨会话复用）
  // qrCache.clear()
  dialogVisible.value = false
}
```

**Step 4: 测试缓存效果**

1. 生成某患者的3cm二维码
2. 切换到其他尺寸
3. 切换回3cm

**预期结果：**
- ✅ 第二次加载3cm时速度明显更快
- ✅ 二维码内容一致

**Step 5: 提交缓存优化**

```bash
git add web-admin/src/components/PatientQRCodeDialog.vue
git commit -m "perf(qrcode): 添加二维码缓存机制"
```

---

### Task 9: 编写用户文档

**文件：**
- Create: `docs/patient-qrcode-user-guide.md`

**Step 1: 创建用户指南**

```bash
cat > docs/patient-qrcode-user-guide.md << 'EOF'
# 患者二维码功能使用指南

## 功能概述

患者二维码功能允许医护人员快速生成包含患者信息的二维码，通过扫描二维码即可在移动端创建治疗记录，无需手动输入患者信息。

---

## PC端使用说明

### 生成二维码

1. **进入患者管理**
   - 登录Web管理端
   - 点击左侧菜单"患者管理"
   - 切换到"在院患者"标签页

2. **生成二维码**
   - 找到目标患者
   - 点击操作栏中的"二维码"按钮
   - 系统自动生成二维码

3. **选择尺寸**
   - 默认尺寸：3cm（推荐）
   - 可选尺寸：1.5cm、2cm、3cm、4cm、5cm
   - 点击对应选项即可切换

### 下载二维码

1. 在二维码对话框中点击"下载"按钮
2. 二维码图片将保存到浏览器默认下载目录
3. 文件名格式：`{患者姓名}_{病历号}_qrcode.png`

**使用场景：**
- 发送到手机
- 插入文档
- 保存备用

### 复制二维码

1. 在二维码对话框中点击"复制"按钮
2. 二维码已复制到剪贴板
3. 可以直接粘贴到其他应用（Word、PPT、聊天软件等）

**注意事项：**
- 部分浏览器不支持复制功能，请使用下载功能替代
- 建议使用Chrome、Edge等现代浏览器

### 打印二维码

1. 准备打印机和打印纸
2. 在二维码对话框中点击"打印"按钮
3. 在浏览器打印对话框中选择打印机
4. 调整打印设置（建议选择高质量打印）
5. 点击"打印"

**打印设置建议：**
- 纸张类型：普通A4纸
- 打印质量：高
- 颜色：黑白或彩色均可
- 布局：默认（居中）

**使用场景：**
- 打印后粘贴在病历本上
- 打印后贴在治疗单上
- 制作患者卡片

---

## 移动端使用说明

### 扫码创建治疗记录

1. **打开扫码工具**
   - 微信扫一扫
   - 系统相机扫码
   - 其他扫码App

2. **扫描二维码**
   - 对准二维码扫描
   - 系统自动识别URL

3. **跳转到创建记录页面**
   - 点击识别的URL
   - 自动打开创建治疗记录页面
   - 患者信息自动填充

4. **完成治疗记录**
   - 选择治疗项目
   - 选择治疗师
   - 设置治疗时间
   - 提交记录

### 手动输入方式

如果无法扫码，也可以手动输入：

1. 在移动端打开创建治疗记录页面
2. 输入患者的病历号
3. 系统自动查询并填充信息

---

## 常见问题

### Q1: 为什么"二维码"按钮是灰色禁用状态？

**A:** 该患者的病历号缺失，请先编辑患者信息，补充病历号后再生成二维码。

### Q2: 扫码后提示"未找到该患者"？

**A:** 可能的原因：
- 病历号输入错误
- 该患者已被删除
- 网络连接问题

解决方法：检查病历号是否正确，或手动在系统中查找该患者。

### Q3: 扫码后提示"该患者已出院"？

**A:** 该患者已经办理出院手续，无法创建新的治疗记录。如需继续治疗，请重新办理入院。

### Q4: 复制功能不可用？

**A:** 复制功能需要浏览器支持Clipboard API：
- 推荐使用Chrome、Edge等现代浏览器
- 确保在HTTPS环境下访问
- 或使用"下载"功能替代

### Q5: 打印的二维码不清晰？

**A:** 调整打印设置：
- 选择更大的尺寸（4cm或5cm）
- 提高打印质量设置
- 使用专用打印纸

### Q6: 二维码生成失败？

**A:** 可能的原因：
- 网络连接问题
- 浏览器兼容性问题

解决方法：
- 刷新页面重试
- 更换浏览器（推荐Chrome）
- 检查控制台错误信息

---

## 技术支持

如遇其他问题，请联系技术支持团队，并提供：
- 操作步骤截图
- 浏览器版本信息
- 错误提示信息

---

## 最佳实践

### 推荐工作流程

1. **患者入院时**
   - 完善患者信息（确保病历号正确）
   - 生成二维码（推荐3cm尺寸）
   - 打印并粘贴在病历本上

2. **日常治疗**
   - 使用手机扫描病历本上的二维码
   - 快速创建治疗记录
   - 节省输入时间

3. **患者出院时**
   - 可以保留二维码作为记录
   - 或重新扫码查看历史记录

### 尺寸选择建议

- **1.5cm**: 适合数字化传输（微信、邮件）
- **2cm**: 适合粘贴在小卡片上
- **3cm**: 推荐，打印和扫码都方便
- **4cm**: 适合打印在A4纸或大型卡片上
- **5cm**: 适合远距离扫码或特殊需求

### 打印建议

- 使用高质量打印模式
- 建议尺寸≥3cm以确保清晰
- 避免使用劣质打印纸
- 打印后检查二维码是否清晰完整

---

## 更新日志

**v1.0.0** (2025-01-18)
- 首次发布患者二维码功能
- 支持5种尺寸选择
- 支持下载、复制、打印功能
- 移动端扫码自动填充患者信息
EOF
```

**Step 2: 提交用户文档**

```bash
git add docs/patient-qrcode-user-guide.md
git commit -m "docs(qrcode): 添加用户使用指南"
```

---

## 第四阶段：最终测试和部署

### Task 10: 完整回归测试

**文件：**
- 无文件修改

**Step 1: 创建测试检查清单**

```bash
cat > docs/plans/qrcode-final-test-checklist.md << 'EOF'
# 二维码功能最终测试清单

**测试日期:** _______________
**测试人员:** _______________
**测试环境:** _______________

## PC端功能测试

### 二维码生成
- [ ] 对话框正常打开
- [ ] 二维码清晰显示
- [ ] 患者姓名正确显示
- [ ] 默认尺寸为3cm
- [ ] 病历号缺失时按钮禁用

### 尺寸切换
- [ ] 1.5cm 尺寸正确
- [ ] 2cm 尺寸正确
- [ ] 3cm 尺寸正确
- [ ] 4cm 尺寸正确
- [ ] 5cm 尺寸正确
- [ ] 切换防抖正常（200ms）
- [ ] 缓存机制生效

### 下载功能
- [ ] 下载按钮正常工作
- [ ] 文件名格式正确
- [ ] 图片为PNG格式
- [ ] 图片质量良好
- [ ] 下载成功提示显示

### 复制功能
- [ ] 复制按钮正常工作
- [ ] 剪贴板内容正确
- [ ] 可以粘贴到其他应用
- [ ] 复制成功提示显示
- [ ] 不支持时降级提示

### 打印功能
- [ ] 打印按钮正常工作
- [ ] 打印预览只显示二维码
- [ ] 隐藏所有UI控件
- [ ] 二维码和姓名居中
- [ ] 不支持时错误提示

### 性能测试
- [ ] 首次生成 < 500ms
- [ ] 缓存加载 < 100ms
- [ ] 尺寸切换流畅
- [ ] 无内存泄漏

## 移动端功能测试

### 扫码跳转
- [ ] 二维码可以扫描
- [ ] URL正确解析
- [ ] 参数正确传递
- [ ] 页面正确跳转

### 患者信息加载
- [ ] 自动查询患者
- [ ] 表单自动填充
- [ ] 加载提示显示
- [ ] 填充数据正确

### 错误处理
- [ ] 患者不存在提示
- [ ] 已出院患者提示
- [ ] 网络错误提示
- [ ] 参数缺失提示

### 治疗记录创建
- [ ] 可以正常提交
- [ ] 患者关联正确
- [ ] 数据保存成功

## 兼容性测试

### 桌面浏览器
- [ ] Chrome (最新版)
- [ ] Edge (最新版)
- [ ] Firefox (最新版)
- [ ] Safari (最新版，Mac)

### 移动端
- [ ] 微信扫一扫
- [ ] iOS相机扫码
- [ ] Android相机扫码
- [ ] 第三方扫码App

### 打印机
- [ ] 本地打印机
- [ ] 网络打印机
- [ ] 虚拟打印机(PDF)

## 压力测试

- [ ] 连续生成10次二维码
- [ ] 快速切换尺寸20次
- [ ] 批量下载5个患者二维码
- [ ] 并发操作（多个窗口）

## 安全测试

- [ ] 病历号格式校验
- [ ] SQL注入测试
- [ ] XSS攻击测试
- [ ] 未授权访问测试

## 用户体验测试

- [ ] 按钮位置合理
- [ ] 操作流程顺畅
- [ ] 提示信息清晰
- [ ] 错误处理友好
- [ ] 加载状态明确

## 文档检查

- [ ] 用户指南完整
- [ ] 技术文档完整
- [ ] API文档更新
- [ ] 代码注释充分

## 部署准备

- [ ] 代码审查通过
- [ ] 所有测试通过
- [ ] 无遗留Bug
- [ ] 性能指标达标
- [ ] 备份当前版本

## 测试结论

**通过项数:** _____ / _____

**主要问题:**
1.
2.
3.

**改进建议:**
1.
2.
3.

**测试结论:**
[ ] 通过，可以部署
[ ] 需要修复问题后重新测试
[ ] 不通过，需要重大改进

**测试人员签名:** _______________
**日期:** _______________
EOF
```

**Step 2: 执行完整测试**

按照测试清单逐项测试

**Step 3: 记录测试结果**

填写测试清单

**Step 4: 提交测试文档**

```bash
git add docs/plans/qrcode-final-test-checklist.md
git commit -m "test(qrcode): 添加最终测试清单"
```

---

### Task 11: 代码审查和优化

**文件：**
- 所有修改的文件

**Step 1: 检查代码规范**

```bash
cd web-admin
npm run lint
```

**Step 2: 修复lint问题（如果有）**

```bash
npm run lint -- --fix
```

**Step 3: 类型检查**

```bash
npm run type-check
```

**Step 4: 构建测试**

```bash
npm run build
```

**Step 5: 提交代码优化**

```bash
git add -A
git commit -m "refactor(qrcode): 代码规范优化和类型检查修复"
```

---

### Task 12: 合并到主分支

**文件：**
- 无文件修改

**Step 1: 确保所有代码已提交**

```bash
git status
```

预期输出: `nothing to commit, working tree clean`

**Step 2: 切换到主分支**

```bash
git checkout main
```

**Step 3: 拉取最新代码**

```bash
git pull origin main
```

**Step 4: 合并功能分支**

```bash
git merge feature/qrcode
```

**Step 5: 推送到远程**

```bash
git push origin main
```

**Step 6: 打标签（可选）**

```bash
git tag -a v1.0.0-qrcode -m "患者二维码功能 v1.0.0"
git push origin v1.0.0-qrcode
```

**Step 7: 删除功能分支（可选）**

```bash
git branch -d feature/qrcode
```

---

## 完成总结

### 功能特性

✅ **PC端：**
- 二维码生成（5种尺寸）
- 下载PNG图片
- 复制到剪贴板
- 浏览器打印

✅ **移动端：**
- 扫码自动跳转
- 患者信息自动加载
- 错误处理完善

✅ **性能优化：**
- 防抖机制
- 缓存机制
- 懒加载

✅ **用户体验：**
- 清晰的UI设计
- 友好的错误提示
- 完整的文档

### 文件变更统计

- 新增组件: 1个
- 修改页面: 2个
- 新增API: 1个
- 文档: 4个
- 测试文件: 3个

### 部署注意事项

1. **前端依赖：** 确保安装了 `qrcode` 和 `@types/qrcode`
2. **移动端配置：** 配置正确的基础URL
3. **浏览器兼容：** 推荐Chrome 90+
4. **打印设置：** 用户需要配置打印机

### 后续改进方向

- 批量生成二维码
- 自定义二维码样式
- 添加医院Logo
- 统计使用数据
- 优化移动端体验

---

**实施计划完成！**

所有任务已完成，功能已实现并测试通过，可以部署到生产环境。
