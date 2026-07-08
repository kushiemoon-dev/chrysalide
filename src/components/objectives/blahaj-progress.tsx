'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { BlahajSvg } from './blahaj-svg'

interface BlahajProgressProps {
  progress: number // 0-100
  context?: 'feminizing' | 'masculinizing' | 'neutral'
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animate?: boolean
  className?: string
}

// Colors based on context (trans flag)
const FILL_COLORS = {
  feminizing: '#F5A9B8', // Trans pink
  masculinizing: '#5BCEFA', // Trans blue
  neutral: '#FFFFFF', // White (center of the flag)
}

const SIZES = {
  sm: 'w-24',
  md: 'w-32',
  lg: 'w-48',
  xl: 'w-64',
}

/**
 * BLAHAJ progress component
 * Displays a BLAHAJ that fills up progressively
 */
export function BlahajProgress({
  progress,
  context = 'feminizing',
  showPercentage = true,
  size = 'md',
  animate = true,
  className,
}: BlahajProgressProps) {
  const [animatedProgress, setAnimatedProgress] = useState(animate ? 0 : progress)

  // Fill animation
  useEffect(() => {
    if (!animate) {
      // ponytail: sync to final value when animation is disabled — not a bug
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnimatedProgress(progress)
      return
    }

    // Progressive animation
    const duration = 1000 // ms
    const steps = 60
    const increment = progress / steps
    let current = 0
    let step = 0

    const timer = setInterval(() => {
      step++
      current = Math.min(progress, increment * step)
      setAnimatedProgress(current)

      if (step >= steps || current >= progress) {
        clearInterval(timer)
        setAnimatedProgress(progress)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [progress, animate])

  const fillColor = FILL_COLORS[context]
  const displayProgress = Math.round(animatedProgress)

  return (
    <div className={cn('relative flex flex-col items-center', className)}>
      {/* BLAHAJ SVG */}
      <div className={cn(SIZES[size], 'relative')}>
        <BlahajSvg
          fillPercent={animatedProgress}
          fillColor={fillColor}
          outlineColor="currentColor"
          className="text-foreground/70 transition-all duration-300"
        />

        {/* Percentage overlaid in the center */}
        {showPercentage && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                'font-bold tabular-nums',
                size === 'sm' && 'text-xs',
                size === 'md' && 'text-sm',
                size === 'lg' && 'text-lg',
                size === 'xl' && 'text-2xl',
                // Contrasting text based on fill level
                displayProgress > 50 ? 'text-white drop-shadow-md' : 'text-foreground'
              )}
            >
              {displayProgress}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
