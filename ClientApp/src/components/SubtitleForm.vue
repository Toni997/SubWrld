<template>
  <q-card>
    <q-card-section class="row items-center">
      <h5 class="q-ma-none">{{ subtitle ? 'Edit' : 'Upload' }} Subtitle</h5>
    </q-card-section>
    <q-form @submit="onSubmit">
      <q-card-section>
        <p class="text-body1">
          {{ subtitle ? 'Edit' : 'Upload' }} subtitle for
          {{ episode.details?.name }} (S{{ episode.details?.season_number }}E{{
            episode.details?.episode_number
          }})<span class="text-primary" v-if="relatedRequestId">
            - Related to a subtitle request</span
          >
        </p>
        {{ subtitle?._id }}
        <q-select
          class="q-mb-md"
          filled
          v-model="state.language"
          :rules="[required]"
          use-input
          label="Language"
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
          v-model="state.frameRate"
          :rules="[required, frameRateRangeLimit]"
          type="number"
          step="1"
          label="Frame Rate"
        ></q-input>
        <div>
          <q-toggle
            class="q-mb-md"
            v-model="state.forHearingImpaired"
            label="For hearing impaired"
          />
        </div>
        <div>
          <q-toggle
            class="q-mb-md"
            v-model="state.onlyForeignLanguage"
            label="Only foreign language translated"
          />
        </div>
        <div>
          <q-toggle
            class="q-mb-md"
            v-model="state.uploaderIsAuthor"
            label="Uploader is Author"
          />
        </div>
        <q-file
          :rules="[fileRequired]"
          class="q-mb-lg"
          filled
          multiple
          :max-files="5"
          :max-total-size="2 * 1024 * 1024"
          :accept="acceptedFileTypes.join(', ')"
          color="purple-12"
          v-model="state.files"
          label="Attach subtitle files"
          :hint="
            'Max 5 files, 2MB total' +
            (subtitle
              ? ' (your previously attached files will get overrided if you attach new files here)'
              : '')
          "
          @change="onFilesChanged"
          @rejected="onFilesRejected"
        >
          <template v-slot:prepend>
            <q-icon name="attach_file" />
          </template>
          <template v-if="state.files.length" v-slot:append>
            <q-icon
              name="cancel"
              @click.stop.prevent="clearFilesClick"
              class="cursor-pointer"
            />
          </template>
        </q-file>
        <div>
          <q-toggle
            :disable="!state.files?.length && !subtitle?.filePath"
            class="q-mb-md"
            v-model="state.isWorkInProgress"
            label="Work in Progress"
          />
        </div>
        <q-input
          v-model="state.release"
          :rules="[required, releaseCharacterLimit, releaseFormat]"
          filled
          type="textarea"
          hint="50 characters limit"
          label="Release"
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
import { defineComponent, PropType, reactive, Ref, ref, toRefs } from 'vue'
import { ITVShowEpisodeForDialog } from '../interfaces/tv-show'
import { useAuthStore } from '../stores/auth-store'
import { api, ApiEndpoints } from '../boot/axios'
import { useQuasar } from 'quasar'
import { ISubtitle, ISubtitleForm } from '../interfaces/subtitle'
import { ILanguageSelection } from '../interfaces/common'

