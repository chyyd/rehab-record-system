<template>
  <view class="login-container">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="login-content">
      <!-- Logo区域 -->
      <view class="logo-section">
        <view class="logo-placeholder">
          <text class="logo-icon">+</text>
        </view>
        <text class="app-name">虎林市中医医院</text>
        <text class="app-desc">康复科治疗记录系统</text>
      </view>

      <!-- 登录表单 -->
      <view class="login-form">
        <view class="form-item">
          <view class="form-item-icon">
            <text class="iconfont icon-user"></text>
          </view>
          <input
            class="form-item-input"
            type="text"
            v-model="formData.username"
            placeholder="请输入用户名"
            placeholder-style="color: #999"
          />
        </view>

        <view class="form-item">
          <view class="form-item-icon">
            <text class="iconfont icon-lock"></text>
          </view>
          <input
            class="form-item-input"
            :type="showPassword ? 'text' : 'password'"
            v-model="formData.password"
            placeholder="请输入密码"
            placeholder-style="color: #999"
          />
          <view class="form-item-eye" @click="togglePassword">
            <text :class="showPassword ? 'iconfont icon-eye-open' : 'iconfont icon-eye-close'"></text>
          </view>
        </view>

        <button class="login-btn" :disabled="loading" @click="handleLogin">
          {{ loading ? '登录中...' : '登录' }}
        </button>

        <!-- 测试账号提示 -->
        <view class="test-accounts">
          <text class="test-title">测试账号：</text>
          <view class="account-list">
            <text class="account-item" @click="fillAccount('admin', '123456')">管理员</text>
            <text class="account-item" @click="fillAccount('therapist001', '123456')">治疗师</text>
            <text class="account-item" @click="fillAccount('doc001', '123456')">医师</text>
            <text class="account-item" @click="fillAccount('nurse001', '123456')">护士</text>
          </view>
        </view>
      </view>

      <!-- 版权信息 -->
      <view class="copyright">
        <text>© 2026 虎林市中医医院 康复科</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

console.log('登录页面加载')

// 检测是否是H5环境
const isH5 = typeof window !== 'undefined' && typeof document !== 'undefined'

const statusBarHeight = ref(0)
const showPassword = ref(false)
const loading = ref(false)

const formData = ref({
  username: '',
  password: ''
})

onMounted(() => {
  console.log('登录页面 onMounted, 环境:', isH5 ? 'H5' : '小程序/App')

  try {
    const systemInfo = uni.getSystemInfoSync()
    statusBarHeight.value = systemInfo.statusBarHeight || 0
    console.log('状态栏高度:', statusBarHeight.value)
  } catch (e) {
    console.error('获取系统信息失败:', e)
    statusBarHeight.value = 0
  }
})

function togglePassword() {
  console.log('切换密码可见性')
  showPassword.value = !showPassword.value
}

function fillAccount(username: string, password: string) {
  console.log('填充测试账号:', username)
  formData.value.username = username
  formData.value.password = password
}

async function handleLogin() {
  console.log('点击登录按钮')
  console.log('表单数据:', {
    username: formData.value.username,
    password: formData.value.password ? '***' : ''
  })

  // 表单验证
  if (!formData.value.username) {
    console.log('用户名为空')
    uni.showToast({
      title: '请输入用户名',
      icon: 'none'
    })
    return
  }

  if (!formData.value.password) {
    console.log('密码为空')
    uni.showToast({
      title: '请输入密码',
      icon: 'none'
    })
    return
  }

  if (formData.value.password.length < 6) {
    console.log('密码长度不足')
    uni.showToast({
      title: '密码至少6位',
      icon: 'none'
    })
    return
  }

  loading.value = true
  console.log('开始登录请求...')

  try {
    const result = await userStore.login({
      username: formData.value.username,
      password: formData.value.password
    })

    console.log('登录成功，准备跳转')

    uni.showToast({
      title: '登录成功',
      icon: 'success'
    })

    // 跳转到患者列表（首页）
    setTimeout(() => {
      console.log('✅ 登录成功，跳转到患者列表')

      // 🔄 使用 reLaunch 清空页面栈，避免返回到登录页
      uni.reLaunch({
        url: '/pages/patients/list'
      })
    }, 500)
  } catch (error: any) {
    console.error('登录失败:', error)

    uni.showToast({
      title: error.message || '登录失败',
      icon: 'none',
      duration: 3000
    })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
/* 医疗专业配色 */
$medical-primary: #0ea5e9;
$medical-blue-dark: #0284c7;
$medical-blue-light: #38bdf8;
$medical-teal: #14b8a6;
$sky-gradient-start: #0c4a6e;
$sky-gradient-end: #075985;

.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, $sky-gradient-start 0%, $sky-gradient-end 50%, $medical-blue-dark 100%);
  display: flex;
  flex-direction: column;
  position: relative;

  /* 医疗十字装饰 */
  &::before {
    content: '+';
    position: absolute;
    top: 10%;
    right: 10%;
    font-size: 200rpx;
    color: rgba(255, 255, 255, 0.03);
    font-weight: 300;
    font-family: Arial, sans-serif;
  }

  &::after {
    content: '+';
    position: absolute;
    bottom: 15%;
    left: 8%;
    font-size: 150rpx;
    color: rgba(255, 255, 255, 0.03);
    font-weight: 300;
    font-family: Arial, sans-serif;
  }
}

