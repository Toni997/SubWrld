import { RouteRecordRaw } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import ErrorNotFound from '../pages/ErrorNotFoundPage.vue'
import LogInPage from '../pages/LogInPage.vue'
import SignUpPage from '../pages/SignUpPage.vue'
import IndexPage from '../pages/IndexPage.vue'
import TVShowsPage from '../pages/TVShowsPage.vue'
import { useAuthStore } from 'src/stores/auth-store'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', component: IndexPage },
      {
        path: '/login',
        component: LogInPage,
        beforeEnter: (to, from, next): any => {
          const authStore = useAuthStore()
          if (authStore.userInfo) {
            next('/')
          }
          next()
        },
      },
      {
        path: '/signup',
        component: SignUpPage,
        beforeEnter: (to, from, next): any => {
          const authStore = useAuthStore()
          if (authStore.userInfo) {
            next('/')
          }
          next()
        },
      },
      { path: '/tv-shows', component: TVShowsPage },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: ErrorNotFound,
  },
]

export default routes
