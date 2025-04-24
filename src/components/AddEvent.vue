<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  categories: {
    type: Array,
    required: true,
  },
  userCoords: {
    type: Array,
    default: null,
  },
  selectedCoords: {
    type: Array,
    default: null,
  },
})

const emit = defineEmits(['event-submitted'])

const eventCategory = ref('')
const eventName = ref('')
const eventDescription = ref('')
const errorMessage = ref('')
const eventCoords = ref(null)

watch(
  () => props.selectedCoords,
  (newVal) => {
    if (newVal) {
      eventCoords.value = newVal
      errorMessage.value = ''
    }
  },
)

const useCurrentLocation = () => {
  if (!props.userCoords) {
    errorMessage.value = 'Please enable location tracking first'
    return
  }
  eventCoords.value = props.userCoords
  errorMessage.value = ''
}

const handleSubmit = () => {
  if (!eventCategory.value || !eventName.value || !eventDescription.value) {
    errorMessage.value = 'All fields are required'
    return
  }

  if (!eventCoords.value) {
    errorMessage.value =
      'Please select a location by clicking the map or using your current location'
    return
  }

  emit('event-submitted', {
    category: eventCategory.value,
    name: eventName.value,
    description: eventDescription.value,
    coords: eventCoords.value,
    status: 'pending',
  })

  eventCategory.value = ''
  eventName.value = ''
  eventDescription.value = ''
  eventCoords.value = null
  errorMessage.value = ''
}
</script>

<template>
  <div class="q-pa-md">
    <h5 class="q-mt-none">Add New Event</h5>
    <q-select
      v-model="eventCategory"
      :options="categories"
      label="Category *"
      outlined
      dense
      class="q-mb-sm"
    />
    <q-input v-model="eventName" label="Event Name *" outlined dense class="q-mb-sm" />
    <q-input
      v-model="eventDescription"
      label="Description *"
      outlined
      dense
      type="textarea"
      class="q-mb-sm"
    />

    <div class="q-mb-sm">
      <div class="text-caption q-mb-sm">Location selection:</div>
      <q-btn
        label="Use Current Location"
        color="primary"
        outline
        dense
        class="q-mr-sm"
        @click="useCurrentLocation"
      />
      <div v-if="eventCoords" class="q-mt-sm">
        Selected coordinates:<br />
        {{ eventCoords[1].toFixed(6) }}, {{ eventCoords[0].toFixed(6) }}
      </div>
      <div v-else class="text-caption q-mt-sm">Click anywhere on the map to select location</div>
    </div>

    <div v-if="errorMessage" class="text-negative q-mb-sm">{{ errorMessage }}</div>

    <q-btn label="Add Event" color="primary" class="full-width" @click="handleSubmit" />
  </div>
</template>
