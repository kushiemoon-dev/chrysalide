import { diffLocaleKeys } from '../src/lib/locale-keys.mjs'

const { inSync, missingByLocale } = diffLocaleKeys()

if (!inSync) {
  console.error('Locale key drift detected between fr/en/de:')
  for (const [locale, keys] of Object.entries(missingByLocale)) {
    if (keys.length > 0) console.error(`  ${locale} missing: ${keys.join(', ')}`)
  }
  process.exit(1)
}

console.log('Locale keys in sync (fr/en/de).')
