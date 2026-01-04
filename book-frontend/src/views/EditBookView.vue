<template>
  <div class="edit-book-page">
    <!-- 返回按钮 -->
    <div class="page-header">
      <el-button type="link" @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h1>编辑图书</h1>
      <el-tag v-if="bookData" type="info">
        ISBN: {{ bookData.isbn }}
      </el-tag>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <!-- 表单区域 -->
    <div v-else-if="bookData" class="form-container">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        label-position="top"
        :disabled="submitting"
      >
        <!-- 基础信息 -->
        <el-card class="form-section">
          <template #header>
            <div class="section-header">
              <h3>📖 基础信息</h3>
              <span class="required-tip">* 为必填项</span>
            </div>
          </template>

          <div class="form-grid">
            <!-- 书名 -->
            <el-form-item label="书名" prop="title" class="full-width">
              <el-input
                v-model="form.title"
                placeholder="请输入书名"
                clearable
              />
            </el-form-item>

            <!-- 副标题 -->
            <el-form-item label="副标题" prop="subtitle" class="full-width">
              <el-input
                v-model="form.subtitle"
                placeholder="请输入副标题（可选）"
                clearable
              />
            </el-form-item>

            <!-- 作者（可添加多个） -->
            <el-form-item label="作者" prop="author" class="full-width">
              <el-select
                v-model="form.author"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="请输入作者，可添加多个"
                style="width: 100%"
              >
                <el-option
                  v-for="(author, index) in form.author"
                  :key="index"
                  :label="author"
                  :value="author"
                />
              </el-select>
            </el-form-item>

            <!-- ISBN（不可编辑） -->
            <el-form-item label="ISBN" class="half-width">
              <el-input
                v-model="form.isbn"
                placeholder="978XXXXXXXXXX"
                disabled
              />
              <div class="field-tip">ISBN创建后不可修改</div>
            </el-form-item>

            <!-- 出版社 -->
            <el-form-item label="出版社" prop="press" class="half-width">
              <el-input
                v-model="form.press"
                placeholder="请输入出版社"
                clearable
              />
            </el-form-item>

            <!-- 出版日期 -->
            <el-form-item label="出版日期" prop="publishDate" class="half-width">
              <el-date-picker
                v-model="form.publishDate"
                type="date"
                placeholder="选择出版日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>

            <!-- 价格 -->
            <el-form-item label="价格" prop="price" class="half-width">
              <el-input
                v-model="form.price"
                placeholder="例如：¥42.00 或 42.00元"
                clearable
              >
                <template #append>元</template>
              </el-input>
            </el-form-item>
          </div>
        </el-card>

        <!-- 详细信息 -->
        <el-card class="form-section">
          <template #header>
            <h3>📋 详细信息</h3>
          </template>

          <div class="form-grid">
            <!-- 页数 -->
            <el-form-item label="页数" prop="pages" class="half-width">
              <el-input
                v-model="form.pages"
                placeholder="例如：320"
                clearable
              >
                <template #append>页</template>
              </el-input>
            </el-form-item>

            <!-- 装帧 -->
            <el-form-item label="装帧" prop="binding" class="half-width">
              <el-select
                v-model="form.binding"
                placeholder="选择装帧类型"
                style="width: 100%"
                clearable
              >
                <el-option label="平装" value="平装" />
                <el-option label="精装" value="精装" />
                <el-option label="线装" value="线装" />
                <el-option label="盒装" value="盒装" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>

            <!-- 豆瓣ID（可选） -->
            <el-form-item label="豆瓣ID" prop="doubanId" class="half-width">
              <el-input
                v-model="form.doubanId"
                placeholder="豆瓣图书ID（可选）"
                clearable
              />
            </el-form-item>

            <!-- 豆瓣链接（可选） -->
            <el-form-item label="豆瓣链接" prop="doubanUrl" class="half-width">
              <el-input
                v-model="form.doubanUrl"
                placeholder="https://book.douban.com/subject/xxx/"
                clearable
              />
            </el-form-item>
          </div>
        </el-card>

        <!-- 内容介绍 -->
        <el-card class="form-section">
          <template #header>
            <h3>📝 内容介绍</h3>
          </template>

          <!-- 书籍简介 -->
          <el-form-item label="书籍简介" prop="summary">
            <el-input
              v-model="form.summary"
              type="textarea"
              :rows="6"
              placeholder="请输入书籍简介..."
              maxlength="2000"
              show-word-limit
              resize="none"
            />
          </el-form-item>

          <!-- 作者简介 -->
          <el-form-item label="作者简介" prop="authorIntro">
            <el-input
              v-model="form.authorIntro"
              type="textarea"
              :rows="4"
              placeholder="请输入作者简介..."
              maxlength="1000"
              show-word-limit
              resize="none"
            />
          </el-form-item>
        </el-card>

        <!-- 标签管理 -->
        <el-card class="form-section">
          <template #header>
            <h3>🏷️ 标签管理</h3>
          </template>

          <el-form-item label="标签" prop="tags">
            <el-select
              v-model="form.tags"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="选择或输入标签"
              style="width: 100%"
            >
              <el-option
                v-for="tag in popularTags"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
            <div class="tag-tips">
              <small>当前标签：{{ form.tags.join(', ') || '暂无' }}</small>
            </div>
          </el-form-item>
        </el-card>

        <!-- 评分信息 -->
        <el-card class="form-section">
          <template #header>
            <h3>⭐ 评分信息</h3>
          </template>

          <div class="form-grid">
            <!-- 评分 -->
            <el-form-item label="评分" prop="rating" class="half-width">
              <el-input-number
                v-model="form.rating"
                :min="0"
                :max="10"
                :step="0.1"
                placeholder="0-10分"
                style="width: 100%"
              />
            </el-form-item>

            <!-- 评价人数 -->
            <el-form-item label="评价人数" prop="ratingCount" class="half-width">
              <el-input
                v-model="form.ratingCount"
                placeholder="例如：1254"
                clearable
              />
            </el-form-item>

            <!-- 评论人数 -->
            <el-form-item label="评论人数" prop="reviewCount" class="half-width">
              <el-input
                v-model="form.reviewCount"
                placeholder="例如：324"
                clearable
              />
            </el-form-item>
          </div>
        </el-card>

        <!-- 封面图片 -->
        <el-card class="form-section">
          <template #header>
            <h3>🖼️ 封面图片</h3>
          </template>

          <el-form-item label="封面图片">
            <div class="upload-area">
              <!-- 当前封面 -->
              <div v-if="bookData.coverImageUrl" class="current-cover">
                <h4>当前封面：</h4>
                <div class="current-image">
                  <img :src="bookData.coverImageUrl" alt="当前封面" />
                  <div class="image-info">
                    <span>{{ bookData.coverImage?.fileName || '未命名' }}</span>
                    <el-button
                      type="text"
                      size="small"
                      @click="viewOriginalCover"
                    >
                      查看原图
                    </el-button>
                  </div>
                </div>
              </div>

              <!-- 新图片上传 -->
              <div class="upload-new">
                <h4>更新封面：</h4>
                <div v-if="imagePreview" class="image-preview">
                  <img :src="imagePreview" alt="新封面预览" />
                  <el-button
                    type="danger"
                    size="small"
                    circle
                    @click="removeNewImage"
                  >
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>

                <el-upload
                  v-else
                  class="upload-demo"
                  :show-file-list="false"
                  :before-upload="beforeImageUpload"
                  accept=".jpg,.jpeg,.png,.gif"
                >
                  <el-button type="primary">
                    <el-icon><Upload /></el-icon> 上传新封面
                  </el-button>
                  <div class="upload-tips">
                    <small>支持 JPG、PNG 格式，大小不超过 5MB</small>
                  </div>
                </el-upload>
              </div>
            </div>
          </el-form-item>
        </el-card>

        <!-- 表单操作 -->
        <div class="form-actions">
          <el-button @click="goBack">取消</el-button>
          <el-button
            type="danger"
            plain
            @click="confirmDelete"
            :loading="deleting"
          >
            {{ deleting ? '删除中...' : '删除本书' }}
          </el-button>
          <el-button
            type="primary"
            @click="submitForm"
            :loading="submitting"
          >
            {{ submitting ? '保存中...' : '保存修改' }}
          </el-button>
        </div>
      </el-form>
    </div>

    <!-- 图书不存在 -->
    <div v-else class="not-found">
      <el-empty description="图书不存在或已删除">
        <el-button type="primary" @click="goBack">返回列表</el-button>
      </el-empty>
    </div>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="400px"
      :before-close="handleDeleteDialogClose"
    >
      <div class="delete-confirm">
        <el-alert
          title="⚠️  警告：此操作不可撤销！"
          type="warning"
          :closable="false"
          show-icon
        />
        <div class="confirm-content">
          <p>确定要删除《{{ bookData?.title }}》吗？</p>
          <p class="confirm-tip">所有相关评论和附件将被永久删除。</p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="deleteBook" :loading="deleting">
            确认删除
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  ArrowLeft,
  Upload,
  Close
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(true)
const submitting = ref(false)
const deleting = ref(false)
const deleteDialogVisible = ref(false)

