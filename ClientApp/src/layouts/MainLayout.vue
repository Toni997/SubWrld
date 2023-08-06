<template>
  <q-layout view="lHr LpR lFr">
    <q-header elevated class="bg-primary text-white" height-hint="98">
      <q-toolbar>
        <q-btn
          v-if="auth.isLoggedIn()"
          dense
          flat
          round
          icon="menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          <q-avatar>
            <img src="../assets/logo.png" />
          </q-avatar>
          SubWrld
        </q-toolbar-title>

        <q-btn dense flat round icon="menu" @click="toggleRightDrawer" />
      </q-toolbar>

      <q-tabs align="left">
        <q-route-tab to="/" label="Home" />
        <q-route-tab to="/tv-shows" label="TV Shows" />
        <q-route-tab
          v-if="auth.isLoggedIn()"
          to="/watchlist"
          label="Watchlist"
        />
        <q-route-tab v-if="auth.isAdmin()" to="/reports" label="Reports" />
      </q-tabs>
    </q-header>

    <q-drawer
      v-if="auth.isLoggedIn()"
      show-if-above
      v-model="leftDrawerOpen"
      side="left"
      bordered
    >
      <notifications-and-announcements />
    </q-drawer>

    <q-drawer show-if-above v-model="rightDrawerOpen" side="right" bordered>
      <q-list>
        <hello-message />
        <q-item>
          <q-item-section>
            <q-toggle size="lg" v-model="darkMode" ch label="Dark Mode" />
          </q-item-section>
        </q-item>
        <q-item v-if="!auth.isLoggedIn()" clickable to="/login">
          <q-item-section clickable>
            <q-item-label>Log In</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-if="!auth.isLoggedIn()" clickable to="/signup">
          <q-item-section>
            <q-item-label>Sign Up</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-if="auth.isLoggedIn()" clickable @click="logoutClick()">
          <q-item-section>
            <q-item-label>Log Out</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { ref, Ref, watch } from 'vue'
import HelloMessage from '../components/HelloMessage.vue'
import { useAuthStore } from '../stores/auth-store'
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill'
import { useQuasar } from 'quasar'
import { storeToRefs } from 'pinia'
import NotificationsAndAnnouncements from '../components/NotificationsAndAnnouncements.vue'

export default {
  components: { HelloMessage, NotificationsAndAnnouncements },
  setup() {
    const auth = useAuthStore()
    const { darkMode } = storeToRefs(auth)
    const $q = useQuasar()
    const leftDrawerOpen: Ref<boolean> = ref(false)
    const rightDrawerOpen: Ref<boolean> = ref(false)

    polyfillCountryFlagEmojis()

    const logoutClick = async () => auth.logout()

    watch(darkMode, async (newValue) => {
      await auth.setDarkMode(newValue)
      $q.dark.set(newValue)
    })

    return {
      auth,
      darkMode,
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