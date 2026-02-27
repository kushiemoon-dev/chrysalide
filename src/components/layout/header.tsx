'use client'

import { ChrysalideLogo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title?: string
  subtitle?: string
  showDate?: boolean
  showLogo?: boolean
  backHref?: string
  className?: string
  children?: React.ReactNode
}

export function Header({
  title = 'Chrysalide',
  subtitle,
  showDate = false,
  showLogo = true,
  backHref,
  className,
  children,
}: HeaderProps) {
  return (
    <header className={cn('relative overflow-hidden', className)}>
      {/* Gradient background accent */}
      <div className="from-trans-blue/[0.06] to-trans-pink/[0.06] absolute inset-0 bg-gradient-to-br via-transparent" />

      {/* Subtle gradient border at bottom */}
      <div className="via-trans-blue/30 to-trans-pink/30 absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent" />

      <div className="relative flex items-center gap-3 px-4 py-4">
        {backHref && (
          <Link href={backHref}>
            <Button variant="ghost" size="icon" className="-ml-2 shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        )}

        {showLogo && !backHref && (
          <ChrysalideLogo size={42} animated={false} className="shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <h1 className="text-foreground truncate text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="text-muted-foreground truncate text-sm">{subtitle}</p>}
          {showDate && !subtitle && (
            <p className="text-muted-foreground text-sm">
              {format(new Date(), 'EEEE d MMMM', { locale: fr })}
            </p>
          )}
        </div>

        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
    </header>
  )
}

// Simplified page header for inner pages
export function PageHeader({
  title,
  subtitle,
  backHref,
  children,
}: {
  title: string
  subtitle?: string
  backHref?: string
  children?: React.ReactNode
}) {
  return (
    <header className="px-4 pt-2 pb-4">
      <div className="flex items-center gap-3">
        {backHref && (
          <Link href={backHref}>
            <Button variant="ghost" size="icon" className="-ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="text-foreground truncate text-xl font-bold">{title}</h1>
          {subtitle && <p className="text-muted-foreground truncate text-sm">{subtitle}</p>}
        </div>

        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
    </header>
  )
}

// Section header within pages
export function SectionHeader({
  title,
  action,
  className,
}: {
  title: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex items-center justify-between', className)}>
      <div className="flex items-center gap-2">
        <div className="from-trans-blue to-trans-pink h-5 w-1 rounded-full bg-gradient-to-b" />
        <h2 className="text-foreground text-base font-semibold">{title}</h2>
      </div>
      {action}
    </div>
  )
}
