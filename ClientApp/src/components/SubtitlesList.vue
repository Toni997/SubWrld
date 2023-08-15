<template>
  <q-card>
    <q-dialog v-model="showConfirmDialog">
      <confirm-dialog
        v-if="showConfirmDialog"
        message="Are you sure you want to remove this subtitle?"
        @on-confirmed="deleteSubtitle"
      />
    </q-dialog>

    <q-dialog v-model="isSubtitleFormShowed" persistent>
      <subtitle-form
        :episode="episode"
        :subtitle="subtitleForDialog"
        @subtitle-saved="onSubtitleSaved"
      />
    </q-dialog>

    <q-dialog v-model="isReportDialogShown" persistent>
      <report-subtitle-form
        style="width: min(600px, 100%)"
        :subtitleId="subtitleIdToReport"
        @on-submit="onReportSaved"
      />
    </q-dialog>

    <q-banner v-show="error" dense class="text-white bg-red">
      <template v-slot:avatar>
        <q-icon name="error" color="white" />
      </template>
      {{ error }}
    </q-banner>
    <q-card-section class="header">
      <h5 class="q-ma-none">Subtitles</h5>
      <q-btn
        round
        flat
        icon="close"
        color="red"
        size="1.2rem"
        v-close-popup
        @click="$emit('closed')"
      />
    </q-card-section>
    <q-card-section>
      <p class="text-body1">
        Subtitles for {{ episode.details?.name }} (S{{
          episode.details?.season_number
        }}E{{ episode.details?.episode_number }})
      </p>
      <q-btn
        v-if="auth.isLoggedIn"
        label="Add Subtitle"
        color="primary"
        @click="addClick"
      ></q-btn>
      <q-table
        class="q-mt-md text-body1"
        bordered
        :loading="isLoading"
        ref="tableRef"
        :rows="rows"
        :columns="columns"
        row-key="id"
      >
        <template v-slot:loading>
          <q-inner-loading showing color="primary" />
        </template>

        <template v-slot:header="props">
          <q-tr :props="props">
            <q-th auto-width />
            <q-th v-for="col in props.cols" :key="col.name" :props="props">
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

        <template v-slot:body="props">
          <q-tr
            :props="props"
            :class="{
              'just-added': props.row._id === episode.justAddedSubtitleId,
            }"
          >
            <q-td auto-width>
              <q-btn
                size="sm"
                color="primary"
                round
                dense
                @click="
                  columnExpanded[props.rowIndex] =
                    !columnExpanded[props.rowIndex]
                "
                :icon="columnExpanded[props.rowIndex] ? 'remove' : 'add'"
              >
                <q-tooltip>See release</q-tooltip>
              </q-btn>
            </q-td>
            <q-td v-for="col in props.cols" :key="col.name" :props="props">
              <span
                v-if="
                  col.name !== 'actions' &&
                  col.name !== 'download' &&
                  col.name !== 'uploadedBy'
                "
              >
                {{ col.value }}
              </span>
              <span v-if="col.name === 'uploadedBy'">
                <q-btn
                  flat
                  dense
                  no-caps
                  v-if="!props.row.user.isAdmin"
                  :to="`/users/${props.row.user._id}`"
                >
                  {{ props.row.user.username }}
                </q-btn>
                <q-chip
                  text-color="white"
                  :icon="props.row.user.isAdmin ? 'verified' : 'grade'"
                  size="0.7rem"
                  :color="
                    getReputationBadgeColor(
                      props.row.user.reputation,
                      props.row.user.isAdmin
                    )
                  "
                  >{{
                    props.row.user.isAdmin
                      ? 'Official'
                      : props.row.user.reputation
                  }}
                  <q-tooltip>{{
                    props.row.user.isAdmin ? 'Uploaded by Staff' : 'Reputation'
                  }}</q-tooltip>
                </q-chip>
              </span>
              <span v-if="col.name === 'download'">
                <q-btn
                  v-if="props.row.filePath"
                  :href="ApiEndpoints.downloadSubtitle(props.row._id)"
                  icon="download"
                  color="primary"
                  flat
                  round
                >
                  <q-tooltip>Click to Download</q-tooltip>
                </q-btn>
                <q-icon
                  class="q-pa-xs"
                  v-if="!props.row.filePath"
                  name="file_download_off"
                  size="1.5rem"
                  color="red"
                >
                  <q-tooltip>Not Yet Available</q-tooltip>
                </q-icon>
              </span>
              <span v-if="col.name === 'actions'">
                <q-btn icon="more_horiz" flat round v-if="auth.isLoggedIn">
                  <q-menu>
                    <q-list>
                      <q-item
                        v-if="
                          !props.row.isConfirmed &&
                          !props.row.isOwner &&
                          !auth.isAdmin
                        "
                        clickable
                        @click="reportClick(props.row)"
                        v-close-popup
                      >
                        <q-item-section>Report</q-item-section>
                      </q-item>
                      <q-item
                        v-if="
                          !props.row.isConfirmed &&
                          !props.row.isWorkInProgress &&
                          auth.isAdmin
                        "
                        clickable
                        @click="() => confirmClick(props.row)"
                        v-close-popup
                      >
                        <q-item-section>Confirm</q-item-section>
                      </q-item>
                      <q-item
                        v-if="!props.row.isThankedByUser && !props.row.isOwner"
                        clickable
                        @click="() => thankYouClick(props.row)"
                        v-close-popup
                      >
                        <q-item-section>Thank You</q-item-section>
                      </q-item>
                      <q-item
                        v-if="
                          !props.row.isConfirmed &&
                          (props.row.isOwner || auth.isAdmin)
                        "
                        clickable
                        @click="editClick(props.row)"
                        v-close-popup
                      >
                        <q-item-section>Edit</q-item-section>
                      </q-item>
                      <q-item
                        v-if="props.row.isOwner || auth.isAdmin"
                        clickable
                        @click="deleteSubtitleClick(props.row._id)"
                        v-close-popup
                      >
                        <q-item-section>Delete</q-item-section>
                      </q-item>
                      <q-separator />
                    </q-list>
                  </q-menu> </q-btn
              ></span>
            </q-td>
          </q-tr>
          <q-tr v-show="columnExpanded[props.rowIndex]" :props="props">
            <q-td colspan="100%">
              <div class="text-left">{{ props.row.release }}</div>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  PropType,
  reactive,
  ref,
  Ref,
  toRefs,
} from 'vue'
import { api, ApiEndpoints } from '../boot/axios'
import { ITVShowEpisodeForDialog } from '../interfaces/tv-show'
import { languages } from 'countries-list'
import moment from 'moment'
import { useAuthStore } from '../stores/auth-store'
import truncate from 'truncate'
import { getReputationBadgeColor } from '../utils/getReputationBadgeColor'
import { useQuasar } from 'quasar'
import SubtitleForm from '../components/SubtitleForm.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import ReportSubtitleForm from '../components/ReportSubtitleForm.vue'
import { ISubtitle } from '../interfaces/subtitle'

