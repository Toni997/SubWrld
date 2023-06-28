<template>
  <div class="q-pa-md">
    <q-dialog v-model="confirmRemoveDialog">
      <q-card>
        <q-card-section class="row items-center">
          <span class="text-body1">
            Are you sure you want to remove {{ selected.length }} TV Shows from
            your watchlist?
          </span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn
            @click="removeSelected"
            flat
            label="Yes"
            color="green"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-pull-to-refresh
      @refresh="refresh"
      color="primary"
      bg-color="white"
      icon="autorenew"
    >
      <h2>Watchlist</h2>
      <q-separator></q-separator>
      <q-banner v-if="error" dense class="text-white bg-red">
        <template v-slot:avatar>
          <q-icon name="error" color="white" />
        </template>
        {{ error }}
      </q-banner>

      <q-table
        @row-click="(event, row) => rowClick(row)"
        class="q-mt-md text-body1"
        flat
        bordered
        :loading="isLoading"
        ref="tableRef"
        title="Watchlist"
        :rows="getRows()"
        :columns="columns"
        row-key="tvShowId"
        selection="multiple"
        v-model:selected="selected"
        :visible-columns="['-tvShowId']"
        :pagination-options="{ rowsPerPage: 10 }"
      >
        <template v-slot:loading>
          <q-inner-loading showing color="primary" />
        </template>
        <template v-slot:top>
          <q-btn
            v-if="selected.length"
            class="q-ml-sm"
            color="red"
            icon="delete"
            label="Remove Selected"
            @click="confirmRemoveDialog = true"
          />
          <q-space />
          <q-input filled dense debounce="500" v-model="filterWatchlist">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>
      </q-table>
    </q-pull-to-refresh>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, Ref, watch } from 'vue'
import { IWatchlistWithTVShowDetails } from '../interfaces/tv-show'
import { api, ApiEndpoints } from '../boot/axios'
import { useRouter } from 'vue-router'

const columns = [
  {
    name: 'tvShowId',
    label: 'Id',
    align: 'left',
    field: (row: IWatchlistWithTVShowDetails) => row.tvShowId,
    sortable: true,
  },
  {
    name: 'title',
    required: true,
    label: 'Title',
    align: 'left',
    field: (row: IWatchlistWithTVShowDetails) => row.title,
    sortable: true,
  },
  {
    name: 'nextEpisode',
    required: true,
    align: 'left',
    label: 'Next Episode',
    field: (row: IWatchlistWithTVShowDetails) => {
      const nextEp = row.next_episode_to_air
      return nextEp
        ? `S${nextEp.season_number}E${nextEp.episode_number} (${nextEp.air_date})`
        : '-'
    },
    sortable: true,
  },
  {
    name: 'status',
    required: true,
    align: 'left',
    label: 'Status',
    field: (row: IWatchlistWithTVShowDetails) => row.status || '-',
    sortable: true,
  },
  {
    name: 'watchlistedOn',
    required: true,
    align: 'left',
    label: 'Watchlisted On',
    field: (row: IWatchlistWithTVShowDetails) => row.createdAt.split('T')[0],
    sortable: true,
  },
]

export default defineComponent({
  setup() {
    const router = useRouter()
    const rows: Ref<readonly IWatchlistWithTVShowDetails[] | undefined> =
      ref(undefined)
    const isLoading: Ref<boolean> = ref(false)
    const error: Ref<string> = ref('')
    const selected: Ref<IWatchlistWithTVShowDetails[]> = ref([])
    const filterWatchlist: Ref<string> = ref('')
    const confirmRemoveDialog: Ref<boolean> = ref(false)

    onMounted(async () => {
      await loadWatchlist()
    })

    const refresh = async (done: any) => {
      rows.value = []
      selected.value = []
      filterWatchlist.value = ''
      error.value = ''
      await loadWatchlist()
      done()
    }

    const loadWatchlist = async () => {
      isLoading.value = true
      try {
        const response = await api.get(ApiEndpoints.getWatchlistedTVShows)
        rows.value = response.data
      } catch (err: any) {
        error.value = 'Failed to fetch.'
      } finally {
        isLoading.value = false
      }
    }

    const getRows = () => {
      if (!rows.value) return undefined
      return rows.value.filter((r) =>
        r.title.toLowerCase().includes(filterWatchlist.value.toLowerCase())
      )
    }

    const rowClick = (row: IWatchlistWithTVShowDetails) => {
      router.push('/tv-shows/' + row.tvShowId)
    }

    const removeSelected = async () => {
      isLoading.value = true
      try {
        const response = await api.delete(ApiEndpoints.removeFromWatchlist, {
          data: {
            tvShowIds: selected.value.map((s) => s.tvShowId),
          },
        })

        if (response.status !== 200 && response.status !== 201) {
          console.log(response.statusText)
          return
        }

        await loadWatchlist()
        selected.value = []
      } catch (err) {
        error.value = 'Failed to fetch.'
      } finally {
        isLoading.value = false
      }
    }

    return {
      columns,
      rows,
      error,
      selected,
      removeSelected,
      isLoading,
      filterWatchlist,
      getRows,
      rowClick,
      refresh,
      confirmRemoveDialog,
    }
  },
})
</script>
