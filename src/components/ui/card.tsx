import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const cardVariants = cva(
  'bg-card text-card-foreground flex flex-col gap-6 rounded-2xl transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'border border-border/50 shadow-soft-sm hover:shadow-soft-md',
        gradient: [
          'border border-transparent shadow-soft-md',
          'bg-gradient-to-br from-trans-blue/[0.08] to-trans-pink/[0.08]',
          '[background-clip:padding-box]',
        ].join(' '),
        glow: 'border border-border/30 shadow-trans-glow hover:shadow-trans-glow-lg',
        ghost: 'bg-transparent border-0 shadow-none',
        outline: 'border border-border bg-transparent shadow-none',
      },
      padding: {
        default: 'py-6',
        compact: 'py-4',
        none: 'py-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
    },
  }
)

interface CardProps extends React.ComponentProps<'div'>, VariantProps<typeof cardVariants> {}

function Card({ className, variant, padding, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-6', className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  )
}

// Stat card with accent line
function StatCard({
  className,
  accentColor = 'blue',
  children,
  ...props
}: React.ComponentProps<'div'> & {
  accentColor?: 'blue' | 'pink' | 'gradient'
}) {
  const accentStyles = {
    blue: 'from-trans-blue to-trans-blue/50',
    pink: 'from-trans-pink/50 to-trans-pink',
    gradient: 'from-trans-blue via-white/50 to-trans-pink',
  }

  return (
    <div
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground border-border/50 shadow-soft-sm relative flex flex-col overflow-hidden rounded-2xl border',
        className
      )}
      {...props}
    >
      {/* Accent line at top */}
      <div
        className={cn(
          'absolute top-0 right-0 left-0 h-1 bg-gradient-to-r',
          accentStyles[accentColor]
        )}
      />
      <div className="px-4 pt-5 pb-4">{children}</div>
    </div>
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  StatCard,
}
