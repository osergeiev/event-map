import { createI18n } from 'vue-i18n'
import en from './en-US'
import hr from './hr-HR'
import uk from './uk-UA'

const messages = {
  'en-US': en,
  'hr-HR': hr,
  'uk-UA': uk,
}

const i18n = createI18n({
  locale: 'en-US',
  fallbackLocale: 'en-US',
  messages,
  legacy: false,
})

export default i18n
