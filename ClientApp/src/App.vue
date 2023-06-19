<template>
  <router-view />
</template>

<script lang="ts">
import { useQuasar } from 'quasar'
import { useAuthStore } from './stores/auth-store'
import jwt_decode from 'jwt-decode'

export default {
  setup() {
    const $q = useQuasar()
    const authStore = useAuthStore()

    const token = localStorage.getItem('token')
    if (token) {
      const decoded: any = jwt_decode(token)
      const currentTime = Date.now() / 1000
      if (decoded.exp >= currentTime) {
        authStore.loadUserInfo(decoded)
      } else {
        localStorage.removeItem('token')
      }
    }

    // calling here; equivalent to when component is created
    $q.dark.set(true)
  },
}
</script>
