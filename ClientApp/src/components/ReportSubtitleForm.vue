<template>
  <q-card>
    <q-card-section class="row items-center">
      <h5 class="q-ma-none">Submit Report</h5>
    </q-card-section>
    <q-form @submit="onSubmit">
      <q-card-section>
        <p>You will be notified once the report has been dealt with</p>
        <q-input
          v-model="reason"
          :rules="[required, reasonCharacterLimit]"
          filled
          type="textarea"
          hint="Between 10 and 300 characters"
          label="Reason for submitting this report"
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
import { useQuasar } from 'quasar'
import { defineComponent, Ref, ref, toRefs } from 'vue'
import { api, ApiEndpoints } from '../boot/axios'
export default defineComponent({
  props: {
    subtitleId: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const $q = useQuasar()
    const { subtitleId } = toRefs(props)

    const isLoading: Ref<boolean> = ref(false)
    const reason: Ref<string | null> = ref(null)

    const onSubmit = async () => {
      isLoading.value = true
      try {
        await api.post(ApiEndpoints.reportSubtitle(subtitleId.value), {
          reason: reason.value,
        })
        $q.notify({
          message: 'Subtitle reported',
          position: 'bottom',
          color: 'green',
          timeout: 3000,
        })
        emit('on-submit')
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
      isLoading,
      reason,
      onSubmit,
      required: (val: any) => !!val || 'This field is required',
      reasonCharacterLimit: (val: string) =>
        (val.length >= 10 && val.length <= 300) ||
        'Must have between 10 and 300 characters',
    }
  },
})
</script>
