<template>
  <div class="users">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增用户
          </el-button>
        </div>
      </template>

      <!-- Tabs -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="启用用户" name="active">
          <!-- Table -->
          <el-table :data="activeUsers" stripe v-loading="loading">
            <el-table-column prop="username" label="用户名" width="150" />
            <el-table-column prop="name" label="姓名" width="150" />
            <el-table-column prop="role" label="角色" width="150">
              <template #default="{ row }">
                <el-tag :type="getRoleType(row.role)" size="small">
                  {{ getRoleName(row.role) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="department" label="部门" />
            <el-table-column prop="isActive" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
                  {{ row.isActive ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="lastLoginAt" label="最后登录" width="180">
              <template #default="{ row }">
                {{ row.lastLoginAt ? formatDateTime(row.lastLoginAt) : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="300" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="handleEdit(row)">
                  编辑
                </el-button>
                <el-button type="warning" size="small" @click="handleResetPassword(row)">
                  重置密码
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="handleToggleStatus(row)"
                >
                  禁用
                </el-button>
                <el-button type="danger" size="small" @click="handleDelete(row)" v-if="row.username !== 'admin'">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="禁用用户" name="inactive">
          <el-table :data="inactiveUsers" stripe v-loading="loading">
            <el-table-column prop="username" label="用户名" width="150" />
            <el-table-column prop="name" label="姓名" width="150" />
            <el-table-column prop="role" label="角色" width="150">
              <template #default="{ row }">
                <el-tag :type="getRoleType(row.role)" size="small">
                  {{ getRoleName(row.role) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="department" label="部门" />
            <el-table-column prop="isActive" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
                  {{ row.isActive ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="lastLoginAt" label="最后登录" width="180">
              <template #default="{ row }">
                {{ row.lastLoginAt ? formatDateTime(row.lastLoginAt) : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="250" fixed="right">
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
                <el-button type="danger" size="small" @click="handleDelete(row)" v-if="row.username !== 'admin'">
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
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="formData.username"
            placeholder="请输入用户名"
            :disabled="!!formData.id"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password" v-if="!formData.id">
          <el-input v-model="formData.password" type="password" placeholder="请输入密码" />
        </el-form-item>

        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" placeholder="请输入姓名" />
        </el-form-item>

        <el-form-item label="角色" prop="role">
          <el-select v-model="formData.role" placeholder="请选择角色" style="width: 100%;">
            <el-option label="管理员" value="admin" />
            <el-option label="医师" value="physician" />
            <el-option label="护士" value="nurse" />
            <el-option label="治疗师" value="therapist" />
          </el-select>
        </el-form-item>

        <el-form-item label="部门" prop="department">
          <el-input v-model="formData.department" placeholder="请输入部门" />
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
import dayjs from 'dayjs'

const loading = ref(false)
const tableData = ref<any[]>([])
const activeTab = ref('active')

const dialogVisible = ref(false)
const dialogTitle = computed(() => (formData.id ? '编辑用户' : '新增用户'))
const submitting = ref(false)

const formRef = ref<FormInstance>()
const formData = reactive<any>({
  id: null,
  username: '',
  password: '',
  name: '',
  role: '',
  department: ''
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  department: [{ required: true, message: '请输入部门', trigger: 'blur' }]
}

// 计算属性：启用和禁用的用户
const activeUsers = computed(() => {
  return tableData.value.filter(u => u.isActive)
})

const inactiveUsers = computed(() => {
  return tableData.value.filter(u => !u.isActive)
})

onMounted(() => {
  loadData()
})

function handleTabChange() {
  // 标签切换时的处理（如果需要）
}

async function loadData() {
  loading.value = true

  try {
    const data = await request.get('/users')
    tableData.value = data
  } catch (error) {
    console.error('Failed to load users:', error)
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  Object.assign(formData, {
    id: null,
    username: '',
    password: '',
    name: '',
    role: '',
    department: ''
  })
  dialogVisible.value = true
}

function handleEdit(row: any) {
  Object.assign(formData, row)
  dialogVisible.value = true
}

async function handleResetPassword(row: any) {
  try {
    const { value } = await ElMessageBox.prompt('请输入新密码（至少6位）', '重置密码', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^.{6,}$/,
      inputErrorMessage: '密码至少6位'
    })

    await request.post(`/users/${row.id}/password`, {
      password: value
    })
    ElMessage.success('密码重置成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '重置失败')
    }
  }
}

async function handleToggleStatus(row: any) {
  try {
    await request.put(`/users/${row.id}/status`)
    ElMessage.success('状态更新成功')
    await loadData()
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败')
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await request.delete(`/users/${row.id}`)
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
        if (formData.id) {
          await request.put(`/users/${formData.id}`, {
            name: formData.name,
            role: formData.role,
            department: formData.department
          })
          ElMessage.success('更新成功')
        } else {
          await request.post('/users', formData)
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

function getRoleName(role: string): string {
  const roleMap: Record<string, string> = {
    admin: '管理员',
    physician: '医师',
    nurse: '护士',
    therapist: '治疗师'
  }
  return roleMap[role] || role
}

function getRoleType(role: string): string {
  const typeMap: Record<string, string> = {
    admin: 'danger',
    physician: 'primary',
    nurse: 'success',
    therapist: 'warning'
  }
  return typeMap[role] || ''
}

function formatDateTime(date: string): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}
</script>

<style lang="scss" scoped>
.users {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }
}
</style>
