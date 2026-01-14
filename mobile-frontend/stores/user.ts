import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LoginDto, UserInfo } from '@/types/user'

const API_BASE = 'http://localhost:3000'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const userInfo = ref<UserInfo | null>(null)

  // 初始化：从本地存储读取token
  function init() {
    const savedToken = uni.getStorageSync('token')
    const savedUserInfo = uni.getStorageSync('userInfo')

    if (savedToken) {
      token.value = savedToken
    }

    if (savedUserInfo) {
      userInfo.value = savedUserInfo
    }
  }

  // 登录
  async function login(data: LoginDto) {
    try {
      const response = await uni.request({
        url: `${API_BASE}/auth/login`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          username: data.username,
          password: data.password
        }
      }) as any

      if (response.statusCode === 201) {
        const result = response.data

        // 保存token和用户信息
        token.value = result.access_token
        userInfo.value = result.user

        // 持久化到本地存储
        uni.setStorageSync('token', result.access_token)
        uni.setStorageSync('userInfo', result.user)

        return result
      } else {
        throw new Error(response.data?.message || '登录失败')
      }
    } catch (error: any) {
      throw new Error(error.errMsg || '网络请求失败')
    }
  }

  // 获取当前用户信息
  async function getUserInfo() {
    if (!token.value) {
      throw new Error('未登录')
    }

    try {
      const response = await uni.request({
        url: `${API_BASE}/auth/profile`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token.value}`
        }
      }) as any

      if (response.statusCode === 200) {
        userInfo.value = response.data
        uni.setStorageSync('userInfo', response.data)
        return response.data
      } else {
        throw new Error('获取用户信息失败')
      }
    } catch (error: any) {
      throw new Error(error.errMsg || '网络请求失败')
    }
  }

  // 登出
  function logout() {
    token.value = ''
    userInfo.value = null

    // 清除本地存储
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')

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
