<template>
  <q-card>
    <q-dialog v-model="showConfirmDialog">
      <confirm-dialog
        message="Are you sure you want to remove this request?"
        @on-confirmed="deleteSubtitleRequest"
      />
    </q-dialog>

    <q-dialog v-model="isRequestSubtitleDialogShown" persistent>
      <request-subtitle-form
        style="width: min(600px, 100%)"
        :episode="episode"
        @request-saved="onRequestSaved"
      />
    </q-dialog>

    <q-dialog v-model="isSubtitleFormShowed" persistent>
      <subtitle-form
        style="width: min(600px, 100%)"
        :episode="episode"
        :relatedRequestId="relatedRequestId"
        @subtitle-saved="onSubtitleSaved"
      />
    </q-dialog>

    <q-dialog v-model="isSelectSubtitleShown">
      <select-subtitle
        style="width: min(600px, 100%)"
        :episode="episode"
        :requestId="requestIdToFulfill"
        @on-submit="(requestId) => onFulfilledWithExistingSubtitle(requestId)"
      />
    </q-dialog>

    <q-banner v-show="error" dense class="text-white bg-red">
      <template v-slot:avatar>
        <q-icon name="error" color="white" />
      </template>
      {{ error }}
    </q-banner>
    <q-card-section class="header">
      <h5 class="q-ma-none">Subtitle Requests</h5>
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
        Subtitle Requests for {{ episode.details?.name }} (S{{
          episode.details?.season_number
        }}E{{ episode.details?.episode_number }})
      </p>
      <q-btn
        v-if="auth.isLoggedIn"
        label="Add Request"
        color="primary"
        @click="isRequestSubtitleDialogShown = true"
      ></q-btn>
      <q-table
        class="q-mt-md text-body1"
        bordered
        :loading="isLoading"
        ref="tableRef"
        :rows="rows"
        :columns="columns"
        row-key="id"
        :visible-columns="['-id']"
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
              'just-added':
                props.row._id === episode.justAddedSubtitleRequestId,
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
                <q-tooltip>See comment</q-tooltip>
              </q-btn>
            </q-td>
            <q-td v-for="col in props.cols" :key="col.name" :props="props">
              <span v-if="col.name !== 'actions' && col.name !== 'download'">{{
                col.value
              }}</span>
              <span v-if="col.name === 'actions'">
                <q-btn icon="more_horiz" flat round v-if="auth.isLoggedIn">
                  <q-menu>
                    <q-list>
                      <q-item
                        v-if="!props.row.isOwner && !props.row.subtitle"
                        clickable
                        @click="uploadSubtitleClick(props.row)"
                        v-close-popup
                      >
                        <q-item-section>Upload New Subtitle</q-item-section>
                      </q-item>
                      <q-item
                        v-if="!props.row.isOwner && !props.row.subtitle"
                        clickable
                        @click="selectSubtitleClick(props.row)"
                        v-close-popup
                      >
                        <q-item-section>
                          Select Uploaded Subtitle
                        </q-item-section>
                      </q-item>
                      <q-item
                        v-if="props.row.isOwner && props.row.subtitle"
                        clickable
                        @click="reopenClick(props.row)"
                        v-close-popup
                      >
                        <q-item-section>Reopen</q-item-section>
                      </q-item>
                      <q-item
                        v-if="
                          auth.userInfo?._id === props.row.userId ||
                          auth.isAdmin
                        "
                        clickable
                        @click="deleteSubtitleRequestClick(props.row._id)"
                        v-close-popup
                      >
                        <q-item-section>Delete Request</q-item-section>
                      </q-item>
                      <q-separator />
                    </q-list>
                  </q-menu>
                </q-btn>
              </span>
              <span v-if="col.name === 'download'">
                <q-btn
                  v-if="props.row.subtitleId"
                  :href="ApiEndpoints.downloadSubtitle(props.row.subtitleId)"
                  icon="download"
                  color="primary"
                  flat
                  round
                >
                  <q-tooltip>Click to Download</q-tooltip>
                </q-btn>
                <span v-if="!props.row.subtitleId">-</span>
              </span>
            </q-td>
          </q-tr>
          <q-tr v-show="columnExpanded[props.rowIndex]" :props="props">
            <q-td colspan="100%">
              <div v-if="props.row.comment" class="text-left">
                {{ props.row.comment }}
              </div>
              <div v-if="!props.row.comment" class="text-left">
                <i>No comment added</i>
              </div>
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
import { ISubtitleRequest } from '../interfaces/subtitleRequest'
import { api, ApiEndpoints } from '../boot/axios'
import { ITVShowEpisodeForDialog } from '../interfaces/tv-show'
import { languages } from 'countries-list'
import moment from 'moment'
import { useAuthStore } from '../stores/auth-store'
import truncate from 'truncate'
import { useQuasar } from 'quasar'
import RequestSubtitleForm from '../components/RequestSubtitleForm.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import SubtitleForm from '../components/SubtitleForm.vue'
import SelectSubtitle from '../components/SelectSubtitle.vue'
import { ISubtitle } from '../interfaces/subtitle'