const bookData = ref<any>(null)
const imagePreview = ref<string>('')
const newCoverFile = ref<File | null>(null)

// 热门标签建议
const popularTags = ref([
  '文学', '小说', '历史', '编程', '心理学', '经济学',
  '哲学', '科幻', '悬疑', '传记', '艺术', '教育'
])

// 表单数据
const form = reactive({
  title: '',
  subtitle: '',
  author: [] as string[],
  isbn: '',
  press: '',
  publishDate: '',
  price: '',
  pages: '',
  binding: '',
  doubanId: '',
  doubanUrl: '',
  summary: '',
  authorIntro: '',
  tags: [] as string[],
  rating: '',
  ratingCount: '',
  reviewCount: '',
  source: 'manual'
})

// 表单验证规则
const rules: FormRules = {
  title: [
    { required: true, message: '请输入书名', trigger: 'blur' },
    { min: 1, max: 200, message: '长度在 1 到 200 个字符', trigger: 'blur' }
  ],
  author: [
    { required: true, message: '请至少输入一位作者', trigger: 'blur' }
  ],
  press: [
    { required: true, message: '请输入出版社', trigger: 'blur' }
  ],
  publishDate: [
    { required: true, message: '请选择出版日期', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入价格', trigger: 'blur' }
  ],
  summary: [
    { required: true, message: '请输入书籍简介', trigger: 'blur' },
    { min: 10, message: '简介至少10个字符', trigger: 'blur' }
  ]
}

// 加载图书数据
const loadBookData = async () => {
  loading.value = true
  try {
    const response = await fetch(`/api/books/${route.params.id}`)
    const result = await response.json()

    if (result.success) {
      bookData.value = result.data
      // 填充表单数据
      Object.keys(form).forEach(key => {
        if (key in result.data) {
          const value = result.data[key]
          // 处理数组类型的空值
          if (Array.isArray(value) && (!value || value.length === 0)) {
            (form as any)[key] = []
          } else if (value !== null && value !== undefined) {
            (form as any)[key] = value
          }
        }
      })

      // 确保 author 是数组
      if (!Array.isArray(form.author)) {
        form.author = form.author ? [String(form.author)] : []
      }

      // 确保 tags 是数组
      if (!Array.isArray(form.tags)) {
        form.tags = form.tags ? [String(form.tags)] : []
      }

      ElMessage.success('数据加载完成')
    } else {
      ElMessage.error(result.message || '加载失败')
    }
  } catch (error: any) {
    console.error('加载失败:', error)
    ElMessage.error('加载失败，请检查网络')
  } finally {
    loading.value = false
  }
}

// 图片上传前的验证
const beforeImageUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB！')
    return false
  }

  // 预览图片
  imagePreview.value = URL.createObjectURL(file)
  newCoverFile.value = file
  return false // 阻止自动上传
}

