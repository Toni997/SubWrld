import { defineStore } from 'pinia'
import { api, ApiEndpoints } from '../boot/axios'
import { AuthState } from 'src/interfaces/user'

export const useAuthStore = defineStore({
  id: 'auth',
  state: (): AuthState => ({
    isLoading: false,
    darkMode: false,
    isSettingDarkMode: false,
    userInfo: null,
  }),
  actions: {
    async login(username: string, password: string): Promise<void> {
      this.isLoading = true
      try {
        const { data } = await api.post(ApiEndpoints.loginPath, {
          username,
          password,
        })
        this.loadUserInfo(data)
        this.router.push('/')
      } catch (error: any) {
        throw new Error(error.response ? 'Wrong credentials' : 'Server error')
      } finally {
        this.isLoading = false
      }
    },
    loadUserInfo(userInfo: any): void {
      this.userInfo = {
        _id: userInfo._id,
        username: userInfo.username,
        email: userInfo.email,
        isAdmin: userInfo.isAdmin,
      }
      this.darkMode = userInfo.darkMode
      userInfo.token && localStorage.setItem('token', userInfo.token)
      localStorage.setItem('darkMode', userInfo.darkMode.toString())
    },
    async signup(
      username: string,
      email: string,
      password: string
    ): Promise<void> {
      this.isLoading = true
      try {
        const { data } = await api.post(ApiEndpoints.signupPath, {
          username,
          email,
          password,
        })

        this.loadUserInfo(data)
        this.router.push('/')
      } catch (error: any) {
        throw new Error(error.response.data.message || 'Server error')
      } finally {
        this.isLoading = false
      }
    },
    logout() {
      this.userInfo = null
      localStorage.removeItem('token')
      this.router.push('/login')
    },
    isLoggedIn() {
      return !!this.userInfo
    },
    isAdmin() {
      return this.userInfo?.isAdmin || false
    },
    async setDarkMode(darkMode: boolean): Promise<void> {
      this.isSettingDarkMode = true
      this.darkMode = darkMode
      localStorage.setItem('darkMode', darkMode.toString())
      try {
        if (this.userInfo) {
          await api.patch(ApiEndpoints.setDarkMode, {
            darkMode,
          })
        }
      } catch (error: any) {
        throw new Error(error.response ? 'Wrong credentials' : 'Server error')
      } finally {
        this.isSettingDarkMode = false
      }
    },
    loadDarkModeFromStorage() {
      const darkModeFromStorage = localStorage.getItem('darkMode')
      const darkModeToBool = Boolean(darkModeFromStorage)
      this.darkMode = darkModeToBool
    },
  },
})
