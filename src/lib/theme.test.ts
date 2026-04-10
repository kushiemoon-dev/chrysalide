import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  DEFAULT_THEME,
  COLOR_SCHEMES,
  THEME_MODES,
  loadTheme,
  saveTheme,
  getSystemPrefersDark,
  getSystemPrefersReducedMotion,
} from './theme'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('DEFAULT_THEME', () => {
  it('mode sombre par défaut', () => {
    expect(DEFAULT_THEME.mode).toBe('dark')
  })

  it('schéma trans par défaut', () => {
    expect(DEFAULT_THEME.colorScheme).toBe('trans')
  })

  it('pas de mouvement réduit par défaut', () => {
    expect(DEFAULT_THEME.reducedMotion).toBe(false)
  })
})

describe('COLOR_SCHEMES', () => {
  it('contient les 4 schémas', () => {
    expect(Object.keys(COLOR_SCHEMES)).toEqual(['trans', 'blue', 'pink', 'violet'])
  })

  it('chaque schéma a 3 couleurs preview', () => {
    Object.values(COLOR_SCHEMES).forEach((scheme) => {
      expect(scheme.preview).toHaveLength(3)
    })
  })

  it('les couleurs preview sont au format hex', () => {
    Object.values(COLOR_SCHEMES).forEach((scheme) => {
      scheme.preview.forEach((color) => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      })
    })
  })
})

describe('THEME_MODES', () => {
  it('contient les 3 modes', () => {
    expect(Object.keys(THEME_MODES)).toEqual(['dark', 'light', 'system'])
  })

  it('chaque mode a une icône', () => {
    Object.values(THEME_MODES).forEach((mode) => {
      expect(mode.icon).toBeTruthy()
    })
  })
})

describe('loadTheme', () => {
  it('retourne DEFAULT_THEME si localStorage est vide', () => {
    expect(loadTheme()).toEqual(DEFAULT_THEME)
  })

  it('charge un thème sauvegardé', () => {
    const custom = { mode: 'light', colorScheme: 'pink', reducedMotion: true }
    localStorage.setItem('chrysalide-theme', JSON.stringify(custom))
    const loaded = loadTheme()
    expect(loaded.mode).toBe('light')
    expect(loaded.colorScheme).toBe('pink')
    expect(loaded.reducedMotion).toBe(true)
  })

  it('utilise les valeurs par défaut pour les clés manquantes', () => {
    localStorage.setItem('chrysalide-theme', JSON.stringify({ mode: 'light' }))
    const loaded = loadTheme()
    expect(loaded.mode).toBe('light')
    expect(loaded.colorScheme).toBe(DEFAULT_THEME.colorScheme)
    expect(loaded.reducedMotion).toBe(DEFAULT_THEME.reducedMotion)
  })

  it('retourne DEFAULT_THEME si le JSON est invalide', () => {
    localStorage.setItem('chrysalide-theme', 'not-json')
    expect(loadTheme()).toEqual(DEFAULT_THEME)
  })
})

describe('saveTheme', () => {
  it('persiste le thème dans localStorage', () => {
    const theme = { mode: 'light' as const, colorScheme: 'violet' as const, reducedMotion: true }
    saveTheme(theme)
    const raw = localStorage.getItem('chrysalide-theme')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.mode).toBe('light')
    expect(parsed.colorScheme).toBe('violet')
    expect(parsed.reducedMotion).toBe(true)
  })

  it('saveTheme puis loadTheme retourne le même thème', () => {
    const theme = { mode: 'system' as const, colorScheme: 'blue' as const, reducedMotion: false }
    saveTheme(theme)
    expect(loadTheme()).toEqual(theme)
  })
})

describe('getSystemPrefersDark / getSystemPrefersReducedMotion', () => {
  // jsdom ne fournit pas matchMedia — on doit le stubber globalement
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  it('getSystemPrefersDark retourne un booléen', () => {
    expect(typeof getSystemPrefersDark()).toBe('boolean')
  })

  it('getSystemPrefersReducedMotion retourne un booléen', () => {
    expect(typeof getSystemPrefersReducedMotion()).toBe('boolean')
  })

  it('getSystemPrefersDark retourne true quand prefers-color-scheme: dark est activé', () => {
    const mockMatchMedia = (query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })
    vi.stubGlobal('matchMedia', mockMatchMedia)
    expect(getSystemPrefersDark()).toBe(true)
  })

  it('getSystemPrefersReducedMotion retourne true quand reduce est activé', () => {
    const mockMatchMedia = (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })
    vi.stubGlobal('matchMedia', mockMatchMedia)
    expect(getSystemPrefersReducedMotion()).toBe(true)
  })
})
