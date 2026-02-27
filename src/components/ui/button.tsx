import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-soft-sm hover:bg-primary/90 hover:shadow-soft-md',
        destructive:
          'bg-destructive text-white shadow-soft-sm hover:bg-destructive/90 focus-visible:ring-destructive/30',
        outline:
          'border border-border/50 bg-card shadow-soft-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-soft-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent/50 hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        // New trans-themed variants
        gradient:
          'bg-gradient-to-r from-trans-blue to-trans-pink text-white shadow-trans-glow hover:shadow-trans-glow-lg hover:brightness-110',
        'soft-outline':
          'border border-border/40 bg-card/50 hover:border-trans-blue/30 hover:shadow-trans-glow transition-all',
        'trans-blue':
          'bg-trans-blue/15 text-trans-blue border border-trans-blue/30 hover:bg-trans-blue/25',
        'trans-pink':
          'bg-trans-pink/15 text-trans-pink border border-trans-pink/30 hover:bg-trans-pink/25',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-9 rounded-lg gap-1.5 px-4',
        lg: 'h-11 rounded-xl px-6 text-base',
        icon: 'size-10 rounded-xl',
        'icon-sm': 'size-9 rounded-lg',
        'icon-lg': 'size-11 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
