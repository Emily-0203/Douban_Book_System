<template>
  <div class="add-book-page">
    <!-- 返回按钮 -->
    <div class="page-header">
      <el-button type="link" @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h1>添加新书</h1>
    </div>

    <!-- 表单区域 -->
    <div class="form-container">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        label-position="top"
        :disabled="submitting"
      >
        <!-- 核心信息 -->
        <el-card class="form-section">
          <template #header>
            <div class="section-header">
              <h3>📖 核心信息</h3>
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

            <!-- 副标题（可选） -->
            <el-form-item label="副标题" class="full-width">
              <el-input
                v-model="form.subtitle"
                placeholder="副标题（可选）"
                clearable
              />
            </el-form-item>

            <!-- 作者（修复的版本） -->
            <el-form-item label="作者" prop="author" class="full-width">
              <div class="author-input-container">
                <!-- 显示已添加的作者 -->
                <div v-if="form.author.length > 0" class="author-tags">
                  <el-tag
                    v-for="(author, index) in form.author"
                    :key="index"
                    closable
                    @close="removeAuthor(index)"
                    class="author-tag"
                  >
                    {{ author }}
                  </el-tag>
                </div>

                <!-- 输入新作者 -->
                <div class="author-input-wrapper">
                  <el-input
                    v-model="newAuthorInput"
                    placeholder="输入作者，按回车或逗号添加"
                    @keyup.enter="addAuthor"
                    @keyup.space="addAuthor"
                    clearable
                  >
                    <template #append>
                      <el-button @click="addAuthor">添加</el-button>
                    </template>
                  </el-input>
                  <div class="input-tips">
                    <small>可添加多位作者，用逗号或回车分隔</small>
                  </div>
                </div>
              </div>
            </el-form-item>

            <!-- ISBN -->
            <el-form-item label="ISBN" prop="isbn" class="half-width">
              <el-input
                v-model="form.isbn"
                placeholder="978XXXXXXXXXX"
                clearable
              />
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
                placeholder="例如：42.00 或 ¥42.00"
                clearable
              >
                <template #append>元</template>
              </el-input>
              <div class="field-tip">支持输入 "42.00"、"¥42.00"、"42.00元"</div>
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
            <el-form-item label="页数" class="half-width">
              <el-input
                v-model="form.pages"
                placeholder="例如：320"
                clearable
              >
                <template #append>页</template>
              </el-input>
            </el-form-item>

            <!-- 装帧 -->
            <el-form-item label="装帧" class="half-width">
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
          <el-form-item label="作者简介">
            <el-input
              v-model="form.authorIntro"
              type="textarea"
              :rows="4"
              placeholder="作者简介（可选）..."
              maxlength="1000"
              show-word-limit
              resize="none"
            />
          </el-form-item>
        </el-card>

        <!-- 标签管理 -->
        <el-card class="form-section">
          <template #header>
            <h3>🏷️ 标签管理（可选）</h3>
          </template>

          <el-form-item label="标签">
            <div class="tags-container">
              <!-- 显示已选标签 -->
              <div v-if="form.tags.length > 0" class="selected-tags">
                <el-tag
                  v-for="(tag, index) in form.tags"
                  :key="index"
                  closable
                  @close="removeTag(index)"
                  class="tag-item"
                >
                  {{ tag }}
                </el-tag>
              </div>

              <!-- 标签输入 -->
              <div class="tags-input-wrapper">
                <el-input
                  v-model="newTagInput"
                  placeholder="输入标签，按回车添加"
                  @keyup.enter="addTag"
                  clearable
                >
                  <template #append>
                    <el-button @click="addTag">添加</el-button>
                  </template>
                </el-input>

                <!-- 热门标签建议 -->
                <div class="popular-tags">
                  <small>热门标签：</small>
                  <el-button
                    v-for="tag in popularTags"
                    :key="tag"
                    size="small"
                    @click="addTagFromSuggest(tag)"
                    class="suggest-tag"
                  >
                    {{ tag }}
                  </el-button>
                </div>
              </div>
            </div>
          </el-form-item>
        </el-card>

        <!-- 封面图片 -->
        <el-card class="form-section">
          <template #header>
            <h3>🖼️ 封面图片</h3>
          </template>

          <el-form-item label="封面图片" prop="coverImage">
            <div class="upload-area">
              <!-- 图片预览 -->
              <div v-if="imagePreview" class="image-preview">
                <img :src="imagePreview" alt="封面预览" />
                <el-button
                  type="danger"
                  size="small"
                  circle
                  @click="removeImage"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>

              <!-- 上传按钮 -->
              <el-upload
                v-else
                class="upload-demo"
                :show-file-list="false"
                :before-upload="beforeImageUpload"
                accept=".jpg,.jpeg,.png"
              >
                <el-button type="primary">
                  <el-icon><Upload /></el-icon> 点击上传封面
                </el-button>
                <div class="upload-tips">
                  <small>支持 JPG、PNG 格式，大小不超过 5MB</small>
                  <br>
                  <small class="required-tip">* 封面图片为必填项</small>
                </div>
              </el-upload>
            </div>
          </el-form-item>
        </el-card>

        <!-- 评分（可选） -->
        <el-card class="form-section">
          <template #header>
            <h3>⭐ 评分（可选）</h3>
          </template>

          <el-form-item label="评分">
            <div class="rating-container">
              <el-rate
                v-model="form.rating"
                :max="10"
                allow-half
                show-score
                score-template="{value} 分"
                class="rating-stars"
              />
              <div class="rating-tip">
                <small>1-10分，可不填（默认0分）</small>
              </div>
            </div>
          </el-form-item>
        </el-card>

        <!-- 表单操作 -->
        <div class="form-actions">
          <el-button @click="goBack">取消</el-button>
          <el-button
            type="primary"
            @click="submitForm"
            :loading="submitting"
          >
            {{ submitting ? '提交中...' : '添加图书' }}
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  ArrowLeft,
  Upload,
  Close
} from '@element-plus/icons-vue'

