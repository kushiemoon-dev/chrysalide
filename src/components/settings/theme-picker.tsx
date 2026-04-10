'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun, Monitor, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useTheme, ThemeMode, ColorScheme, COLOR_SCHEMES, THEME_MODES } from '@/lib/theme'

const modeIcons: Record<ThemeMode, typeof Moon> = {
  dark: Moon,
  light: Sun,
  system: Monitor,
}

export function ThemePicker() {
  const [mounted, setMounted] = useState(false)
  const { theme, setMode, setColorScheme, setReducedMotion } = useTheme()
  const t = useTranslations('theme')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  // Show skeleton during SSR/SSG
  if (!mounted) {
    return <ThemePickerSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('modeTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(Object.entries(THEME_MODES) as [ThemeMode, typeof THEME_MODES.dark][]).map(([mode]) => {
            const Icon = modeIcons[mode]
            const isActive = theme.mode === mode

            return (
              <button
                key={mode}
                onClick={() => setMode(mode)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl p-3 transition-all',
                  'border border-transparent',
                  isActive ? 'bg-primary/10 border-primary/30' : 'bg-muted/50 hover:bg-muted'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-foreground font-medium">{t(`modes.${mode}.label`)}</p>
                  <p className="text-muted-foreground text-sm">{t(`modes.${mode}.description`)}</p>
                </div>
                {isActive && <Check className="text-primary h-5 w-5 flex-shrink-0" />}
              </button>
            )
          })}
        </CardContent>
      </Card>

      {/* Color Scheme Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('paletteTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(COLOR_SCHEMES) as [ColorScheme, typeof COLOR_SCHEMES.trans][]).map(
              ([scheme, config]) => {
                const isActive = theme.colorScheme === scheme

                return (
                  <button
                    key={scheme}
                    onClick={() => setColorScheme(scheme)}
                    className={cn(
                      'relative rounded-xl p-3 text-left transition-all',
                      'border-2',
                      isActive
                        ? 'border-primary bg-primary/5'
                        : 'bg-muted/50 hover:bg-muted border-transparent'
                    )}
                  >
                    {/* Color preview */}
                    <div className="mb-2 flex gap-1">
                      {config.preview.map((color, i) => (
                        <div
                          key={i}
                          className="h-6 w-6 rounded-full shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <p className="text-foreground text-sm font-medium">
                      {t(`schemes.${scheme}.label`)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {t(`schemes.${scheme}.description`)}
                    </p>
                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <Check className="text-primary h-4 w-4" />
                      </div>
                    )}
                  </button>
                )
              }
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reduced Motion */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('a11yTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground font-medium">{t('reducedMotion')}</p>
              <p className="text-muted-foreground text-sm">{t('reducedMotionDescription')}</p>
            </div>
            <Switch checked={theme.reducedMotion} onCheckedChange={setReducedMotion} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Skeleton for SSR/SSG
function ThemePickerSkeleton() {
  const t = useTranslations('theme')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('modeTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted/50 flex w-full items-center gap-3 rounded-xl p-3">
              <div className="bg-muted h-10 w-10 animate-pulse rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="bg-muted h-4 w-24 animate-pulse rounded" />
                <div className="bg-muted/70 h-3 w-32 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('paletteTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-muted/50 rounded-xl p-3">
                <div className="mb-2 flex gap-1">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="bg-muted h-6 w-6 animate-pulse rounded-full" />
                  ))}
                </div>
                <div className="bg-muted mb-1 h-4 w-16 animate-pulse rounded" />
                <div className="bg-muted/70 h-3 w-24 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('a11yTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="bg-muted h-4 w-32 animate-pulse rounded" />
              <div className="bg-muted/70 h-3 w-48 animate-pulse rounded" />
            </div>
            <div className="bg-muted h-6 w-11 animate-pulse rounded-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Compact version for quick settings
export function ThemeModeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setMode } = useTheme()
  const t = useTranslations('theme')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const nextMode = (): ThemeMode => {
    const modes: ThemeMode[] = ['dark', 'light', 'system']
    const currentIndex = modes.indexOf(theme.mode)
    return modes[(currentIndex + 1) % modes.length]
  }

  const Icon = modeIcons[theme.mode]

  if (!mounted) {
    return <div className="bg-muted h-9 w-9 animate-pulse rounded-lg p-2" />
  }

  return (
    <button
      onClick={() => setMode(nextMode())}
      className="bg-muted hover:bg-muted/80 rounded-lg p-2 transition-colors"
      title={t(`modes.${theme.mode}.label`)}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}