export default defineComponent({
  components: {
    RequestSubtitleForm,
    SubtitleForm,
    SelectSubtitle,
    ConfirmDialog,
  },

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

    const rows: Ref<readonly ISubtitleRequest[] | undefined> = ref(undefined)
    const isLoading: Ref<boolean> = ref(false)
    const error: Ref<string> = ref('')
    const isRequestSubtitleDialogShown: Ref<boolean> = ref(false)
    const showConfirmDialog: Ref<boolean> = ref(false)
    const isSubtitleFormShowed: Ref<boolean> = ref(false)
    const isSelectSubtitleShown: Ref<boolean> = ref(false)
    const requestIdToFulfill: Ref<string> = ref('')
    const relatedRequestId: Ref<string | undefined> = ref(undefined)
    let requestIdToDelete: string | null = null
    const columnExpanded = reactive<{
      [key: number]: boolean
    }>({})

    const columns = [
      {
        name: 'preferredLanguage',
        required: true,
        label: 'Preferred Language',
        field: (row: ISubtitleRequest) =>
          `${languages[getLanguageKey(row.preferredLanguage)].name} (${
            languages[getLanguageKey(row.preferredLanguage)].native
          })`,
        sortable: true,
      },
      {
        name: 'preferredFrameRate',
        required: true,
        label: 'Preferred Frame Rate',
        field: (row: ISubtitleRequest) => row.preferredFrameRate || 'Any',
        sortable: true,
      },
      {
        name: 'preferForHearingImpaired',
        required: true,
        label: 'Prefers Subtitle For Hearing Impaired',
        field: (row: ISubtitleRequest) =>
          row.preferForHearingImpaired ? 'Yes' : 'No',
        sortable: true,
      },
      {
        name: 'comment',
        required: true,
        label: 'Comment',
        field: (row: ISubtitleRequest) => truncate(row.comment || '-', 20),
        sortable: true,
      },
      {
        name: 'requestedBy',
        required: true,
        label: 'Requested By',
        field: (row: ISubtitleRequest) =>
          row.user.username +
          (auth.userInfo?.username === row.user.username ? ' (You)' : ''),
        sortable: true,
      },
      {
        name: 'fulfilledBy',
        required: true,
        label: 'Fulfilled By',
        field: (row: ISubtitleRequest) =>
          row.subtitle
            ? row.subtitle.user.username +
              (auth.userInfo?.username === row.subtitle.user.username
                ? ' (You)'
                : '')
            : '-',
        sortable: true,
      },
      { name: 'download', label: 'Download Subtitle', required: true },
      {
        name: 'requestedFromNow',
        required: true,
        label: 'Requested',
        field: (row: ISubtitleRequest) => row.createdAt,
        sortable: true,
        format: (val: string) => moment(val).fromNow(),
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
        field: (row: ISubtitleRequest) => row.updatedAt,
        sortable: true,
        format: (val: string) => moment(val).fromNow(),
        sort: (a: string, b: string) => {
          const timeA = moment(a)
          const timeB = moment(b)
          return timeA.isBefore(timeB)
        },
      },
      { name: 'actions', label: '', required: true },
    ]

    onMounted(async () => {
      await loadSubtitleRequests()
    })

    const loadSubtitleRequests = async () => {
      if (!episode.value.details) return
      error.value = ''
      isLoading.value = true
      try {
        const response = await api.get(
          ApiEndpoints.getSubtitleRequests(episode.value.details.id)
        )
        rows.value = response.data
      } catch (err: any) {
        error.value = err.response?.data.message || 'Failed to fetch'
      } finally {
        isLoading.value = false
      }
    }

    const deleteSubtitleRequestClick = (requestId: string) => {
      requestIdToDelete = requestId
      showConfirmDialog.value = true
    }

    const deleteSubtitleRequest = async () => {
      if (isLoading.value) return
      isLoading.value = true
      try {
        const response = await api.delete(
          ApiEndpoints.deleteSubtitleRequest(requestIdToDelete as string)
        )
        $q.notify({
          message: 'Subtitle request deleted',
          position: 'bottom',
          color: 'green',
          timeout: 3000,
        })
        await loadSubtitleRequests()
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

    const onRequestSaved = async (justAddedId: string) => {
      isRequestSubtitleDialogShown.value = false
      episode.value.justAddedSubtitleRequestId = justAddedId
      await loadSubtitleRequests()
    }

    const onSubtitleSaved = async () => {
      isSubtitleFormShowed.value = false
      await loadSubtitleRequests()
    }

    const onFulfilledWithExistingSubtitle = async (requestId: string) => {
      episode.value.justAddedSubtitleRequestId = requestId
      isSelectSubtitleShown.value = false
      await loadSubtitleRequests()
    }

    const uploadSubtitleClick = (subtitle: ISubtitle) => {
      relatedRequestId.value = subtitle._id
      isSubtitleFormShowed.value = true
    }

    const reopenClick = async (request: ISubtitleRequest) => {
      if (isLoading.value) return
      isLoading.value = true
      try {
        await api.patch(ApiEndpoints.reopenSubtitleRequest(request._id))
        request.subtitle = null
        request.subtitleId = null
        $q.notify({
          message: 'Subtitle request reopened',
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
        isLoading.value = false
      }
    }

    const selectSubtitleClick = (request: ISubtitleRequest) => {
      requestIdToFulfill.value = request._id
      isSelectSubtitleShown.value = true
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
      deleteSubtitleRequest,
      isRequestSubtitleDialogShown,
      onRequestSaved,
      showConfirmDialog,
      deleteSubtitleRequestClick,
      isSubtitleFormShowed,
      onSubtitleSaved,
      relatedRequestId,
      uploadSubtitleClick,
      ApiEndpoints,
      reopenClick,
      isSelectSubtitleShown,
      requestIdToFulfill,
      onFulfilledWithExistingSubtitle,
      selectSubtitleClick,
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