// 移除新上传的图片
const removeNewImage = () => {
  imagePreview.value = ''
  newCoverFile.value = null
}

// 查看原封面
const viewOriginalCover = () => {
  if (bookData.value?.coverImageUrl) {
    window.open(bookData.value.coverImageUrl, '_blank')
  }
}

// 提交表单（更新图书）
const submitForm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    // 创建FormData
    const formData = new FormData()

    // 添加表单数据
    Object.keys(form).forEach(key => {
      const value = (form as any)[key]
      if (Array.isArray(value)) {
        // 数组类型（作者、标签）
        value.forEach(item => formData.append(key, item))
      } else if (value !== null && value !== undefined && value !== '') {
        formData.append(key, String(value))
      }
    })

    // 添加新封面图片（如果有）
    if (newCoverFile.value) {
      formData.append('cover', newCoverFile.value)
    }

    // 发送PUT请求
    const response = await fetch(`/api/books/${route.params.id}`, {
      method: 'PUT',
      body: formData
    })

    const result = await response.json()

    if (result.success) {
      ElMessage.success('图书更新成功！')
      // 重新加载数据
      await loadBookData()
      // 清除新图片预览
      removeNewImage()
    } else {
      ElMessage.error(result.message || '更新失败')
    }
  } catch (error: any) {
    console.error('更新失败:', error)
    if (error.name !== 'ValidateError') {
      ElMessage.error(error.message || '更新失败，请检查网络')
    }
  } finally {
    submitting.value = false
  }
}

