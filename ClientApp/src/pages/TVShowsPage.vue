<template>
  <div class="q-pa-md">
    <q-pull-to-refresh
      @refresh="loadData"
      color="orange-2"
      bg-color="black"
      icon="autorenew"
    >
      <q-input
        v-model="searchKeyword"
        debounce="500"
        filled
        outlined
        clearable
        placeholder="Search TV Shows..."
      >
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
      <q-banner v-if="error" dense class="text-white bg-red">
        <template v-slot:avatar>
          <q-icon name="error" color="white" />
        </template>
        {{ error }}
      </q-banner>
      <h2>{{ searchedTVShows.length > 0 ? 'Search Results' : 'Popular' }}</h2>
      <q-separator></q-separator>
      <q-spinner color="primary" size="3em" :thickness="10" v-if="isLoading" />
      <div class="row items-start" v-if="!isLoading">
        <div
          class="col-xs-12 col-sm-6 col-md-4 col-lg-3"
          v-for="tvShow in getTVShows()"
          :key="tvShow.id"
        >
          <div class="q-pa-md">
            <q-card class="q-pa-none">
              <router-link :to="`/tv-shows/${tvShow.id}`">
                <q-img
                  :src="getImageUrl(tvShow.poster_path)"
                  :alt="tvShow.name"
                  class="tv-show-poster cursor-pointer"
                >
                  <div class="tv-show-overview">
                    {{
                      truncate(tvShow.overview, 300) || 'No overview to display'
                    }}
                  </div>
                </q-img>
              </router-link>
              <q-card-section class="tv-show-info">
                <router-link
                  :to="`/tv-shows/${tvShow.id}`"
                  style="text-decoration: none; color: inherit"
                  class="text-h6 cursor-pointer tv-show-title"
                  >{{ tvShow.name }}
                </router-link>
                <div class="text-body1">Aired: {{ tvShow.first_air_date }}</div>
                <div class="text-body1">
                  {{ tvShow.genre_names.join(' | ') }}
                </div>
                <div class="text-body1">
                  <q-rating
                    v-model="tvShow.vote_average"
                    size="1em"
                    color="orange"
                    icon-half="star_half"
                    readonly
                    max="10"
                  />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </q-pull-to-refresh>
  </div>
</template>

<script lang="ts">
import { ref, onMounted, watch, Ref } from 'vue'
import { ITVShowBase } from '../interfaces/tv-show'
import { tmdbImageBaseUrl } from '../config/tmdbConfig'
import { api, ApiEndpoints } from '../boot/axios'
import truncate from 'truncate'

export default {
  setup() {
    const popularTVShows: Ref<ITVShowBase[]> = ref([])
    const error: Ref<string> = ref('')
    const isLoading: Ref<boolean> = ref(false)
    const searchedTVShows: Ref<ITVShowBase[]> = ref([])
    const searchKeyword: Ref<string> = ref('')

    onMounted(async () => await loadData(null))

    watch(searchKeyword, async (newValue, oldValue) => {
      error.value = ''
      newValue = newValue?.trim()
      if (!newValue) {
        searchedTVShows.value = []
        return
      }
      isLoading.value = true
      try {
        const { data } = await api.get(
          ApiEndpoints.searchTVShowsPath + newValue
        )
        searchedTVShows.value = data
        if (searchedTVShows.value.length < 1) error.value = 'Nothing found'
      } catch (err) {
        error.value = 'Failed to fetch.'
      } finally {
        isLoading.value = false
      }
    })

    const loadData = async (done: any) => {
      isLoading.value = true
      try {
        const { data } = await api.get(ApiEndpoints.getPopularTVShowsPath)
        popularTVShows.value = data
      } catch (err) {
        error.value = 'Failed to fetch.'
      } finally {
        isLoading.value = false
      }

      if (done) done()
    }

    const getImageUrl = (relativePath: string) =>
      tmdbImageBaseUrl + relativePath

    const divideRatingByTwo = (actualRating: number) => actualRating / 2

    const getTVShows = () =>
      searchedTVShows.value.length > 0
        ? searchedTVShows.value
        : popularTVShows.value

    return {
      searchedTVShows,
      error,
      getImageUrl,
      truncate,
      isLoading,
      loadData,
      searchKeyword,
      getTVShows,
      divideRatingByTwo,
    }
  },
}
</script>

<style lang="scss">
.tv-show-poster {
  width: 100%;
  min-height: 300px;
  object-fit: cover;
  border-radius: 5px;
}

.tv-show-hover,
.tv-show-overview,
.tv-show-title,
.tv-show-poster img {
  transition: 0.3s;
}

.tv-show-overview {
  opacity: 0;
}

.tv-show-poster:hover {
  .tv-show-overview {
    opacity: 1;
  }

  img {
    filter: blur(8px);
  }
}

.tv-show-title:hover {
  opacity: 0.7;
}
</style>
