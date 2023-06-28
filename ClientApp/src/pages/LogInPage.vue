<template>
  <q-page class="flex flex-center">
    <q-card class="q-card">
      <q-card-section>
        <h2 class="text-h4 text-center">Log in</h2>
        <span class="text-negative">
          {{ errorMessage }}
        </span>
        <q-form @submit.prevent="onLoginSubmit">
          <q-input
            v-model="username"
            type="text"
            label="Username"
            lazy-rules
            :rules="required"
          />
          <q-input
            v-model="password"
            type="password"
            label="Password"
            lazy-rules
            :rules="required"
          />
          <q-btn
            type="submit"
            color="primary"
            label="Log in"
            class="q-mt-md"
            :loading="auth.isLoading"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<style scoped>
.q-card {
  width: 100%;
  max-width: 500px;
}
</style>

<script lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth-store'
import { useQuasar } from 'quasar'

export default {
  setup() {
    const auth = useAuthStore()
    const username = ref('')
    const password = ref('')
    const errorMessage = ref('')

    const onLoginSubmit = async () => {
      username.value = username.value.trim()
      errorMessage.value = ''
      try {
        await auth.login(username.value, password.value)
      } catch (error: any) {
        errorMessage.value = error.message
      }
    }

    return {
      auth,
      username,
      password,
      onLoginSubmit,
      errorMessage,
      required: [
        (val: string) => (val && val.length > 0) || 'This field is required',
      ],
    }
  },
}
</script>
