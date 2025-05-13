<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import AppSettings from 'src/settings.js'

const { user, isAuthenticated, getAccessTokenSilently } = useAuth0()

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

const formData = ref({
  category: null,
  name: null,
  description: null,
  distance: null,
  email: '',
  latitude: null,
  longitude: null,
})

const distanceOptions = ref([
  { label: '1 km', value: 1 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '20 km', value: 20 },
  { label: '50 km', value: 50 },
  { label: '100 km', value: 100 },
])

const errorMessage = ref('')
const isLoading = ref(false)

onMounted(async () => {
  if (isAuthenticated.value) {
    formData.value.email = user.value.email
    await loadSavedPreferences()
  }
})

watch(
  () => props.selectedCoords,
  (newVal) => {
    if (newVal) {
      formData.value.latitude = newVal[1]
      formData.value.longitude = newVal[0]
    }
  },
)

async function loadSavedPreferences() {
  try {
    isLoading.value = true
    const res = await fetch(`${AppSettings.EventApi}/api/User/${formData.value.email}`)
    if (res.ok) {
      const data = await res.json()
      formData.value = { ...data }
    }
  } catch (error) {
    console.error('Error loading preferences:', error)
  } finally {
    isLoading.value = false
  }
}

const useCurrentLocation = () => {
  if (!props.userCoords) {
    errorMessage.value = 'Please enable location tracking first'
    return
  }
  formData.value.latitude = props.userCoords[1]
  formData.value.longitude = props.userCoords[0]
}

const handleSubmit = async () => {
  try {
    if (!formData.value.email) {
      errorMessage.value = 'Email is required'
      return
    }

    const token = await getAccessTokenSilently()
    const res = await fetch(`${AppSettings.EventApi}/api/User/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: formData.value.email,
        category: formData.value.category,
        nameFilter: formData.value.name,
        descriptionFilter: formData.value.description,
        maxDistance: formData.value.distance,
        latitude: formData.value.latitude,
        longitude: formData.value.longitude,
      }),
    })

    if (!res.ok) throw new Error('Failed to save preferences')

    errorMessage.value = ''
    alert('Preferences saved successfully!')
  } catch (error) {
    console.error('Error saving preferences:', error)
    errorMessage.value = 'Failed to save preferences'
  }
}
</script>

<template>
  <div class="q-pa-md">
    <h5 class="q-mt-none">Email Notifications Setup</h5>

    <q-input
      v-model="formData.email"
      label="Email *"
      outlined
      dense
      class="q-mb-sm"
      :disable="isAuthenticated"
    />

    <q-select
      v-model="formData.category"
      :options="categories"
      label="Category"
      outlined
      dense
      class="q-mb-sm"
    />

    <q-input
      v-model="formData.name"
      label="Name contains"
      outlined
      dense
      clearable
      class="q-mb-sm"
    />

    <q-input
      v-model="formData.description"
      label="Description contains"
      outlined
      dense
      clearable
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
        :disable="!userCoords"
      />
      <div v-if="formData.latitude && formData.longitude" class="q-mt-sm">
        Selected coordinates:<br />
        {{ formData.latitude.toFixed(6) }}, {{ formData.longitude.toFixed(6) }}
      </div>
      <div v-else class="text-caption q-mt-sm">Click anywhere on the map to select location</div>
    </div>

    <q-select
      v-model="formData.distance"
      :options="distanceOptions"
      label="Max distance"
      option-label="label"
      option-value="value"
      outlined
      dense
      class="q-mb-sm"
      :disable="!formData.latitude || !formData.longitude"
      hint="Requires location selection"
    />

    <div v-if="errorMessage" class="text-negative q-mb-sm">{{ errorMessage }}</div>

    <q-btn
      label="Save Preferences"
      color="primary"
      class="full-width"
      @click="handleSubmit"
      :loading="isLoading"
    />
  </div>
</template>
