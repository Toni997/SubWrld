<template>
  <q-layout view="lHr LpR lFr">
    <q-header elevated class="bg-primary text-white" height-hint="98">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <q-avatar>
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg" />
          </q-avatar>
          SubWrld
        </q-toolbar-title>

        <q-btn dense flat round icon="menu" @click="toggleRightDrawer" />
      </q-toolbar>

      <q-tabs align="left">
        <q-route-tab to="/" label="Home" />
        <q-route-tab to="/tv-shows" label="TV Shows" />
        <q-route-tab to="/schedule" label="Schedule" />
      </q-tabs>
    </q-header>

    <q-drawer show-if-above v-model="leftDrawerOpen" side="left" bordered>
      <!-- drawer content -->
    </q-drawer>

    <q-drawer show-if-above v-model="rightDrawerOpen" side="right" bordered>
      <q-list>
        <hello-message></hello-message>
        <q-item v-if="!authStore.userInfo" clickable>
          <q-item-section>
            <q-item-label @click="$router.push('/login')">Log In</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-if="!authStore.userInfo" clickable>
          <q-item-section>
            <q-item-label @click="$router.push('/signup')"
              >Sign Up</q-item-label
            >
          </q-item-section>
        </q-item>
        <q-item v-if="authStore.userInfo" clickable>
          <q-item-section>
            <q-item-label @click="logoutClick()">Log Out</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { ref } from 'vue'
import HelloMessage from '../components/HelloMessage.vue'
import { useAuthStore } from '../stores/auth-store'
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill'

export default {
  components: { HelloMessage },
  setup() {
    const authStore = useAuthStore()
    const leftDrawerOpen = ref(false)
    const rightDrawerOpen = ref(false)
    polyfillCountryFlagEmojis()

    const logoutClick = async () => authStore.logout()

    return {
      authStore,
      logoutClick,
      leftDrawerOpen,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value
      },

      rightDrawerOpen,
      toggleRightDrawer() {
        rightDrawerOpen.value = !rightDrawerOpen.value
      },
    }
  },
}
</script>