<template>
  <div class="avatar-upload">
    <!-- 当前头像 -->
    <div class="current-avatar">
      <el-avatar :size="120" :src="avatarUrl" class="avatar-preview">
        {{ userStore.profile?.nickname?.charAt(0) || 'U' }}
      </el-avatar>
      <div class="avatar-info">
        <p class="avatar-tip">点击下方按钮上传新头像</p>
      </div>
    </div>

    <!-- 上传区域 -->
    <div class="upload-area">
      <el-upload
        class="upload-demo"
        :action="uploadUrl"
        :headers="uploadHeaders"
        :show-file-list="false"
        :before-upload="beforeAvatarUpload"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        name="avatar"
        :data="{ type: 'avatar' }" 
      >
        <el-button type="primary" :loading="uploading">
          <el-icon><Upload /></el-icon>
          {{ uploading ? `上传中 ${uploadProgress}%` : '选择图片上传' }}
        </el-button>
      </el-upload>

      <!-- 上传提示 -->
      <div class="upload-tips">
        <p class="tip-item">
          <el-icon><InfoFilled /></el-icon>
          支持 JPG、PNG、GIF 格式
        </p>
        <p class="tip-item">
          <el-icon><WarningFilled /></el-icon>
          图片大小不超过 2MB
        </p>
        <p class="tip-item">
          <el-icon><Check /></el-icon>
          建议图片尺寸 200x200 像素
        </p>
      </div>
    </div>

    <!-- 预览区域 -->
    <div v-if="previewUrl" class="preview-section">
      <h4>预览</h4>
      <div class="preview-container">
        <img :src="previewUrl" alt="头像预览" class="preview-image" />
      </div>
      <div class="preview-actions">
        <el-button @click="confirmUpload" type="primary" size="small">
          确认使用
        </el-button>
        <el-button @click="cancelPreview" size="small">
          取消
        </el-button>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      <el-alert :title="error" type="error" show-icon :closable="false" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Upload,
  InfoFilled,
  WarningFilled,
  Check
} from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import { useAuthStore } from '../stores/auth'

const emit = defineEmits<{
  success: [avatarUrl: string]
}>()

const userStore = useUserStore()
const authStore = useAuthStore()
const uploadRef = ref()

// 状态
const previewUrl = ref('')
const uploading = ref(false)
const uploadProgress = ref(0)
const error = ref('')
const tempFile = ref<File | null>(null)

// 计算属性
const avatarUrl = computed(() => userStore.profile?.avatar || '')
const uploadUrl = computed(() => '/api/users/avatar')
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
}))

// 上传前的验证
const beforeAvatarUpload = (file: File) => {
  error.value = ''
  tempFile.value = file

  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    error.value = '只能上传图片文件！'
    return false
  }

  if (!isLt2M) {
    error.value = '图片大小不能超过 2MB！'
    return false
  }

  // 预览
  previewUrl.value = URL.createObjectURL(file)

  return true
}

// 上传进度
const handleUploadProgress = (event: any) => {
  uploadProgress.value = Math.round((event.loaded / event.total) * 100)
}

// 上传成功
const handleUploadSuccess = (response: any) => {
  uploading.value = false
  uploadProgress.value = 0

  if (response.success) {
    ElMessage.success('头像上传成功！')

    // 更新本地状态
    if (userStore.profile) {
      userStore.profile.avatar = response.data.avatar
    }

    // 清理预览
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = ''
    }

    emit('success', response.data.avatar)
  } else {
    error.value = response.message || '上传失败'
    ElMessage.error(error.value)
  }
}

// 上传失败
const handleUploadError = (error: Error) => {
  uploading.value = false
  uploadProgress.value = 0

  console.error('上传失败:', error)
  ElMessage.error('上传失败，请检查网络连接')
}

// 确认上传
const confirmUpload = () => {
  if (tempFile.value) {
    uploading.value = true
    // 触发上传
    uploadRef.value.submit()
  }
}

// 取消预览
const cancelPreview = () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
  tempFile.value = null
  error.value = ''
}
</script>

<style scoped>
.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  margin: 0 auto;
}

.current-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.avatar-preview {
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.avatar-info {
  text-align: center;
}

.avatar-tip {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.upload-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-demo {
  width: 100%;
}

.upload-tips {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-item {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 12px;
}

.tip-item .el-icon {
  font-size: 14px;
}

.tip-item:nth-child(1) .el-icon {
  color: #409eff;
}

.tip-item:nth-child(2) .el-icon {
  color: #e6a23c;
}

.tip-item:nth-child(3) .el-icon {
  color: #67c23a;
}

.preview-section {
  width: 100%;
  animation: slideDown 0.3s ease;
}

.preview-section h4 {
  margin: 0 0 12px;
  color: #303133;
  font-size: 16px;
  text-align: center;
}

.preview-container {
  width: 200px;
  height: 200px;
  margin: 0 auto 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.error-message {
  width: 100%;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
