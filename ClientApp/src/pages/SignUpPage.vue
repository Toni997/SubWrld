<template>
  <q-page class="flex flex-center">
    <q-card class="q-card">
      <q-card-section>
        <h2 class="text-h4 text-center">Sign Up</h2>
        <span class="text-negative">
          {{ errorMessage }}
        </span>
        <q-form @submit.prevent="onSignupSubmit">
          <q-input
            v-model="username"
            type="text"
            label="Username"
            lazy-rules
            :rules="[required, usernameValid]"
          />
          <q-input
            v-model="email"
            type="text"
            label="Email"
            lazy-rules
            :rules="[required, emailValid]"
          />
          <q-input
            v-model="password"
            type="password"
            label="Password"
            lazy-rules
            :rules="[required, minLength]"
          />
          <q-input
            v-model="repeatPassword"
            type="password"
            label="Repeat Password"
            lazy-rules
            :rules="[required, matchPassword]"
          />
          <q-btn type="submit" color="primary" label="Log in" class="q-mt-md" />
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
import { defineComponent, ref } from 'vue'
import { useAuthStore } from '../stores/auth-store'

export default defineComponent({
  setup() {
    const username = ref('')
    const email = ref('')
    const password = ref('')
    const repeatPassword = ref('')
    const errorMessage = ref('')
    const authStore = useAuthStore()

    const onSignupSubmit = async () => {
      username.value = username.value.trim()
      email.value = email.value.trim()

      try {
        await authStore.signup(username.value, email.value, password.value)
      } catch (error: any) {
        errorMessage.value = error.message
      }
    }

    return {
      username,
      email,
      password,
      repeatPassword,
      errorMessage,
      required: (val: string) =>
        (val && val.length > 0) || 'This field is required',
      minLength: (val: string) => val.length >= 6 || 'At least 6 characters',
      usernameValid: (val: string) => {
        const re = /^(?=.{5,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/
        return re.test(val) || 'Username not valid'
      },
      emailValid: (val: string) => {
        const re = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
        return re.test(val) || 'Email not valid'
      },
      matchPassword: (val: string) =>
        val === password.value || 'Passwords do not match',
      onSignupSubmit,
    }
  },
})
</script>
