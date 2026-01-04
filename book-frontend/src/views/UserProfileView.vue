<template>
  <div class="profile-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-button type="text" @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h1>个人资料</h1>
    </div>

    <div v-if="loading" class="loading">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else class="profile-content">
      <!-- 基本信息卡片 -->
      <el-card class="profile-card">
        <template #header>
          <div class="card-header">
            <h3>基本信息</h3>
            <el-button type="primary" @click="showEditDialog" size="small">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
          </div>
        </template>

        <div class="basic-info">
          <!-- 头像 -->
          <div class="avatar-section">
            <AvatarUpload @success="handleAvatarSuccess" />
              <div class="avatar-info">
                <h4>{{ profile.nickname }}</h4>
                <p class="username">@{{ profile.username }}</p>
              </div>
          </div>

          <!-- 个人信息 -->
          <div class="info-grid">
            <div class="info-item">
              <span class="label">昵称</span>
              <span class="value">{{ profile.nickname }}</span>
            </div>
            <div class="info-item">
              <span class="label">性别</span>
              <span class="value">{{ formatGender(profile.gender) }}</span>
            </div>
            <div class="info-item">
              <span class="label">所在地</span>
              <span class="value">{{ profile.location || '未设置' }}</span>
            </div>
            <div class="info-item">
              <span class="label">个人网站</span>
              <span class="value">
                <a v-if="profile.website" :href="profile.website" target="_blank">
                  {{ profile.website }}
                </a>
                <span v-else>未设置</span>
              </span>
            </div>
            <div class="info-item full-width">
              <span class="label">个人简介</span>
              <p class="value bio">{{ profile.bio || '这个人很懒，什么都没留下～' }}</p>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 统计信息 -->
      <div class="stats-section">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-icon" style="background: #ecf5ff;">
                  <el-icon><Star /></el-icon>
                </div>
                <div class="stat-info">
                  <h3>{{ bookmarkStats?.total || 0 }}</h3>
                  <p>收藏书籍</p>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-icon" style="background: #f0f9eb;">
                  <el-icon><ChatDotRound /></el-icon>
                </div>
                <div class="stat-info">
                  <h3>{{ commentStats || 0 }}</h3>
                  <p>发表评论</p>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-icon" style="background: #fdf6ec;">
                  <el-icon><Calendar /></el-icon>
                </div>
                <div class="stat-info">
                  <h3>{{ userStats?.joinedDays || 0 }}</h3>
                  <p>加入天数</p>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 操作卡片 -->
      <div class="action-section">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card class="action-card">
              <template #header>
                <h4>账户安全</h4>
              </template>
              <div class="action-content">
                <p>定期修改密码以保证账户安全</p>
                <el-button type="warning" @click="showPasswordDialog" plain>
                  <el-icon><Lock /></el-icon>
                  修改密码
                </el-button>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="action-card">
              <template #header>
                <h4>我的收藏</h4>
              </template>
              <div class="action-content">
                <p>查看和管理收藏的书籍</p>
                <el-button type="primary" @click="$router.push('/bookmarks')">
                  <el-icon><Collection /></el-icon>
                  查看收藏
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 编辑资料对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑个人资料"
      width="500px"
      :before-close="handleEditDialogClose"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="80px"
      >
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-select v-model="editForm.gender" placeholder="请选择性别">
            <el-option label="保密" value="" />
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item label="所在地" prop="location">
          <el-input v-model="editForm.location" placeholder="请输入所在地" />
        </el-form-item>

        <el-form-item label="个人网站" prop="website">
          <el-input v-model="editForm.website" placeholder="请输入个人网站地址" />
        </el-form-item>

        <el-form-item label="个人简介" prop="bio">
          <el-input
            v-model="editForm.bio"
            type="textarea"
            :rows="3"
            placeholder="介绍一下自己吧～"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveProfile" :loading="saving">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="400px"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input
            v-model="passwordForm.currentPassword"
            type="password"
            placeholder="请输入当前密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="changePassword" :loading="changingPassword">
            确认修改
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  ArrowLeft,
  Edit,
  Calendar,
  Star,
  ChatDotRound,
  Lock,
  Collection
} from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import { useBookmarkStore } from '../stores/bookmark'
import { useAuthStore } from '../stores/auth'
import AvatarUpload from '../components/AvatarUpload.vue'

const router = useRouter()
const userStore = useUserStore()
const bookmarkStore = useBookmarkStore()
const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const changingPassword = ref(false)
const editDialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const editFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

// 计算属性
const profile = computed(() => userStore.profile || {
  _id: '',
  username: '',
  nickname: '',
  avatar: '',
  bio: '',
  gender: '',
  location: '',
  website: '',
  createdAt: ''
})