.status-bar {
  width: 100%;
}

.login-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 48rpx;
  position: relative;
  z-index: 1;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 100rpx;

  .logo-placeholder {
    width: 180rpx;
    height: 180rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #fff 0%, #f0f9ff 100%);
    margin-bottom: 36rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 32rpx rgba(14, 165, 233, 0.25);
    border: 4rpx solid rgba(255, 255, 255, 0.9);
  }

  .logo-icon {
    font-size: 110rpx;
    font-weight: 300;
    color: $medical-primary;
    font-family: Georgia, serif;
    text-shadow: 0 2rpx 8rpx rgba(14, 165, 233, 0.15);
  }

  .app-name {
    font-size: 44rpx;
    font-weight: 600;
    color: #fff;
    margin-bottom: 12rpx;
    letter-spacing: 2rpx;
    text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  }

  .app-desc {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.85);
    letter-spacing: 1rpx;
  }
}

.login-form {
  width: 100%;

  .form-item {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10rpx);
    border-radius: 28rpx;
    margin-bottom: 24rpx;
    padding: 0 32rpx;
    height: 100rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;

    &:focus-within {
      box-shadow: 0 6rpx 28rpx rgba(14, 165, 233, 0.2);
      transform: translateY(-2rpx);
    }

    &-icon {
      margin-right: 20rpx;
      font-size: 38rpx;
      color: $medical-primary;
    }

    &-input {
      flex: 1;
      font-size: 30rpx;
      height: 100%;
      color: #1f2937;
    }

    &-eye {
      padding: 10rpx;
      font-size: 36rpx;
      color: #94a3b8;
      transition: color 0.2s;

      &:active {
        color: $medical-primary;
      }
    }
  }

  .login-btn {
    width: 100%;
    height: 100rpx;
    background: linear-gradient(135deg, $medical-primary 0%, $medical-blue-dark 100%);
    color: #fff;
    border-radius: 28rpx;
    font-size: 34rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 48rpx;
    box-shadow: 0 8rpx 24rpx rgba(14, 165, 233, 0.35);
    border: none;
    transition: all 0.3s ease;

    &:not(:disabled):active {
      transform: translateY(2rpx);
      box-shadow: 0 4rpx 16rpx rgba(14, 165, 233, 0.3);
    }

    &:disabled {
      opacity: 0.7;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
    }
  }
}

.test-accounts {
  margin-top: 70rpx;
  padding: 32rpx;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10rpx);
  border-radius: 24rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.18);

  .test-title {
    display: block;
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 20rpx;
    font-weight: 500;
  }

  .account-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
  }

  .account-item {
    padding: 12rpx 24rpx;
    background: rgba(255, 255, 255, 0.18);
    border-radius: 32rpx;
    font-size: 24rpx;
    color: #fff;
    border: 1rpx solid rgba(255, 255, 255, 0.25);
    transition: all 0.2s ease;

    &:active {
      background: rgba(255, 255, 255, 0.28);
      transform: scale(0.96);
    }
  }
}

.copyright {
  margin-top: 90rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.65);
  letter-spacing: 0.5rpx;
}
</style>
