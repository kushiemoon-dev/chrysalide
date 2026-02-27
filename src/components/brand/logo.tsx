'use client'

import { cn } from '@/lib/utils'

interface ChrysalideLogoProps {
  size?: number
  animated?: boolean
  className?: string
  variant?: 'full' | 'icon' | 'minimal'
}

export function ChrysalideLogo({
  size = 40,
  animated = false,
  className = '',
  variant = 'full',
}: ChrysalideLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(animated && 'animate-flutter', className)}
      aria-label="Chrysalide - Logo papillon"
      role="img"
    >
      <defs>
        {/* Trans flag gradient */}
        <linearGradient id="trans-gradient-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5BCEFA" />
          <stop offset="50%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F5A9B8" />
        </linearGradient>

        <linearGradient id="trans-gradient-diagonal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5BCEFA" />
          <stop offset="100%" stopColor="#F5A9B8" />
        </linearGradient>

        {/* Wing gradients */}
        <linearGradient id="wing-blue-gradient" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#91DEFF" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#5BCEFA" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#3BA8D4" stopOpacity="0.8" />
        </linearGradient>

        <linearGradient id="wing-pink-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD4E0" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#F5A9B8" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#D4849A" stopOpacity="0.8" />
        </linearGradient>

        {/* Glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {variant === 'minimal' ? (
        /* Minimal variant - simple butterfly silhouette */
        <g filter="url(#glow)">
          <path
            d="M32 20 C24 12, 8 16, 12 32 C16 48, 28 44, 32 32"
            fill="url(#wing-blue-gradient)"
          />
          <path
            d="M32 20 C40 12, 56 16, 52 32 C48 48, 36 44, 32 32"
            fill="url(#wing-pink-gradient)"
          />
          <ellipse cx="32" cy="32" rx="3" ry="14" fill="url(#trans-gradient-body)" />
        </g>
      ) : (
        /* Full variant - detailed butterfly */
        <g filter="url(#glow)">
          {/* Left upper wing */}
          <path
            d="M28 30 C16 18, 6 20, 8 30 C10 40, 18 38, 28 32"
            fill="url(#wing-blue-gradient)"
          />
          {/* Left lower wing */}
          <path
            d="M28 34 C18 38, 10 44, 14 50 C18 56, 26 50, 28 36"
            fill="#5BCEFA"
            fillOpacity="0.7"
          />

          {/* Right upper wing */}
          <path
            d="M36 30 C48 18, 58 20, 56 30 C54 40, 46 38, 36 32"
            fill="url(#wing-pink-gradient)"
          />
          {/* Right lower wing */}
          <path
            d="M36 34 C46 38, 54 44, 50 50 C46 56, 38 50, 36 36"
            fill="#F5A9B8"
            fillOpacity="0.7"
          />

          {/* Wing details - subtle patterns */}
          <circle cx="18" cy="28" r="3" fill="#91DEFF" fillOpacity="0.4" />
          <circle cx="46" cy="28" r="3" fill="#FFD4E0" fillOpacity="0.4" />
          <circle cx="16" cy="46" r="2" fill="#5BCEFA" fillOpacity="0.3" />
          <circle cx="48" cy="46" r="2" fill="#F5A9B8" fillOpacity="0.3" />

          {/* Body */}
          <ellipse cx="32" cy="34" rx="3.5" ry="16" fill="url(#trans-gradient-body)" />

          {/* Head */}
          <circle cx="32" cy="16" r="4" fill="url(#trans-gradient-diagonal)" />

          {/* Antennae */}
          <path
            d="M30 14 Q26 8, 22 6"
            stroke="url(#trans-gradient-diagonal)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M34 14 Q38 8, 42 6"
            stroke="url(#trans-gradient-diagonal)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Antenna tips */}
          <circle cx="22" cy="6" r="1.5" fill="#5BCEFA" />
          <circle cx="42" cy="6" r="1.5" fill="#F5A9B8" />
        </g>
      )}
    </svg>
  )
}

// Export a simple icon version for favicons/small sizes
export function ChrysalideIcon({
  size = 24,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5BCEFA" />
          <stop offset="100%" stopColor="#F5A9B8" />
        </linearGradient>
      </defs>
      <path d="M12 6 C8 4, 2 6, 4 12 C6 18, 10 16, 12 12" fill="#5BCEFA" fillOpacity="0.8" />
      <path d="M12 6 C16 4, 22 6, 20 12 C18 18, 14 16, 12 12" fill="#F5A9B8" fillOpacity="0.8" />
      <ellipse cx="12" cy="12" rx="1.5" ry="6" fill="url(#icon-gradient)" />
    </svg>
  )
}
