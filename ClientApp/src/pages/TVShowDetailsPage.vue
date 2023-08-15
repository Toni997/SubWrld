<template>
  <div class="q-pa-md">
    <q-pull-to-refresh
      @refresh="refresh"
      color="primary"
      bg-color="white"
      icon="autorenew"
    >
      <q-dialog v-model="isRequestSubtitleDialogShown" persistent>
        <request-subtitle-form
          style="width: min(600px, 100%)"
          :episode="episodeForDialog"
          @request-saved="onSubtitleRequestSaved"
        />
      </q-dialog>
      <q-dialog v-model="isSubtitleDialogShown" persistent>
        <subtitle-form
          style="width: min(600px, 100%)"
          :episode="episodeForDialog"
          @subtitle-saved="onSubtitleSaved"
        />
      </q-dialog>
      <q-dialog v-model="isSubtitleRequestsListDialogShown" maximized>
        <subtitle-requests-list
          :episode="episodeForDialog"
          @closed="episodeForDialog.justAddedSubtitleRequestId = null"
        />
      </q-dialog>
      <q-dialog v-model="isSubtitlesListDialogShown" maximized>
        <subtitles-list
          :episode="episodeForDialog"
          @closed="episodeForDialog.justAddedSubtitleId = null"
        />
      </q-dialog>
      <q-dialog v-model="isAnnouncementDialogShown" v-if="tvShowDetails">
        <announcements-list
          style="width: min(600px, 100%)"
          :tvShowId="tvShowDetails.id"
        />
      </q-dialog>
      <q-dialog v-model="markWatchedDialog">
        <q-card>
          <q-card-section class="row items-center">
            <span class="text-body1">
              Do you also want to mark all previous episodes as watched?
            </span>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="grey" v-close-popup />
            <q-btn
              @click="markSingleEpisodeAsWatched()"
              flat
              label="No"
              color="red"
              v-close-popup
            />
            <q-btn
              @click="markEpisodeAsWatchedWithPrevious()"
              flat
              label="Yes"
              color="green"
              v-close-popup
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
      <q-spinner color="primary" size="3em" :thickness="10" v-if="isLoading" />
      <q-banner v-if="error" dense class="text-white bg-red">
        <template v-slot:avatar>
          <q-icon name="error" color="white" />
        </template>
        {{ error }}
      </q-banner>
      <div v-if="!isLoading && tvShowDetails">
        <div class="tv-show-details">
          <div class="poster-container">
            <q-img
              :src="getImageUrl(tvShowDetails.poster_path)"
              width="300px"
              height="450px"
            >
              <template v-slot:error>
                <div class="absolute-full flex flex-center bg-grey text-yellow">
                  Couldn't load poster
                </div>
              </template>
            </q-img>
          </div>
          <div class="details-container">
            <q-scroll-area
              style="height: 2rem"
              v-if="tvShowDetails.networks.length"
            >
              <div class="row no-wrap networks-logos">
                <q-img
                  v-for="network in tvShowDetails.networks"
                  :key="network.id"
                  :src="getImageUrl(network.logo_path)"
                  fit="contain"
                  style="width: 4rem; max-height: 2rem"
                >
                  <q-tooltip>
                    {{ network.name
                    }}<span v-if="network.origin_country">
                      ({{ network.origin_country }})</span
                    >
                  </q-tooltip>
                  <template v-slot:error>
                    <span>{{ network.name }}</span>
                  </template>
                </q-img>
              </div>
            </q-scroll-area>
            <h4 class="q-mt-xs q-mb-xs">
              {{ tvShowDetails.name }}
              <span v-if="tvShowDetails.first_air_date"
                >({{ new Date(tvShowDetails.first_air_date).getFullYear() }}-{{
                  tvShowDetails.status === 'Ended'
                    ? new Date(tvShowDetails.last_air_date).getFullYear()
                    : ''
                }})
              </span>
            </h4>
            <h6 class="q-mb-none q-mt-none">
              {{ tvShowDetails.genres.map((g) => g.name).join(' | ') }}
            </h6>
            <p>
              {{ tvShowDetails.number_of_episodes }} episodes<span
                v-if="tvShowDetails.episode_run_time.length"
              >
                |
                {{
                  tvShowDetails.episode_run_time.map((r) => r + 'm').join(', ')
                }}</span
              >
            </p>
            <div class="text-body1">
              <q-rating
                v-model="tvShowDetails.vote_average"
                size="1.5em"
                color="orange"
                icon-half="star_half"
                readonly
                max="10"
              />
              ({{ tvShowDetails.vote_average }},
              {{ tvShowDetails.vote_count }} votes)
            </div>
            <p class="q-mt-md text-body1">{{ tvShowDetails.overview }}</p>
            <p class="text-body1" v-if="tvShowDetails.original_name">
              Original Name:
              <strong>{{ tvShowDetails.original_name }}</strong>
              <span
                style="font-family: 'Twemoji Country Flags'; font-size: 1.4rem"
                v-for="(originCountry, index) in tvShowDetails.origin_country"
                :key="index"
                >&nbsp;
                <q-tooltip v-if="countries[getCountryKey(originCountry)]?.name">
                  {{ countries[getCountryKey(originCountry)]?.name }}
                </q-tooltip>
                {{ getEmojiFlag(originCountry) }}</span
              >
            </p>
            <p class="text-body1" v-if="tvShowDetails.spoken_languages.length">
              Spoken Languages:
              <strong>{{
                tvShowDetails.spoken_languages
                  .map((c) => c.english_name)
                  .join(', ')
              }}</strong>
            </p>
            <p class="text-body1" v-if="tvShowDetails.created_by.length">
              Created by
              <strong>{{
                tvShowDetails.created_by.map((c) => c.name).join(', ')
              }}</strong>
            </p>
            <div class="q-mt-md" v-if="auth.isLoggedIn">
              <q-btn
                :label="
                  tvShowDetails.is_watchlisted_by_user
                    ? 'Remove from Watchlist'
                    : 'Add to Watchlist'
                "
                color="grey"
                :icon="tvShowDetails.is_watchlisted_by_user ? 'tv_off' : 'tv'"
                @click="updateWatchlist"
                :loading="updatingWatchlist"
              />
            </div>
            <div class="q-mt-md">
              <q-btn
                label="Announcements"
                icon="feed"
                color="grey"
                @click="announcementsClick"
              />
            </div>
          </div>
        </div>
        <div class="tv-show-episodes q-mt-lg">
          <q-tabs
            v-model="tab"
            dense
            class="text-grey"
            active-color="primary"
            indicator-color="primary"
            align="justify"
            narrow-indicator
            swipeable
          >
            <q-tab
              v-for="(season, index) in tvShowDetails.seasons"
              :key="season.id"
              :name="index"
              :label="`${season.name}`"
            />
          </q-tabs>
          <q-separator />
          <q-tab-panels v-model="tab" animated>
            <q-tab-panel
              v-for="(season, seasonIndex) in tvShowDetails.seasons"
              :key="season.id"
              :name="seasonIndex"
            >
              <q-spinner
                color="primary"
                size="3em"
                :thickness="10"
                v-if="isLoadingSeasonEpisodes[seasonIndex]"
              />
              <q-list
                v-if="season.episodes && !isLoadingSeasonEpisodes[seasonIndex]"
              >
                <q-banner
                  v-if="!season.episodes?.length"
                  dense
                  class="text-white bg-primary"
                >
                  <template v-slot:avatar>
                    <q-icon name="info" color="white" />
                  </template>
                  No episodes found
                </q-banner>
                <q-expansion-item
                  v-for="(episode, episodeIndex) in season.episodes"
                  :key="episode.id"
                >
                  <template v-slot:header>
                    <q-item-section>
                      <p class="text-body1 q-my-sm">
                        {{ episode.episode_number }}. {{ episode.name
                        }}<span class="text-grey" v-if="episode.air_date">
                          ({{ episode.air_date }})</span
                        >
                      </p>
                    </q-item-section>
                    <q-item-section side>
                      <q-btn
                        icon="more_vert"
                        flat
                        round
                        size="0.7rem"
                        @click.stop
                      >
                        <q-tooltip>Menu</q-tooltip>
                        <q-menu>
                          <q-list>
                            <q-item
                              clickable
                              @click="listOfSubtitlesClick(episode)"
                              v-close-popup
                            >
                              <q-item-section>All Subtitles</q-item-section>
                            </q-item>
                            <q-item
                              clickable
                              @click="uploadSubtitleClick(episode)"
                              v-if="auth.isLoggedIn"
                              v-close-popup
                            >
                              <q-item-section>Upload Subtitle</q-item-section>
                            </q-item>
                            <q-separator />
                            <q-item
                              clickable
                              @click="listOfSubtitleRequestsClick(episode)"
                              v-close-popup
                            >
                              <q-item-section>All Requests</q-item-section>
                            </q-item>
                            <q-item
                              clickable
                              @click="requestSubtitleClick(episode)"
                              v-if="auth.isLoggedIn"
                              v-close-popup
                            >
                              <q-item-section>Request Subtitle</q-item-section>
                            </q-item>
                          </q-list>
                        </q-menu>
                      </q-btn>
                    </q-item-section>
                    <q-item-section
                      side
                      v-if="
                        auth.isLoggedIn &&
                        episode.air_date &&
                        isAirDateDayInThePastOrPresen(episode.air_date)
                      "
                    >
                      <q-btn
                        round
                        :color="episode.marked_as_watched ? 'green' : 'grey'"
                        icon="check"
                        size="0.7rem"
                        @click="
                          markAsWatchedClick(
                            $event,
                            episodeIndex,
                            season,
                            seasonIndex
                          )
                        "
                        :loading="episode.is_loading"
                      >
                        <q-tooltip>{{
                          episode.marked_as_watched
                            ? 'Remove from Watched'
                            : 'Mark as Watched'
                        }}</q-tooltip>
                      </q-btn>
                    </q-item-section>
                  </template>
                  <q-separator />
                  <q-card>
                    <q-card-section>
                      <p
                        class="text-body1 q-my-sm"
                        v-html="
                          episode.overview ||
                          '<i>Plot unknown at this moment</i>'
                        "
                      />
                    </q-card-section>
                  </q-card>
                </q-expansion-item>
              </q-list>
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </div>
    </q-pull-to-refresh>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, Ref, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth-store'
