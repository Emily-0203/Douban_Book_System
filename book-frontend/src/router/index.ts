import { createRouter, createWebHistory, type RouteLocationNormalized, type NavigationGuardNext } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue')
  },
  {
  path: '/books/:id',
  name: 'BookDetail',
  component: () => import('../views/BookDetailView.vue'),
  meta: { requiresAuth: true }
},
{
  path: '/books/add',
  name: 'AddBook',
  component: () => import('../views/AddBookView.vue')
},
{
  path: '/books/:id/edit',
  name: 'EditBook',
  component: () => import('../views/EditBookView.vue') // 稍后创建
},
{
  path: '/bookmarks',
  name: 'Bookmarks',
  component: () => import('../views/BookmarksView.vue'),
  meta: { requiresAuth: true }
},
{
  path: '/profile',
  name: 'Profile',
  component: () => import('../views/UserProfileView.vue'),
  meta: { requiresAuth: true }
}

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.token) {
    next('/login')
  } else {
    next()
  }
})

export default router
