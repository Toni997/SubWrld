<template>
  <div class="q-pa-md">
    <h2>Watchlist</h2>
    <q-separator></q-separator>
    <q-banner v-if="error" dense class="text-white bg-red">
      <template v-slot:avatar>
        <q-icon name="error" color="white" />
      </template>
      {{ false }}
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
          color="primary"
          label="Remove Selected"
          @click="removeSelected"
        />
        <q-space />
        <q-input filled dense debounce="500" v-model="filterWatchlist">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>
    </q-table>
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

    onMounted(async () => {
      await loadWatchlist()
    })

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

    const removeSelected = () => {
      // TODO implement
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
    }
  },
})
</script>
