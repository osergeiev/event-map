<script setup>
import { useI18n } from 'vue-i18n'
// eslint-disable-next-line no-unused-vars
const { t } = useI18n()
import { ref, watch, defineProps, defineEmits } from 'vue'

defineProps({
  categories: {
    type: Array,
    required: true,
  },
  locationAvailable: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['filter-change'])

const selectedCategory = ref('All')
const nameFilter = ref('')
const descriptionFilter = ref('')
const selectedDistance = ref('All')

const distanceOptions = ref([
  { label: 'All', value: 999999999 },
  { label: '1 km', value: 1 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '20 km', value: 20 },
  { label: '50 km', value: 50 },
  { label: '100 km', value: 100 },
])

watch(
  [selectedCategory, nameFilter, descriptionFilter, selectedDistance],
  ([category, name, description, distance]) => {
    const emitName = name === null ? '' : name
    const emitDescription = description === null ? '' : description
    emit('filter-change', {
      category,
      name: emitName,
      description: emitDescription,
      distance,
    })
  },
  { immediate: true },
)
</script>

<template>
  <div class="q-pa-md">
    <h5 class="q-mt-none">{{ $t('app.filterEvents') }}</h5>
    <q-select
      v-model="selectedCategory"
      :options="['All', ...categories]"
      :label="$t('app.category')"
      outlined
      dense
      class="q-mb-sm"
    />
    <q-input
      v-model="nameFilter"
      :label="$t('app.nameContains')"
      outlined
      dense
      clearable
      class="q-mb-sm"
    />
    <q-input
      v-model="descriptionFilter"
      :label="$t('app.descriptionContains')"
      outlined
      dense
      clearable
      class="q-mb-sm"
    />
    <q-select
      v-model="selectedDistance"
      :options="distanceOptions"
      :label="$t('app.maxDistance')"
      option-label="label"
      option-value="value"
      outlined
      dense
      class="q-mb-sm"
      :disable="!locationAvailable"
      :hint="!locationAvailable ? $t('app.enableLocating') : ''"
    />
  </div>
</template>
