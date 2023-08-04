<template>
  <q-card>
    <q-card-section class="row items-center">
      <h5 class="q-ma-none">
        {{ announcement ? 'Edit' : 'Add' }} Announcement
      </h5>
    </q-card-section>
    <q-form @submit="onSubmit">
      <q-card-section>
        <q-input
          v-model="text"
          :rules="[required, reasonCharacterLimit]"
          filled
          type="textarea"
          hint="Between 10 and 500 characters"
          label="Announcement"
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
import { defineComponent, PropType, Ref, ref, toRefs } from 'vue'
import { api, ApiEndpoints } from '../boot/axios'
import { IAnnouncement } from '../interfaces/announcement'
export default defineComponent({
  props: {
    tvShowId: {
      type: Number,
      required: true,
    },
    announcement: {
      type: Object as PropType<IAnnouncement | null>,
    },
  },
  setup(props, { emit }) {
    const $q = useQuasar()
    const { announcement, tvShowId } = toRefs(props)

    const isLoading: Ref<boolean> = ref(false)
    const text: Ref<string | null> = ref(announcement.value?.text || null)

    const onSubmit = async () => {
      isLoading.value = true
      try {
        let response
        if (announcement.value) {
          response = await api.put(
            ApiEndpoints.updateAnnouncement(announcement.value._id),
            {
              text: text.value,
            }
          )
        } else {
          response = await api.post(ApiEndpoints.addAnnouncement, {
            tvShowId: tvShowId.value,
            text: text.value,
          })
        }
        $q.notify({
          message: 'Announcement saved',
          position: 'bottom',
          color: 'green',
          timeout: 3000,
        })
        const savedAnnouncement: IAnnouncement = response.data
        emit('on-submit', savedAnnouncement)
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
      text,
      onSubmit,
      required: (val: any) => !!val || 'This field is required',
      reasonCharacterLimit: (val: string) =>
        (val.length >= 10 && val.length <= 500) ||
        'Must have between 10 and 500 characters',
    }
  },
})
</script>
