<template>
  <div class="projects">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>治疗项目管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增项目
          </el-button>
        </div>
      </template>

      <!-- Tabs -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="启用项目" name="active">
          <!-- Table -->
          <el-table :data="activeProjects" stripe v-loading="loading">
            <el-table-column prop="name" label="项目名称" width="200" />
            <el-table-column prop="code" label="项目编码" width="150" />
            <el-table-column prop="category" label="类别" width="100">
              <template #default="{ row }">
                <el-tag :type="getCategoryType(row.category)" size="small">
                  {{ row.category }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="defaultDuration" label="默认时长(分钟)" width="150" />
            <el-table-column prop="allowedRoles" label="允许的角色" width="300">
              <template #default="{ row }">
                <template v-if="Array.isArray(parseAllowedRoles(row.allowedRoles)) && parseAllowedRoles(row.allowedRoles).length > 0">
                  <el-tag
                    v-for="role in parseAllowedRoles(row.allowedRoles)"
                    :key="role"
                    size="small"
                    style="margin-right: 5px;"
                  >
                    {{ getRoleName(role) }}
                  </el-tag>
                </template>
                <span v-else style="color: #999;">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="sortOrder" label="排序" width="80" />
            <el-table-column prop="isActive" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
                  {{ row.isActive ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="handleEdit(row)">
                  编辑
                </el-button>
                <el-button
                  type="warning"
                  size="small"
                  @click="handleToggleStatus(row)"
                >
                  禁用
                </el-button>
                <el-button type="danger" size="small" @click="handleDelete(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="禁用项目" name="inactive">
          <el-table :data="inactiveProjects" stripe v-loading="loading">
            <el-table-column prop="name" label="项目名称" width="200" />
            <el-table-column prop="code" label="项目编码" width="150" />
            <el-table-column prop="category" label="类别" width="100">
              <template #default="{ row }">
                <el-tag :type="getCategoryType(row.category)" size="small">
                  {{ row.category }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="defaultDuration" label="默认时长(分钟)" width="150" />
            <el-table-column prop="allowedRoles" label="允许的角色" width="300">
              <template #default="{ row }">
                <template v-if="Array.isArray(parseAllowedRoles(row.allowedRoles)) && parseAllowedRoles(row.allowedRoles).length > 0">
                  <el-tag
                    v-for="role in parseAllowedRoles(row.allowedRoles)"
                    :key="role"
                    size="small"
                    style="margin-right: 5px;"
                  >
                    {{ getRoleName(role) }}
                  </el-tag>
                </template>
                <span v-else style="color: #999;">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="sortOrder" label="排序" width="80" />
            <el-table-column prop="isActive" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
                  {{ row.isActive ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="handleEdit(row)">
                  编辑
                </el-button>
                <el-button
                  type="success"
                  size="small"
                  @click="handleToggleStatus(row)"
                >
                  启用
                </el-button>
                <el-button type="danger" size="small" @click="handleDelete(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
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
        label-width="120px"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入项目名称" />
        </el-form-item>

        <el-form-item label="项目编码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入项目编码，如：PT_001" />
        </el-form-item>

        <el-form-item label="类别" prop="category">
          <el-select v-model="formData.category" placeholder="请选择类别" style="width: 100%;">
            <el-option label="PT (物理治疗)" value="PT" />
            <el-option label="OT (作业治疗)" value="OT" />
            <el-option label="ST (言语治疗)" value="ST" />
            <el-option label="CT (认知训练)" value="CT" />
            <el-option label="TCM (中医治疗)" value="TCM" />
            <el-option label="VT (职业治疗)" value="VT" />
            <el-option label="ELE (电刺激)" value="ELE" />
          </el-select>
        </el-form-item>

        <el-form-item label="默认时长" prop="defaultDuration">
          <el-input-number
            v-model="formData.defaultDuration"
            :min="5"
            :max="120"
            :step="5"
            style="width: 100%;"
          />
          <span style="margin-left: 10px;">分钟</span>
        </el-form-item>

        <el-form-item label="允许的角色" prop="allowedRoles">
          <el-checkbox-group v-model="selectedRoles">
            <el-checkbox label="physician">医师</el-checkbox>
            <el-checkbox label="nurse">护士</el-checkbox>
            <el-checkbox label="therapist">治疗师</el-checkbox>
            <el-checkbox label="admin">管理员</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="排序" prop="sortOrder">
          <el-input-number
            v-model="formData.sortOrder"
            :min="0"
            :max="999"
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item label="状态" prop="isActive">
          <el-switch v-model="formData.isActive" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const tableData = ref<any[]>([])
const activeTab = ref('active')

const dialogVisible = ref(false)
const dialogTitle = computed(() => (formData.id ? '编辑项目' : '新增项目'))
const submitting = ref(false)

const formRef = ref<FormInstance>()
const selectedRoles = ref<string[]>([])

const formData = reactive<any>({
  id: null,
  name: '',
  code: '',
  category: '',
  defaultDuration: 30,
  allowedRoles: '',
  sortOrder: 0,
  isActive: true
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入项目编码', trigger: 'blur' }],
  category: [{ required: true, message: '请选择类别', trigger: 'change' }],
  defaultDuration: [{ required: true, message: '请输入默认时长', trigger: 'blur' }],
  allowedRoles: [
    {
      required: true,
      message: '请选择允许的角色',
      trigger: 'change',
      validator: (rule, value, callback) => {
        if (selectedRoles.value.length === 0) {
          callback(new Error('请至少选择一个角色'))
        } else {
          callback()
        }
      }
    }
  ]
}

// 计算属性：启用和禁用的项目
const activeProjects = computed(() => {
  return tableData.value.filter(p => p.isActive).sort((a: any, b: any) => a.sortOrder - b.sortOrder)
})

const inactiveProjects = computed(() => {
  return tableData.value.filter(p => !p.isActive).sort((a: any, b: any) => a.sortOrder - b.sortOrder)
})

onMounted(() => {
  loadData()
})

function handleTabChange() {
  // 标签切换时的处理（如果需要）
}

// 辅助函数：解析角色数组
function parseAllowedRoles(allowedRoles: any): string[] {
  console.log('parseAllowedRoles input:', allowedRoles, 'type:', typeof allowedRoles)

  try {
    // 如果已经是数组，直接返回
    if (Array.isArray(allowedRoles)) {
      console.log('parseAllowedRoles output (array):', allowedRoles)
      return allowedRoles
    }
    // 如果是字符串，解析JSON
    if (typeof allowedRoles === 'string' && allowedRoles.trim()) {
      // 处理可能的双重转义
      let parsed = JSON.parse(allowedRoles)
      // 如果解析后还是字符串，再解析一次
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed)
      }
      console.log('parseAllowedRoles output (parsed):', parsed)
      return Array.isArray(parsed) ? parsed : []
    }
    console.log('parseAllowedRoles output (empty):', [])
    return []
  } catch (e) {
    console.error('Failed to parse allowedRoles:', allowedRoles, e)
    return []
  }
}

async function loadData() {
  loading.value = true

  try {
    const data = await request.get('/projects')
    tableData.value = data.sort((a: any, b: any) => a.sortOrder - b.sortOrder)
  } catch (error) {
    console.error('Failed to load projects:', error)
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  selectedRoles.value = []
  Object.assign(formData, {
    id: null,
    name: '',
    code: '',
    category: '',
    defaultDuration: 30,
    allowedRoles: '',
    sortOrder: 0,
    isActive: true
  })
  dialogVisible.value = true
}

function handleEdit(row: any) {
  // 使用 parseAllowedRoles 函数解析角色
  selectedRoles.value = parseAllowedRoles(row.allowedRoles)

  // 复制其他字段，但不包括allowedRoles字符串
  Object.assign(formData, {
    id: row.id,
    name: row.name,
    code: row.code,
    category: row.category,
    defaultDuration: row.defaultDuration,
    sortOrder: row.sortOrder,
    isActive: row.isActive
  })
  dialogVisible.value = true
}

async function handleToggleStatus(row: any) {
  try {
    await request.put(`/projects/${row.id}`, {
      ...row,
      isActive: !row.isActive
    })
    ElMessage.success('状态更新成功')
    await loadData()
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败')
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm('确定要删除该项目吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await request.delete(`/projects/${row.id}`)
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
        const data = {
          ...formData,
          allowedRoles: JSON.stringify(selectedRoles.value)
        }

        if (formData.id) {
          await request.put(`/projects/${formData.id}`, data)
          ElMessage.success('更新成功')
        } else {
          await request.post('/projects', data)
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
  dialogVisible.value = false
  // 延迟重置，避免在关闭动画时出现问题
  setTimeout(() => {
    formRef.value?.resetFields()
    selectedRoles.value = []
  }, 100)
}

function getCategoryType(category: string): string {
  const typeMap: Record<string, string> = {
    PT: 'primary',
    OT: 'success',
    ST: 'warning',
    CT: 'danger',
    TCM: 'info',
    VT: '',
    ELE: 'primary'
  }
  return typeMap[category] || ''
}

function getRoleName(role: string): string {
  const roleMap: Record<string, string> = {
    physician: '医师',
    nurse: '护士',
    therapist: '治疗师',
    admin: '管理员'
  }
  return roleMap[role] || role
}
</script>

<style lang="scss" scoped>
.projects {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }
}
</style>
