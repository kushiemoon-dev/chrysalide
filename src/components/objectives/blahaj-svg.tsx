'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

interface BlahajSvgProps {
  fillPercent?: number // 0-100
  fillColor?: string // Fill color (default: trans-blue)
  outlineColor?: string // Outline color
  className?: string
}

/**
 * BLAHAJ SVG - Silhouette of the IKEA shark plush emblematic of the trans community
 * Fills from bottom to top based on the progress percentage
 */
export function BlahajSvg({
  fillPercent = 0,
  fillColor = '#5BCEFA',
  outlineColor = 'currentColor',
  className,
}: BlahajSvgProps) {
  // Clip path for the progressive fill (bottom to top)
  const clipId = `blahaj-clip-${useId().replace(/:/g, '')}`
  const fillHeight = Math.max(0, Math.min(100, fillPercent))

  return (
    <svg
      viewBox="0 0 200 100"
      className={cn('h-auto w-full', className)}
      role="img"
      aria-label={`BLAHAJ filled to ${fillPercent}%`}
    >
      <defs>
        {/* Clip path for the progressive fill */}
        <clipPath id={clipId}>
          <rect x="0" y={100 - fillHeight} width="200" height={fillHeight} />
        </clipPath>
      </defs>

      {/* Main body of the BLAHAJ (stylized shark silhouette) */}
      <g>
        {/* Background filled based on the percentage */}
        <path
          d="
            M 20 60
            Q 30 45 50 40
            Q 65 35 85 35
            L 90 20
            Q 92 15 95 20
            L 100 35
            Q 130 35 150 40
            Q 170 45 180 55
            Q 185 60 180 65
            L 175 65
            Q 178 70 175 75
            L 170 75
            Q 172 78 170 80
            Q 165 85 155 85
            Q 140 85 120 82
            Q 100 80 80 80
            Q 60 80 45 78
            Q 35 77 25 72
            Q 15 68 20 60
            Z
          "
          fill={fillColor}
          clipPath={`url(#${clipId})`}
          opacity="0.9"
        />

        {/* Body outline */}
        <path
          d="
            M 20 60
            Q 30 45 50 40
            Q 65 35 85 35
            L 90 20
            Q 92 15 95 20
            L 100 35
            Q 130 35 150 40
            Q 170 45 180 55
            Q 185 60 180 65
            L 175 65
            Q 178 70 175 75
            L 170 75
            Q 172 78 170 80
            Q 165 85 155 85
            Q 140 85 120 82
            Q 100 80 80 80
            Q 60 80 45 78
            Q 35 77 25 72
            Q 15 68 20 60
            Z
          "
          fill="none"
          stroke={outlineColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dorsal fin */}
        <path
          d="M 90 20 Q 92 15 95 20"
          fill="none"
          stroke={outlineColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Eye (small circle) */}
        <circle cx="40" cy="55" r="4" fill={outlineColor} />

        {/* Gentle smile */}
        <path
          d="M 35 65 Q 42 70 50 66"
          fill="none"
          stroke={outlineColor}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Pectoral fin */}
        <path
          d="M 70 65 Q 80 72 75 78"
          fill="none"
          stroke={outlineColor}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Tail (caudal fin) */}
        <path
          d="M 170 75 Q 175 80 185 78 Q 180 82 175 82"
          fill="none"
          stroke={outlineColor}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Gills */}
        <path
          d="M 55 55 L 55 62"
          fill="none"
          stroke={outlineColor}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M 60 54 L 60 63"
          fill="none"
          stroke={outlineColor}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}