import { api, ApiEndpoints } from '../boot/axios'
import { tmdbImageBaseUrl } from '../config/tmdbConfig'
import truncate from 'truncate'
import {
  IMarkWatched,
  ITVShowDetails,
  ITVShowEpisode,
  ITVShowEpisodeForDialog,
  ITVShowSeason,
} from '../interfaces/tv-show'
import RequestSubtitleForm from '../components/RequestSubtitleForm.vue'
import SubtitleRequestsList from '../components/SubtitleRequestsList.vue'
import SubtitlesList from '../components/SubtitlesList.vue'
import SubtitleForm from '../components/SubtitleForm.vue'
import AnnouncementsList from '../components/AnnouncementsList.vue'
import { getEmojiFlag, countries } from 'countries-list'
import { useQuasar } from 'quasar'

export default defineComponent({
  components: {
    RequestSubtitleForm,
    SubtitleRequestsList,
    SubtitleForm,
    SubtitlesList,
    AnnouncementsList,
  },
  setup() {
    const route = useRoute()
    const $q = useQuasar()
    const auth = useAuthStore()
    const tab: Ref<number | null> = ref(null)
    const tvShowDetails: Ref<ITVShowDetails | null> = ref(null)
    const tvShowId: Ref<string> = ref('')
    const isLoading: Ref<boolean> = ref(false)
    const error: Ref<string> = ref('')
    const updatingWatchlist: Ref<boolean> = ref(false)
    const isLoadingSeasonEpisodes: { [key: string]: boolean } = reactive({})
    const markWatchedDialog: Ref<boolean> = ref(false)
    const markWatchedSeasonSelected: Ref<ITVShowSeason | null> = ref(null)
    const markWatchedEpisodeSelectedIndex: Ref<number | null> = ref(null)
    const isRequestSubtitleDialogShown: Ref<boolean> = ref(false)
    const isSubtitleRequestsListDialogShown: Ref<boolean> = ref(false)
    const isSubtitleDialogShown: Ref<boolean> = ref(false)
    const isSubtitlesListDialogShown: Ref<boolean> = ref(false)
    const isAnnouncementDialogShown: Ref<boolean> = ref(false)
    const episodeForDialog = reactive<ITVShowEpisodeForDialog>({
      details: null,
      tvShowId: null,
      justAddedSubtitleRequestId: null,
      justAddedSubtitleId: null,
    })

    onMounted(async () => {
      tvShowId.value = route.params.tvShowId as string
      await loadTVShowDetails()
    })

    const refresh = async (done: any) => {
      tvShowDetails.value = null
      tab.value = null
      error.value = ''
      await loadTVShowDetails()
      done()
    }

    const loadTVShowDetails = async () => {
      isLoading.value = true
      try {
        const response = await api.get(
          ApiEndpoints.getTVShowDetailsPath(tvShowId.value)
        )
        tvShowDetails.value = response.data
        putSpecialEpisodesToEndIfExist()
        tab.value = tvShowDetails.value?.seasons.length ? 0 : null
      } catch (err) {
        error.value = 'Failed to fetch.'
      } finally {
        isLoading.value = false
      }
    }

    const putSpecialEpisodesToEndIfExist = () => {
      if (!tvShowDetails.value) return

      const seasonDetails = tvShowDetails.value.seasons
      if (seasonDetails.length < 2) return
      if (seasonDetails[0].season_number !== 0) return

      const temp = seasonDetails[0]
      seasonDetails.shift()
      seasonDetails.push(temp)
    }

    watch(tab, async (newValue) => {
      if (newValue === null || !tvShowDetails.value) return
      const season = tvShowDetails.value.seasons[newValue].season_number
      await loadSeasonEpisodes(newValue, season)
    })

    const loadSeasonEpisodes = async (index: number, season: number) => {
      if (!tvShowDetails.value) return
      const seasonDetails = tvShowDetails.value.seasons[index]
      if (seasonDetails.episodes) return
      isLoadingSeasonEpisodes[index] = true
      try {
        const response = await api.get(
          ApiEndpoints.getTVShowSeasonDetailsPath(
            tvShowDetails.value.id,
            season
          )
        )
        seasonDetails.episodes = response.data
      } catch (err: any) {
        console.log(err)
        error.value = 'Failed to fetch.'
      } finally {
        isLoadingSeasonEpisodes[index] = false
      }
    }

    const getImageUrl = (relativePath: string) =>
      tmdbImageBaseUrl + relativePath

    const updateWatchlist = async () => {
      if (!tvShowDetails.value) return
      updatingWatchlist.value = true
      try {
        if (tvShowDetails.value.is_watchlisted_by_user) {
          await api.delete(ApiEndpoints.removeFromWatchlist, {
            data: {
              tvShowIds: [tvShowDetails.value.id],
            },
          })
        } else {
          await api.post(ApiEndpoints.addToWatchlist(tvShowDetails.value.id))
        }

        tvShowDetails.value.is_watchlisted_by_user =
          !tvShowDetails.value.is_watchlisted_by_user

        $q.notify({
          message: 'Watchlist updated',
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
      } finally {
        updatingWatchlist.value = false
      }
    }

    const markSingleEpisodeAsWatched = async () => {
      if (!tvShowDetails.value) return
      if (!markWatchedSeasonSelected.value) return
      if (markWatchedEpisodeSelectedIndex.value === null) return

      const seasonDetails = markWatchedSeasonSelected.value
      const episodeIndex = markWatchedEpisodeSelectedIndex.value

      const episodeDetails = seasonDetails.episodes[episodeIndex]
      episodeDetails.is_loading = true

      try {
        const requestBody: IMarkWatched = {
          tvShowId: tvShowDetails.value.id,
          watched: [
            {
              season: episodeDetails.season_number,
              episodes: episodeDetails.episode_number,
            },
          ],
        }

        await api.post(ApiEndpoints.markEpisodeWatched, requestBody)

        episodeDetails.marked_as_watched = true

        $q.notify({
          message: 'Marked as watched',
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
      } finally {
        episodeDetails.is_loading = false
      }
    }

    const markEpisodeAsWatchedWithPrevious = async () => {
      if (!tvShowDetails.value) return
      if (!markWatchedSeasonSelected.value) return
      if (markWatchedEpisodeSelectedIndex.value === null) return

      const seasonDetails = markWatchedSeasonSelected.value
      const episodeIndex = markWatchedEpisodeSelectedIndex.value
      const episodeDetails = seasonDetails.episodes[episodeIndex]

      for (const season of tvShowDetails.value.seasons) {
        if (season.season_number > episodeDetails.season_number) break

        if (season.season_number < episodeDetails.season_number) {
          season.episodes?.forEach((e) => {
            e.is_loading = true
          })
        } else {
          season.episodes?.forEach((e) => {
            if (e.episode_number <= episodeDetails.episode_number) {
              if (!e.marked_as_watched) {
                e.is_loading = true
              }
            }
          })
        }
      }

      try {
        const requestBody: IMarkWatched = {
          tvShowId: tvShowDetails.value.id,
          watched: [],
        }

        for (const season of tvShowDetails.value.seasons) {
          if (season.season_number > episodeDetails.season_number) break

          if (season.season_number < episodeDetails.season_number) {
            requestBody.watched.push({
              season: season.season_number,
              episodes: null,
            })
          } else {
            requestBody.watched.push({
              season: season.season_number,
              episodes:
                episodeDetails.episode_number !== 1
                  ? [1, episodeDetails.episode_number]
                  : 1,
            })
          }
        }

        await api.post(ApiEndpoints.markEpisodeWatched, requestBody)

        for (const season of tvShowDetails.value.seasons) {
          if (season.season_number > episodeDetails.season_number) break

          if (season.season_number < episodeDetails.season_number) {
            season.episodes?.forEach((e) => {
              e.marked_as_watched = true
            })
          } else {
            season.episodes?.forEach((e) => {
              if (e.episode_number <= episodeDetails.episode_number) {
                e.marked_as_watched = true
              }
            })
          }
        }
        $q.notify({
          message: 'Marked as watched',
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
      } finally {
        for (const season of tvShowDetails.value.seasons) {
          if (season.season_number > episodeDetails.season_number) break

          if (season.season_number < episodeDetails.season_number) {
            season.episodes?.forEach((e) => {
              e.is_loading = false
            })
          } else {
            season.episodes?.forEach((e) => {
              if (e.episode_number <= episodeDetails.episode_number) {
                e.is_loading = false
              }
            })
          }
        }
      }
    }

    const removeEpisodeFromWatched = async (episodeDetails: ITVShowEpisode) => {
      if (!tvShowDetails.value) return

      episodeDetails.is_loading = true
      try {
        await api.delete(
          ApiEndpoints.removeEpisodeFromWatched(episodeDetails.id)
        )

        episodeDetails.marked_as_watched = false

        $q.notify({
          message: 'Removed from watched',
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
      } finally {
        episodeDetails.is_loading = false
      }
    }

    const markAsWatchedClick = async (
      event: Event,
      episodeindex: number,
      seasonDetails: ITVShowSeason,
      seasonIndex: number
    ) => {
      event.stopPropagation()
      if (!tvShowDetails.value) return

      markWatchedSeasonSelected.value = seasonDetails
      markWatchedEpisodeSelectedIndex.value = episodeindex
      const episodeDetails = seasonDetails.episodes[episodeindex]

      if (episodeDetails.marked_as_watched) {
        removeEpisodeFromWatched(episodeDetails)
        return
      }

      let shouldShowDialog = false
      if (seasonDetails.season_number === 0) {
        markSingleEpisodeAsWatched()
        return
      }

      if (episodeindex === 0 && seasonIndex > 0) {
        const previousSeason = tvShowDetails.value.seasons[seasonIndex - 1]
        await loadSeasonEpisodes(seasonIndex - 1, seasonDetails.season_number)
        const lastEpisodeOfPreviousSeason =
          previousSeason.episodes[previousSeason.episodes.length - 1]
        shouldShowDialog = !lastEpisodeOfPreviousSeason.marked_as_watched
      } else if (episodeindex > 0) {
        const previousEpisode = seasonDetails.episodes[episodeindex - 1]
        shouldShowDialog = !previousEpisode.marked_as_watched
      }

      if (shouldShowDialog) {
        markWatchedDialog.value = true
      } else {
        markSingleEpisodeAsWatched()
      }
    }

    const isAirDateDayInThePastOrPresen = (airDate: string) => {
      const givenDate = new Date(airDate)
      const currentDate = new Date()

      return givenDate <= currentDate
    }

    const requestSubtitleClick = (episodeDetails: ITVShowEpisode) => {
      if (!tvShowDetails.value) return
      isRequestSubtitleDialogShown.value = true
      episodeForDialog.details = episodeDetails
      episodeForDialog.tvShowId = tvShowDetails.value.id
    }

    const listOfSubtitleRequestsClick = (episodeDetails: ITVShowEpisode) => {
      if (!tvShowDetails.value) return
      isSubtitleRequestsListDialogShown.value = true
      episodeForDialog.details = episodeDetails
      episodeForDialog.tvShowId = tvShowDetails.value.id
    }

    const onSubtitleRequestSaved = (justAddedId: string) => {
      isRequestSubtitleDialogShown.value = false
      isSubtitleRequestsListDialogShown.value = true
      episodeForDialog.justAddedSubtitleRequestId = justAddedId
    }

    const uploadSubtitleClick = (episodeDetails: ITVShowEpisode) => {
      if (!tvShowDetails.value) return
      isSubtitleDialogShown.value = true
      episodeForDialog.details = episodeDetails
      episodeForDialog.tvShowId = tvShowDetails.value.id
    }

    const onSubtitleSaved = (justAddedId: string) => {
      isSubtitleDialogShown.value = false
      isSubtitlesListDialogShown.value = true
      episodeForDialog.justAddedSubtitleRequestId = justAddedId
    }

    const listOfSubtitlesClick = (episodeDetails: ITVShowEpisode) => {
      if (!tvShowDetails.value) return
      isSubtitlesListDialogShown.value = true
      episodeForDialog.details = episodeDetails
      episodeForDialog.tvShowId = tvShowDetails.value.id
    }

    const announcementsClick = () => {
      isAnnouncementDialogShown.value = true
    }

    const getCountryKey = (key: string): keyof typeof countries =>
      key as keyof typeof countries

    return {
      isLoading,
      tvShowDetails,
      getImageUrl,
      error,
      tab,
      truncate,
      updateWatchlist,
      auth,
      getEmojiFlag,
      countries,
      getCountryKey,
      updatingWatchlist,
      isLoadingSeasonEpisodes,
      markWatchedDialog,
      refresh,
      markAsWatchedClick,
      markWatchedSeasonSelected,
      markEpisodeAsWatchedWithPrevious,
      markSingleEpisodeAsWatched,
      isAirDateDayInThePastOrPresen,
      isRequestSubtitleDialogShown,
      requestSubtitleClick,
      episodeForDialog,
      isSubtitleRequestsListDialogShown,
      listOfSubtitleRequestsClick,
      onSubtitleRequestSaved,
      onSubtitleSaved,
      isSubtitleDialogShown,
      uploadSubtitleClick,
      isSubtitlesListDialogShown,
      listOfSubtitlesClick,
      announcementsClick,
      isAnnouncementDialogShown,
    }
  },
})
</script>

<style lang="scss">
.tv-show-details {
  display: flex;
  gap: 2rem;

  @media (max-width: $breakpoint-md-max) {
    flex-direction: column;
  }
}

.networks-logos {
  display: flex;
  gap: 0.5rem;
  flex-wrap: nowrap;
  overflow-x: auto;

  img {
    filter: brightness(0) invert(0.6);
  }
}
</style>
