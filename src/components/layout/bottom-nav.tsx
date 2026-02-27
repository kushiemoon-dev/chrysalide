'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Pill,
  TestTube,
  TrendingUp,
  Settings,
  MoreHorizontal,
  BookOpen,
  Target,
  ExternalLink,
  Calendar,
  X,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getModulePreferences } from '@/lib/notifications'

// Main nav items (always visible)
const mainNavItems = [
  { href: '/', icon: Home, label: 'Accueil' },
  { href: '/medications', icon: Pill, label: 'Medocs' },
  { href: '/bloodtests', icon: TestTube, label: 'Analyses' },
]

// More menu items (shown in dropdown)
const moreMenuItems = [
  { href: '/progress', icon: TrendingUp, label: 'Évolution', moduleKey: 'evolution' as const },
  { href: '/journal', icon: BookOpen, label: 'Journal', moduleKey: null },
  { href: '/objectives', icon: Target, label: 'Objectifs', moduleKey: null },
  { href: '/appointments', icon: Calendar, label: 'Rendez-vous', moduleKey: null },
  { href: '/practitioners', icon: Users, label: 'Praticien·nes', moduleKey: null },
  { href: '/resources', icon: ExternalLink, label: 'Ressources', moduleKey: null },
]

function getFilteredMoreItems() {
  const prefs = getModulePreferences()
  return moreMenuItems.filter((item) => {
    if (item.moduleKey === 'evolution') return prefs.evolutionEnabled
    return true
  })
}

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [moreItems, setMoreItems] = useState(getFilteredMoreItems)

  // Check if current page is in the "more" menu
  const isMoreActive = moreItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )

  // Listen for storage changes (when settings are updated)
  const handleStorageChange = useCallback(() => {
    setMoreItems(getFilteredMoreItems())
  }, [])

  useEffect(() => {
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('modulePrefsChanged', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('modulePrefsChanged', handleStorageChange)
    }
  }, [handleStorageChange])

  // Close menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMoreMenuOpen(false)
  }, [pathname])

  const handleMoreItemClick = (href: string) => {
    setMoreMenuOpen(false)
    router.push(href)
  }

  return (
    <>
      {/* More Menu Overlay */}
      {moreMenuOpen && (
        <div
          className="bg-background/80 animate-fade-in fixed inset-0 z-40 backdrop-blur-sm"
          onClick={() => setMoreMenuOpen(false)}
        />
      )}

      {/* More Menu Sheet */}
      {moreMenuOpen && (
        <div className="animate-slide-up fixed right-4 bottom-[80px] left-4 z-50">
          <div className="bg-card border-border overflow-hidden rounded-2xl border shadow-lg">
            <div className="border-border flex items-center justify-between border-b p-4">
              <span className="text-foreground font-medium">Plus</span>
              <button
                onClick={() => setMoreMenuOpen(false)}
                className="hover:bg-muted rounded-lg p-1 transition-colors"
              >
                <X className="text-muted-foreground h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 p-2">
              {moreItems.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/')
                return (
                  <button
                    key={href}
                    onClick={() => handleMoreItemClick(href)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl p-3 transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed right-0 bottom-0 left-0 z-50">
        {/* Frosted glass background */}
        <div className="bg-card/85 absolute inset-0 backdrop-blur-xl" />

        {/* Trans gradient accent line at top */}
        <div className="from-trans-blue/50 to-trans-pink/50 absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r via-white/30" />

        {/* Nav content */}
        <div className="relative mx-auto flex h-[72px] max-w-lg items-center justify-around px-2">
          {/* Main nav items */}
          {mainNavItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 transition-all duration-300',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground active:scale-95'
                )}
              >
                {isActive && (
                  <div
                    className="from-trans-blue/15 to-trans-pink/15 absolute inset-0 rounded-2xl bg-gradient-to-br"
                    style={{
                      border: '1px solid transparent',
                      background: `
                        linear-gradient(var(--card), var(--card)) padding-box,
                        linear-gradient(135deg, rgba(91, 206, 250, 0.3), rgba(245, 169, 184, 0.3)) border-box
                      `,
                    }}
                  />
                )}
                <Icon
                  className={cn(
                    'relative h-5 w-5 transition-transform duration-300',
                    isActive && 'text-primary scale-110'
                  )}
                />
                <span
                  className={cn(
                    'relative text-[11px] font-medium transition-colors',
                    isActive && 'text-primary'
                  )}
                >
                  {label}
                </span>
              </Link>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 transition-all duration-300',
              isMoreActive || moreMenuOpen
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground active:scale-95'
            )}
          >
            {(isMoreActive || moreMenuOpen) && (
              <div
                className="from-trans-blue/15 to-trans-pink/15 absolute inset-0 rounded-2xl bg-gradient-to-br"
                style={{
                  border: '1px solid transparent',
                  background: `
                    linear-gradient(var(--card), var(--card)) padding-box,
                    linear-gradient(135deg, rgba(91, 206, 250, 0.3), rgba(245, 169, 184, 0.3)) border-box
                  `,
                }}
              />
            )}
            <MoreHorizontal
              className={cn(
                'relative h-5 w-5 transition-transform duration-300',
                (isMoreActive || moreMenuOpen) && 'text-primary scale-110'
              )}
            />
            <span
              className={cn(
                'relative text-[11px] font-medium transition-colors',
                (isMoreActive || moreMenuOpen) && 'text-primary'
              )}
            >
              Plus
            </span>
          </button>

          {/* Settings */}
          <Link
            href="/settings"
            className={cn(
              'relative flex flex-col items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 transition-all duration-300',
              pathname.startsWith('/settings')
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground active:scale-95'
            )}
          >
            {pathname.startsWith('/settings') && (
              <div
                className="from-trans-blue/15 to-trans-pink/15 absolute inset-0 rounded-2xl bg-gradient-to-br"
                style={{
                  border: '1px solid transparent',
                  background: `
                    linear-gradient(var(--card), var(--card)) padding-box,
                    linear-gradient(135deg, rgba(91, 206, 250, 0.3), rgba(245, 169, 184, 0.3)) border-box
                  `,
                }}
              />
            )}
            <Settings
              className={cn(
                'relative h-5 w-5 transition-transform duration-300',
                pathname.startsWith('/settings') && 'text-primary scale-110'
              )}
            />
            <span
              className={cn(
                'relative text-[11px] font-medium transition-colors',
                pathname.startsWith('/settings') && 'text-primary'
              )}
            >
              Réglages
            </span>
          </Link>
        </div>

        {/* Safe area padding for notched devices */}
        <div className="bg-card/85 h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  )
}
