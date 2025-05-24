<template>
  <div class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <h6 class="q-mt-none q-mb-none">{{ $t('app.addEvent') }}</h6>
      <q-btn flat round dense icon="close" @click="selectComponent" class="q-mr-sm" />
    </div>
    <q-select
      v-model="eventCategory"
      :options="categoryOptions"
      :label="$t('app.category') + ' *'"
      option-label="label"
      option-value="value"
      outlined
      dense
      class="q-mb-sm"
    />
    <q-input
      v-model="eventName"
      :label="$t('app.eventName') + ' *'"
      outlined
      dense
      class="q-mb-sm"
    />
    <q-input
      v-model="eventDescription"
      :label="$t('app.description') + ' *'"
      outlined
      dense
      type="textarea"
      class="q-mb-sm"
    />

    <div class="q-mb-sm">
      <div class="text-caption q-mb-sm">{{ $t('app.locationSelection') }}:</div>
      <q-btn
        :label="$t('app.useCurrentLocation')"
        color="primary"
        outline
        dense
        class="q-mr-sm"
        @click="useCurrentLocation"
      />
      <div v-if="eventCoords" class="q-mt-sm">
        {{ $t('app.selectedCoordinates') }}:<br />
        {{ eventCoords[1].toFixed(6) }}, {{ eventCoords[0].toFixed(6) }}
      </div>
      <div v-else class="text-caption q-mt-sm">{{ $t('app.clickToSelect') }}</div>
    </div>

    <div v-if="errorMessage" class="text-negative q-mb-sm">{{ errorMessage }}</div>

    <q-btn :label="$t('app.addEvent')" color="primary" class="full-width" @click="handleSubmit" />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import { ref, watch, computed } from 'vue'

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

const emit = defineEmits(['event-submitted', 'delete-tmp', 'select-component'])

const eventCategory = ref('')
const eventName = ref('')
const eventDescription = ref('')
const errorMessage = ref('')
const eventCoords = ref(null)

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

watch(
  () => props.selectedCoords,
  (newVal) => {
    if (newVal) {
      eventCoords.value = newVal
      errorMessage.value = ''
    }
  },
)

const selectComponent = () => {
  emit('select-component')
}

const useCurrentLocation = () => {
  if (!props.userCoords) {
    errorMessage.value = t('app.userLocationSelectionRequired')
    return
  }
  emit('delete-tmp')
  eventCoords.value = props.userCoords
  errorMessage.value = ''
}

const handleSubmit = () => {
  if (!eventCategory.value || !eventName.value || !eventDescription.value) {
    errorMessage.value = t('app.allFieldsRequired')
    return
  }

  if (!eventCoords.value) {
    errorMessage.value = t('app.locationRequired')
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
