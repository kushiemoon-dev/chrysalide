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
