import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LoginDto, UserInfo } from '@/types/user'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

console.log('User Store initialized, API_BASE:', API_BASE)

// 检测是否是H5环境
const isH5 = typeof window !== 'undefined' && typeof document !== 'undefined'

console.log('运行环境:', isH5 ? 'H5' : '小程序/App')

// 通用请求函数
async function request(options: {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  headers?: Record<string, string>
  timeout?: number
}): Promise<any> {
  const fullUrl = options.url.startsWith('http') ? options.url : `${API_BASE}${options.url}`

  console.log('请求:', { url: fullUrl, method: options.method })

  // H5环境使用fetch
  if (isH5 && typeof fetch !== 'undefined') {
    console.log('使用fetch API')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000)

    try {
      const response = await fetch(fullUrl, {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.data ? JSON.stringify(options.data) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      console.log('Fetch响应:', { status: response.status, data })

      return {
        statusCode: response.status,
        data: data,
        header: {}
      }
    } catch (error: any) {
      clearTimeout(timeoutId)
      console.error('Fetch错误:', error)

      if (error.name === 'AbortError') {
        throw new Error('连接超时')
      }

      throw error
    }
  }

  // 小程序/App环境使用uni.request
  console.log('使用uni.request')
  return await uni.request({
    url: fullUrl,
    method: options.method,
    header: options.headers,
    data: options.data,
    timeout: options.timeout || 10000
  }) as any
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const userInfo = ref<UserInfo | null>(null)

  // 初始化：从本地存储读取token
  function init() {
    try {
      let savedToken: string = ''
      let savedUserInfo: any = null

      if (isH5) {
        savedToken = localStorage.getItem('token') || ''
        const userInfoStr = localStorage.getItem('userInfo')
        savedUserInfo = userInfoStr ? JSON.parse(userInfoStr) : null
      } else {
        savedToken = uni.getStorageSync('token')
        savedUserInfo = uni.getStorageSync('userInfo')
      }

      console.log('Init store - savedToken:', savedToken ? 'exists' : 'none')

      if (savedToken) {
        token.value = savedToken
      }

      if (savedUserInfo) {
        userInfo.value = savedUserInfo
      }
    } catch (e) {
      console.error('初始化store失败:', e)
    }
  }

  // 登录
  async function login(data: LoginDto) {
    console.log('开始登录:', data.username)

    try {
      const response = await request({
        url: '/auth/login',
        method: 'POST',
        data: {
          username: data.username,
          password: data.password
        },
        timeout: 10000
      })

      console.log('登录响应:', response)

      if (response.statusCode === 201) {
        const result = response.data

        console.log('登录成功:', result)

        // 保存token和用户信息
        token.value = result.access_token
        userInfo.value = result.user

        // 持久化到本地存储
        if (isH5) {
          localStorage.setItem('token', result.access_token)
          localStorage.setItem('userInfo', JSON.stringify(result.user))
        } else {
          uni.setStorageSync('token', result.access_token)
          uni.setStorageSync('userInfo', result.user)
        }

        return result
      } else {
        console.error('登录失败 - 状态码:', response.statusCode)
        throw new Error(response.data?.message || '登录失败')
      }
    } catch (error: any) {
      console.error('登录异常:', error)

      // 处理不同类型的错误
      if (error.message) {
        if (error.message.includes('超时') || error.message.includes('timeout')) {
          throw new Error('连接超时，请检查网络')
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('无法连接到服务器，请确保后端已启动')
        }
      }

      throw new Error(error.message || error.errMsg || '网络请求失败')
    }
  }

  // 获取当前用户信息
  async function getUserInfo() {
    if (!token.value) {
      throw new Error('未登录')
    }

    try {
      const response = await request({
        url: '/auth/profile',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })

      if (response.statusCode === 200) {
        userInfo.value = response.data

        if (isH5) {
          localStorage.setItem('userInfo', JSON.stringify(response.data))
        } else {
          uni.setStorageSync('userInfo', response.data)
        }

        return response.data
      } else {
        throw new Error('获取用户信息失败')
      }
    } catch (error: any) {
      throw new Error(error.message || '网络请求失败')
    }
  }

  // 登出
  function logout() {
    token.value = ''
    userInfo.value = null

    // 清除本地存储
    if (isH5) {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    } else {
      uni.removeStorageSync('token')
      uni.removeStorageSync('userInfo')
    }

    // 跳转到登录页
    uni.reLaunch({
      url: '/pages/login/login'
    })
  }

  // 检查是否已登录
  function isLoggedIn(): boolean {
    return !!token.value
  }

  // 检查用户角色
  function hasRole(role: string): boolean {
    return userInfo.value?.role === role
  }

  // 获取token
  function getToken(): string {
    return token.value
  }

  return {
    token,
    userInfo,
    init,
    login,
    getUserInfo,
    logout,
    isLoggedIn,
    hasRole,
    getToken
  }
})
