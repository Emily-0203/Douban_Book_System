import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userApi, type UserProfile, type UpdateProfileData, type ChangePasswordData } from '../api/users'

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(null)
  const loading = ref(false)
  const stats = ref<any>(null)

  // 获取用户信息
  const fetchProfile = async () => {
    loading.value = true
    try {
      const response = await userApi.getProfile()
      if (response.success) {
        profile.value = response.data
      }
      return response
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 更新用户信息
  const updateProfile = async (data: UpdateProfileData) => {
    loading.value = true
    try {
      const response = await userApi.updateProfile(data)
      if (response.success && profile.value) {
        profile.value = response.data
      }
      return response
    } catch (error) {
      console.error('更新用户信息失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 上传头像
  const uploadAvatar = async (file: File) => {
    try {
      const response = await userApi.uploadAvatar(file)
      if (response.success && profile.value) {
        profile.value.avatar = response.data.avatar
      }
      return response
    } catch (error) {
      console.error('上传头像失败:', error)
      throw error
    }
  }

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const response = await userApi.getStats()
      if (response.success) {
        stats.value = response.data
      }
      return response
    } catch (error) {
      console.error('获取统计信息失败:', error)
      throw error
    }
  }

  // 修改密码
  const changePassword = async (data: ChangePasswordData) => {
    try {
      const response = await userApi.changePassword(data)
      return response
    } catch (error) {
      console.error('修改密码失败:', error)
      throw error
    }
  }

  // 重置状态
  const reset = () => {
    profile.value = null
    stats.value = null
  }

  return {
    // state
    profile,
    loading,
    stats,

    // actions
    fetchProfile,
    updateProfile,
    uploadAvatar,
    fetchStats,
    changePassword,
    reset
  }
})
