<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-left">
        <h1>📚 图书管理系统</h1>
      </div>
      <div class="nav-right">
        <template v-if="authStore.user">
          <!-- 用户菜单 -->
          <el-dropdown @command="handleUserCommand">
            <div class="user-menu">
              <el-avatar :size="32" :src="userStore.profile?.avatar" class="user-avatar">
                {{ userStore.profile?.nickname?.charAt(0) || authStore.user.nickname?.charAt(0) }}
              </el-avatar>
              <span class="user-name">{{ authStore.user.nickname }}</span>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人资料
                </el-dropdown-item>
                <el-dropdown-item command="bookmarks">
                  <el-icon><Star /></el-icon>
                  我的收藏
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <router-link to="/login">登录</router-link>
          <router-link to="/register">注册</router-link>
        </template>
      </div>
    </nav>

    <div class="main-container">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowDown, User, Star, SwitchButton } from '@element-plus/icons-vue'
import { useAuthStore } from './stores/auth'
import { useUserStore } from './stores/user'

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()

const logout = () => {
  authStore.logout()
  router.push('/login')
}

const handleUserCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'bookmarks':
      router.push('/bookmarks')
      break
    case 'logout':
      logout()
      break
  }
}
</script>

<style scoped>
#app {
  font-family: Arial, sans-serif;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #2c3e50;
  color: white;
}

.nav-right a {
  color: white;
  margin-left: 1rem;
  text-decoration: none;
}

.nav-right a:hover {
  text-decoration: underline;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.user-menu:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-avatar {
  background: #409eff;
}

.user-name {
  font-size: 14px;
  color: white;
}

.dropdown-icon {
  color: white;
  font-size: 12px;
}

.main-container {
  padding: 1rem;
}
</style>
