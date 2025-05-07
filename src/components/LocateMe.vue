<template>
  <div id="locate-me" class="locate-me-container">
    <q-toggle
      v-model="isTracking"
      checked-icon="location_on"
      unchecked-icon="my_location"
      color="blue"
      :loading="isLocating"
      @update:model-value="handleToggleChange"
    >
      <q-tooltip>
        {{ isTracking ? 'Stop tracking' : 'Start tracking' }}
      </q-tooltip>
    </q-toggle>
    <div v-if="locationError" class="error-message">
      {{ locationError }}
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { fromLonLat } from 'ol/proj'

const emit = defineEmits(['location-found', 'location-error'])

const isLocating = ref(false)
const userCoords = localStorage.getItem('userCoords')
const isTracking = ref(!!userCoords) // Set to true if userCoords exists, otherwise false
const locationError = ref('')
const watchId = ref(null)

const handleToggleChange = (newValue) => {
  if (newValue) {
    startTracking()
  } else {
    stopTracking()
  }
}

const startTracking = () => {
  locationError.value = ''
  isLocating.value = true

  if (!navigator.geolocation) {
    handleError('Geolocation is not supported by your browser')
    isTracking.value = false
    isLocating.value = false
    return
  }

  watchId.value = navigator.geolocation.watchPosition(
    (position) => {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }
      emit('location-found', fromLonLat([coords.lng, coords.lat]))
      isLocating.value = false
    },
    (error) => {
      handleError(error)
      stopTracking()
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    },
  )
}

const stopTracking = () => {
  if (watchId.value !== null) {
    navigator.geolocation.clearWatch(watchId.value)
    watchId.value = null
  }
  isTracking.value = false
  isLocating.value = false
  emit('location-found', null)
}

const handleError = (error) => {
  let message = 'Error getting location: '

  if (typeof error === 'string') {
    message += error
  } else {
    switch (error.code) {
      case 1:
        message += 'Permission denied'
        break
      case 2:
        message += 'Position unavailable'
        break
      case 3:
        message += 'Timeout'
        break
      default:
        message += 'Unknown error'
    }
  }

  locationError.value = message
  emit('location-error', message)
}

onUnmounted(() => {
  stopTracking()
})
</script>

<style>
.locate-me-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
}

.error-message {
  color: red;
  font-size: 12px;
  max-width: 200px;
}
</style>
