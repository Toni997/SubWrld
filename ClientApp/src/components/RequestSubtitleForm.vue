<template>
  <q-card>
    <q-card-section class="row items-center">
      <h5 class="q-ma-none">Request Subtitle</h5>
    </q-card-section>
    <q-form @submit="onSubmit">
      <q-card-section>
        <p class="text-body1">
          Requesting subtitle for {{ episode.details?.name }} (S{{
            episode.details?.season_number
          }}E{{ episode.details?.episode_number }})
        </p>
        <q-select
          class="q-mb-md"
          filled
          v-model="state.preferredLanguage"
          :rules="[required]"
          use-input
          label="Preferred Language"
          :options="languageOptions"
          option-label="displayValue"
          option-value="actualValue"
          @filter="languagesFilter"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">No results</q-item-section>
            </q-item>
          </template>
        </q-select>
        <q-input
          filled
          v-model="state.preferredFrameRate"
          :rules="[frameRateRangeLimit]"
          type="number"
          step="1"
          label="Preferred Frame Rate"
        ></q-input>
        <q-toggle
          class="q-mb-md"
          v-model="state.preferForHearingImpaired"
          label="Prefer subtitle for hearing impaired"
        />
        <q-input
          v-model="state.comment"
          :rules="[commentCharacterLimit]"
          filled
          type="textarea"
          hint="100 characters limit"
          label="Additional Comment"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="grey" v-close-popup />
        <q-btn
          type="submit"
          flat
          label="Save"
          color="primary"
          :loading="isLoading"
        />
      </q-card-actions>
    </q-form>
  </q-card>
</template>
  
  <script lang="ts">
import { languages } from 'countries-list'
import {
  defineComponent,
  onMounted,
  PropType,
  reactive,
  Ref,
  ref,
  toRefs,
} from 'vue'
import { ITVShowEpisode, ITVShowEpisodeForDialog } from '../interfaces/tv-show'
import { useAuthStore } from '../stores/auth-store'
import {
  ICreateSubtitleRequest,
  ISubtitleRequest,
  ISubtitleRequestForm,
} from '../interfaces/subtitleRequest'
import { api, ApiEndpoints } from '../boot/axios'
import { useQuasar } from 'quasar'
import { ILanguageSelection } from '../interfaces/common'

const languagesMapped = Object.entries(languages).map((l) => ({
  actualValue: l[0],
  displayValue: `${l[1].name} (${l[1].native})`,
}))

export default defineComponent({
  name: 'RequestSubtitleForm',
  props: {
    episode: {
      type: Object as PropType<ITVShowEpisodeForDialog>,
      required: true,
    },
  },
  setup(props, { emit }) {
    const authStore = useAuthStore()
    const $q = useQuasar()
    const { episode } = toRefs(props)

    const languageOptions: Ref<ILanguageSelection[]> = ref(languagesMapped)
    const isLoading: Ref<boolean> = ref(false)

    const state = reactive<ISubtitleRequestForm>({
      tvShowId: episode.value.tvShowId as number,
      season: episode.value.details?.season_number as number,
      episode: episode.value.details?.episode_number as number,
      preferredLanguage: null,
      preferredFrameRate: null,
      preferForHearingImpaired: false,
      comment: null,
    })

    const languagesFilter = (val: string, update: any) => {
      if (val === '') {
        update(() => {
          languageOptions.value = languagesMapped
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase()
        languageOptions.value = languagesMapped.filter((v) =>
          v.displayValue.toLowerCase().includes(needle)
        )
      })
    }

    const onSubmit = async () => {
      isLoading.value = true
      const subtitleRequest: ICreateSubtitleRequest = {
        tvShowId: state.tvShowId,
        season: state.season,
        episode: state.episode,
        preferredLanguage: state.preferredLanguage?.actualValue as string,
        preferredFrameRate: state.preferredFrameRate,
        preferForHearingImpaired: state.preferForHearingImpaired,
        comment: state.comment,
      }
      try {
        const { data }: { data: ISubtitleRequest } = await api.post(
          ApiEndpoints.addSubtitleRequest,
          subtitleRequest
        )
        $q.notify({
          message: 'Subtitle request added',
          position: 'bottom',
          color: 'green',
          timeout: 3000,
        })
        emit('request-saved', data._id)
      } catch (error: any) {
        $q.notify({
          message: error.response?.data.message || 'Error occurred',
          position: 'bottom',
          color: 'red',
          timeout: 3000,
        })
      } finally {
        isLoading.value = false
      }
    }

    return {
      authStore,
      languageOptions,
      languagesFilter,
      onSubmit,
      state,
      isLoading,
      required: (val: any) => !!val || 'This field is required',
      frameRateRangeLimit: (val: number) =>
        !val ||
        (val >= 23.976 && val <= 60) ||
        'Frame rate must be between 23.976 and 60',
      commentCharacterLimit: (val: string) =>
        !val || val.length <= 100 || 'Exceeded character limit',
    }
  },
})
</script>../interfaces/subtitleRequest