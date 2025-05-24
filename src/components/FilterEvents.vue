<template>
  <div class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <h6 class="q-mt-none q-mb-none">{{ $t('app.filterEvents') }}</h6>
      <q-btn flat round dense icon="close" @click="selectComponent" class="q-mr-sm" />
    </div>
    <q-select
      v-model="selectedCategory"
      :options="[t('app.all'), ...categoryOptions]"
      :label="$t('app.category')"
      option-label="label"
      option-value="value"
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

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
import { ref, watch, defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  categories: {
    type: Array,
    required: true,
  },
  locationAvailable: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['filter-change', 'select-component'])

const selectedCategory = ref(t('app.all'))
const nameFilter = ref('')
const descriptionFilter = ref('')
const selectedDistance = ref(t('app.all'))

const distanceOptions = ref([
  { label: t('app.all'), value: 999999999 },
  { label: '1 km', value: 1 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '20 km', value: 20 },
  { label: '50 km', value: 50 },
  { label: '100 km', value: 100 },
])

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

const selectComponent = () => {
  emit('select-component')
}

watch(
  [selectedCategory, nameFilter, descriptionFilter, selectedDistance],
  ([category, name, description, distance]) => {
    const emitName = name === null ? '' : name
    const emitDescription = description === null ? '' : description
    emit('filter-change', {
      category: category.value || t('app.all'),
      name: emitName,
      description: emitDescription,
      distance,
    })
  },
  { immediate: true },
)
</script>
