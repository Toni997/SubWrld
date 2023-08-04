<template>
  <q-card>
    <q-card-section class="row items-center">
      <h5 class="q-ma-none">Select Subtitle</h5>
    </q-card-section>
    <q-card-section>
      <q-table
        flat
        bordered
        :rows="rows"
        :columns="columns"
        row-key="name"
        selection="single"
        v-model:selected="selected"
      />
    </q-card-section>
    <q-card-actions align="right">
      <q-btn flat label="Cancel" color="grey" v-close-popup />
      <q-btn
        type="submit"
        flat
        label="Save"
        color="primary"
        :disable="!selected.length"
        :loading="isLoading"
        @click="onSubmit"
      />
    </q-card-actions>
  </q-card>
</template>

<script lang="ts">
import { useQuasar } from 'quasar'
import { defineComponent, onMounted, PropType, Ref, ref, toRefs } from 'vue'
import { ISubtitle } from '../interfaces/subtitle'
import moment from 'moment'
import { languages } from 'countries-list'
import truncate from 'truncate'
import { ITVShowEpisodeForDialog } from '../interfaces/tv-show'
import { api, ApiEndpoints } from '../boot/axios'

const getLanguageKey = (key: string): keyof typeof languages =>
  key as keyof typeof languages

const columns = [
  {
    name: 'language',
    required: true,
    label: 'Language',
    field: (row: ISubtitle) =>
      `${languages[getLanguageKey(row.language)].name} (${
        languages[getLanguageKey(row.language)].native
      })`,
    sortable: true,
  },
  {
    name: 'release',
    required: true,
    label: 'Release',
    field: (row: ISubtitle) => truncate(row.release || 'No', 20),
    sortable: true,
  },
  {
    name: 'frameRate',
    required: true,
    label: 'Frame Rate',
    field: (row: ISubtitle) => row.frameRate || 'Any',
    sortable: true,
  },
  {
    name: 'uploadedFromNow',
    required: true,
    label: 'Uploaded',
    field: (row: ISubtitle) => row.createdAt,
    sortable: true,
    format: (val: string, row: ISubtitle) => moment(val).fromNow(),
    sort: (a: string, b: string) => {
      const timeA = moment(a)
      const timeB = moment(b)
      return timeA.isBefore(timeB)
    },
  },
  {
    name: 'updatedFromNow',
    required: true,
    label: 'Updated',
    field: (row: ISubtitle) => row.updatedAt,
    sortable: true,
    format: (val: string, row: ISubtitle) => moment(val).fromNow(),
    sort: (a: string, b: string) => {
      const timeA = moment(a)
      const timeB = moment(b)
      return timeA.isBefore(timeB)
    },
  },
]

export default defineComponent({
  props: {
    requestId: {
      type: String,
      required: true,
    },
    episode: {
      type: Object as PropType<ITVShowEpisodeForDialog>,
      required: true,
    },
  },
  setup(props, { emit }) {
    const $q = useQuasar()
    const { episode, requestId } = toRefs(props)

    const rows: Ref<readonly ISubtitle[] | undefined> = ref(undefined)
    const isLoading: Ref<boolean> = ref(false)
    const selected: Ref<ISubtitle[]> = ref([])

    onMounted(async () => {
      if (!episode.value.details) return
      isLoading.value = true
      try {
        const response = await api.get(
          ApiEndpoints.getUserSubtitlesForEpisode(episode.value.details.id)
        )
        rows.value = response.data
      } catch (err: any) {
        $q.notify({
          message: err.response?.data.message || 'Error occurred',
          position: 'bottom',
          color: 'red',
          timeout: 3000,
        })
      } finally {
        isLoading.value = false
      }
    })

    const onSubmit = async () => {
      if (!selected.value.length) return
      const selectedSubtitle = selected.value[0]
      isLoading.value = true
      try {
        await api.patch(
          ApiEndpoints.fulfillSubtitleRequestWithExistingSubtitle(
            requestId.value,
            selectedSubtitle._id
          )
        )
        emit('on-submit', requestId.value)
      } catch (err: any) {
        $q.notify({
          message: err.response?.data.message || 'Error occurred',
          position: 'bottom',
          color: 'red',
          timeout: 3000,
        })
      } finally {
        isLoading.value = false
      }
    }

    return { isLoading, selected, rows, columns, onSubmit }
  },
})
</script>
