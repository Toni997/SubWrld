<template>
  <q-item>
    <q-item-section>
      <q-item-label
        >Hello,
        <strong>{{
          authStore.userInfo?.username || 'Guest'
        }}</strong></q-item-label
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
