<template>
  <q-item>
    <q-item-section>
      <q-item-label
        >Hello, {{ authStore.userInfo?.username || 'Guest' }}</q-item-label
      >
    </q-item-section>
  </q-item>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useAuthStore } from '../stores/auth-store'

export default defineComponent({
  name: 'HelloMessage',
  setup() {
    const authStore = useAuthStore()

    return { authStore }
  },
})
</script>
