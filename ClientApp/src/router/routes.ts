import { RouteRecordRaw } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import ErrorNotFound from '../pages/ErrorNotFoundPage.vue'
import LogInPage from '../pages/LogInPage.vue'
import SignUpPage from '../pages/SignUpPage.vue'
import IndexPage from '../pages/IndexPage.vue'
import TVShowsPage from '../pages/TVShowsPage.vue'
import { useAuthStore } from 'src/stores/auth-store'
import TVShowDetailsPageVue from 'src/pages/TVShowDetailsPage.vue'
import WatchlistPage from 'src/pages/WatchlistPage.vue'
import ReportsPage from 'src/pages/ReportsPage.vue'

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
          const auth = useAuthStore()
          if (auth.isLoggedIn()) {
            next('/')
          }
          next()
        },
      },
      {
        path: '/signup',
        component: SignUpPage,
        beforeEnter: (to, from, next): any => {
          const auth = useAuthStore()
          if (auth.isLoggedIn()) {
            next('/')
          }
          next()
        },
      },
      {
        path: '/tv-shows',
        children: [
          {
            path: '',
            component: TVShowsPage,
          },
          {
            path: ':tvShowId',
            component: TVShowDetailsPageVue,
          },
          {
            path: '/watchlist',
            component: WatchlistPage,
            beforeEnter: (to, from, next): any => {
              const auth = useAuthStore()
              if (auth.isLoggedIn()) {
                next()
              }
              next('/')
            },
          },
          {
            path: '/reports',
            component: ReportsPage,
            beforeEnter: (to, from, next): any => {
              const auth = useAuthStore()
              if (auth.isAdmin()) {
                next()
              }
              next('/')
            },
          },
        ],
      },
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
