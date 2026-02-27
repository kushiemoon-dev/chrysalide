'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface SuccessAnimationProps {
  show: boolean
  onComplete?: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
}

const strokeWidths = {
  sm: 3,
  md: 3,
  lg: 4,
}

export function SuccessAnimation({
  show,
  onComplete,
  className,
  size = 'md',
}: SuccessAnimationProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (show) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        onComplete?.()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  if (!visible) return null

  return (
    <div
      className={cn('flex items-center justify-center', 'animate-scale-in', sizes[size], className)}
    >
      <svg viewBox="0 0 52 52" className={cn('animate-success-pulse rounded-full', sizes[size])}>
        <circle
          cx="26"
          cy="26"
          r="25"
          fill="none"
          className="stroke-green-500"
          strokeWidth={strokeWidths[size]}
        />
        <path
          fill="none"
          className="animate-checkmark stroke-green-500"
          strokeWidth={strokeWidths[size]}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="100"
          strokeDashoffset="100"
          d="M14.1 27.2l7.1 7.2 16.7-16.8"
        />
      </svg>
    </div>
  )
}

// Inline checkmark for buttons and small indicators
export function InlineCheckmark({
  className,
  animated = true,
}: {
  className?: string
  animated?: boolean
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn('h-5 w-5', className)}>
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(animated && 'animate-checkmark')}
        style={animated ? { strokeDasharray: 30, strokeDashoffset: 30 } : undefined}
      />
    </svg>
  )
}

// Button with press animation
interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'default' | 'success'
}

export function AnimatedButton({
  children,
  className,
  variant = 'default',
  onClick,
  ...props
}: AnimatedButtonProps) {
  const [pressed, setPressed] = useState(false)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setPressed(true)
    setTimeout(() => setPressed(false), 150)
    onClick?.(e)
  }

  return (
    <button
      className={cn(
        'transition-transform',
        pressed && 'animate-press',
        variant === 'success' && pressed && 'animate-success-pulse',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
}
