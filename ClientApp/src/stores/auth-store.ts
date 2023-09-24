import { defineStore } from 'pinia'
import { api, ApiEndpoints } from '../boot/axios'
import { AuthState } from 'src/interfaces/user'
import { convertStringifiedBoolean } from 'src/utils/convertStringifiedBoolean'

export const useAuthStore = defineStore({
  id: 'auth',
  state: (): AuthState => ({
    isLoading: false,
    darkMode: false,
    isSettingDarkMode: false,
    userInfo: null,
  }),
  getters: {
    isLoggedIn: (state) => !!state.userInfo,
    isAdmin: (state) => state.userInfo?.isAdmin || false,
  },
  actions: {
    loadUserInfo(userInfo: any, isFromLogin = false): void {
      this.userInfo = {
        _id: userInfo._id,
        username: userInfo.username,
        email: userInfo.email,
        isAdmin: userInfo.isAdmin,
      }
      userInfo.token && localStorage.setItem('token', userInfo.token)
      if (isFromLogin)
        localStorage.setItem('darkMode', userInfo.darkMode.toString())
      this.initDarkMode(userInfo.darkMode)
    },
    async login(username: string, password: string): Promise<void> {
      this.isLoading = true
      try {
        const { data } = await api.post(ApiEndpoints.loginPath, {
          username,
          password,
        })
        this.loadUserInfo(data, true)
        this.router.push('/')
      } catch (error: any) {
        throw new Error(error.response ? 'Wrong credentials' : 'Server error')
      } finally {
        this.isLoading = false
      }
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
    async setDarkMode(darkMode: boolean): Promise<void> {
      this.isSettingDarkMode = true
      this.darkMode = darkMode
      localStorage.setItem('darkMode', darkMode.toString())
      try {
        if (this.userInfo)
          await api.patch(ApiEndpoints.setDarkMode, {
            darkMode,
          })
      } catch (error: any) {
        throw new Error(error.response ? 'Wrong credentials' : 'Server error')
      } finally {
        this.isSettingDarkMode = false
      }
    },
    initDarkMode(defaultValue = false) {
      const darkModeFromStorage = localStorage.getItem('darkMode')
      if (darkModeFromStorage) {
        const darkModeToBool = convertStringifiedBoolean(darkModeFromStorage)
        this.darkMode = darkModeToBool
      } else {
        this.darkMode = defaultValue
      }
    },
  },
})
