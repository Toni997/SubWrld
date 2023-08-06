<template>
  <div class="q-pa-md">
    <q-pull-to-refresh
      @refresh="refresh"
      color="primary"
      bg-color="white"
      icon="autorenew"
    >
      <h5 class="q-mb-lg">Latest Subtitles</h5>
      <q-separator />
      <q-spinner
        color="primary"
        size="3em"
        :thickness="10"
        v-if="isLoadingSubtitles"
      />
      <q-banner v-if="subtitlesError" dense class="text-white bg-red">
        <template v-slot:avatar>
          <q-icon name="error" color="white" />
        </template>
        {{ subtitlesError }}
      </q-banner>
      <q-banner
        v-if="subtitles?.docs?.length === 0 && !isLoadingSubtitles"
        dense
        class="text-white bg-blue"
      >
        <template v-slot:avatar>
          <q-icon name="info" color="white" />
        </template>
        No uploaded subtitles yet
      </q-banner>
      <q-list v-if="subtitles?.docs?.length" class="text-body1">
        <div v-for="subtitle in subtitles.docs" :key="subtitle._id">
          <q-item>
            <q-item-section>
              <q-item-label>
                <q-btn
                  flat
                  dense
                  no-caps
                  :to="`/tv-shows/${subtitle.tvShowId}`"
                  :label="subtitle.tvShowTitle"
                />
                S{{ subtitle.season }}E{{ subtitle.episode }}
                <q-icon
                  v-if="subtitle.uploaderIsAuthor"
                  class="q-mr-xs"
                  name="military_tech"
                  color="primary"
                  size="1.2rem"
                >
                  <q-tooltip>Uploader is Author</q-tooltip>
                </q-icon>
                <q-icon
                  v-if="subtitle.forHearingImpaired"
                  class="q-mr-xs"
                  name="hearing_disabled"
                  color="primary"
                  size="1.2rem"
                >
                  <q-tooltip>For Hearing Impaired</q-tooltip>
                </q-icon>
                <q-icon
                  v-if="subtitle.onlyForeignLanguage"
                  class="q-mr-xs"
                  name="translate"
                  color="primary"
                  size="1.2rem"
                >
                  <q-tooltip>
                    {{
                      subtitle.onlyForeignLanguage
                        ? 'Only Foreign Language Translated'
                        : 'Translated every dialog'
                    }}
                  </q-tooltip>
                </q-icon>
                <q-icon
                  v-if="subtitle.isWorkInProgress"
                  name="hourglass_top"
                  color="primary"
                  size="1.2rem"
                >
                  <q-tooltip>Work in Progress</q-tooltip>
                </q-icon>
                <q-icon
                  v-if="subtitle.isConfirmed"
                  name="check"
                  color="primary"
                  size="1.2rem"
                >
                  <q-tooltip>Confirmed</q-tooltip>
                </q-icon>
              </q-item-label>
              <q-item-label caption>
                {{ subtitle.release }}
                ({{
                  languages[castStringToLanguagesKey(subtitle.language)].name
                }}), {{ subtitle.frameRate }} fps
              </q-item-label>
              <q-item-label>
                <span>
                  <q-btn
                    flat
                    dense
                    no-caps
                    v-if="!subtitle.userId.isAdmin"
                    :to="`/users/${subtitle.userId._id}`"
                  >
                    {{ subtitle.userId.username }}
                  </q-btn>
                  <q-chip
                    text-color="white"
                    :icon="subtitle.userId.isAdmin ? 'verified' : 'grade'"
                    size="0.7rem"
                    :color="
                      getReputationBadgeColor(
                        subtitle.userId.reputation,
                        subtitle.userId.isAdmin
                      )
                    "
                    >{{
                      subtitle.userId.isAdmin
                        ? 'Official'
                        : subtitle.userId.reputation
                    }}
                    <q-tooltip>{{
                      subtitle.userId.isAdmin
                        ? 'Uploaded by Staff'
                        : 'Reputation'
                    }}</q-tooltip>
                  </q-chip>
                </span>
              </q-item-label>
            </q-item-section>
            <q-item-section side top>
              <q-item-label caption>{{
                moment(subtitle.updatedAt).fromNow()
              }}</q-item-label>

              <q-btn
                v-if="subtitle.filePath"
                class="q-mt-xs"
                :href="ApiEndpoints.downloadSubtitle(subtitle._id)"
                icon="download"
                color="primary"
                flat
                round
                dense
              >
                <q-tooltip>Click to Download</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
          <q-separator spaced inset />
        </div>
      </q-list>
      <div class="row justify-center q-mt-md" v-if="subtitles?.hasNextPage">
        <q-btn
          icon="expand_more"
          color="primary"
          round
          :loading="isLoadingSubtitles"
          @click="loadLastSubtitles"
        >
          <q-tooltip>Load More</q-tooltip>
        </q-btn>
      </div>
      <h5 class="q-mb-lg">Latest Announcements</h5>
      <q-separator />
      <q-spinner
        color="primary"
        size="3em"
        :thickness="10"
        v-if="isLoadingAnnouncements"
      />
      <q-banner v-if="announcementsError" dense class="text-white bg-red">
        <template v-slot:avatar>
          <q-icon name="error" color="white" />
        </template>
        {{ announcementsError }}
      </q-banner>
      <q-banner
        v-if="announcements?.docs?.length === 0 && !isLoadingAnnouncements"
        dense
        class="text-white bg-blue"
      >
        <template v-slot:avatar>
          <q-icon name="info" color="white" />
        </template>
        No announcements yet
      </q-banner>
      <q-list v-if="announcements?.docs?.length" class="text-body1">
        <div v-for="announcement in announcements.docs" :key="announcement._id">
          <q-item>
            <q-item-section>
              <q-item-label>
                <q-btn
                  flat
                  dense
                  no-caps
                  :to="`/tv-shows/${announcement.tvShowId}`"
                  :label="announcement.tvShowTitle"
                />
              </q-item-label>
              <q-item-label caption>
                {{ announcement.text }}
              </q-item-label>
            </q-item-section>
            <q-item-section side top>
              <q-item-label caption>{{
                moment(announcement.updatedAt).fromNow()
              }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-separator spaced inset />
        </div>
      </q-list>
      <div class="row justify-center q-mt-md" v-if="announcements?.hasNextPage">
        <q-btn
          icon="expand_more"
          color="primary"
          round
          :loading="isLoadingAnnouncements"
          @click="loadLastAnnouncements"
        >
          <q-tooltip>Load More</q-tooltip>
        </q-btn>
      </div>
      <h5 class="q-mb-lg">Top Users</h5>
      <q-separator />
      <q-spinner
        color="primary"
        size="3em"
        :thickness="10"
        v-if="isLoadingUsers"
      />
      <q-banner v-if="usersError" dense class="text-white bg-red">
        <template v-slot:avatar>
          <q-icon name="error" color="white" />
        </template>
        {{ usersError }}
      </q-banner>
      <q-banner
        v-if="users?.docs?.length === 0 && !isLoadingUsers"
        dense
        class="text-white bg-blue"
      >
        <template v-slot:avatar>
          <q-icon name="info" color="white" />
        </template>
        No announcements yet
      </q-banner>
      <q-list v-if="users?.docs?.length" class="text-body1">
        <div v-for="user in users.docs" :key="user._id">
          <q-item>
            <q-item-section>
              <q-item-label>
                <q-btn
                  flat
                  dense
                  no-caps
                  :to="`/users/${user._id}`"
                  :label="user.username"
                />
                <q-chip
                  text-color="white"
                  :icon="user.isAdmin ? 'verified' : 'grade'"
                  size="0.7rem"
                  :color="
                    getReputationBadgeColor(user.reputation, user.isAdmin)
                  "
                >
                  {{ user.isAdmin ? 'Official' : user.reputation }}
                  <q-tooltip>
                    {{ user.isAdmin ? 'Uploaded by Staff' : 'Reputation' }}
                  </q-tooltip>
                </q-chip>
              </q-item-label>
            </q-item-section>
            <q-item-section side top>
              <q-item-label caption>
                Registered {{ moment(user.createdAt).fromNow() }}
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-separator spaced inset />
        </div>
      </q-list>
      <div class="row justify-center q-mt-md" v-if="users?.hasNextPage">
        <q-btn
          icon="expand_more"
          color="primary"
          round
          :loading="isLoadingUsers"
          @click="loadTopUsers"
        >
          <q-tooltip>Load More</q-tooltip>
        </q-btn>
      </div>
    </q-pull-to-refresh>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, Ref, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api, ApiEndpoints } from '../boot/axios'
