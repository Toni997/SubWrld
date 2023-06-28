<template>
  <q-card>
    <q-card-section class="row items-center">
      <span class="text-body1">
        {{ message }}
      </span>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn flat label="Cancel" color="grey" v-close-popup />
      <q-btn
        @click="removeClicked"
        flat
        label="Yes"
        color="green"
        v-close-popup
      />
    </q-card-actions>
  </q-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'HelloMessage',
  props: {
    message: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const removeClicked = () => {
      emit('on-confirmed')
    }

    return { removeClicked }
  },
})
</script>