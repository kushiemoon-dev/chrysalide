'use client'

import { createContext, useContext } from 'react'

// ═══════════════════════════════════════════════════════════════════════════
// THEME TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ThemeMode = 'light' | 'dark' | 'system'
export type ColorScheme = 'trans' | 'blue' | 'pink' | 'violet'

export interface ThemeConfig {
  mode: ThemeMode
  colorScheme: ColorScheme
  reducedMotion: boolean
}

export const DEFAULT_THEME: ThemeConfig = {
  mode: 'dark',
  colorScheme: 'trans',
  reducedMotion: false,
}

// ═══════════════════════════════════════════════════════════════════════════
// COLOR SCHEME DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export const COLOR_SCHEMES: Record<
  ColorScheme,
  {
    label: string
    description: string
    preview: string[] // 3 colors for preview
  }
> = {
  trans: {
    label: 'Trans',
    description: 'Couleurs du drapeau trans',
    preview: ['#5BCEFA', '#FFFFFF', '#F5A9B8'],
  },
  blue: {
    label: 'Océan',
    description: 'Tons bleus apaisants',
    preview: ['#60A5FA', '#93C5FD', '#DBEAFE'],
  },
  pink: {
    label: 'Rose',
    description: 'Tons roses chaleureux',
    preview: ['#F472B6', '#FBCFE8', '#FDF2F8'],
  },
  violet: {
    label: 'Violet',
    description: 'Tons violets mystiques',
    preview: ['#A78BFA', '#C4B5FD', '#EDE9FE'],
  },
}

export const THEME_MODES: Record<
  ThemeMode,
  {
    label: string
    description: string
    icon: string
  }
> = {
  dark: {
    label: 'Sombre',
    description: 'Thème sombre par défaut',
    icon: 'moon',
  },
  light: {
    label: 'Clair',
    description: 'Thème clair',
    icon: 'sun',
  },
  system: {
    label: 'Système',
    description: 'Suit les préférences système',
    icon: 'monitor',
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// THEME CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

export interface ThemeContextValue {
  theme: ThemeConfig
  setMode: (mode: ThemeMode) => void
  setColorScheme: (scheme: ColorScheme) => void
  setReducedMotion: (reduced: boolean) => void
  resolvedMode: 'light' | 'dark' // Actual mode after resolving 'system'
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const context = useContext(ThemeContext)
  // Return default values if no context (e.g., during SSG)
  if (!context) {
    return {
      theme: DEFAULT_THEME,
      setMode: () => {},
      setColorScheme: () => {},
      setReducedMotion: () => {},
      resolvedMode: 'dark' as const,
    }
  }
  return context
}

// ═══════════════════════════════════════════════════════════════════════════
// LOCAL STORAGE
// ═══════════════════════════════════════════════════════════════════════════

const THEME_STORAGE_KEY = 'chrysalide-theme'

export function loadTheme(): ThemeConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME
  }

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        mode: parsed.mode || DEFAULT_THEME.mode,
        colorScheme: parsed.colorScheme || DEFAULT_THEME.colorScheme,
        reducedMotion: parsed.reducedMotion ?? DEFAULT_THEME.reducedMotion,
      }
    }
  } catch {
    // Invalid JSON, return default
  }

  return DEFAULT_THEME
}

export function saveTheme(theme: ThemeConfig): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme))
}

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM PREFERENCE DETECTION
// ═══════════════════════════════════════════════════════════════════════════

export function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined') {
    return true // Default to dark on server
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function getSystemPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
