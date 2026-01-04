<template>
  <div class="detail-page">
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <el-button type="text" @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>

      <div class="action-buttons">
        <!-- 收藏按钮 -->
        <el-button
          type="primary"
          plain
          @click="toggleBookmark"
          :loading="bookmarking"
          :icon="isBookmarked ? StarFilled : Star"
        >
          {{ isBookmarked ? '已收藏' : '收藏本书' }}
        </el-button>

        <!-- 编辑按钮 -->
        <el-button
          type="primary"
          @click="$router.push(`/books/${book._id}/edit`)"
          v-if="book"
        >
          <el-icon><Edit /></el-icon> 编辑本书
        </el-button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else-if="book" class="book-detail">
      <!-- 图书封面 -->
      <div class="book-cover">
        <el-image
          :src="book.coverImageUrl"
          fit="cover"
          class="cover-image"
        >
          <template #error>
            <div class="cover-placeholder">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-image>
      </div>

      <!-- 图书信息 -->
      <div class="book-info">
        <!-- 图书标题和收藏状态 -->
        <div class="book-header">
          <h1>{{ book.title }}</h1>
          <!-- 收藏状态标签 -->
          <el-tag
            v-if="isBookmarked"
            type="warning"
            effect="light"
            size="small"
            class="bookmark-tag"
          >
            <el-icon><StarFilled /></el-icon>
            已收藏
          </el-tag>
        </div>

        <p class="subtitle">{{ book.subtitle }}</p>

        <div class="basic-info">
          <div class="info-item">
            <span class="label">作者：</span>
            <span class="value">{{ book.author?.join(' / ') }}</span>
          </div>
          <div class="info-item">
            <span class="label">出版社：</span>
            <span class="value">{{ book.press }}</span>
          </div>
          <div class="info-item">
            <span class="label">出版日期：</span>
            <span class="value">{{ book.publishDate }}</span>
          </div>
          <div class="info-item">
            <span class="label">ISBN：</span>
            <span class="value">{{ book.isbn }}</span>
          </div>
          <div class="info-item">
            <span class="label">价格：</span>
            <span class="value">{{ book.price }}</span>
          </div>
          <div class="info-item" v-if="book.pages">
            <span class="label">页数：</span>
            <span class="value">{{ book.pages }}页</span>
          </div>
          <div class="info-item" v-if="book.binding">
            <span class="label">装帧：</span>
            <span class="value">{{ book.binding }}</span>
          </div>
          <div class="info-item" v-if="book.priceNumber">
            <span class="label">数值价格：</span>
            <span class="value">¥{{ book.priceNumber.toFixed(2) }}</span>
          </div>
        </div>

        <!-- 评分 -->
        <div class="rating-section">
          <el-rate
            :model-value="parseFloat(book.rating)"
            disabled
            :max="10"
            :show-score="true"
            score-template="{value}分"
          />
          <span class="rating-count">
            ({{ book.commentCount || book.comments?.length || 0 }}条评论)
            <span v-if="book.ratingCount" class="original-count">
              · 豆瓣{{ book.ratingCount }}人评价
            </span>
          </span>
        </div>

        <!-- 标签 -->
        <div class="tags-section">
          <el-tag
            v-for="tag in book.tags"
            :key="tag"
            type="info"
            class="tag"
          >
            {{ tag }}
          </el-tag>
        </div>

        <!-- 内容简介 -->
        <div class="section" v-if="book.summary">
          <h3>内容简介</h3>
          <p class="summary">{{ book.summary }}</p>
        </div>

        <!-- 作者简介 -->
        <div class="section" v-if="book.authorIntro">
          <h3>作者简介</h3>
          <p class="author-intro">{{ book.authorIntro }}</p>
        </div>

        <!-- 评论部分 -->
        <div class="comments-section">
          <!-- ✅ 使用 CommentList 组件替代原有的评论渲染 -->
          <CommentList
            :comments="book.comments || []"
            :book-id="book._id"
            @refresh="fetchBook"
            @like="handleCommentLike"
            :loading="false"
          />

          <!-- 用户添加评论 -->
          <div class="add-comment">
            <h4>添加评论</h4>

            <!-- 未登录提示 -->
            <div v-if="!authStore.token" class="login-prompt">
              <el-alert title="登录后可发表评论" type="info" show-icon>
                <router-link to="/login" class="login-link">立即登录</router-link>
              </el-alert>
            </div>

            <!-- 评论输入框（仅登录后显示） -->
            <template v-else>
              <el-input
                v-model="newComment"
                type="textarea"
                :rows="4"
                placeholder="写下你的评论..."
                maxlength="500"
                show-word-limit
              />
              <div class="comment-actions">
                <el-rate v-model="userRating" :max="10" />
                <el-button type="primary" @click="submitComment" :loading="commenting">
                  提交评论
                </el-button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Picture, Edit, Star, StarFilled } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { useBookmarkStore } from '../stores/bookmark' // ✅ 导入收藏store
import { ElMessage } from 'element-plus'
import CommentList from '../components/CommentList.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const bookmarkStore = useBookmarkStore() // ✅ 使用收藏store

const book = ref<any>(null)
const loading = ref(false)
const newComment = ref('')
const userRating = ref(0)
const commenting = ref(false)
const bookmarking = ref(false) // ✅ 新增：收藏加载状态

