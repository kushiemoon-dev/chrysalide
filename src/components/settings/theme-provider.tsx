'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  ThemeContext,
  ThemeConfig,
  ThemeMode,
  ColorScheme,
  DEFAULT_THEME,
  loadTheme,
  saveTheme,
  getSystemPrefersDark,
  getSystemPrefersReducedMotion,
} from '@/lib/theme'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    const savedTheme = loadTheme()
    if (getSystemPrefersReducedMotion() && !savedTheme.reducedMotion) {
      savedTheme.reducedMotion = true
    }
    return savedTheme
  })
  const [mounted, setMounted] = useState(false)

  // Resolve 'system' mode to actual light/dark
  const resolvedMode = useMemo(() => {
    if (theme.mode === 'system') {
      return getSystemPrefersDark() ? 'dark' : 'light'
    }
    return theme.mode
  }, [theme.mode])

  // Signal hydration complete
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement

    // Apply mode (light/dark class)
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedMode)

    // Apply color scheme as data attribute
    root.dataset.colorScheme = theme.colorScheme

    // Apply reduced motion
    if (theme.reducedMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      const colors: Record<ColorScheme, string> = {
        trans: '#5BCEFA',
        blue: '#60A5FA',
        pink: '#F472B6',
        violet: '#A78BFA',
      }
      metaThemeColor.setAttribute('content', colors[theme.colorScheme])
    }
  }, [theme, resolvedMode, mounted])

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      if (theme.mode === 'system') {
        // Force re-render to update resolvedMode
        setTheme((prev) => ({ ...prev }))
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme.mode, mounted])

  // Listen for reduced motion preference changes
  useEffect(() => {
    if (!mounted) return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const handleChange = (e: MediaQueryListEvent) => {
      setTheme((prev) => {
        const updated = { ...prev, reducedMotion: e.matches }
        saveTheme(updated)
        return updated
      })
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mounted])

  const setMode = useCallback((mode: ThemeMode) => {
    setTheme((prev) => {
      const updated = { ...prev, mode }
      saveTheme(updated)
      return updated
    })
  }, [])

  const setColorScheme = useCallback((colorScheme: ColorScheme) => {
    setTheme((prev) => {
      const updated = { ...prev, colorScheme }
      saveTheme(updated)
      return updated
    })
  }, [])

  const setReducedMotion = useCallback((reducedMotion: boolean) => {
    setTheme((prev) => {
      const updated = { ...prev, reducedMotion }
      saveTheme(updated)
      return updated
    })
  }, [])

  const value = useMemo(
    () => ({
      theme,
      setMode,
      setColorScheme,
      setReducedMotion,
      resolvedMode,
    }),
    [theme, setMode, setColorScheme, setReducedMotion, resolvedMode]
  )

  // Prevent flash of wrong theme
  if (!mounted) {
    return (
      <div className="dark" data-color-scheme="trans">
        {children}
      </div>
    )
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
