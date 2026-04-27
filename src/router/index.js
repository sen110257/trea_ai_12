import { createRouter, createWebHistory } from 'vue-router'
import AccountBook from '@/views/AccountBook.vue'
import Statistics from '@/views/Statistics.vue'
import Memo from '@/views/Memo.vue'

const routes = [
  {
    path: '/',
    redirect: '/account'
  },
  {
    path: '/account',
    name: 'Account',
    component: AccountBook,
    meta: {
      title: '记账'
    }
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: Statistics,
    meta: {
      title: '统计'
    }
  },
  {
    path: '/memo',
    name: 'Memo',
    component: Memo,
    meta: {
      title: '备忘录'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
