import { browser } from '$app/environment'
import fr from '../messages/fr.json'
import en from '../messages/en.json'
import de from '../messages/de.json'

export const locales = ['fr', 'en', 'de'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'fr'

const LOCALE_STORAGE_KEY = 'chrysalide-locale'

const messagesByLocale: Record<Locale, unknown> = { fr, en, de }

function resolveFromNavigator(): Locale | undefined {
  for (const lang of navigator.languages ?? [navigator.language]) {
    const short = lang.split('-')[0]?.toLowerCase()
    if (locales.includes(short as Locale)) return short as Locale
  }
  return undefined
}

function loadInitialLocale(): Locale {
  if (!browser) return defaultLocale
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (stored && locales.includes(stored as Locale)) return stored as Locale
  return resolveFromNavigator() ?? defaultLocale
}

function readPath(source: unknown, path: string): string | undefined {
  const value = path
    .split('.')
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined,
      source
    )
  return typeof value === 'string' ? value : undefined
}

class I18n {
  locale = $state<Locale>(loadInitialLocale())

  setLocale(locale: Locale) {
    this.locale = locale
    if (browser) localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  }

  t = (path: string): string => {
    return (
      readPath(messagesByLocale[this.locale], path) ??
      readPath(messagesByLocale[defaultLocale], path) ??
      path
    )
  }
}

export const i18n = new I18n()
