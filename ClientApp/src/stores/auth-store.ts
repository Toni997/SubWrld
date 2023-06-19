import { defineStore } from 'pinia'
import { api, ApiEndpoints } from '../boot/axios'
import { AuthState } from 'src/components/models'

export const useAuthStore = defineStore({
  id: 'auth',
  state: (): AuthState => ({
    isLoading: false,
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

        this.userInfo = {
          _id: data._id,
          username: data.username,
          email: data.email,
          isAdmin: data.isAdmin,
        }

        localStorage.setItem('token', data.token)

        this.router.push('/')
      } catch (error: any) {
        throw new Error('Wrong credentials')
      } finally {
        this.isLoading = false
      }
    },
    loadUserInfo(decodedToken: any): void {
      this.userInfo = {
        _id: decodedToken._id,
        username: decodedToken.username,
        email: decodedToken.email,
        isAdmin: decodedToken.isAdmin,
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

        this.userInfo = {
          _id: data._id,
          username: data.username,
          email: data.email,
          isAdmin: data.isAdmin,
        }

        localStorage.setItem('token', data.token)

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
  },
})
