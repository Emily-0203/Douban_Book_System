<template>
  <div class="comment-list">
    <div v-if="loading" class="loading">
      <el-skeleton :rows="3" animated />
    </div>

    <div v-else-if="comments.length === 0" class="empty">
      <el-empty description="暂无评论" />
    </div>

    <div v-else class="comments-container">
      <div class="comment-header">
        <h3>评论 ({{ comments.length }})</h3>
        <el-button
          v-if="showRefresh"
          type="text"
          @click="$emit('refresh')"
        >
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>

      <div v-for="(comment, index) in comments" :key="comment._id || index" class="comment-item">
        <div class="comment-avatar">
          <el-avatar :size="40" :src="comment.avatar || ''">
            {{ comment.username?.charAt(0) || '匿' }}
          </el-avatar>
        </div>

        <div class="comment-content">
          <div class="comment-header">
            <span class="username">{{ comment.username }}</span>
            <span class="time">{{ formatTime(comment.time || comment.createdAt || new Date()) }}</span>

            <!-- 删除按钮（仅限自己的评论） -->
            <el-button
              v-if="canDelete(comment)"
              type="text"
              size="small"
              @click="deleteComment(comment)"
              :loading="deletingId === comment._id"
            >
              删除
            </el-button>
          </div>

          <div v-if="comment.rating && comment.rating !== '0'" class="comment-rating">
            <el-rate
              :model-value="parseFloat(comment.rating)"
              disabled
              :max="10"
              size="small"
            />
          </div>

          <p class="comment-text">{{ comment.content }}</p>

          <div class="comment-location" v-if="comment.location">
            <el-icon><Location /></el-icon>
            {{ comment.location }}
          </div>

          <!-- 评论操作区域 -->
          <div class="comment-actions">
            <!-- 点赞按钮 -->
            <el-button
              size="small"
              :type="isLiked(comment) ? 'primary' : 'text'"
              @click.stop="toggleLike(comment)"
              :loading="likingId === comment._id"
              class="like-button"
            >
              <el-icon :color="isLiked(comment) ? '#f56c6c' : '#909399'">
                <svg v-if="isLiked(comment)" viewBox="0 0 1024 1024" width="16" height="16">
                  <path d="M885.9 533.7c16.8-22.2 26.1-49.4 26.1-77.7 0-44.9-25.1-87.4-65.5-111.1a67.67 67.67 0 0 0-34.3-9.3H572.4l6-122.9c1.4-29.7-9.1-57.9-29.5-79.4A106.62 106.62 0 0 0 471 99.9c-52 0-98 35-111.8 85.1l-85.9 311h-204c-40.1 0-72.6 32.5-72.6 72.6v299.8c0 40.1 32.5 72.6 72.6 72.6h214c39.7 0 72-32.2 72-71.9V562h197.9c39.7 0 72-32.2 72-71.9V538c0-1.3-.1-2.6-.2-3.9 39.7-3.3 71.8-35.8 71.8-76.4 0-1.3 0-2.6-.1-3.9z" fill="currentColor"/>
                </svg>
                <svg v-else viewBox="0 0 1024 1024" width="16" height="16">
                  <path d="M885.9 533.7c16.8-22.2 26.1-49.4 26.1-77.7 0-44.9-25.1-87.4-65.5-111.1a67.67 67.67 0 0 0-34.3-9.3H572.4l6-122.9c1.4-29.7-9.1-57.9-29.5-79.4A106.62 106.62 0 0 0 471 99.9c-52 0-98 35-111.8 85.1l-85.9 311h-204c-40.1 0-72.6 32.5-72.6 72.6v299.8c0 40.1 32.5 72.6 72.6 72.6h214c39.7 0 72-32.2 72-71.9V562h197.9c39.7 0 72-32.2 72-71.9V538c0-1.3-.1-2.6-.2-3.9 39.7-3.3 71.8-35.8 71.8-76.4 0-1.3 0-2.6-.1-3.9zM384 672h-72v-200h72v200zm464 0h-72v-200h72v200z" fill="currentColor"/>
                </svg>
              </el-icon>
              <span class="like-count">{{ comment.likes || 0 }}</span>
            </el-button>

            <!-- 回复按钮 -->
            <el-button
              size="small"
              type="text"
              @click.stop="showReplyInput(comment)"
              class="reply-button"
            >
              <el-icon><ChatDotRound /></el-icon>
              回复
            </el-button>
          </div>

          <!-- 回复输入框 -->
          <div v-if="replyingTo === comment._id" class="reply-input">
            <el-input
              v-model="replyContent"
              type="textarea"
              :rows="2"
              placeholder="写下你的回复..."
              maxlength="200"
              show-word-limit
              ref="replyInputRef"
            />
            <div class="reply-actions">
              <el-button size="small" @click="cancelReply">取消</el-button>
              <el-button type="primary" size="small" @click="submitReply(comment)" :loading="replying">
                回复
              </el-button>
            </div>
          </div>

          <!-- 点赞用户列表（可选显示） -->
          <div v-if="comment.likedBy && comment.likedBy.length > 0" class="liked-by">
            <small>
              <el-icon><Star /></el-icon>
              被 {{ comment.likedBy.length }} 人点赞
            </small>
          </div>

          <!-- 显示回复列表 -->
          <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
            <div class="reply-item" v-for="reply in comment.replies" :key="reply._id">
              <div class="reply-avatar">
                <el-avatar :size="32" :src="reply.avatar || ''">
                  {{ reply.username?.charAt(0) || '匿' }}
                </el-avatar>
              </div>
              <div class="reply-content">
                <div class="reply-header">
                  <span class="reply-username">{{ reply.username }}</span>
                  <span v-if="reply.replyTo" class="reply-to">
                    回复 <span class="reply-target">@{{ reply.replyTo }}</span>
                  </span>
                  <span class="reply-time">{{ formatTime(reply.createdAt) }}</span>
                </div>
                <p class="reply-text">{{ reply.content }}</p>
                <!-- 回复的点赞按钮 -->
                <div class="reply-actions">
                  <el-button
                    size="mini"
                    :type="isLiked(reply) ? 'primary' : 'text'"
                    @click.stop="toggleLike(reply)"
                    :loading="likingId === reply._id"
                    class="reply-like-button"
                  >
                    <el-icon><ThumbUp /></el-icon>
                    <span class="like-count">{{ reply.likes || 0 }}</span>
                  </el-button>
                  <el-button
                    size="mini"
                    type="text"
                    @click.stop="showReplyInput(comment, reply)"
                  >
                    回复
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick  } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Location, ChatDotRound, Star } from '@element-plus/icons-vue' // ✅ 添加图标
import { useAuthStore } from '../stores/auth'

