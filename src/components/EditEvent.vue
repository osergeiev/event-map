<template>
  <q-dialog seamless v-model="showDialog">
    <q-card style="width: 400px" class="edit-event-container q-pa-md">
      <q-card-section>
        <h6 class="q-mt-none">{{ $t('app.editEvent') }}</h6>

        <q-select
          v-model="editedEvent.category"
          :options="categoryOptions"
          :label="$t('app.category') + ' *'"
          option-label="label"
          option-value="value"
          outlined
          dense
          class="q-mb-sm"
        />

        <q-input
          v-model="editedEvent.name"
          :label="$t('app.eventName') + ' *'"
          outlined
          dense
          class="q-mb-sm"
        />

        <q-input
          v-model="editedEvent.description"
          :label="$t('app.description') + ' *'"
          outlined
          dense
          type="textarea"
          class="q-mb-sm"
        />

        <q-select
          v-model="editedEvent.status"
          :options="statusOptions"
          :label="t('app.status') + ' *'"
          outlined
          dense
          class="q-mb-sm"
        />

        <div class="q-mb-sm">
          <div v-if="editedEvent.coords" class="q-mt-sm">
            {{ $t('app.currentCoordinates') }}:<br />
            {{ editedEvent.coords[1].toFixed(6) }}, {{ editedEvent.coords[0].toFixed(6) }}
          </div>
        </div>

        <div v-if="errorMessage" class="text-negative q-mb-sm">{{ errorMessage }}</div>

        <div class="row q-gutter-sm">
          <q-btn :label="$t('app.cancel')" color="negative" @click="closeDialog" />
          <q-btn :label="$t('app.saveChanges')" color="positive" @click="handleSubmit" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { ref, watch, computed } from 'vue'

const { t } = useI18n()

const props = defineProps({
  event: Object,
  categories: Array,
  selectedCoords: Array,
})
const emit = defineEmits(['update-event', 'close', 'delete-marker'])

const showDialog = ref(true)
const errorMessage = ref('')

const categoryMap = {
  'Traffic & Accidents': 'traffic',
  'Emergencies & Hazards': 'emergencies',
  'Crime & Security': 'crime',
  'Public Gatherings & Social Events': 'socialEvents',
  'Community & Miscellaneous': 'community',
}

const editedEvent = ref({
  ...props.event,
  category: props.categories.find((cat) => cat === props.event.category)
    ? {
        value: props.event.category,
        label: t('app.' + categoryMap[props.event.category]),
      }
    : { value: '', label: '' },
})

const categoryOptions = computed(() =>
  props.categories.map((cat) => ({
    label: t('app.' + (categoryMap[cat] || cat)),
    value: cat,
  })),
)

const statusOptions = ['approved', 'unapproved']

const closeDialog = () => {
  showDialog.value = false
  emit('close')
  emit('delete-marker')
}

const handleSubmit = () => {
  if (!editedEvent.value.name || !editedEvent.value.description || !editedEvent.value.category) {
    errorMessage.value = t('app.allFieldsRequired')
    return
  }

  if (!editedEvent.value.coords) {
    errorMessage.value = t('app.locationRequired')
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

<style scoped>
.edit-event-container {
  position: fixed;
  top: 70px;
  right: 20px;
  z-index: 6000;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}
</style>
