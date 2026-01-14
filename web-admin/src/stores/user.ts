import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import type { LoginDto, UserInfo } from '@/types/user'

const API_BASE = '/api'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(
    JSON.parse(localStorage.getItem('userInfo') || 'null')
  )

  async function login(data: LoginDto) {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, data)

      if (response.status === 201) {
        token.value = response.data.access_token
        userInfo.value = response.data.user

        localStorage.setItem('token', response.data.access_token)
        localStorage.setItem('userInfo', JSON.stringify(response.data.user))

        return response.data
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '登录失败')
    }
  }

  async function getUserInfo() {
    try {
      const response = await axios.get(`${API_BASE}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })

      if (response.status === 200) {
        userInfo.value = response.data
        localStorage.setItem('userInfo', JSON.stringify(response.data))
      }
    } catch (error) {
      console.error('Failed to get user info:', error)
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  function hasRole(role: string): boolean {
    return userInfo.value?.role === role
  }

  return {
    token,
    userInfo,
    login,
    getUserInfo,
    logout,
    hasRole
  }
})