export default defineComponent({
  components: { SubtitleForm, ReportSubtitleForm, ConfirmDialog },
  props: {
    episode: {
      type: Object as PropType<ITVShowEpisodeForDialog>,
      required: true,
    },
  },
  setup(props) {
    const auth = useAuthStore()
    const $q = useQuasar()
    const { episode } = toRefs(props)

    const rows: Ref<readonly ISubtitle[] | undefined> = ref(undefined)
    const isLoading: Ref<boolean> = ref(false)
    const error: Ref<string> = ref('')
    const showConfirmDialog: Ref<boolean> = ref(false)
    const isSubtitleFormShowed: Ref<boolean> = ref(false)
    const subtitleForDialog: Ref<ISubtitle | undefined> = ref(undefined)
    const subtitleIdToReport: Ref<string> = ref('undefined')
    const isReportDialogShown: Ref<boolean> = ref(false)
    let subtitleIdToDelete: string | null = null
    const columnExpanded = reactive<{
      [key: number]: boolean
    }>({})

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
        name: 'forHearingImpaired',
        required: true,
        label: 'For Hearing Impaired',
        field: (row: ISubtitle) => (row.forHearingImpaired ? 'Yes' : 'No'),
        sortable: true,
      },
      {
        name: 'onlyForeignLanguage',
        required: true,
        label: 'Only Foreign Language Translated',
        field: (row: ISubtitle) => (row.onlyForeignLanguage ? 'Yes' : 'No'),
        sortable: true,
      },
      {
        name: 'isWorkInProgress',
        required: true,
        label: 'Work in Progress',
        field: (row: ISubtitle) => (row.isWorkInProgress ? 'Yes' : 'No'),
        sortable: true,
      },
      {
        name: 'uploadedBy',
        required: true,
        label: 'Uploaded By',
        field: (row: ISubtitle) =>
          row.user.username +
          (auth.userInfo?.username === row.user.username ? ' (You)' : ''),
        sortable: true,
      },
      {
        name: 'uploadedIsAuthor',
        required: true,
        label: 'Uploader Is Author',
        field: (row: ISubtitle) => (row.uploaderIsAuthor ? 'Yes' : 'No'),
        sortable: true,
      },
      { name: 'download', label: 'Download', required: true },
      {
        name: 'downloads',
        required: true,
        label: 'Downloads',
        field: (row: ISubtitle) => row.downloads,
        sortable: true,
      },
      {
        name: 'thankedByCount',
        required: true,
        label: 'Thanked By',
        field: (row: ISubtitle) => row.thankedByCount,
        sortable: true,
      },
      {
        name: 'isConfirmed',
        required: true,
        label: 'Confirmed',
        field: (row: ISubtitle) => (row.isConfirmed ? 'Yes' : 'No'),
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
      { name: 'actions', label: '', required: true },
    ]

    onMounted(async () => {
      await loadSubtitles()
    })

    const loadSubtitles = async () => {
      if (!episode.value.details) return
      error.value = ''
      isLoading.value = true
      try {
        const response = await api.get(
          ApiEndpoints.getSubtitles(episode.value.details.id)
        )
        rows.value = response.data
      } catch (err: any) {
        error.value = err.response?.data.message || 'Failed to fetch'
      } finally {
        isLoading.value = false
      }
    }

    const deleteSubtitleClick = (subtitleId: string) => {
      subtitleIdToDelete = subtitleId
      showConfirmDialog.value = true
    }

    const thankYouClick = async (subtitleRow: ISubtitle) => {
      if (isLoading.value) return
      isLoading.value = true
      try {
        await api.post(ApiEndpoints.thankForSubtitle(subtitleRow._id))
        $q.notify({
          message: 'Thanked for subtitle',
          position: 'bottom',
          color: 'green',
          timeout: 3000,
        })
        subtitleRow.thankedByCount += 1
        subtitleRow.isThankedByUser = true
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

    const confirmClick = async (subtitleRow: ISubtitle) => {
      if (isLoading.value) return
      isLoading.value = true
      try {
        await api.patch(ApiEndpoints.confirmSubtitle(subtitleRow._id))
        $q.notify({
          message: 'Confirmed subtitle',
          position: 'bottom',
          color: 'green',
          timeout: 3000,
        })
        subtitleRow.isConfirmed = true
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

    const reportClick = async (subtitleRow: ISubtitle) => {
      subtitleIdToReport.value = subtitleRow._id
      isReportDialogShown.value = true
    }

    const addClick = () => {
      subtitleForDialog.value = undefined
      isSubtitleFormShowed.value = true
    }

    const editClick = async (subtitleRow: ISubtitle) => {
      subtitleForDialog.value = subtitleRow
      isSubtitleFormShowed.value = true
    }

    const deleteSubtitle = async () => {
      if (isLoading.value) return
      isLoading.value = true
      try {
        const response = await api.delete(
          ApiEndpoints.deleteSubtitle(subtitleIdToDelete as string)
        )
        rows.value = response.data
        $q.notify({
          message: 'Subtitle deleted',
          position: 'bottom',
          color: 'green',
          timeout: 3000,
        })
        await loadSubtitles()
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

    const onSubtitleSaved = async (justSaved: ISubtitle) => {
      isSubtitleFormShowed.value = false
      episode.value.justAddedSubtitleId = justSaved._id
      await loadSubtitles()
    }

    const onReportSaved = () => {
      isReportDialogShown.value = false
    }

    const getLanguageKey = (key: string): keyof typeof languages =>
      key as keyof typeof languages

    return {
      error,
      columns,
      rows,
      isLoading,
      auth,
      columnExpanded,
      deleteSubtitle,
      onSubtitleSaved,
      showConfirmDialog,
      deleteSubtitleClick,
      ApiEndpoints,
      thankYouClick,
      confirmClick,
      reportClick,
      editClick,
      isSubtitleFormShowed,
      subtitleForDialog,
      addClick,
      isReportDialogShown,
      onReportSaved,
      subtitleIdToReport,
      getReputationBadgeColor,
    }
  },
})
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;
}

.just-added {
  animation: justAddedAnimation 3s forwards;
}

@keyframes justAddedAnimation {
  0% {
    background-color: grey;
  }
  100% {
    background-color: none;
  }
}
</style>
