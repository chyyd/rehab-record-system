<template>
  <view class="app">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
  </view>
</template>

<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const statusBarHeight = ref(0)

// 检测是否是H5环境
const isH5 = typeof window !== 'undefined' && typeof document !== 'undefined'

onLaunch(() => {
  console.log('App Launch, 环境:', isH5 ? 'H5' : '小程序/App')

  // 获取系统信息
  try {
    const systemInfo = uni.getSystemInfoSync()
    statusBarHeight.value = systemInfo.statusBarHeight || 0
  } catch (e) {
    console.error('获取系统信息失败:', e)
    statusBarHeight.value = 0
  }

  // 初始化用户store（从本地存储恢复登录状态）
  userStore.init()

  // 检查登录状态 - 延迟执行以避免页面冲突
  setTimeout(() => {
    checkLoginStatus()
  }, 100)
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})

function checkLoginStatus() {
  try {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const currentRoute = currentPage?.route || ''

    console.log('当前页面:', currentRoute)

    // 如果已经在登录页，不需要跳转
    if (currentRoute.includes('login')) {
      console.log('已在登录页，跳过检查')
      return
    }

    // 使用userStore检查登录状态
    const isLoggedIn = userStore.isLoggedIn()
    console.log('登录状态:', isLoggedIn ? '已登录' : '未登录')

    if (!isLoggedIn) {
      console.log('未登录，跳转到登录页')
      // 未登录，跳转到登录页
      uni.reLaunch({
        url: '/pages/login/login'
      })
    } else {
      console.log('已登录，恢复用户信息')
      // 如果有token但没有用户信息，尝试获取
      if (!userStore.userInfo) {
        userStore.getUserInfo().catch(err => {
          console.error('获取用户信息失败:', err)
          // 如果获取用户信息失败，可能token已过期，需要重新登录
          userStore.logout()
        })
      }
    }
  } catch (e) {
    console.error('检查登录状态失败:', e)
  }
}
</script>

<style lang="scss">
/* 全局样式 */
@import '@/static/styles/global.scss';

page {
  background-color: #f5f5f5;
  font-size: 16px;
  line-height: 1.6;
}

.app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.status-bar {
  width: 100%;
}
</style>
