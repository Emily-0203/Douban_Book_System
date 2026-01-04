import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useUserStore } from './user'  // 新增导入

interface User {
  _id: string
  username: string
  nickname: string
  avatar: string
}

interface AuthResponse {
  success: boolean
  message?: string
  data?: {
    token: string
    user: User
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const userStore = useUserStore()  // 新增

  // 初始化时尝试获取用户信息
  if (token.value) {
    axios.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token.value}` }
    })
      .then(async res => {  // 改为 async
        if (res.data.success) {
          user.value = res.data.data
          // ✅ 新增：同步获取用户完整资料
          await userStore.fetchProfile()
        } else {
          logout()
        }
      })
      .catch(() => {
        logout()
      })
  }

  const login = async (username: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await axios.post<AuthResponse>('/api/auth/login', {
        username,
        password
      })

      if (response.data.success && response.data.data) {
        token.value = response.data.data.token
        user.value = response.data.data.user
        localStorage.setItem('token', token.value)

        // ✅ 新增：登录后获取用户完整资料
        await userStore.fetchProfile()
      }

      return response.data
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '网络错误，请稍后重试'
      }
    }
  }

  const register = async (username: string, password: string, nickname?: string): Promise<AuthResponse> => {
    try {
      const response = await axios.post<AuthResponse>('/api/auth/register', {
        username,
        password,
        nickname
      })

      if (response.data.success && response.data.data) {
        token.value = response.data.data.token
        user.value = response.data.data.user
        localStorage.setItem('token', token.value)

        // ✅ 新增：注册后获取用户完整资料
        await userStore.fetchProfile()
      }

      return response.data
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '注册失败，请稍后重试'
      }
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    userStore.reset()  // ✅ 新增：清除用户资料
    localStorage.removeItem('token')
  }

  return {
    user,
    token,
    login,
    register,
    logout
  }
})
