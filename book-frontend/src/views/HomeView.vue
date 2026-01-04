<template>
  <div class="home-page">
    <!-- 顶部搜索栏 -->
    <div class="search-header">
      <div class="search-box">
         <el-autocomplete
          v-model="searchKeyword"
          placeholder="搜索书名、作者、ISBN或标签..."
          size="large"
          @keyup.enter="search"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button type="primary" @click="search" :loading="loading">
              搜索
            </el-button>
          </template>
          <template #default="{ item }">
            <div class="suggestion-item">
              <span class="title">{{ item.title }}</span>
              <span class="author">{{ item.author?.join(', ') }}</span>
            </div>
          </template>
        </el-autocomplete>
      </div>
    </div>

  <div class="header-right">
  <!-- 已有代码... -->
  <el-button type="primary" @click="$router.push('/books/add')">
    <el-icon><Plus /></el-icon> 添加图书
  </el-button>
</div>

    <div class="main-layout">
      <!-- 左侧筛选栏 -->
      <div class="filter-sidebar">
        <h3 class="filter-title">筛选条件</h3>

        <div class="filter-section">
          <h4>评分</h4>
          <el-slider
            v-model="ratingRange"
            range
            :min="0"
            :max="10"
            :step="0.1"
            show-stops
          />
          <div class="slider-values">
            <span>{{ ratingRange[0] }}</span>
            <span>{{ ratingRange[1] }}</span>
          </div>
        </div>


        <div class="filter-section">
          <h4>热门标签</h4>
          <div class="tags-cloud">
            <el-tag
              v-for="tag in popularTags"
              :key="tag"
              class="tag-item"
              :type="selectedTags.includes(tag) ? 'primary' : 'info'"
              @click="toggleTag(tag)"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>

        <div class="filter-section">
          <h4>出版社</h4>
          <el-select
            v-model="selectedPress"
            placeholder="选择出版社"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="press in pressList"
              :key="press"
              :label="press"
              :value="press"
            />
          </el-select>
        </div>

        <el-button type="primary" @click="applyFilters" style="width: 100%">
          应用筛选
        </el-button>
        <el-button @click="resetFilters" style="width: 100%; margin-top: 10px">
          重置
        </el-button>
      </div>

      <!-- 右侧内容区 -->
      <div class="content-area">
        <div class="content-header">
          <div class="header-left">
            <h2>图书列表</h2>
            <span class="book-count">共 {{ total }} 本</span>
          </div>
          <div class="header-right">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button label="grid">
                <el-icon><Grid /></el-icon>
              </el-radio-button>
              <el-radio-button label="list">
                <el-icon><List /></el-icon>
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="6" animated />
        </div>

        <!-- 空状态 -->
        <div v-else-if="books.length === 0" class="empty-state">
          <el-empty description="暂无图书数据" />
        </div>

        <!-- 网格视图 -->
        <div v-else-if="viewMode === 'grid'" class="books-grid">
          <div
            v-for="book in books"
            :key="book._id"
            class="book-card"
            @click="viewDetail(book._id)"
          >
            <div class="book-cover">
            <img
              :src="book.coverImageUrl"
              :alt="book.title"
              @error="handleImageError"
              style="width: 100%; height: 200px; object-fit: cover;"
              />
            <div v-if="book.rating" class="book-rating">
              <el-rate
                  :model-value="parseFloat(book.rating)"
                  disabled
                  :max="10"
                  :show-score="true"
                  score-template="{value}"
                  />
              </div>
          </div>
            <div class="book-info">
              <h3 class="book-title" :title="book.title">{{ book.title }}</h3>
              <p class="book-author">{{ book.author?.join(' / ') }}</p>
              <div class="book-meta">
                <span class="meta-item">
                  <el-icon><OfficeBuilding /></el-icon>
                  {{ book.press }}
                </span>
                <span class="meta-item">
                  <el-icon><Calendar /></el-icon>
                  {{ book.publishDate }}
                </span>
                <span class="meta-item">
                  <el-icon><PriceTag /></el-icon>
                  {{ book.price }}
                </span>
              </div>
              <div class="book-tags">
                <el-tag
                  v-for="tag in book.tags?.slice(0, 2)"
                  :key="tag"
                  size="small"
                  class="book-tag"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 列表视图 -->
        <div v-else class="books-list">
          <el-table :data="books" style="width: 100%">
            <el-table-column width="80">
              <template #default="{ row }">
                <el-image
                  :src="row.coverImageUrl || '/placeholder.jpg'"
                  width="60"
                  height="80"
                  fit="cover"
                >
                  <template #error>
                    <div class="table-cover-placeholder">
                      <el-icon><Notebook /></el-icon>
                    </div>
                  </template>
                </el-image>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="书名" min-width="200" />
            <el-table-column prop="author" label="作者" width="120">
              <template #default="{ row }">
                {{ row.author?.join(', ') }}
              </template>
            </el-table-column>
            <el-table-column prop="press" label="出版社" width="120" />
            <el-table-column prop="rating" label="评分" width="100">
              <template #default="{ row }">
                <el-rate
                  :model-value="parseFloat(row.rating)"
                  disabled
                  :max="10"
                  :show-score="true"
                  score-template="{value}"
                />
              </template>
            </el-table-column>
            <el-table-column prop="price" label="价格" width="80" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  link
                  @click.stop="viewDetail(row._id)"
                >
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页 -->
        <div v-if="books.length > 0" class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchBooks"
            @current-change="fetchBooks"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted} from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  Grid,
  List,
  Notebook,
  OfficeBuilding,
  Calendar,
  PriceTag,
  Plus
} from '@element-plus/icons-vue'

