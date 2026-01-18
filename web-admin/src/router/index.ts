import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/Login.vue'),
    meta: { requiresAuth: false }
  },
  // 打印页面 - 不需要Layout，独立页面
  {
    path: '/print/treatment-record',
    name: 'PrintTreatmentRecord',
    component: () => import('@/views/print/TreatmentRecord.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/views/layout/Layout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Dashboard.vue'),
        meta: { title: '仪表盘', icon: 'Odometer' }
      },
      {
        path: 'patients',
        name: 'Patients',
        component: () => import('@/views/patients/Patients.vue'),
        meta: { title: '患者管理', icon: 'User' }
      },
      {
        path: 'projects',
        name: 'Projects',
        component: () => import('@/views/projects/Projects.vue'),
        meta: { title: '项目管理', icon: 'Grid' }
      },
      {
        path: 'records',
        name: 'Records',
        component: () => import('@/views/records/Records.vue'),
        meta: { title: '治疗记录', icon: 'Document' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/Users.vue'),
        meta: { title: '用户管理', icon: 'UserFilled', roles: ['admin'] }
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/statistics/Statistics.vue'),
        meta: { title: '统计报表', icon: 'TrendCharts' }
      },
      {
        path: 'backup',
        name: 'Backup',
        component: () => import('@/views/backup/Backup.vue'),
        meta: { title: '备份管理', icon: 'FolderOpened', roles: ['admin'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth !== false && !userStore.token) {
    next('/login')
  } else if (to.path === '/login' && userStore.token) {
    next('/')
  } else {
    // Check role permissions
    if (to.meta.roles) {
      const userRole = userStore.userInfo?.role
      if (userRole && !to.meta.roles.includes(userRole)) {
        next('/')
      } else {
        next()
      }
    } else {
      next()
    }
  }
})

export default router
