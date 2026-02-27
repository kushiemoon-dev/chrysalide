'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

interface BlahajSvgProps {
  fillPercent?: number // 0-100
  fillColor?: string // Couleur de remplissage (défaut: trans-blue)
  outlineColor?: string // Couleur du contour
  className?: string
}

/**
 * BLAHAJ SVG - Silhouette du requin IKEA emblématique de la communauté trans
 * Se remplit de bas en haut selon le pourcentage de progression
 */
export function BlahajSvg({
  fillPercent = 0,
  fillColor = '#5BCEFA',
  outlineColor = 'currentColor',
  className,
}: BlahajSvgProps) {
  // Clip path pour le remplissage progressif (de bas en haut)
  const clipId = `blahaj-clip-${useId().replace(/:/g, '')}`
  const fillHeight = Math.max(0, Math.min(100, fillPercent))

  return (
    <svg
      viewBox="0 0 200 100"
      className={cn('h-auto w-full', className)}
      role="img"
      aria-label={`BLAHAJ rempli à ${fillPercent}%`}
    >
      <defs>
        {/* Clip path pour le remplissage progressif */}
        <clipPath id={clipId}>
          <rect x="0" y={100 - fillHeight} width="200" height={fillHeight} />
        </clipPath>
      </defs>

      {/* Corps principal du BLAHAJ (silhouette de requin stylisée) */}
      <g>
        {/* Fond rempli selon le pourcentage */}
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

        {/* Contour du corps */}
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

        {/* Nageoire dorsale */}
        <path
          d="M 90 20 Q 92 15 95 20"
          fill="none"
          stroke={outlineColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Oeil (petit cercle) */}
        <circle cx="40" cy="55" r="4" fill={outlineColor} />

        {/* Sourire doux */}
        <path
          d="M 35 65 Q 42 70 50 66"
          fill="none"
          stroke={outlineColor}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Nageoire pectorale */}
        <path
          d="M 70 65 Q 80 72 75 78"
          fill="none"
          stroke={outlineColor}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Queue (nageoire caudale) */}
        <path
          d="M 170 75 Q 175 80 185 78 Q 180 82 175 82"
          fill="none"
          stroke={outlineColor}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Branchies */}
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