const router = useRouter()
// 搜索建议
const searchSuggestions = ref<any[]>([])
// 数据状态
const searchKeyword = ref('')
const books = ref<any[]>([])
const total = ref(0)
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const viewMode = ref('grid')


// 筛选状态
const ratingRange = ref([0, 10])
const selectedTags = ref<string[]>([])
const selectedPress = ref('')
const popularTags = ref(['编程', '小说', '历史', '心理学', '经济学', '文学'])
const pressList = ref(['人民文学出版社', '商务印书馆', '中华书局', '清华大学出版社', '机械工业出版社'])


// 获取搜索建议
const querySearch = async (queryString: string, cb: any) => {
  if (!queryString.trim()) {
    cb([])
    return
  }

  try {
    const response = await fetch(`/api/books/search?q=${encodeURIComponent(queryString)}&limit=5`)
    const data = await response.json()

    if (data.success) {
      searchSuggestions.value = data.data.map((book: any) => ({
        ...book,
        value: book.title
      }))
      cb(searchSuggestions.value)
    } else {
      cb([])
    }
  } catch (error) {
    console.error('获取搜索建议失败:', error)
    cb([])
  }
}

// 处理选择建议
const handleSelect = (item: any) => {
  router.push(`/books/${item._id}`)
}

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  console.error('图片加载失败:', img.src)
  img.style.display = 'none'

  // 创建默认图标
  const parent = img.parentElement
  if (parent) {
    const placeholder = document.createElement('div')
    placeholder.className = 'image-placeholder'
    placeholder.innerHTML = '<el-icon><Picture /></el-icon>'
    parent.appendChild(placeholder)
  }
}


// 获取书籍
const fetchBooks = async () => {
  loading.value = true;
  try {
    const response = await fetch('/api/books/search/advanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: currentPage.value,
        limit: pageSize.value
      })
    });

    const data = await response.json();
    if (data.success) {
      books.value = data.data;
      total.value = data.pagination.total;
    }
  } catch (error) {
    console.error('获取书籍失败:', error);
  } finally {
    loading.value = false;
  }
};

// 搜索
const search = async () => {
  if (!searchKeyword.value.trim()) {
    fetchBooks()  // 清空搜索时显示全部
    return
  }

  loading.value = true
  try {
    const response = await fetch(`/api/books/search?q=${encodeURIComponent(searchKeyword.value)}`)
    const data = await response.json()
    if (data.success) {
      books.value = data.data
      total.value = data.count || data.data.length
    }
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    loading.value = false
  }
}

// 筛选
const applyFilters = async () => {
  loading.value = true;
  try {
    const response = await fetch('/api/books/search/advanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyword: searchKeyword.value,
        minRating: ratingRange.value[0],
        maxRating: ratingRange.value[1],
        tags: selectedTags.value,
        press: selectedPress.value,
        page: currentPage.value,
        limit: pageSize.value,

      })
    });

    const data = await response.json();
    if (data.success) {
      books.value = data.data;
      total.value = data.pagination.total;
    }
  } catch (error) {
    console.error('搜索失败:', error);
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  searchKeyword.value = ''
  ratingRange.value = [0, 10]
  selectedTags.value = []
  selectedPress.value = ''
  currentPage.value = 1
  fetchBooks()  // 重新加载数据
}


const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

// 查看详情
const viewDetail = (id: string) => {
  router.push(`/books/${id}`)
}

onMounted(() => {
  fetchBooks()
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.search-header {
  background: white;
  padding: 20px 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.search-box {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.main-layout {
  display: flex;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.filter-sidebar {
  width: 280px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: fit-content;
  position: sticky;
  top: 20px;
}

.filter-title {
  margin: 0 0 20px;
  color: #303133;
  font-size: 18px;
}

.filter-section {
  margin-bottom: 24px;
}

.filter-section h4 {
  margin: 0 0 12px;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.slider-values {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}

.tags-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  cursor: pointer;
  user-select: none;
}

.content-area {
  flex: 1;
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.header-left h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.book-count {
  color: #909399;
  font-size: 14px;
  margin-left: 12px;
}

.loading-container {
  padding: 40px 0;
}

.empty-state {
  padding: 80px 0;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.book-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #ebeef5;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.book-cover {
  position: relative;
  height: 280px;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 48px;
}

.book-rating {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px;
  backdrop-filter: blur(4px);
}

.book-info {
  padding: 16px;
}

.book-title {
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

.book-author {
  margin: 0 0 12px;
  color: #606266;
  font-size: 14px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 12px;
}

.book-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.book-tag {
  background: #f0f2f5;
  border: none;
}

.table-cover-placeholder {
  width: 60px;
  height: 80px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
}

.pagination-container {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: center;
}

.suggestion-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
}

.suggestion-item .title {
  font-weight: 500;
  color: #303133;
}

.suggestion-item .author {
  color: #909399;
  font-size: 12px;
}
</style>
