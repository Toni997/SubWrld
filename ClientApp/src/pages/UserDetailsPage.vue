<template>
  <div class="q-pa-md">
    <q-pull-to-refresh
      @refresh="refresh"
      color="primary"
      bg-color="white"
      icon="autorenew"
    >
      <q-spinner
        color="primary"
        size="3em"
        :thickness="10"
        v-if="isLoadingUserDetails"
      />
      <q-banner v-if="userDetailsError" dense class="text-white bg-red">
        <template v-slot:avatar>
          <q-icon name="error" color="white" />
        </template>
        {{ userDetailsError }}
      </q-banner>
      <div v-if="user" class="text-body1">
        <h5 class="q-ma-none">
          {{ user.username }}
          <span v-if="user._id === auth.userInfo?._id"> (You)</span>
          <q-chip
            text-color="white"
            :icon="user.isAdmin ? 'verified' : 'grade'"
            :color="getReputationBadgeColor(user.reputation, user.isAdmin)"
            >{{ user.isAdmin ? 'Official' : user.reputation }}
            <q-tooltip>{{
              user.isAdmin ? 'Member of Staff' : 'Reputation'
            }}</q-tooltip>
          </q-chip>
        </h5>
        <div>Email: {{ user.email }}</div>
        <div>Registered: {{ moment(user.createdAt).fromNow() }}</div>
        <div>
          Dark Mode:
          <q-icon
            :name="user.darkMode ? 'check' : 'close'"
            :color="user.darkMode ? 'green' : 'red'"
            size="1.2rem"
          ></q-icon>
        </div>
      </div>
      <h5 class="q-mb-lg">Last Uploaded Subtitles</h5>
      <q-separator />
      <q-spinner
        color="primary"
        size="3em"
        :thickness="10"
        v-if="isLoadingUserSubtitles"
      />
      <q-banner v-if="userSubtitlesError" dense class="text-white bg-red">
        <template v-slot:avatar>
          <q-icon name="error" color="white" />
        </template>
        {{ userSubtitlesError }}
      </q-banner>
      <q-banner
        v-if="subtitles?.docs?.length === 0 && !isLoadingUserSubtitles"
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
                  <q-tooltip>Author</q-tooltip>
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
          :loading="isLoadingUserSubtitles"
          @click="loadUserSubtitles"
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
import { IUser } from '../interfaces/user'
import { useAuthStore } from '../stores/auth-store'
import { getReputationBadgeColor } from '../utils/getReputationBadgeColor'
import moment from 'moment'
import { IPaginated } from '../interfaces/common'
import { ISubtitleWithTVShowTitle } from '../interfaces/subtitle'
import { languages } from 'countries-list'
import { castStringToLanguagesKey } from '../utils/castStringToLanguagesKey'

export default defineComponent({
  setup() {
    const route = useRoute()
    const auth = useAuthStore()

    const isLoadingUserDetails: Ref<boolean> = ref(false)
    const isLoadingUserSubtitles: Ref<boolean> = ref(false)
    const userDetailsError: Ref<string> = ref('')
    const userSubtitlesError: Ref<string> = ref('')
    const user: Ref<IUser | null> = ref(null)
    const subtitles: Ref<IPaginated<ISubtitleWithTVShowTitle> | null> =
      ref(null)

    onMounted(async () => {
      await loadUserDetails()
      await loadUserSubtitles()
    })

    const refresh = async (done: any) => {
      user.value = null
      subtitles.value = null
      userDetailsError.value = ''
      userSubtitlesError.value = ''
      await loadUserDetails()
      await loadUserSubtitles()
      done()
    }

    const loadUserDetails = async () => {
      const userId = route.params.userId as string
      isLoadingUserDetails.value = true
      try {
        const response = await api.get(ApiEndpoints.getUserDetails(userId))
        user.value = response.data
      } catch (err: any) {
        userDetailsError.value = 'Failed to fetch user details.'
      } finally {
        isLoadingUserDetails.value = false
      }
    }

    const loadUserSubtitles = async () => {
      const userId = route.params.userId as string
      isLoadingUserSubtitles.value = true
      const page = subtitles.value ? subtitles.value.page + 1 : 1
      try {
        const response = await api.get(
          ApiEndpoints.getUserSubtitles(userId, page)
        )
        subtitles.value = response.data
      } catch (err: any) {
        userSubtitlesError.value = 'Failed to fetch subtitles.'
      } finally {
        isLoadingUserSubtitles.value = false
      }
    }

    return {
      isLoadingUserDetails,
      isLoadingUserSubtitles,
      userDetailsError,
      userSubtitlesError,
      user,
      subtitles,
      auth,
      getReputationBadgeColor,
      moment,
      refresh,
      languages,
      castStringToLanguagesKey,
      ApiEndpoints,
      loadUserSubtitles,
    }
  },
})
</script>
