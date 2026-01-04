export interface User {
  _id: string
  username: string
  nickname: string
  avatar: string
  createdAt: string
  lastLogin?: string
}

export interface LoginResponse {
  success: boolean
  message: string
  data: {
    token: string
    user: User
  }
}