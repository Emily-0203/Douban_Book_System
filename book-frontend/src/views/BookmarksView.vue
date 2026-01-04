<template>
  <div class="bookmarks-page">
    <div class="page-header">
      <h1>
        <el-icon><Star /></el-icon>
        我的收藏
      </h1>

      <div class="stats" v-if="stats">
        <el-tag type="info">共 {{ stats.total }} 本</el-tag>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <el-skeleton :rows="6" animated />
    </div>

    <div v-else-if="bookmarks.length === 0" class="empty">
      <el-empty description="暂无收藏书籍">
        <el-button type="primary" @click="$router.push('/')">
          去发现好书
        </el-button>
      </el-empty>
    </div>

    <div v-else class="bookmarks-container">
      <!-- 书籍网格 -->
      <div class="books-grid">
        <div
          v-for="bookmark in bookmarks"
          :key="bookmark.id"
          class="bookmark-item"
          @click="viewBook(bookmark.bookId)"
        >
          <div class="book-cover">
            <img
              :src="bookmark.coverImageUrl || '/placeholder.jpg'"
              :alt="bookmark.title"
              @error="handleImageError"
            />
            <div class="bookmark-badge">
              <el-icon><Star /></el-icon>
              收藏于 {{ formatDate(bookmark.bookmarkedAt) }}
            </div>
          </div>

          <div class="book-info">
            <h3 class="title">{{ bookmark.title }}</h3>
            <p class="author">{{ bookmark.author?.join(' / ') }}</p>
            <div class="meta">
              <span class="press">{{ bookmark.press }}</span>
              <span class="date">{{ bookmark.publishDate }}</span>
            </div>
            <div class="rating">
              <el-rate
                :model-value="parseFloat(bookmark.rating)"
                disabled
                :max="10"
                size="small"
              />
            </div>
          </div>

          <div class="actions">
            <el-button
              type="danger"
              size="small"
              @click.stop="removeBookmark(bookmark)"
              :loading="deletingId === bookmark.id"
            >
              取消收藏
            </el-button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="pagination.total > pagination.limit">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="pagination.total"
          :page-sizes="[20, 40, 60]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadBookmarks"
          @current-change="loadBookmarks"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Star } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useBookmarkStore } from '../stores/bookmark'

const router = useRouter()
const bookmarkStore = useBookmarkStore()

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const deletingId = ref('')

const bookmarks = computed(() => bookmarkStore.bookmarksList)
const stats = computed(() => bookmarkStore.stats)
const pagination = computed(() => ({
  total: bookmarks.value.length * 2, // 简化分页
  limit: pageSize.value
}))

// 加载收藏
const loadBookmarks = async () => {
  loading.value = true
  try {
    await bookmarkStore.fetchBookmarks(currentPage.value, pageSize.value)
    await bookmarkStore.fetchStats()
  } catch (error) {
    console.error('加载收藏失败:', error)
  } finally {
    loading.value = false
  }
}

// 查看书籍
const viewBook = (bookId: string) => {
  router.push(`/books/${bookId}`)
}

// 取消收藏
const removeBookmark = async (bookmark: any) => {
  try {
    await ElMessageBox.confirm('确定要取消收藏吗？', '确认', {
      type: 'warning'
    })

    deletingId.value = bookmark.id
    const success = await bookmarkStore.toggleBookmark(bookmark.bookId)

    if (success) {
      ElMessage.success('已取消收藏')
      await loadBookmarks() // 重新加载
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消收藏失败')
    }
  } finally {
    deletingId.value = ''
  }
}

// 图片加载失败处理
const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.src = '/placeholder.jpg'
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
}

onMounted(() => {
  loadBookmarks()
})
</script>

<style scoped>
.bookmarks-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.page-header h1 {
  margin: 0;
  font-size: 28px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 10px;
}

.stats {
  display: flex;
  gap: 10px;
  align-items: center;
}

.loading {
  padding: 40px;
}

.empty {
  padding: 80px 0;
  text-align: center;
}

.bookmarks-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.bookmark-item {
  background: white;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  overflow: hidden;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
}

.bookmark-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.book-cover {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bookmark-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  padding: 8px 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.book-info {
  padding: 16px;
}

.title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.author {
  margin: 0 0 12px;
  color: #606266;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.rating {
  margin-top: 8px;
}

.actions {
  padding: 0 16px 16px;
  text-align: right;
}

.pagination {
  display: flex;
  justify-content: center;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>
