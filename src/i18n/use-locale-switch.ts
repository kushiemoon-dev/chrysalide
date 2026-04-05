'use client'

import { useLocale } from 'next-intl'
import { LOCALE_COOKIE, LOCALE_STORAGE_KEY, type Locale } from './config'

export function useLocaleSwitch() {
  const current = useLocale() as Locale

  const setLocale = (locale: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    window.location.reload()
  }

  return { locale: current, setLocale }
}
