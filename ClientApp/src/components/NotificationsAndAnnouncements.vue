<template>
  <div>
    <q-tabs
      dense
      class="text-grey"
      active-color="primary"
      indicator-color="primary"
      align="justify"
      narrow-indicator
      swipeable
      v-model="tab"
    >
      <q-tab name="notifications" label="Notifications" />
      <q-tab name="announcements" label="Announcements" />
    </q-tabs>
    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="notifications">
        <q-spinner
          color="primary"
          size="3em"
          :thickness="10"
          v-if="isLoadingNotifications"
        />
        <q-banner v-if="notificationsError" dense class="text-white bg-red">
          <template v-slot:avatar>
            <q-icon name="error" color="white" />
          </template>
          {{ notificationsError }}
        </q-banner>
        <q-banner
          v-if="!notifications?.docs?.length && !isLoadingNotifications"
          dense
          class="text-white bg-blue"
        >
          <template v-slot:avatar>
            <q-icon name="info" color="white" />
          </template>
          No notifications yet
        </q-banner>
        <q-list bordered padding v-if="notifications?.docs?.length">
          <q-item
            v-for="notification in notifications.docs"
            :key="notification._id"
          >
            <q-item-section>
              <q-item-label overline>
                {{ moment(notification.updatedAt).fromNow() }}
              </q-item-label>
              <q-item-label caption>
                {{ notification.text }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <div
          class="row justify-center q-mt-md"
          v-if="notifications?.hasNextPage"
        >
          <q-btn
            icon="expand_more"
            color="primary"
            round
            :loading="isLoadingNotifications"
            @click="loadNotifications"
          >
            <q-tooltip>Load More</q-tooltip>
          </q-btn>
        </div>
      </q-tab-panel>
      <q-tab-panel name="announcements">
        <q-spinner
          color="primary"
          size="3em"
          :thickness="10"
          v-if="isLoadingAnnouncements"
        />
        <q-banner
          v-if="!announcements?.docs?.length && !isLoadingAnnouncements"
          dense
          class="text-white bg-blue"
        >
          <template v-slot:avatar>
            <q-icon name="info" color="white" />
          </template>
          No announcements yet
        </q-banner>
        <q-list bordered padding v-if="announcements?.docs?.length">
          <q-item
            v-for="announcement in announcements.docs"
            :key="announcement._id"
          >
            <q-item-section>
              <q-item-label overline>
                <q-btn
                  flat
                  dense
                  no-caps
                  :to="`/tv-shows/${announcement.tvShowId}`"
                  :label="announcement.tvShowTitle"
                />
                <div>
                  {{ moment(announcement.updatedAt).fromNow() }}
                </div>
              </q-item-label>
              <q-item-label caption>
                {{ announcement.text }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <div
          class="row justify-center q-mt-md"
          v-if="announcements?.hasNextPage"
        >
          <q-btn
            icon="expand_more"
            color="primary"
            round
            :loading="isLoadingAnnouncements"
            @click="loadAnnouncements"
          >
            <q-tooltip>Load More</q-tooltip>
          </q-btn>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script lang="ts">
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/auth-store'
import { Ref, defineComponent, onMounted, ref, watch } from 'vue'
import { IPaginated } from '../interfaces/common'
import { INotification } from '../interfaces/notification'
import { IAnnouncementWithTVShowTitle } from '../interfaces/announcement'
import moment from 'moment'
import { api, ApiEndpoints } from '../boot/axios'

export default defineComponent({
  setup() {
    const auth = useAuthStore()
    const $q = useQuasar()

    const tab: Ref<string> = ref('notifications')
    const notifications: Ref<IPaginated<INotification> | null> = ref(null)
    const announcements: Ref<IPaginated<IAnnouncementWithTVShowTitle> | null> =
      ref(null)
    const isLoadingNotifications: Ref<boolean> = ref(false)
    const isLoadingAnnouncements: Ref<boolean> = ref(false)
    const notificationsError: Ref<string> = ref('')
    const announcementsError: Ref<string> = ref('')

    onMounted(async () => {
      await loadNotifications()
    })

    watch(tab, async (newValue) => {
      console.log(newValue)
      if (newValue === 'notifications') {
        await reloadNotifications()
      } else {
        announcements.value = null
        await loadAnnouncements()
        console.log(announcements.value)
      }
    })

    const refreshNotifications = async (done: any) => {
      await reloadNotifications()
      done()
    }

    const refreshAnnouncements = async (done: any) => {
      await reloadAnnouncements()
      done()
    }

    const reloadNotifications = async () => {
      notifications.value = null
      await loadNotifications()
    }

    const reloadAnnouncements = async () => {
      announcements.value = null
      await loadAnnouncements()
    }

    const loadNotifications = async () => {
      isLoadingNotifications.value = true
      const page = notifications.value ? notifications.value.page + 1 : 1
      try {
        const response = await api.get(
          ApiEndpoints.getNotificationsForUser(page)
        )
        const data: IPaginated<INotification> = response.data
        if (notifications.value) {
          notifications.value.docs = notifications.value.docs.concat(data.docs)
          notifications.value.page = data.page
          notifications.value.hasNextPage = data.hasNextPage
        } else {
          notifications.value = data
        }
      } catch (err: any) {
        notificationsError.value = 'Failed to fetch subtitles.'
      } finally {
        isLoadingNotifications.value = false
      }
    }

    const loadAnnouncements = async () => {
      isLoadingAnnouncements.value = true
      const page = announcements.value ? announcements.value.page + 1 : 1
      try {
        const response = await api.get(
          ApiEndpoints.getAllWatchlistedAnnouncements(page)
        )
        const data: IPaginated<IAnnouncementWithTVShowTitle> = response.data
        if (announcements.value) {
          announcements.value.docs = announcements.value.docs.concat(data.docs)
          announcements.value.page = data.page
          announcements.value.hasNextPage = data.hasNextPage
        } else {
          announcements.value = data
        }
      } catch (err: any) {
        announcementsError.value = 'Failed to fetch announcements.'
      } finally {
        isLoadingAnnouncements.value = false
      }
    }

    return {
      auth,
      tab,
      isLoadingNotifications,
      isLoadingAnnouncements,
      notificationsError,
      announcementsError,
      notifications,
      announcements,
      moment,
      loadNotifications,
      loadAnnouncements,
      refreshNotifications,
      refreshAnnouncements,
    }
  },
})
</script>