const acceptedFileTypes = [
  '.srt',
  '.sub',
  '.ssa',
  '.ass',
  '.vtt',
  'application/x-subrip',
  'application/x-matroska',
  'application/vnd.ms-ssa',
  'application/vnd.nikse.subtitleeditor',
  'text/plain',
]

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
    subtitle: {
      type: Object as PropType<ISubtitle>,
    },
    relatedRequestId: {
      type: String,
    },
  },
  setup(props, { emit }) {
    const auth = useAuthStore()
    const $q = useQuasar()
    const { episode, subtitle, relatedRequestId } = toRefs(props)

    const languageOptions: Ref<ILanguageSelection[]> = ref(languagesMapped)
    const isLoading: Ref<boolean> = ref(false)
    const filesErrorMessage: Ref<string> = ref('')

    const state = reactive<ISubtitleForm>({
      tvShowId: episode.value.tvShowId as number,
      season: episode.value.details?.season_number as number,
      episode: episode.value.details?.episode_number as number,
      language: subtitle.value
        ? (languagesMapped.find(
            (x) => x.actualValue === subtitle.value?.language
          ) as ILanguageSelection)
        : null,
      frameRate: subtitle.value?.frameRate || null,
      forHearingImpaired: subtitle.value?.forHearingImpaired || false,
      isWorkInProgress: subtitle.value?.isWorkInProgress || true,
      onlyForeignLanguage: subtitle.value?.onlyForeignLanguage || false,
      uploaderIsAuthor: subtitle.value?.uploaderIsAuthor || false,
      release: subtitle.value?.release || null,
      files: [],
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
      const formData = new FormData()
      formData.append('tvShowId', String(state.tvShowId))
      formData.append('season', String(state.season))
      formData.append('episode', String(state.episode))
      formData.append('language', state.language?.actualValue as string)
      formData.append('frameRate', String(state.frameRate))
      formData.append('forHearingImpaired', String(state.forHearingImpaired))
      formData.append('isWorkInProgress', String(state.isWorkInProgress))
      formData.append('onlyForeignLanguage', String(state.onlyForeignLanguage))
      formData.append('uploaderIsAuthor', String(state.uploaderIsAuthor))
      formData.append('release', state.release as string)
      if (relatedRequestId.value)
        formData.append('subtitleRequestId', relatedRequestId.value)
      state.files.forEach((file: File) => {
        formData.append('files', file)
      })
      try {
        let savedSubtitle: ISubtitle
        if (subtitle.value) {
          const response = await api.put(
            ApiEndpoints.editSubtitle(subtitle.value._id),
            formData
          )
          savedSubtitle = response.data
        } else {
          const response = await api.post(ApiEndpoints.addSubtitle, formData)
          savedSubtitle = response.data
        }

        $q.notify({
          message: 'Subtitle saved',
          position: 'bottom',
          color: 'green',
          timeout: 3000,
        })
        emit('subtitle-saved', savedSubtitle)
      } catch (error: any) {
        console.log('error', error)
        $q.notify({
          message: error.response?.message || 'Failed to send request',
          position: 'bottom',
          color: 'red',
          timeout: 3000,
        })
      } finally {
        isLoading.value = false
      }
    }

    const onFilesRejected = (rejectedEntries: any) => {
      $q.notify({
        type: 'negative',
        message: `${rejectedEntries.length} file(s) not supported`,
      })
    }

    const onFilesChanged = () => {
      if (!state.files.length) state.isWorkInProgress = true
    }

    const clearFilesClick = () => {
      state.files = []
      state.isWorkInProgress = true
    }

    return {
      auth,
      languageOptions,
      languagesFilter,
      onSubmit,
      state,
      isLoading,
      acceptedFileTypes,
      onFilesRejected,
      filesErrorMessage,
      onFilesChanged,
      clearFilesClick,
      required: (val: any) => !!val || 'This field is required',
      frameRateRangeLimit: (val: number) =>
        (val >= 23.976 && val <= 60) ||
        'Frame rate must be between 23.976 and 60',
      releaseCharacterLimit: (val: any) =>
        (val.length >= 3 && val.length <= 50) ||
        'Must be between 3 and 50 characters',
      releaseFormat: (val: string) =>
        /^[a-zA-Z0-9]+(?:[.-][a-zA-Z0-9]+)*$/.test(val) ||
        'Only letters, numbers, - and . (no consecutive - or . nor at the beginning or the end)',
      fileRequired: (files: any) =>
        (files?.length && relatedRequestId.value !== undefined) ||
        'Please attach at least one file',
    }
  },
})
</script>