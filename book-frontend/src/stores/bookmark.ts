import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { bookmarkApi, type Bookmark } from '../api/bookmarks'

export const useBookmarkStore = defineStore('bookmark', () => {
  // 收藏状态缓存
  const bookmarksCache = ref<Record<string, boolean>>({})
  const bookmarksList = ref<Bookmark[]>([])
  const loading = ref(false)
  const stats = ref<any>(null)

  // 检查是否已收藏
  const isBookmarked = computed(() => (bookId: string) => {
    return bookmarksCache.value[bookId] || false
  })

  // 收藏/取消收藏
  const toggleBookmark = async (bookId: string) => {
    try {
      const response = await bookmarkApi.toggleBookmark(bookId)
      if (response.success) {
        // 更新缓存
        bookmarksCache.value[bookId] = response.data.isBookmarked
        return response.data.isBookmarked
      }
      return false
    } catch (error) {
      console.error('收藏操作失败:', error)
      return false
    }
  }

  // 检查收藏状态
  const checkBookmark = async (bookId: string) => {
    try {
      const response = await bookmarkApi.checkBookmark(bookId)
      if (response.success) {
        bookmarksCache.value[bookId] = response.data.isBookmarked
      }
      return response.data.isBookmarked
    } catch (error) {
      console.error('检查收藏状态失败:', error)
      return false
    }
  }

  // 获取收藏列表
  const fetchBookmarks = async (page = 1, limit = 20) => {
    loading.value = true
    try {
      const response = await bookmarkApi.getBookmarks(page, limit)
      if (response.success) {
        bookmarksList.value = response.data
        return response
      }
    } catch (error) {
      console.error('获取收藏列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 获取收藏统计
  const fetchStats = async () => {
    try {
      const response = await bookmarkApi.getBookmarkStats()
      if (response.success) {
        stats.value = response.data
      }
    } catch (error) {
      console.error('获取收藏统计失败:', error)
    }
  }

  // 批量检查收藏状态
  const checkMultipleBookmarks = async (bookIds: string[]) => {
    const promises = bookIds.map(id => checkBookmark(id))
    await Promise.all(promises)
  }

  return {
    // state
    bookmarksList,
    loading,
    stats,

    // getters
    isBookmarked,

    // actions
    toggleBookmark,
    checkBookmark,
    fetchBookmarks,
    fetchStats,
    checkMultipleBookmarks
  }
})