import { IPaginated } from '../interfaces/common'
import { ISubtitleWithTVShowTitle } from '../interfaces/subtitle'
import { useAuthStore } from '../stores/auth-store'
import moment from 'moment'
import { languages } from 'countries-list'
import { castStringToLanguagesKey } from '../utils/castStringToLanguagesKey'
import { getReputationBadgeColor } from '../utils/getReputationBadgeColor'
import { IAnnouncementWithTVShowTitle } from '../interfaces/announcement'
import { IUser } from '../interfaces/user'

export default defineComponent({
  name: 'IndexPage',
  components: {},
  setup() {
    const route = useRoute()
    const auth = useAuthStore()

    const isLoadingSubtitles: Ref<boolean> = ref(false)
    const isLoadingAnnouncements: Ref<boolean> = ref(false)
    const isLoadingUsers: Ref<boolean> = ref(false)
    const subtitlesError: Ref<string> = ref('')
    const announcementsError: Ref<string> = ref('')
    const usersError: Ref<string> = ref('')
    const subtitles: Ref<IPaginated<ISubtitleWithTVShowTitle> | null> =
      ref(null)
    const announcements: Ref<IPaginated<IAnnouncementWithTVShowTitle> | null> =
      ref(null)
    const users: Ref<IPaginated<IUser> | null> = ref(null)

    onMounted(async () => {
      await loadLastSubtitles()
      await loadLastAnnouncements()
      await loadTopUsers()
    })

    const refresh = async (done: any) => {
      subtitles.value = null
      announcements.value = null
      users.value = null
      subtitlesError.value = ''
      announcementsError.value = ''
      usersError.value = ''
      await loadLastSubtitles()
      await loadLastAnnouncements()
      await loadTopUsers()
      done()
    }

    const loadLastSubtitles = async () => {
      isLoadingSubtitles.value = true
      const page = subtitles.value ? subtitles.value.page + 1 : 1
      try {
        const response = await api.get(ApiEndpoints.getAllSubtitles(page))
        const data: IPaginated<ISubtitleWithTVShowTitle> = response.data
        if (subtitles.value) {
          subtitles.value.docs = subtitles.value.docs.concat(data.docs)
          subtitles.value.page = data.page
          subtitles.value.hasNextPage = data.hasNextPage
        } else {
          subtitles.value = data
        }
      } catch (err: any) {
        subtitlesError.value = 'Failed to fetch subtitles.'
      } finally {
        isLoadingSubtitles.value = false
      }
    }

    const loadLastAnnouncements = async () => {
      isLoadingAnnouncements.value = true
      const page = announcements.value ? announcements.value.page + 1 : 1
      try {
        const response = await api.get(ApiEndpoints.getAllAnnouncements(page))
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

    const loadTopUsers = async () => {
      isLoadingUsers.value = true
      const page = users.value ? users.value.page + 1 : 1
      try {
        const response = await api.get(
          ApiEndpoints.getAllUsersOrderedByReputation(page)
        )
        const data: IPaginated<IUser> = response.data
        if (users.value) {
          users.value.docs = users.value.docs.concat(data.docs)
          users.value.page = data.page
          users.value.hasNextPage = data.hasNextPage
        } else {
          users.value = data
        }
      } catch (err: any) {
        usersError.value = 'Failed to fetch user details.'
      } finally {
        isLoadingUsers.value = false
      }
    }

    return {
      subtitles,
      announcements,
      users,
      refresh,
      isLoadingSubtitles,
      isLoadingAnnouncements,
      isLoadingUsers,
      subtitlesError,
      announcementsError,
      usersError,
      loadLastSubtitles,
      loadLastAnnouncements,
      loadTopUsers,
      ApiEndpoints,
      languages,
      moment,
      castStringToLanguagesKey,
      getReputationBadgeColor,
    }
  },
})
</script>
