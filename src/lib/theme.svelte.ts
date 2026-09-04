import { browser } from '$app/environment'
import {
  DEFAULT_THEME,
  loadTheme,
  saveTheme,
  getSystemPrefersDark,
  type ThemeConfig,
  type ThemeMode,
} from './theme'

function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'system' ? (getSystemPrefersDark() ? 'dark' : 'light') : mode
}

class ThemeStore {
  config = $state<ThemeConfig>(browser ? loadTheme() : DEFAULT_THEME)
  resolvedMode = $derived(resolveMode(this.config.mode))

  setMode(mode: ThemeMode) {
    this.config = { ...this.config, mode }
    saveTheme(this.config)
  }

  setReducedMotion(reducedMotion: boolean) {
    this.config = { ...this.config, reducedMotion }
    saveTheme(this.config)
  }
}

export const theme = new ThemeStore()
