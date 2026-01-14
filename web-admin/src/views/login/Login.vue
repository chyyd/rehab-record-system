<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1>康复治疗记录系统</h1>
        <p>虎林市中医医院康复科 - 管理后台</p>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="formData.username"
            placeholder="请输入用户名"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-btn"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>

        <el-divider>测试账号</el-divider>

        <div class="test-accounts">
          <el-tag
            v-for="account in testAccounts"
            :key="account.username"
            class="account-tag"
            @click="fillAccount(account)"
          >
            {{ account.label }}
          </el-tag>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const formData = reactive({
  username: '',
  password: ''
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

const testAccounts = [
  { label: '管理员', username: 'admin', password: '123456' },
  { label: '治疗师', username: 'therapist001', password: '123456' },
  { label: '医师', username: 'doc001', password: '123456' },
  { label: '护士', username: 'nurse001', password: '123456' }
]

function fillAccount(account: any) {
  formData.username = account.username
  formData.password = account.password
}

async function handleLogin() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true

      try {
        await userStore.login({
          username: formData.username,
          password: formData.password
        })

        ElMessage.success('登录成功')

        router.push('/')
      } catch (error: any) {
        ElMessage.error(error.message || '登录失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0284c7 100%);
  position: relative;

  /* 医疗十字装饰 */
  &::before {
    content: '+';
    position: absolute;
    top: 15%;
    right: 15%;
    font-size: 200px;
    color: rgba(255, 255, 255, 0.03);
    font-weight: 300;
    font-family: Georgia, serif;
  }

  &::after {
    content: '+';
    position: absolute;
    bottom: 20%;
    left: 12%;
    font-size: 150px;
    color: rgba(255, 255, 255, 0.03);
    font-weight: 300;
    font-family: Georgia, serif;
  }
}

.login-box {
  width: 420px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 48px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;

  h1 {
    font-size: 28px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 10px;
    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
  }
}

.login-form {
  .login-btn {
    width: 100%;
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 12px;
  }
}

.test-accounts {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;

  .account-tag {
    cursor: pointer;
    transition: all 0.3s;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 500;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
    }
  }
}

/* 覆盖 Element Plus 样式 */
:deep(.el-input__wrapper) {
  border-radius: 12px;
  padding: 8px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  &:hover {
    box-shadow: 0 2px 8px rgba(14, 165, 233, 0.2);
  }

  &.is-focus {
    box-shadow: 0 0 0 1px #0ea5e9 inset;
  }
}

:deep(.el-form-item) {
  margin-bottom: 24px;
}

:deep(.el-divider__text) {
  background: transparent;
  color: #94a3b8;
  font-weight: 500;
}
</style>
