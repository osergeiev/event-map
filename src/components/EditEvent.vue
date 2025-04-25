<template>
  <q-dialog v-model="showDialog">
    <q-card class="q-pa-md" style="width: 400px">
      <q-card-section>
        <h6 class="q-mt-none">Edit Event</h6>

        <q-select
          v-model="editedEvent.category"
          :options="categories"
          label="Category *"
          outlined
          dense
          class="q-mb-sm"
        />

        <q-input v-model="editedEvent.name" label="Event Name *" outlined dense class="q-mb-sm" />

        <q-input
          v-model="editedEvent.description"
          label="Description *"
          outlined
          dense
          type="textarea"
          class="q-mb-sm"
        />

        <q-select
          v-model="editedEvent.status"
          :options="statusOptions"
          label="Status *"
          outlined
          dense
          class="q-mb-sm"
        />

        <div class="q-mb-sm">
          <div class="text-caption q-mb-sm">Location selection:</div>
          <q-btn
            label="Select New Location"
            color="primary"
            outline
            dense
            class="q-mr-sm"
            @click="enableMapClick"
          />
          <div v-if="editedEvent.coords" class="q-mt-sm">
            Current coordinates:<br />
            {{ editedEvent.coords[1].toFixed(6) }}, {{ editedEvent.coords[0].toFixed(6) }}
          </div>
        </div>

        <div v-if="errorMessage" class="text-negative q-mb-sm">{{ errorMessage }}</div>

        <div class="row q-gutter-sm">
          <q-btn label="Cancel" color="negative" @click="closeDialog" />
          <q-btn label="Save Changes" color="positive" @click="handleSubmit" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  event: Object,
  categories: Array,
  selectedCoords: Array,
  mapClickEnabled: Boolean,
})
const emit = defineEmits(['update-event', 'update:mapClickEnabled'])

const showDialog = ref(true)
const errorMessage = ref('')
const editedEvent = ref({ ...props.event })
const statusOptions = ['approved', 'unapproved']

const enableMapClick = () => {
  emit('update:mapClickEnabled', true)
}

const closeDialog = () => {
  emit('update:mapClickEnabled', false)
  showDialog.value = false
}

const handleSubmit = () => {
  if (!editedEvent.value.name || !editedEvent.value.description || !editedEvent.value.category) {
    errorMessage.value = 'Required fields are missing'
    return
  }

  if (!editedEvent.value.coords) {
    errorMessage.value = 'Location is required'
    return
  }

  emit('update-event', editedEvent.value)
  closeDialog()
}

watch(
  () => props.selectedCoords,
  (newVal) => {
    if (newVal) {
      editedEvent.value.coords = newVal
    }
  },
)
</script>
