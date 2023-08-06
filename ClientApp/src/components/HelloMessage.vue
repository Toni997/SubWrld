<template>
  <q-item>
    <q-item-section>
      <q-item-label class="text-body1">
        Hello,
        <q-btn
          v-if="authStore.userInfo"
          dense
          flat
          no-caps
          :to="`/users/${authStore.userInfo?._id}`"
        >
          <strong>{{ authStore.userInfo?.username || 'Guest' }}</strong>
        </q-btn>
        <span v-if="!authStore.userInfo">
          <strong>Guest</strong>
        </span>
      </q-item-label>
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
