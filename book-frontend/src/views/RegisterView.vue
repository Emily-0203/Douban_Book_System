<template>
  <div class="register-container">
    <h2>注册</h2>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <el-form
      ref="registerForm"
      :model="form"
      :rules="rules"
      @submit.prevent="handleRegister"
    >
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" />
        <div class="form-tip">3-20个字符，只能包含字母、数字、下划线</div>
      </el-form-item>

      <el-form-item label="密码" prop="password">
        <el-input v-model="form.password" type="password" show-password />
        <div class="form-tip">至少6个字符，建议包含字母和数字</div>
      </el-form-item>

      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="form.confirmPassword" type="password" show-password />
      </el-form-item>

      <el-form-item label="昵称" prop="nickname">
        <el-input v-model="form.nickname" />
        <div class="form-tip">可选，不填默认使用用户名</div>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleRegister" :loading="loading">
          {{ loading ? '注册中...' : '注册' }}
        </el-button>
        <router-link to="/login" class="login-link">已有账号？去登录</router-link>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const registerForm = ref<FormInstance>()

const form = ref({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: ''
})

const error = ref('')
const loading = ref(false)

// 验证规则
const validateUsername = (rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入用户名'))
  } else if (value.length < 3) {
    callback(new Error('用户名至少3个字符'))
  } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    callback(new Error('只能包含字母、数字、下划线'))
  } else {
    callback()
  }
}

const validatePassword = (rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入密码'))
  } else if (value.length < 6) {
    callback(new Error('密码至少6个字符'))
  } else {
    callback()
  }
}

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请确认密码'))
  } else if (value !== form.value.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  username: [
    { required: true, validator: validateUsername, trigger: 'blur' }
  ],
  password: [
    { required: true, validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!registerForm.value) return

  try {
    // 验证表单
    await registerForm.value.validate()

    loading.value = true
    error.value = ''

    const result = await authStore.register(
      form.value.username,
      form.value.password,
      form.value.nickname || undefined
    )

    if (result.success) {
      ElMessage.success('注册成功！')
      router.push('/')
    } else {
      error.value = result.message || '注册失败'
      ElMessage.error(error.value)
    }
  } catch (validateError) {
    // 验证失败，不进行注册
    console.log('表单验证失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
}

.error-message {
  color: #f56c6c;
  background: #fef0f0;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid #fbc4c4;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.login-link {
  margin-left: 16px;
  color: #409eff;
  text-decoration: none;
}

.login-link:hover {
  text-decoration: underline;
}
</style>
