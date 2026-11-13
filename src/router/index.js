import Vue from 'vue'
import VueRouter from 'vue-router'
import { getSession } from '@/services/authService'
import LoginView from '@/views/views/Auth/LoginView.vue'
import RegisterView from '@/views/views/Auth/RegisterView.vue'

import StudentManagement from '@/views/views/Student/StudentManagement.vue'
import ChangePasswordView from '@/views/views/Auth/ChangePasswordView.vue'
import ResetPasswordView from '@/views/views/Auth/ResetPasswordView.vue'
import TutorManagement from '@/views/views/Tutor/TutorManagement.vue'
import AdminDashboard from '@/views/views/Admin/AdminDashboard.vue'

Vue.use(VueRouter)

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/register', name: 'register', component: RegisterView },
  { path: '/student-home', name: 'student-home', component: StudentManagement, meta: { requiresAuth: true, role: 'student' } },
  { path: '/profile', name: 'profile', component: StudentManagement, meta: { requiresAuth: true, role: 'student' } },
  { path: '/tutor-home', name: 'tutor-home', component: TutorManagement, meta: { requiresAuth: true, role: 'tutor' } },
  { path: '/change-password', name: 'change-password', component: ChangePasswordView, meta: { requiresAuth: true } },
  { path: '/reset-password', name: 'reset-password', component: ResetPasswordView },
  { path: '/admin-home', redirect: '/admin' },
  { path: '/admin', name: 'AdminDashboard', component: AdminDashboard, meta: { requiresAuth: true, role: 'admin' } },
  { path: '*', redirect: '/login' },
]

const router = new VueRouter({
  mode: 'history',
  routes
})

router.beforeEach((to, from, next) => {
  const session = getSession()
  if (to.meta.requiresAuth && !session) {
    return next('/login')
  }
  if (to.meta.role && session && session.role !== to.meta.role) {
    return next(`/${session.role}-home`)
  }
  if ((to.name === 'login' || to.name === 'register') && session) {
    return next(`/${session.role}-home`)
  }
  next()
})

export default router