const userStats = computed(() => userStore.stats)
const bookmarkStats = computed(() => bookmarkStore.stats)
const commentStats = ref(0) // 需要后端支持，暂时设为0

// 编辑表单
const editForm = ref({
  nickname: '',
  gender: '',
  location: '',
  website: '',
  bio: ''
})

const editRules: FormRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度在2-20个字符', trigger: 'blur' }
  ],
  website: [
    {
      pattern: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
      message: '请输入有效的网址',
      trigger: 'blur'
    }
  ]
}

// 密码表单
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== passwordForm.value.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules: FormRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    await userStore.fetchProfile()
    await userStore.fetchStats()
    await bookmarkStore.fetchStats()

    // 初始化编辑表单
    if (userStore.profile) {
      editForm.value = {
        nickname: userStore.profile.nickname,
        gender: userStore.profile.gender,
        location: userStore.profile.location,
        website: userStore.profile.website,
        bio: userStore.profile.bio
      }
    }
  } catch (error) {
    console.error('加载用户数据失败:', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

// 格式化性别
const formatGender = (gender: string) => {
  const map: Record<string, string> = {
    'male': '男',
    'female': '女',
    'other': '其他',
    '': '保密'
  }
  return map[gender] || '保密'
}

// 显示编辑对话框
const showEditDialog = () => {
  editDialogVisible.value = true
}

// 处理编辑对话框关闭
const handleEditDialogClose = (done: () => void) => {
  if (saving.value) return
  done()
}

// 保存资料
const saveProfile = async () => {
  if (!editFormRef.value) return

  try {
    await editFormRef.value.validate()
    saving.value = true

    const response = await userStore.updateProfile(editForm.value)

    if (response.success) {
      ElMessage.success('资料更新成功')
      editDialogVisible.value = false
    } else {
      ElMessage.error(response.message || '更新失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

// 显示密码对话框
const showPasswordDialog = () => {
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  passwordDialogVisible.value = true
}

// 修改密码
const changePassword = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()
    changingPassword.value = true

    const response = await userStore.changePassword({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    })

    if (response.success) {
      ElMessage.success('密码修改成功')
      passwordDialogVisible.value = false

      // 询问是否重新登录
      ElMessageBox.confirm(
        '密码已修改成功，建议重新登录。是否立即重新登录？',
        '提示',
        {
          confirmButtonText: '重新登录',
          cancelButtonText: '稍后',
          type: 'warning'
        }
      ).then(() => {
        authStore.logout()
        router.push('/login')
      })
    } else {
      ElMessage.error(response.message || '修改失败')
    }
  } catch (error) {
    console.error('修改密码失败:', error)
  } finally {
    changingPassword.value = false
  }
}

// 头像上传成功回调
// 添加成功回调
const handleAvatarSuccess = (avatarUrl: string) => {
  ElMessage.success('头像更新成功')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.profile-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.page-header h1 {
  margin: 0;
  font-size: 28px;
  color: #303133;
}

.loading {
  padding: 40px;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.basic-info {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #ebeef5;
}

.avatar-info h4 {
  margin: 0 0 8px;
  font-size: 24px;
  color: #303133;
}

.username {
  margin: 0 0 12px;
  color: #909399;
  font-size: 14px;
}

.member-since {
  margin: 0;
  color: #909399;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item.full-width {
  grid-column: span 2;
}

.label {
  color: #909399;
  font-size: 14px;
  font-weight: 500;
}

.value {
  color: #303133;
  font-size: 16px;
  line-height: 1.6;
}

.value a {
  color: #409eff;
  text-decoration: none;
}

.value a:hover {
  text-decoration: underline;
}

.bio {
  margin: 0;
  white-space: pre-line;
  line-height: 1.8;
}

/* 统计卡片 */
.stats-section {
  margin-top: 20px;
}

.stat-card {
  height: 100%;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon .el-icon {
  font-size: 28px;
  color: #409eff;
}

.stat-info h3 {
  margin: 0;
  font-size: 28px;
  color: #303133;
  font-weight: 600;
}

.stat-info p {
  margin: 4px 0 0;
  color: #909399;
  font-size: 14px;
}

/* 操作卡片 */
.action-section {
  margin-top: 20px;
}

.action-card h4 {
  margin: 0;
  color: #303133;
}

.action-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-content p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-item.full-width {
    grid-column: span 1;
  }

  .avatar-section {
    flex-direction: column;
    text-align: center;
  }

  .stats-section .el-col {
    margin-bottom: 16px;
  }

  .stats-section .el-col:last-child {
    margin-bottom: 0;
  }

  .action-section .el-col {
    margin-bottom: 16px;
  }

  .action-section .el-col:last-child {
    margin-bottom: 0;
  }
}
</style>