interface Comment {
  _id?: string
  userId?: string
  username: string
  content: string
  rating: string
  time?: string
  location?: string
  createdAt?: string | Date
  avatar?: string
  likes?: number  // ✅ 新增：点赞数
  likedBy?: string[]  // ✅ 新增：点赞用户ID数组

  // ✅ 新增：回复相关字段
  replies?: Comment[]        // 回复列表
  parentId?: string         // 父评论ID（为空则表示是顶级评论）
  replyTo?: string          // 回复给谁的用户名
  replyToId?: string        // 回复给谁的ID
}

interface Props {
  comments: Comment[]
  loading?: boolean
  showRefresh?: boolean
  bookId?: string
}

const props = withDefaults(defineProps<Props>(), {
  comments: () => [],
  loading: false,
  showRefresh: false,
  bookId: ''
})

const emit = defineEmits<{
  refresh: []
  delete: [id: string]
  like: [commentId: string, isLike: boolean]  // ✅ 新增：点赞事件
}>()

const authStore = useAuthStore()
const deletingId = ref<string>('')
const likingId = ref<string>('')  // ✅ 新增：点赞加载状态

// 格式化时间
const formatTime = (time: string | Date | undefined) => {
  if (!time) return '刚刚'
  const date = time instanceof Date ? time : new Date(time)

  if (isNaN(date.getTime())) {
    return new Date().toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 检查是否可以删除（自己的评论）
const canDelete = (comment: Comment) => {
  if (!authStore.user) return false
  return comment.userId === authStore.user._id
}



// 删除评论
const deleteComment = async (comment: Comment) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })

    if (comment._id) {
      deletingId.value = comment._id
      emit('delete', comment._id)
    }
  } catch {
    // 用户取消
  } finally {
    deletingId.value = ''
  }
}

// 新增状态
const replyingTo = ref<string>('')
const replyContent = ref('')
const replying = ref(false)
const replyInputRef = ref()

