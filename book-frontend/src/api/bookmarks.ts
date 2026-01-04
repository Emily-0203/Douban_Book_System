import { Book } from '../types/book'

export interface Bookmark {
  id: string
  bookId: string
  title: string
  author: string[]
  press: string
  coverImageUrl: string | null
  rating: string
  isbn: string
  publishDate: string
  bookmarkedAt: string
}

export interface BookmarkResponse {
  success: boolean
  message: string
  data: {
    isBookmarked: boolean
    bookmark?: {
      id: string
      createdAt: string
    }
  }
}

export interface BookmarksResponse {
  success: boolean
  data: Bookmark[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export const bookmarkApi = {
  // 收藏/取消收藏
  async toggleBookmark(bookId: string): Promise<BookmarkResponse> {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/bookmarks/${bookId}/toggle`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    return response.json()
  },

  // 检查收藏状态
  async checkBookmark(bookId: string): Promise<BookmarkResponse> {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/bookmarks/${bookId}/status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.json()
  },

  // 获取收藏列表
  async getBookmarks(page = 1, limit = 20): Promise<BookmarksResponse> {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/bookmarks/user/list?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.json()
  },

  // 获取收藏统计
  async getBookmarkStats() {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/bookmarks/user/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.json()
  }
}
