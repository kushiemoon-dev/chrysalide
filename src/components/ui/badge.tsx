import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-all duration-200 overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/15 text-primary',
        secondary: 'border-transparent bg-secondary/15 text-secondary',
        destructive: 'border-transparent bg-destructive/15 text-destructive',
        outline: 'border-border/50 text-foreground bg-transparent',
        // Trans-themed variants
        'trans-blue': 'border-trans-blue/30 bg-trans-blue/15 text-trans-blue',
        'trans-pink': 'border-trans-pink/30 bg-trans-pink/15 text-trans-pink',
        'trans-gradient':
          'border-0 bg-gradient-to-r from-trans-blue/20 to-trans-pink/20 text-foreground',
        // Status badges
        success: 'border-green-500/30 bg-green-500/15 text-green-600 dark:text-green-400',
        warning: 'border-yellow-500/30 bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
        info: 'border-blue-500/30 bg-blue-500/15 text-blue-600 dark:text-blue-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
