import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const LOCALES = ['fr', 'en', 'de']

const messagesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'messages')

export function flattenKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? flattenKeys(value, path)
      : [path]
  })
}

export function diffLocaleKeys(locales = LOCALES) {
  const keysByLocale = Object.fromEntries(
    locales.map((locale) => {
      const raw = fs.readFileSync(path.join(messagesDir, `${locale}.json`), 'utf-8')
      return [locale, new Set(flattenKeys(JSON.parse(raw)))]
    })
  )

  const unionKeys = new Set(Object.values(keysByLocale).flatMap((keys) => [...keys]))

  const missingByLocale = Object.fromEntries(
    locales.map((locale) => [
      locale,
      [...unionKeys].filter((key) => !keysByLocale[locale].has(key)).sort(),
    ])
  )

  const inSync = Object.values(missingByLocale).every((keys) => keys.length === 0)

  return { inSync, missingByLocale }
}
