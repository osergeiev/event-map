<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import { ref, onMounted, watch, computed } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import AppSettings from 'src/settings.js'

const { user, isAuthenticated, getAccessTokenSilently } = useAuth0()
const exist = ref(false)

const emit = defineEmits(['select-component', 'delete-tmpemail'])

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
  categoryName: null,
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
const categoryMap = {
  'Traffic & Accidents': 'traffic',
  'Emergencies & Hazards': 'emergencies',
  'Crime & Security': 'crime',
  'Public Gatherings & Social Events': 'socialEvents',
  'Community & Miscellaneous': 'community',
}

const categoryOptions = computed(() =>
  props.categories.map((cat) => ({
    label: t('app.' + (categoryMap[cat] || cat)),
    value: cat,
  })),
)
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
    const token = await getAccessTokenSilently()
    isLoading.value = true
    const res = await fetch(`${AppSettings.EventApi}/api/User/${formData.value.email}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    if (res.ok) {
      exist.value = true
      const data = await res.json()
      formData.value = {
        ...data,
        categoryName: data.categoryName
          ? {
              value: data.categoryName,
              label: t('app.' + (categoryMap[data.categoryName] || data.categoryName)),
            }
          : null,
      }
    }
  } catch (error) {
    console.error('Error loading preferences:', error)
  } finally {
    isLoading.value = false
  }
}

const clearLocation = () => {
  formData.value.latitude = null
  formData.value.longitude = null
  emit('delete-tmpemail')
}

const useCurrentLocation = () => {
  if (!props.userCoords) {
    errorMessage.value = t('app.enableLocationFirst')
    return
  }
  formData.value.latitude = props.userCoords[1]
  formData.value.longitude = props.userCoords[0]
}

const handleSubmit = async () => {
  try {
    const token = await getAccessTokenSilently()
    var res
    if (!exist.value) {
      res = await fetch(`${AppSettings.EventApi}/api/User`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: user.value.email,
          categoryName: formData.value.categoryName.value,
          longitude: formData.value.longitude,
          latitude: formData.value.latitude,
          distance: formData.value.distance?.value,
          name: formData.value.name,
          description: formData.value.description,
        }),
      })
      exist.value = true
    } else {
      res = await fetch(`${AppSettings.EventApi}/api/User/${formData.value.email}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formData.value.email,
          categoryName: formData.value.categoryName.value,
          longitude: formData.value.longitude,
          latitude: formData.value.latitude,
          distance: formData.value.distance?.value,
          name: formData.value.name,
          description: formData.value.description,
        }),
      })
    }

    if (!res.ok) throw new Error('Failed to save preferences')

    errorMessage.value = ''
    alert('Preferences saved successfully!')
  } catch (error) {
    console.error('Error saving preferences:', error)
    errorMessage.value = 'Failed to save preferences'
  }
}

const selectComponent = () => {
  emit('select-component')
}

const handleUnsubscribe = async () => {
  try {
    if (!confirm('Are you sure you want to unsubscribe and delete all preferences?')) return

    const token = await getAccessTokenSilently()
    const res = await fetch(`${AppSettings.EventApi}/api/User/${formData.value.email}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) throw new Error('Failed to unsubscribe')

    exist.value = false
    formData.value = {
      categoryName: null,
      name: null,
      description: null,
      distance: null,
      email: isAuthenticated.value ? user.value.email : '',
      latitude: null,
      longitude: null,
    }
    alert('Successfully unsubscribed!')
  } catch (error) {
    console.error('Error unsubscribing:', error)
    errorMessage.value = 'Failed to unsubscribe'
  }
}
</script>

<template>
  <div class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <h6 class="q-mt-none q-mb-none">{{ $t('app.emailSubscriptions') }}</h6>
      <q-btn flat round dense icon="close" @click="selectComponent" class="q-mr-sm" />
    </div>
    <q-input
      v-model="formData.email"
      :label="$t('app.email') + ' *'"
      outlined
      dense
      class="q-mb-sm"
      :disable="isAuthenticated"
    />

    <q-select
      v-model="formData.categoryName"
      :options="categoryOptions"
      :label="$t('app.category')"
      option-label="label"
      option-value="value"
      outlined
      dense
      class="q-mb-sm"
      clearable
    >
    </q-select>

    <q-input
      v-model="formData.name"
      :label="$t('app.nameContains')"
      outlined
      dense
      clearable
      class="q-mb-sm"
    />

    <q-input
      v-model="formData.description"
      :label="$t('app.descriptionContains')"
      outlined
      dense
      clearable
      class="q-mb-sm"
    />

    <div class="q-mb-sm">
      <div class="text-caption q-mb-sm">{{ $t('app.locationSelection') }}:</div>
      <div class="row items-center q-gutter-sm">
        <q-btn
          :label="$t('app.useCurrentLocation')"
          color="primary"
          outline
          dense
          @click="useCurrentLocation"
          :disable="!userCoords"
        />
        <q-btn
          :label="$t('app.clearLocation')"
          color="negative"
          outline
          dense
          @click="clearLocation"
          :disable="!formData.latitude || !formData.longitude"
        />
      </div>
      <div v-if="formData.latitude && formData.longitude" class="q-mt-sm">
        {{ $t('app.selectedCoordinates') }}:<br />
        {{ formData.latitude.toFixed(6) }}, {{ formData.longitude.toFixed(6) }}
      </div>
      <div v-else class="text-caption q-mt-sm">{{ $t('app.clickToSelect') }}</div>
    </div>

    <q-select
      v-model="formData.distance"
      :options="distanceOptions"
      :label="$t('app.distance')"
      option-label="label"
      option-value="value"
      outlined
      dense
      class="q-mb-sm"
      :disable="!formData.latitude || !formData.longitude"
      :hint="$t('app.locationSelectionRequired')"
      clearable
    >
    </q-select>

    <div v-if="errorMessage" class="text-negative q-mb-sm">{{ errorMessage }}</div>

    <q-btn
      :label="$t('app.savePreferences')"
      color="primary"
      class="full-width"
      @click="handleSubmit"
    />
    <div class="q-mt-md">
      <q-btn
        v-if="exist"
        :label="$t('app.unsubscribe')"
        color="negative"
        class="full-width"
        @click="handleUnsubscribe"
      />
    </div>
  </div>
</template>
