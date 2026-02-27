'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type IconVariant = 'blue' | 'pink' | 'gradient' | 'muted'
type IconSize = 'sm' | 'md' | 'lg'

interface DecoratedIconProps {
  icon: LucideIcon
  variant?: IconVariant
  size?: IconSize
  className?: string
  animated?: boolean
}

const variantStyles: Record<IconVariant, { bg: string; icon: string }> = {
  blue: {
    bg: 'bg-trans-blue/15 dark:bg-trans-blue/10',
    icon: 'text-trans-blue',
  },
  pink: {
    bg: 'bg-trans-pink/15 dark:bg-trans-pink/10',
    icon: 'text-trans-pink',
  },
  gradient: {
    bg: 'bg-gradient-to-br from-trans-blue/15 to-trans-pink/15 dark:from-trans-blue/10 dark:to-trans-pink/10',
    icon: 'text-foreground',
  },
  muted: {
    bg: 'bg-muted/50',
    icon: 'text-muted-foreground',
  },
}

const sizeStyles: Record<IconSize, { wrapper: string; icon: string }> = {
  sm: {
    wrapper: 'p-2 rounded-lg',
    icon: 'w-4 h-4',
  },
  md: {
    wrapper: 'p-2.5 rounded-xl',
    icon: 'w-5 h-5',
  },
  lg: {
    wrapper: 'p-3 rounded-2xl',
    icon: 'w-6 h-6',
  },
}

export function DecoratedIcon({
  icon: Icon,
  variant = 'blue',
  size = 'md',
  className = '',
  animated = false,
}: DecoratedIconProps) {
  const styles = variantStyles[variant]
  const sizes = sizeStyles[size]

  return (
    <div
      className={cn(
        sizes.wrapper,
        styles.bg,
        'transition-all duration-200',
        animated && 'hover:scale-105 active:scale-95',
        className
      )}
    >
      <Icon className={cn(sizes.icon, styles.icon)} />
    </div>
  )
}

// Variant with glow effect for emphasis
export function GlowingIcon({
  icon: Icon,
  size = 'md',
  className = '',
}: Omit<DecoratedIconProps, 'variant'>) {
  const sizes = sizeStyles[size]

  return (
    <div
      className={cn(
        sizes.wrapper,
        'relative',
        'from-trans-blue/20 to-trans-pink/20 bg-gradient-to-br',
        'shadow-trans-glow',
        'transition-all duration-300',
        'hover:shadow-trans-glow-lg hover:scale-105',
        className
      )}
    >
      <Icon className={cn(sizes.icon, 'text-foreground relative z-10')} />
    </div>
  )
}

// Pill-shaped variant for stats/badges
export function PillIcon({
  icon: Icon,
  label,
  value,
  variant = 'blue',
  className = '',
}: {
  icon: LucideIcon
  label: string
  value: string | number
  variant?: IconVariant
  className?: string
}) {
  const styles = variantStyles[variant]

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full px-3 py-2',
        styles.bg,
        'transition-all duration-200 hover:scale-[1.02]',
        className
      )}
    >
      <Icon className={cn('h-4 w-4', styles.icon)} />
      <div className="flex items-baseline gap-1.5">
        <span className="text-foreground font-semibold">{value}</span>
        <span className="text-muted-foreground text-xs">{label}</span>
      </div>
    </div>
  )
}
