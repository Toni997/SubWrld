<template>
  <q-card>
    <q-card-section class="row justify-between">
      <h5 class="q-ma-none">Announcements</h5>
      <q-btn round flat icon="close" color="red" v-close-popup />
    </q-card-section>

    <q-dialog v-model="isConfirmDialogShown">
      <confirm-dialog
        message="Are you sure you want to delete this announcement?"
        @on-confirmed="deleteAnnouncement"
      />
    </q-dialog>

    <q-dialog v-model="isAnnouncementFormShown" persistent>
      <announcement-form
        style="width: min(600px, 100%)"
        :tvShowId="tvShowId"
        :announcement="announcementToEdit"
        @on-submit="onAnnouncementSaved"
      />
    </q-dialog>

    <q-card-section>
      <div class="q-mb-md">
        <q-btn
          v-if="auth.isAdmin()"
          label="Add Announcement"
          color="primary"
          @click="onAddAnnouncementClick"
        />
      </div>

      <q-spinner
        color="primary"
        size="3em"
        :thickness="10"
        v-if="isLoading && !announcements.length"
      />
      <q-banner
        v-if="!announcements.length && !isLoading"
        dense
        class="text-white bg-blue"
      >
        <template v-slot:avatar>
          <q-icon name="info" color="white" />
        </template>
        No announcements yet
      </q-banner>
      <q-banner v-if="error" dense class="text-white bg-red">
        <template v-slot:avatar>
          <q-icon name="error" color="white" />
        </template>
        {{ error }}
      </q-banner>
      <q-list bordered padding v-if="announcements.length">
        <q-item
          v-for="(announcement, index) in announcements"
          :key="announcement._id"
        >
          <q-item-section>
            <q-item-label overline>
              {{ moment(announcement.updatedAt).fromNow() }}
            </q-item-label>
            <q-item-label caption>
              {{ announcement.text }}
            </q-item-label>
          </q-item-section>
          <q-item-section side top v-if="auth.isAdmin()">
            <q-item-label caption>
              <q-btn
                icon="edit"
                color="orange"
                size="0.7rem"
                flat
                round
                @click="onEditAnnouncementClick(announcement)"
              />
              <q-btn
                icon="delete"
                color="red"
                flat
                round
                @click="onDeleteAnnouncementClick(announcement._id, index)"
              />
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
    <q-card-section v-if="canLoadMore">
      <div class="row justify-center">
        <q-btn
          icon="expand_more"
          color="primary"
          round
          :loading="isLoading"
          @click="loadAnnouncements"
        >
          <q-tooltip>Load More</q-tooltip>
        </q-btn>
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import { useQuasar } from 'quasar'
import { defineComponent, onMounted, Ref, ref, toRefs } from 'vue'
import { api, ApiEndpoints } from '../boot/axios'
import { IPaginated } from '../interfaces/common'
import { useAuthStore } from '../stores/auth-store'
import { IAnnouncement } from '../interfaces/announcement'
import AnnouncementForm from './AnnoncementForm.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import moment from 'moment'
export default defineComponent({
  props: {
    tvShowId: {
      type: Number,
      required: true,
    },
  },
  components: {
    AnnouncementForm,
    ConfirmDialog,
  },
  setup(props) {
    const auth = useAuthStore()
    const $q = useQuasar()
    const { tvShowId } = toRefs(props)
    let pageNumber = 1

    const isLoading: Ref<boolean> = ref(false)
    const canLoadMore: Ref<boolean> = ref(false)
    const announcementIdToDelete: Ref<string> = ref('')
    const announcementIndexToDelete: Ref<number> = ref(-1)
    const isConfirmDialogShown: Ref<boolean> = ref(false)
    const isAnnouncementFormShown: Ref<boolean> = ref(false)
    const error: Ref<string> = ref('')
    const announcementToEdit: Ref<IAnnouncement | null> = ref(null)
    const announcements: Ref<IAnnouncement[]> = ref([])

    onMounted(async () => {
      await loadAnnouncements()
    })

    const loadAnnouncements = async () => {
      if (!tvShowId.value) return
      error.value = ''
      isLoading.value = true
      try {
        const response = await api.get(
          ApiEndpoints.getAnnouncemensForTVShow(tvShowId.value, pageNumber)
        )
        const data: IPaginated<IAnnouncement> = response.data
        announcements.value = announcements.value.concat(data.docs)
        canLoadMore.value = data.hasNextPage
        pageNumber++
      } catch (err: any) {
        error.value = err.response?.data.message || 'Failed to fetch'
      } finally {
        isLoading.value = false
      }
    }

    const reloadAnnouncements = async () => {
      announcements.value = []
      pageNumber = 1
      await loadAnnouncements()
    }

    const onAddAnnouncementClick = () => {
      announcementToEdit.value = null
      isAnnouncementFormShown.value = true
    }

    const onEditAnnouncementClick = (announcement: IAnnouncement) => {
      announcementToEdit.value = announcement
      isAnnouncementFormShown.value = true
    }

    const onAnnouncementSaved = async (savedAnnouncement: IAnnouncement) => {
      isAnnouncementFormShown.value = false
      if (announcementToEdit.value) {
        announcementToEdit.value.text = savedAnnouncement.text
        announcementToEdit.value.updatedAt = savedAnnouncement.updatedAt
      } else {
        await reloadAnnouncements()
      }
      announcementToEdit.value = null
    }

    const onDeleteAnnouncementClick = async (
      announcementId: string,
      announcementIndex: number
    ) => {
      announcementIdToDelete.value = announcementId
      announcementIndexToDelete.value = announcementIndex
      isConfirmDialogShown.value = true
    }

    const deleteAnnouncement = async () => {
      try {
        await api.delete(
          ApiEndpoints.deleteAnnouncement(announcementIdToDelete.value)
        )
        announcements.value.splice(announcementIndexToDelete.value, 1)
        $q.notify({
          message: 'Announcement deleted',
          position: 'bottom',
          color: 'green',
          timeout: 3000,
        })
      } catch (err: any) {
        $q.notify({
          message: err.response?.data.message || 'Error occurred',
          position: 'bottom',
          color: 'red',
          timeout: 3000,
        })
      }
    }

    return {
      auth,
      isLoading,
      error,
      canLoadMore,
      announcements,
      moment,
      announcementToEdit,
      onAnnouncementSaved,
      isAnnouncementFormShown,
      onAddAnnouncementClick,
      onEditAnnouncementClick,
      onDeleteAnnouncementClick,
      isConfirmDialogShown,
      deleteAnnouncement,
      announcementIndexToDelete,
      announcementIdToDelete,
      loadAnnouncements,
    }
  },
})
</script>
