import { createI18n } from 'vue-i18n'
import en from './en-US'
import hr from './hr-HR'
import uk from './uk-UA'

const messages = {
  'en-US': en,
  'hr-HR': hr,
  'uk-UA': uk,
}

export const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'en-US',
  fallbackLocale: 'en-US',
  messages,
})

export default i18n
