import { i18n } from '../i18n'
import { watch } from 'vue'

export default ({ app }) => {
  app.use(i18n)

  // Watch for locale changes
  i18n.global.locale.value = localStorage.getItem('locale') || 'en-US'
  watch(
    () => i18n.global.locale.value,
    (newVal) => {
      localStorage.setItem('locale', newVal)
    },
  )
}
