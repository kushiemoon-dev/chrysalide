import { diffLocaleKeys } from '../src/lib/locale-keys.mjs'

const localeKeysMatchRule = {
  meta: { type: 'problem', docs: { description: 'fr/en/de locale files must share the same key set' }, schema: [] },
  create(context) {
    return {
      Program(node) {
        const { inSync, missingByLocale } = diffLocaleKeys()
        if (inSync) return
        const detail = Object.entries(missingByLocale)
          .filter(([, keys]) => keys.length > 0)
          .map(([locale, keys]) => `${locale} missing: ${keys.join(', ')}`)
          .join(' | ')
        context.report({ node, message: `Locale key drift between fr/en/de: ${detail}` })
      },
    }
  },
}

export default localeKeysMatchRule