// 显示回复输入框
const showReplyInput = (comment: Comment, targetReply?: Comment) => {
  if (!authStore.user) {
    ElMessage.warning('请先登录')
    return
  }

  replyingTo.value = comment._id || ''
  replyContent.value = targetReply ? `回复 @${targetReply.username}: ` : ''

  nextTick(() => {
    replyInputRef.value?.focus()
  })
}

// 取消回复
const cancelReply = () => {
  replyingTo.value = ''
  replyContent.value = ''
}

// 提交回复
const submitReply = async (parentComment: Comment) => {
  if (!authStore.user || !replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }

  replying.value = true
  try {
    const token = localStorage.getItem('token')
    const bookId = props.bookId

    // 方式一：使用专门的回复接口
    const response = await fetch(`/api/books/${bookId}/comments/${parentComment._id}/replies`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: replyContent.value,
        replyTo: parentComment.username,  // 回复给谁
        replyToId: parentComment.userId   // 回复给谁的ID
      })
    })

    const result = await response.json()

    if (result.success) {
      ElMessage.success('回复成功')
      // 通知父组件刷新评论
      emit('refresh')
      cancelReply()
    } else {
      ElMessage.error(result.message || '回复失败')
    }
  } catch (error) {
    console.error('回复失败:', error)
    ElMessage.error('回复失败，请检查网络')
  } finally {
    replying.value = false
  }
}

// 检查是否已点赞（优化版）
const isLiked = (item: Comment) => {
  if (!authStore.user || !item.likedBy) return false
  return item.likedBy.includes(authStore.user._id)
}

// 点赞/取消点赞（优化版）
const toggleLike = async (item: Comment) => {
  if (!authStore.user) {
    ElMessage.warning('请先登录')
    return
  }

  if (!item._id || !props.bookId) {
    console.error('缺少评论ID或书籍ID')
    return
  }

  likingId.value = item._id

  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/books/${props.bookId}/comments/${item._id}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()

    if (result.success) {
      // 更新本地数据
      const commentIndex = props.comments.findIndex(c => c._id === item._id)
      if (commentIndex !== -1) {
        emit('like', item._id, result.data.isLiked)
      }
      ElMessage.success(result.data.isLiked ? '点赞成功' : '已取消点赞')
    } else {
      ElMessage.error(result.message || '操作失败')
    }
  } catch (error) {
    console.error('点赞失败:', error)
    ElMessage.error('操作失败，请检查网络')
  } finally {
    likingId.value = ''
  }
}



</script>

<style scoped>
.comment-list {
  margin-top: 20px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.comment-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.comments-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  transition: box-shadow 0.2s;
}

.comment-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-content .comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.username {
  font-weight: 600;
  color: #303133;
}

.time {
  color: #909399;
  font-size: 12px;
}

.comment-rating {
  margin-bottom: 8px;
}

.comment-text {
  margin: 0 0 8px;
  line-height: 1.6;
  color: #606266;
  white-space: pre-line;
}

.comment-location {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 12px;
  margin-bottom: 12px;
}

/* ✅ 新增：点赞区域样式 */
.comment-actions {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
}

.like-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  min-width: 60px;
}

.like-count {
  font-size: 12px;
  margin-left: 4px;
}

.liked-by {
  margin-top: 8px;
  color: #909399;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.liked-by .el-icon {
  font-size: 10px;
  color: #f6ad15;
}

.loading {
  padding: 20px;
}

.empty {
  padding: 40px 0;
  text-align: center;
}

/* 新增样式 */
.reply-button {
  margin-left: 8px;
}

.reply-input {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #409eff;
}

.reply-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.replies-list {
  margin-top: 16px;
  margin-left: 56px; /* 缩进显示 */
  border-left: 2px solid #e1e4e8;
  padding-left: 16px;
}

.reply-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f9fafc;
  border-radius: 8px;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.reply-username {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.reply-to {
  color: #909399;
  font-size: 12px;
}

.reply-target {
  color: #409eff;
  font-weight: 500;
}

.reply-time {
  color: #909399;
  font-size: 12px;
}

.reply-text {
  margin: 0;
  line-height: 1.5;
  color: #606266;
  font-size: 14px;
}

.reply-like-button {
  padding: 2px 8px;
  min-width: 50px;
}

/* 点赞图标动画 */
.like-button:active .el-icon {
  transform: scale(1.2);
  transition: transform 0.1s;
}

.reply-like-button:active .el-icon {
  transform: scale(1.2);
  transition: transform 0.1s;
}


</style>
