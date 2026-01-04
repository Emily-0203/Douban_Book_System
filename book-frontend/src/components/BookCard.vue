<template>
  <div class="book-card" @click="handleClick">
    <!-- 收藏按钮 -->
    <div class="bookmark-button" @click.stop="toggleBookmark">
      <el-icon :class="['bookmark-icon', { 'bookmarked': isBookmarked }]">
        <Star />
      </el-icon>
    </div>

    <div class="book-cover">
      <img v-if="book.coverImageUrl" :src="book.coverImageUrl" :alt="book.title" />
      <div v-else class="no-cover">📚</div>
    </div>
    <div class="book-cover">
      <img v-if="book.coverImageUrl" :src="book.coverImageUrl" :alt="book.title" />
      <div v-else class="no-cover">📚</div>
    </div>
    <div class="book-info">
      <h4>{{ book.title }}</h4>
      <p class="author">{{ book.author?.join(', ') }}</p>
      <div class="meta">
        <span class="rating">⭐ {{ book.rating || '暂无评分' }}</span>
        <span class="press">{{ book.press }}</span>
      </div>
      <div class="tags">
        <span v-for="tag in book.tags?.slice(0, 3)" :key="tag" class="tag">
          {{ tag }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Star } from '@element-plus/icons-vue'
import { useBookmarkStore } from '../stores/bookmark'
import type { Book } from '../types/book'

interface Props {
  book: Book
}

const props = defineProps<Props>()
const emit = defineEmits<{
  click: [id: string]
}>()

const bookmarkStore = useBookmarkStore()
const bookmarking = ref(false)

// 是否已收藏
const isBookmarked = computed(() => {
  return bookmarkStore.isBookmarked(props.book._id)
})

// 切换收藏
const toggleBookmark = async () => {
  if (bookmarking.value) return

  bookmarking.value = true
  try {
    const success = await bookmarkStore.toggleBookmark(props.book._id)
    if (success) {
      ElMessage.success(isBookmarked.value ? '已取消收藏' : '收藏成功')
    }
  } catch (error) {
    console.error('收藏失败:', error)
  } finally {
    bookmarking.value = false
  }
}

// 页面加载时检查收藏状态
onMounted(() => {
  bookmarkStore.checkBookmark(props.book._id)
})

const handleClick = () => {
  emit('click', props.book._id)
}
</script>


<style scoped>
.book-card {
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.book-cover {
  height: 180px;
  margin-bottom: 12px;
  overflow: hidden;
  border-radius: 4px;
}

.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-cover {
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: #ccc;
}

.book-info h4 {
  margin: 0 0 8px;
  font-size: 16px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.author {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  background: #eef2ff;
  color: #3730a3;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 12px;
}

.book-card {
  position: relative;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.bookmark-button {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  cursor: pointer;
  padding: 4px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  transition: all 0.2s;
}

.bookmark-button:hover {
  background: white;
  transform: scale(1.1);
}

.bookmark-icon {
  font-size: 20px;
  color: #c0c4cc;
  transition: all 0.2s;
}

.bookmark-icon.bookmarked {
  color: #f6ad15;
}

.bookmark-icon:hover {
  color: #f6ad15;
}

</style>
