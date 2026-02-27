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

// Couleurs selon le contexte (drapeau trans)
const FILL_COLORS = {
  feminizing: '#F5A9B8', // Rose trans
  masculinizing: '#5BCEFA', // Bleu trans
  neutral: '#FFFFFF', // Blanc (centre du drapeau)
}

const SIZES = {
  sm: 'w-24',
  md: 'w-32',
  lg: 'w-48',
  xl: 'w-64',
}

/**
 * Composant de progression BLAHAJ
 * Affiche un BLAHAJ qui se remplit progressivement
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

  // Animation du remplissage
  useEffect(() => {
    if (!animate) {
      setAnimatedProgress(progress)
      return
    }

    // Animation progressive
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

        {/* Pourcentage superposé au centre */}
        {showPercentage && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                'font-bold tabular-nums',
                size === 'sm' && 'text-xs',
                size === 'md' && 'text-sm',
                size === 'lg' && 'text-lg',
                size === 'xl' && 'text-2xl',
                // Texte contrasté selon le remplissage
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

/**
 * Version compacte pour les cards d'objectifs
 */
export function BlahajProgressCompact({
  progress,
  context = 'feminizing',
  className,
}: {
  progress: number
  context?: 'feminizing' | 'masculinizing' | 'neutral'
  className?: string
}) {
  const fillColor = FILL_COLORS[context]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="w-12 flex-shrink-0">
        <BlahajSvg
          fillPercent={progress}
          fillColor={fillColor}
          outlineColor="currentColor"
          className="text-foreground/60"
        />
      </div>
      <span className="text-sm font-medium tabular-nums">{Math.round(progress)}%</span>
    </div>
  )
}
