<template>
  <div class="q-pa-md">
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
      <q-tab :name="ReportStatus.Pending" label="Pending" />
      <q-tab :name="ReportStatus.Approved" label="Approved" />
      <q-tab :name="ReportStatus.Rejected" label="Rejected" />
    </q-tabs>
    <q-separator />
    <q-spinner color="primary" size="3em" :thickness="10" v-if="isLoading" />
    <q-banner v-if="error" dense class="text-white bg-red">
      <template v-slot:avatar>
        <q-icon name="error" color="white" />
      </template>
      {{ error }}
    </q-banner>
    <q-tab-panels v-model="tab" animated>
      <q-tab-panel :name="ReportStatus.Pending" v-if="pendingReports">
        <q-banner
          v-if="!pendingReports?.docs?.length && !isLoading"
          dense
          class="text-white bg-blue"
        >
          <template v-slot:avatar>
            <q-icon name="info" color="white" />
          </template>
          No pending reports yet
        </q-banner>
        <single-report
          class="q-mb-md"
          v-for="report in pendingReports.docs"
          :key="report._id"
          :report="report"
          @on-handled="(status) => onHandled(report, status)"
        />
        <div class="row justify-center" v-if="pendingReports.hasNextPage">
          <q-btn
            icon="expand_more"
            color="primary"
            round
            :loading="isLoading"
            @click="loadReports(ReportStatus.Pending)"
          >
            <q-tooltip>Load More</q-tooltip>
          </q-btn>
        </div>
      </q-tab-panel>
      <q-tab-panel :name="ReportStatus.Approved" v-if="approvedReports">
        <q-banner
          v-if="!approvedReports?.docs?.length && !isLoading"
          dense
          class="text-white bg-blue"
        >
          <template v-slot:avatar>
            <q-icon name="info" color="white" />
          </template>
          No approved reports yet
        </q-banner>

        <single-report
          class="q-mb-md"
          v-for="report in approvedReports.docs"
          :key="report._id"
          :report="report"
        />
        <div class="row justify-center" v-if="approvedReports.hasNextPage">
          <q-btn
            icon="expand_more"
            color="primary"
            round
            :loading="isLoading"
            @click="loadReports(ReportStatus.Pending)"
          >
            <q-tooltip>Load More</q-tooltip>
          </q-btn>
        </div>
      </q-tab-panel>
      <q-tab-panel :name="ReportStatus.Rejected" v-if="rejectedReports">
        <q-banner
          v-if="!rejectedReports?.docs?.length && !isLoading"
          dense
          class="text-white bg-blue"
        >
          <template v-slot:avatar>
            <q-icon name="info" color="white" />
          </template>
          No rejected reports yet
        </q-banner>
        <single-report
          class="q-mb-md"
          v-for="report in rejectedReports.docs"
          :key="report._id"
          :report="report"
        />
        <div class="row justify-center" v-if="rejectedReports.hasNextPage">
          <q-btn
            icon="expand_more"
            color="primary"
            round
            :loading="isLoading"
            @click="loadReports(ReportStatus.Pending)"
          >
            <q-tooltip>Load More</q-tooltip>
          </q-btn>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script lang="ts">
import { ISubtitleReport } from '../interfaces/subtitleReport'
import { defineComponent, onMounted, Ref, ref, watch } from 'vue'
import { api, ApiEndpoints } from '../boot/axios'
import { ReportStatus } from '../utils/reportStatus'
import { IPaginated } from '../interfaces/common'
import SingleReport from '../components/SingleReport.vue'
import { getReputationBadgeColor } from '../utils/getReputationBadgeColor'
import moment from 'moment'

export default defineComponent({
  components: { SingleReport },
  setup() {
    const isLoading: Ref<boolean> = ref(false)
    const error: Ref<string> = ref('')
    const tab: Ref<ReportStatus> = ref(ReportStatus.Pending)
    const pendingReports: Ref<IPaginated<ISubtitleReport> | null> = ref(null)
    const approvedReports: Ref<IPaginated<ISubtitleReport> | null> = ref(null)
    const rejectedReports: Ref<IPaginated<ISubtitleReport> | null> = ref(null)

    onMounted(async () => {
      await loadReports(ReportStatus.Pending)
    })

    watch(tab, async (newValue) => {
      await loadReports(newValue)
    })

    const loadReports = async (status: ReportStatus) => {
      isLoading.value = true
      error.value = ''
      let response
      let page
      try {
        switch (status) {
          case ReportStatus.Pending:
            if (pendingReports.value) pendingReports.value.docs = []
            page = pendingReports.value ? pendingReports.value.page + 1 : 1
            response = await api.get(
              ApiEndpoints.getSubtitleReportsWithStatus(
                ReportStatus[status],
                page
              )
            )
            pendingReports.value = response.data
            console.log(pendingReports.value)
            break
          case ReportStatus.Approved:
            if (approvedReports.value) approvedReports.value.docs = []
            page = pendingReports.value ? pendingReports.value.page + 1 : 1
            response = await api.get(
              ApiEndpoints.getSubtitleReportsWithStatus(
                ReportStatus[status],
                page
              )
            )
            approvedReports.value = response.data
            break
          case ReportStatus.Rejected:
            if (rejectedReports.value) rejectedReports.value.docs = []
            page = pendingReports.value ? pendingReports.value.page + 1 : 1
            response = await api.get(
              ApiEndpoints.getSubtitleReportsWithStatus(
                ReportStatus[status],
                page
              )
            )
            rejectedReports.value = response.data
            break

          default:
            throw new Error('status unknown')
        }
      } catch (err: any) {
        error.value = 'Failed to fetch.'
      } finally {
        isLoading.value = false
      }
    }

    const onHandled = (report: ISubtitleReport, newStatus: ReportStatus) => {
      report.status = newStatus
    }

    return {
      tab,
      ReportStatus,
      pendingReports,
      approvedReports,
      rejectedReports,
      getReputationBadgeColor,
      moment,
      ApiEndpoints,
      isLoading,
      error,
      loadReports,
      onHandled,
    }
  },
})
</script>