// 确认删除
const confirmDelete = () => {
  deleteDialogVisible.value = true
}

// 删除图书
const deleteBook = async () => {
  deleting.value = true
  try {
    const response = await fetch(`/api/books/${route.params.id}`, {
      method: 'DELETE'
    })

    const result = await response.json()

    if (result.success) {
      ElMessage.success('图书删除成功！')
      // 跳转到首页
      router.push('/')
    } else {
      ElMessage.error(result.message || '删除失败')
      deleteDialogVisible.value = false
    }
  } catch (error: any) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败，请检查网络')
    deleteDialogVisible.value = false
  } finally {
    deleting.value = false
  }
}

// 处理删除对话框关闭
const handleDeleteDialogClose = (done: () => void) => {
  if (deleting.value) return
  ElMessageBox.confirm('确定取消删除吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    done()
  }).catch(() => {})
}

// 返回上一页
const goBack = () => {
  router.back()
}

onMounted(() => {
  loadBookData()
})
</script>

<style scoped>
.edit-book-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.page-header h1 {
  margin: 0;
  font-size: 28px;
  color: #303133;
}

.loading-container {
  padding: 40px;
  background: white;
  border-radius: 8px;
}

.not-found {
  padding: 80px 0;
  background: white;
  border-radius: 8px;
  text-align: center;
}

.form-container {
  background: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.required-tip {
  color: #f56c6c;
  font-size: 14px;
}

.field-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.full-width {
  grid-column: span 2;
}

.half-width {
  grid-column: span 1;
}

/* 上传区域样式 */
.upload-area {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.current-cover h4,
.upload-new h4 {
  margin: 0 0 12px;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

.current-image {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e1e4e8;
}

.current-image img {
  width: 100px;
  height: 140px;
  object-fit: cover;
  border-radius: 4px;
}

.image-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.image-info span {
  color: #606266;
  font-size: 14px;
}

.image-preview {
  position: relative;
  width: 200px;
  height: 280px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e1e4e8;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-preview .el-button {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
}

.image-preview .el-button:hover {
  background: rgba(0, 0, 0, 0.7);
}

.upload-demo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.upload-tips {
  color: #909399;
  font-size: 12px;
}

.tag-tips {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}

/* 表单操作按钮 */
.form-actions {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: center;
  gap: 20px;
}

/* 删除确认对话框 */
.delete-confirm {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.confirm-content {
  padding: 0 8px;
}

.confirm-content p {
  margin: 8px 0;
  color: #303133;
}

.confirm-tip {
  color: #f56c6c;
  font-size: 14px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width, .half-width {
    grid-column: span 1;
  }

  .form-container {
    padding: 20px;
  }

  .current-image {
    flex-direction: column;
    text-align: center;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .el-button {
    width: 100%;
  }
}
</style>
