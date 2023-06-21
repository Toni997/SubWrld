<template>
  <div class="q-pa-md">
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
          />
        </div>
        <div class="details-container">
          <h4 class="q-mt-md q-mb-xs">
            {{ tvShowDetails.name }} ({{
              new Date(tvShowDetails.first_air_date).getFullYear()
            }}-{{
              tvShowDetails.status === 'Ended'
                ? new Date(tvShowDetails.last_air_date).getFullYear()
                : ''
            }})
          </h4>
          <h6 class="q-mb-none q-mt-none">
            {{ tvShowDetails.genres.map((g) => g.name).join(' | ') }}
          </h6>
          <p>
            {{
              tvShowDetails.episode_run_time.map((r) => r + 'min').join(', ')
            }}
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
          <div class="q-mt-lg q-mb-none" v-if="auth.isLoggedIn()">
            <q-btn
              class="q-pa-md"
              round
              color="primary"
              icon="visibility"
              @click="addToWatchList()"
            >
              <q-tooltip>Add to Watch List</q-tooltip>
            </q-btn>
          </div>
          <p class="q-mt-lg text-body1">{{ tvShowDetails.overview }}</p>
          <p class="text-body1">
            Original Name:
            <strong>{{ tvShowDetails.original_name }}&nbsp;</strong>
            <span
              style="font-family: 'Twemoji Country Flags'; font-size: 1.4rem"
              v-for="(originCountry, index) in tvShowDetails.origin_country"
              :key="index"
            >
              <q-tooltip>
                {{ countries[getCountryKey(originCountry)]?.name }}
              </q-tooltip>
              {{ getEmojiFlag(originCountry) }}</span
            >
          </p>
          <p class="text-body1">
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
        >
          <q-tab
            v-for="season in tvShowDetails.seasons"
            :key="season.id"
            :name="season.name"
            :label="`${season.name}`"
          />
        </q-tabs>
        <q-separator />
        <q-tab-panels v-model="tab" animated>
          <q-tab-panel
            v-for="season in tvShowDetails.seasons"
            :key="season.id"
            :name="season.name"
          >
            <q-list>
              <q-expansion-item
                v-for="episode in season.episodes"
                :key="episode.id"
                @before-show="loadSubtitlesForEpisode(episode.id)"
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
                  <q-item-section side v-if="auth.isLoggedIn()">
                    <q-btn
                      round
                      color="secundary"
                      icon="visibility"
                      @click="markEpisodeAsWatched($event, episode.id)"
                    >
                      <q-tooltip>Add to Watched</q-tooltip>
                    </q-btn>
                  </q-item-section>
                </template>
                <q-separator />
                <q-card>
                  <q-card-section>
                    <p class="text-body1 q-my-sm">{{ episode.overview }}</p>
                  </q-card-section>
                </q-card>
              </q-expansion-item>
            </q-list>
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, Ref, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth-store'
import { api, ApiEndpoints } from '../boot/axios'
import { tmdbImageBaseUrl } from '../config/tmdbConfig'
import truncate from 'truncate'
import { ITVShowDetails } from '../interfaces/tv-show'
import { getEmojiFlag, countries } from 'countries-list'

export default defineComponent({
  setup() {
    const route = useRoute()
    const auth = useAuthStore()
    const tab: Ref<string> = ref('')
    const tvShowDetails: Ref<ITVShowDetails | null> = ref(null)
    const tvShowId: Ref<string> = ref('')
    const isLoading: Ref<boolean> = ref(false)
    const error: Ref<string> = ref('')

    onMounted(() => {
      tvShowId.value = route.params.tvShowId as string
      loadTVShowDetails()
    })

    const loadTVShowDetails = async () => {
      isLoading.value = true
      try {
        const response = await api.get(
          ApiEndpoints.getTVShowDetailsPath(tvShowId.value)
        )
        if (response.status !== 200) {
          throw new Error()
        }
        tvShowDetails.value = response.data
        tab.value = tvShowDetails.value?.seasons[0]?.name || ''
      } catch (err) {
        error.value = 'Failed to fetch.'
      } finally {
        isLoading.value = false
      }
    }

    const getImageUrl = (relativePath: string) =>
      tmdbImageBaseUrl + relativePath

    const addToWatchList = () => {
      console.log('added to watchlist')
    }

    const loadSubtitlesForEpisode = (episodeId: number) => {
      // return if already loaded
      console.log('loading subtitles for id ' + episodeId)
    }

    const markEpisodeAsWatched = (event: Event, episodeId: number) => {
      console.log('watched ' + episodeId)
      event.stopPropagation()
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
      loadSubtitlesForEpisode,
      markEpisodeAsWatched,
      addToWatchList,
      auth,
      getEmojiFlag,
      countries,
      getCountryKey,
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
</style>