// ✅ 计算是否已收藏
const isBookmarked = computed(() => {
  if (!book.value) return false
  return bookmarkStore.isBookmarked(book.value._id)
})

// ✅ 切换收藏
const toggleBookmark = async () => {
  if (!authStore.user) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  if (!book.value) return

  bookmarking.value = true
  try {
    const success = await bookmarkStore.toggleBookmark(book.value._id)
    if (success) {
      ElMessage.success(isBookmarked.value ? '已取消收藏' : '收藏成功')
    }
  } catch (error) {
    console.error('收藏操作失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  } finally {
    bookmarking.value = false
  }
}

// 获取图书数据
const fetchBook = async () => {
  loading.value = true
  try {
    const response = await fetch(`/api/books/${route.params.id}`)
    const data = await response.json()
    if (data.success) {
      book.value = data.data

      // ✅ 检查收藏状态
      if (authStore.user) {
        bookmarkStore.checkBookmark(data.data._id)
      }
    }
  } catch (error) {
    console.error('获取图书失败:', error)
    ElMessage.error('获取图书信息失败')
  } finally {
    loading.value = false
  }
}
const goBack = () => {
  router.back()
}

// ✅ 新增：处理评论点赞
// ✅ 修复后的处理评论点赞方法
const handleCommentLike = (commentId: string, isLiked: boolean) => {
  // 检查用户是否登录
  if (!authStore.user) {
    ElMessage.warning('请先登录')
    return
  }

  const userId = authStore.user._id

  // 递归查找评论并更新
  const findAndUpdateComment = (comments: any[], id: string): boolean => {
    for (const comment of comments) {
      if (comment._id === id) {
        if (isLiked) {
          comment.likes = (comment.likes || 0) + 1
          comment.likedBy = [...(comment.likedBy || []), userId]
        } else {
          comment.likes = Math.max(0, (comment.likes || 1) - 1)
          comment.likedBy = (comment.likedBy || []).filter((id: string) => id !== userId)
        }
        return true
      }
      if (comment.replies) {
        const found = findAndUpdateComment(comment.replies, id)
        if (found) return true
      }
    }
    return false
  }

  if (book.value?.comments) {
    findAndUpdateComment(book.value.comments, commentId)
  }
}


const submitComment = async () => {
  if (!newComment.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  if (!authStore.token) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  commenting.value = true
  try {
    const response = await fetch(`/api/books/${route.params.id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        content: newComment.value,
        rating: userRating.value
      })
    })

    const result = await response.json()

    if (result.success) {
      ElMessage.success('评论添加成功')
      newComment.value = ''
      userRating.value = 0
      await fetchBook()  // 重新加载书籍数据，显示新评论
    } else {
      ElMessage.error(result.message || '评论添加失败')
    }
  } catch (error) {
    console.error('提交评论失败:', error)
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    commenting.value = false
  }
}

onMounted(() => {
  fetchBook()
})
</script>

<style scoped>
.book-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.bookmark-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
}


.detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* ✅ 新增：顶部操作栏样式 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

/* 为收藏按钮添加特殊样式 */
.el-button--primary.is-plain[icon="Star"] .el-icon {
  color: #f6ad15; /* 未收藏时星星颜色 */
}

.el-button--primary.is-plain[icon="StarFilled"] .el-icon {
  color: #f6ad15; /* 已收藏时星星颜色 */
}

.el-button--primary.is-plain[icon="StarFilled"] {
  border-color: #f6ad15;
  color: #f6ad15;
  background-color: #fef6e5;
}

.el-button--primary.is-plain[icon="StarFilled"]:hover {
  background-color: #fdf0d5;
  border-color: #f2a93b;
}



.loading {
  padding: 40px;
}

.book-detail {
  display: flex;
  gap: 40px;
  margin-top: 20px;
}

.book-cover {
  flex: 0 0 300px;
}

.cover-image {
  width: 300px;
  height: 400px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 64px;
}

.book-info {
  flex: 1;
}

.book-info h1 {
  margin: 0 0 8px;
  font-size: 32px;
  color: #303133;
}

.subtitle {
  margin: 0 0 24px;
  color: #606266;
  font-size: 18px;
  font-style: italic;
}

.basic-info {
  margin-bottom: 24px;
}

.info-item {
  margin-bottom: 12px;
  font-size: 16px;
}

.label {
  color: #909399;
  font-weight: 500;
  min-width: 80px;
  display: inline-block;
}

.value {
  color: #303133;
}

.rating-section {
  margin: 24px 0;
  display: flex;
  align-items: center;
  gap: 16px;
}

.rating-count {
  color: #909399;
  font-size: 14px;
}

.original-count {
  color: #c0c4cc;
  font-size: 12px;
  font-style: italic;
}

.tags-section {
  margin-top: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  cursor: default;
}

.comments-section {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.add-comment {
  margin-top: 30px;
}

.add-comment h4 {
  margin-bottom: 16px;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.comment-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.section h3 {
  margin-bottom: 12px;
  color: #303133;
  font-size: 18px;
}

.summary, .author-intro {
  line-height: 1.8;
  color: #606266;
  white-space: pre-line;
}

.login-prompt {
  margin-bottom: 20px;
}

.login-link {
  margin-left: 10px;
  color: #409eff;
  text-decoration: none;
}

.login-link:hover {
  text-decoration: underline;
}



</style>
