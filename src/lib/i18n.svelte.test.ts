import { describe, it, expect, beforeEach } from 'vitest'
import { i18n, locales, defaultLocale } from './i18n.svelte'

describe('i18n', () => {
  beforeEach(() => {
    localStorage.clear()
    i18n.setLocale(defaultLocale)
  })

  it('default locale is fr', () => {
    expect(i18n.locale).toBe('fr')
  })

  it('t() resolves a nested key for the current locale', () => {
    i18n.setLocale('en')
    expect(i18n.t('nav.home')).toBe('Home')
    i18n.setLocale('fr')
    expect(i18n.t('nav.home')).toBe('Accueil')
  })

  it('t() returns the key itself when missing everywhere', () => {
    expect(i18n.t('does.not.exist')).toBe('does.not.exist')
  })

  it('setLocale persists the choice', () => {
    i18n.setLocale('de')
    expect(localStorage.getItem('chrysalide-locale')).toBe('de')
  })

  it('exposes exactly fr, en, de', () => {
    expect(locales).toEqual(['fr', 'en', 'de'])
  })
})
