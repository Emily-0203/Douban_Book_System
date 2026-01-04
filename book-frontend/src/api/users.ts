export interface UserProfile {
  _id: string
  username: string
  nickname: string
  avatar: string
  bio: string
  gender: string
  location: string
  website: string
  createdAt: string
  lastLogin?: string
}

export interface UpdateProfileData {
  nickname?: string
  bio?: string
  gender?: string
  location?: string
  website?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export interface UserStats {
  joinedDays: number
}

export const userApi = {
  // 获取用户信息
  async getProfile(): Promise<{ success: boolean; data: UserProfile }> {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.json()
  },

  // 更新用户信息
  async updateProfile(data: UpdateProfileData): Promise<{ success: boolean; message: string; data: UserProfile }> {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    return response.json()
  },

  // 上传头像
  async uploadAvatar(file: File): Promise<{ success: boolean; message: string; data: { avatar: string } }> {
    const token = localStorage.getItem('token')
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await fetch('/api/users/avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
    return response.json()
  },

  // 获取用户统计
  async getStats(): Promise<{ success: boolean; data: UserStats }> {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/users/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.json()
  },

  // 修改密码
  async changePassword(data: ChangePasswordData): Promise<{ success: boolean; message: string }> {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/users/password', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    return response.json()
  }
}