const router = useRouter()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const imagePreview = ref<string>('')
const coverImageFile = ref<File | null>(null)
const newAuthorInput = ref('')
const newTagInput = ref('')

// 热门标签建议
const popularTags = ref([
  '文学', '小说', '历史', '编程', '心理学', '经济学',
  '哲学', '科幻', '悬疑', '传记', '艺术', '教育'
])

// 表单数据（精简版）
const form = reactive({
  // 核心信息
  title: '',
  subtitle: '',
  author: [] as string[],  // 作者数组
  isbn: '',
  press: '',
  publishDate: '',
  price: '',

  // 详细信息
  pages: '',
  binding: '',
  summary: '',
  authorIntro: '',

  // 分类
  tags: [] as string[],

  // 评分
  rating: 0,

  // 封面图片（通过FormData上传）
})

// 表单验证规则
const rules: FormRules = {
  title: [
    { required: true, message: '请输入书名', trigger: 'blur' },
    { min: 1, max: 200, message: '长度在 1 到 200 个字符', trigger: 'blur' }
  ],
  author: [
    {
      required: true,
      validator: (rule, value, callback) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少添加一位作者'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  isbn: [
    { required: true, message: '请输入ISBN', trigger: 'blur' },
    { pattern: /^[0-9\-]+$/, message: 'ISBN只能包含数字和横线', trigger: 'blur' }
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
  ],
  coverImage: [
    {
      required: true,
      validator: (rule, value, callback) => {
        if (!coverImageFile.value) {
          callback(new Error('请上传封面图片'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 作者操作函数
const addAuthor = () => {
  if (!newAuthorInput.value.trim()) return

  const authors = newAuthorInput.value
    .split(/[,，]/)  // 支持逗号分隔
    .map(a => a.trim())
    .filter(a => a.length > 0)

  authors.forEach(author => {
    if (!form.author.includes(author)) {
      form.author.push(author)
    }
  })

  newAuthorInput.value = ''
}

const removeAuthor = (index: number) => {
  form.author.splice(index, 1)
}

// 标签操作函数
const addTag = () => {
  if (!newTagInput.value.trim()) return

  const tag = newTagInput.value.trim()
  if (!form.tags.includes(tag)) {
    form.tags.push(tag)
  }

  newTagInput.value = ''
}

const addTagFromSuggest = (tag: string) => {
  if (!form.tags.includes(tag)) {
    form.tags.push(tag)
  }
}

const removeTag = (index: number) => {
  form.tags.splice(index, 1)
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
  coverImageFile.value = file
  return false // 阻止自动上传，我们手动处理
}

// 移除图片
const removeImage = () => {
  imagePreview.value = ''
  coverImageFile.value = null
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    // 创建FormData（支持文件上传）
    const formData = new FormData()

    // 添加表单数据
    const formDataToSend = {
      title: form.title,
      subtitle: form.subtitle || '',
      author: form.author,
      isbn: form.isbn,
      press: form.press,
      publishDate: form.publishDate,
      price: form.price,
      pages: form.pages || '',
      binding: form.binding || '',
      summary: form.summary,
      authorIntro: form.authorIntro || '',
      tags: form.tags,
      rating: form.rating.toString() || '0',
      ratingCount: '0',      // 添加默认值
      reviewCount: '0',      // 添加默认值
      source: 'manual',
      doubanId: '',          // 添加空值
      doubanUrl: ''          // 添加空值
    }

    console.log('📦 完整表单数据:', JSON.stringify(formDataToSend, null, 2))

    // 添加非空字段到FormData
    Object.entries(formDataToSend).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (item) formData.append(key, item)
          })
        } else if (value !== '') {
          formData.append(key, String(value))
        }
      }
    })

    // 添加封面图片
    if (coverImageFile.value) {
      formData.append('cover', coverImageFile.value)
      console.log('📦 封面文件:', coverImageFile.value.name)
    }

    // 调试：显示FormData所有内容
    console.log('📦 FormData内容:')
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: [File] ${value.name}`)
      } else {
        console.log(`  ${key}:`, value)
      }
    }

    // 发送请求
    const response = await fetch('/api/books', {
      method: 'POST',
      body: formData
    })

    console.log('📦 响应状态:', response.status, response.statusText)

    const result = await response.json()
    console.log('📦 API响应:', result)

    if (result.success) {
      ElMessage.success('图书添加成功！')
      router.push(`/books/${result.data._id}`)
    } else {
      ElMessage.error(result.message || '添加失败')
    }
  } catch (error: any) {
    console.error('❌ 提交失败:', error)
    if (error.name !== 'ValidateError') {
      ElMessage.error(error.message || '提交失败，请检查网络')
    }
  } finally {
    submitting.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

onMounted(() => {
  // 可以预加载一些数据
})
</script>

<style scoped>
.add-book-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 28px;
  color: #303133;
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

/* 作者输入样式 */
.author-input-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.author-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.author-tag {
  margin-bottom: 4px;
}

.author-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-tips {
  color: #909399;
  font-size: 12px;
}

/* 标签样式 */
.tags-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  margin-bottom: 4px;
}

.tags-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.popular-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.popular-tags small {
  color: #909399;
}

.suggest-tag {
  padding: 4px 8px;
  font-size: 12px;
}

/* 上传区域样式 */
.upload-area {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
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
  line-height: 1.6;
}

/* 评分样式 */
.rating-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rating-stars {
  font-size: 24px;
}

.rating-tip {
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
}
</style>
