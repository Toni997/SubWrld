<template>
  <div class="text-body1">
    <q-dialog v-model="isConfirmDialogShown">
      <confirm-dialog
        message="Are you sure you want to handle this report?"
        @on-confirmed="handleReport"
      />
    </q-dialog>

    <h5 class="q-my-xs">Report info</h5>
    <div>
      Reported By:
      <span>
        <q-btn
          flat
          dense
          no-caps
          v-if="!report.userId.isAdmin"
          :to="`/users/${report.userId._id}`"
        >
          {{ report.userId.username }}
        </q-btn>
        <q-chip
          text-color="white"
          :icon="report.userId.isAdmin ? 'verified' : 'grade'"
          size="0.7rem"
          :color="
            getReputationBadgeColor(
              report.userId.reputation,
              report.userId.isAdmin
            )
          "
          >{{ report.userId.isAdmin ? 'Official' : report.userId.reputation }}
          <q-tooltip>{{
            report.userId.isAdmin ? 'Uploaded by Staff' : 'Reputation'
          }}</q-tooltip>
        </q-chip>
      </span>
    </div>
    <div>Reason: {{ report.reason }}</div>
    <div>Created: {{ moment(report.createdAt).fromNow() }}</div>
    <div>Updated: {{ moment(report.updatedAt).fromNow() }}</div>
    <div v-if="report.subtitleId">
      <h5 class="q-my-xs">Subtitle info</h5>
      <div>TV Show: {{ report.subtitleId.tvShowTitle }}</div>
      <div>
        Episode: S{{ report.subtitleId.season }}E{{ report.subtitleId.episode }}
      </div>
      <div>
        Uploader:
        <span>
          <q-btn flat dense :to="`/users/${report.subtitleId.userId._id}`">
            {{ report.subtitleId.userId.username }}
          </q-btn>
          <q-chip
            text-color="white"
            :icon="report.subtitleId.userId.isAdmin ? 'verified' : 'grade'"
            size="0.7rem"
            :color="
              getReputationBadgeColor(
                report.subtitleId.userId.reputation,
                report.subtitleId.userId.isAdmin
              )
            "
            >{{
              report.subtitleId.userId.isAdmin
                ? 'Official'
                : report.subtitleId.userId.reputation
            }}
            <q-tooltip>{{
              report.subtitleId.userId.isAdmin
                ? 'Uploaded by Staff'
                : 'Reputation'
            }}</q-tooltip>
          </q-chip>
        </span>
      </div>
      <div>Release: {{ report.subtitleId.release }}</div>
      <div>Frame Rate: {{ report.subtitleId.frameRate }}</div>
      <div>
        For Hearing Impaired:
        <q-icon
          :name="report.subtitleId.forHearingImpaired ? 'check' : 'close'"
          :color="report.subtitleId.forHearingImpaired ? 'green' : 'red'"
          size="1.2rem"
        ></q-icon>
      </div>
      <div>
        Only Foreign Language:
        <q-icon
          :name="report.subtitleId.onlyForeignLanguage ? 'check' : 'close'"
          :color="report.subtitleId.onlyForeignLanguage ? 'green' : 'red'"
          size="1.2rem"
        ></q-icon>
      </div>
      <div>
        Work in Progress:
        <q-icon
          :name="report.subtitleId.isWorkInProgress ? 'check' : 'close'"
          :color="report.subtitleId.isWorkInProgress ? 'green' : 'red'"
          size="1.2rem"
        ></q-icon>
      </div>
      <div>
        Uploader is Author:
        <q-icon
          :name="report.subtitleId.uploaderIsAuthor ? 'check' : 'close'"
          :color="report.subtitleId.uploaderIsAuthor ? 'green' : 'red'"
          size="1.2rem"
        ></q-icon>
      </div>
      <div>
        Confirmed:
        <q-icon
          :name="report.subtitleId.isConfirmed ? 'check' : 'close'"
          :color="report.subtitleId.isConfirmed ? 'green' : 'red'"
          size="1.2rem"
        ></q-icon>
      </div>
      <div>Created: {{ moment(report.subtitleId.createdAt).fromNow() }}</div>
      <div>Updated: {{ moment(report.subtitleId.updatedAt).fromNow() }}</div>
      <div v-if="report.subtitleId.filePath">
        <div>Downloads: {{ report.subtitleId.downloads }}</div>
        <div>
          Download:
          <q-btn
            v-if="report.subtitleId.filePath"
            :href="ApiEndpoints.downloadSubtitle(report.subtitleId._id)"
            icon="download"
            color="primary"
            flat
            round
          >
            <q-tooltip>Click to Download</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>
    <div class="q-mt-md" v-if="report.status === ReportStatus.Pending">
      <q-btn
        class="q-mr-xs"
        label="Approve"
        color="green"
        @click="handleReportClick(ReportStatus.Approved)"
        :loading="isLoading"
      />
      <q-btn
        label="Reject"
        color="red"
        @click="handleReportClick(ReportStatus.Rejected)"
        :loading="isLoading"
      />
    </div>
    <div class="q-mt-md" v-if="report.status !== ReportStatus.Pending">
      {{ report.status === ReportStatus.Approved ? 'Approved' : 'Rejected' }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, Ref, ref, toRefs } from 'vue'
import { api, ApiEndpoints } from '../boot/axios'
import { useQuasar } from 'quasar'
import { ISubtitleReport } from '../interfaces/subtitleReport'
import moment from 'moment'
import { getReputationBadgeColor } from '../utils/getReputationBadgeColor'
import { ReportStatus } from '../utils/reportStatus'
import ConfirmDialog from '../components/ConfirmDialog.vue'

export default defineComponent({
  components: { ConfirmDialog },
  props: {
    report: {
      type: Object as PropType<ISubtitleReport>,
      required: true,
    },
  },
  setup(props, { emit }) {
    const $q = useQuasar()
    const { report } = toRefs(props)

    const isLoading: Ref<boolean> = ref(false)
    const isConfirmDialogShown: Ref<boolean> = ref(false)
    const handlingStatus: Ref<ReportStatus | null> = ref(null)

    const handleReportClick = (status: ReportStatus) => {
      handlingStatus.value = status
      isConfirmDialogShown.value = true
    }

    const handleReport = async () => {
      isLoading.value = true
      try {
        if (handlingStatus.value === ReportStatus.Approved) {
          await api.patch(ApiEndpoints.approveReport(report.value._id))
        } else {
          await api.patch(ApiEndpoints.rejectReport(report.value._id))
        }
        $q.notify({
          message: 'Report handled',
          position: 'bottom',
          color: 'green',
          timeout: 3000,
        })
        emit('on-handled', handlingStatus)
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

    return {
      ApiEndpoints,
      moment,
      getReputationBadgeColor,
      handleReportClick,
      handleReport,
      isConfirmDialogShown,
      handlingStatus,
      ReportStatus,
      isLoading,
    }
  },
})
</script>
