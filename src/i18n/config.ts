export const locales = ['fr', 'en', 'de'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'fr'

export const LOCALE_COOKIE = 'chrysalide-locale'
export const LOCALE_STORAGE_KEY = 'chrysalide-locale'
