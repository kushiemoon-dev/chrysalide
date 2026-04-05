import { fr } from 'date-fns/locale'
import { enUS } from 'date-fns/locale'
import type { Locale as DateFnsLocale } from 'date-fns'
import type { Locale } from './config'

const dateLocales: Record<Locale, DateFnsLocale> = { fr, en: enUS }

export function getDateLocale(locale: Locale): DateFnsLocale {
  return dateLocales[locale] ?? fr
}
