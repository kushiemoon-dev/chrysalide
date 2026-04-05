import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { LOCALE_COOKIE, defaultLocale, locales, type Locale } from './config'

function resolveFromAcceptLanguage(acceptLanguage: string | null): Locale | undefined {
  if (!acceptLanguage) return undefined

  for (const part of acceptLanguage.split(',')) {
    const lang = part.split(';')[0].trim().split('-')[0].toLowerCase()
    if (locales.includes(lang as Locale)) {
      return lang as Locale
    }
  }

  return undefined
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const headerStore = await headers()

  const locale =
    (cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined) ??
    resolveFromAcceptLanguage(headerStore.get('accept-language')) ??
    defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
