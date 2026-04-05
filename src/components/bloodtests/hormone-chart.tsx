'use client'

import { useTranslations, useLocale } from 'next-intl'
import { getDateLocale } from '@/i18n/date-locale'
import type { Locale } from '@/i18n/config'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format } from 'date-fns'
import type { BloodTest, BloodMarker } from '@/lib/types'
import { BLOOD_MARKERS, REFERENCE_RANGES } from '@/lib/constants'

interface HormoneChartProps {
  tests: BloodTest[]
  markers: BloodMarker[]
  context: 'feminizing' | 'masculinizing'
  height?: number
}

// Couleurs pour les différents marqueurs
const MARKER_COLORS: Partial<Record<BloodMarker, string>> = {
  estradiol: '#F5A9B8', // Trans pink
  testosterone: '#5BCEFA', // Trans blue
  lh: '#91DEFF',
  fsh: '#E8A0BF',
  prolactin: '#FFD4E0',
  progesterone: '#D4849A',
  hematocrit: '#5BCEFA',
  hemoglobin: '#F5A9B8',
  alt: '#FFA07A',
  ast: '#FFB347',
  creatinine: '#87CEEB',
  potassium: '#98FB98',
}

// Custom tooltip - defined outside component to avoid recreation on each render
interface TooltipPayloadEntry {
  dataKey: string
  value: number
  color: string
  payload: Record<string, number | string>
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
  context: 'feminizing' | 'masculinizing'
  translateMarker: (key: string) => string
}

function CustomTooltip({ active, payload, label, context, translateMarker }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const fullDate = payload[0]?.payload?.fullDate

  function getReferenceRange(marker: BloodMarker) {
    return REFERENCE_RANGES.find((r) => r.marker === marker && r.context === context)
  }

  return (
    <div className="bg-card border-border rounded-lg border p-3 shadow-lg">
      <p className="text-foreground mb-2 text-sm font-medium">{fullDate || label}</p>
      {payload.map((entry) => {
        const marker = entry.dataKey as BloodMarker
        const info = BLOOD_MARKERS[marker]
        const range = getReferenceRange(marker)
        const inRange = range ? entry.value >= range.min && entry.value <= range.max : true

        return (
          <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{translateMarker(marker)}:</span>
            <span className={`font-medium ${inRange ? 'text-foreground' : 'text-destructive'}`}>
              {entry.value} {info?.unit}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function HormoneChart({ tests, markers, context, height = 250 }: HormoneChartProps) {
  const t = useTranslations('bloodtests')
  const locale = useLocale()
  const dateLocale = getDateLocale(locale as Locale)
  // Transform data for Recharts
  const chartData = tests
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((test) => {
      const dataPoint: Record<string, number | string> = {
        date: format(new Date(test.date), 'dd MMM yy', { locale: dateLocale }),
        fullDate: format(new Date(test.date), 'dd MMMM yyyy', { locale: dateLocale }),
      }

      for (const marker of markers) {
        const result = test.results.find((r) => r.marker === marker)
        if (result) {
          dataPoint[marker] = result.value
        }
      }

      return dataPoint
    })

  // Get reference range for markers
  function getReferenceRange(marker: BloodMarker) {
    return REFERENCE_RANGES.find((r) => r.marker === marker && r.context === context)
  }

  if (chartData.length === 0) {
    return (
      <div className="text-muted-foreground flex h-[200px] items-center justify-center">
        Pas assez de données pour afficher un graphique
      </div>
    )
  }

  /**
   * Calcule le domaine Y en s'adaptant aux données réelles
   * Priorité aux données pour éviter d'écraser les valeurs
   * quand l'échelle de référence est très différente
   */
  function getYDomain(marker: BloodMarker): [number, number] {
    const values = chartData.map((d) => d[marker] as number).filter((v) => v !== undefined)

    const range = getReferenceRange(marker)

    if (values.length === 0) {
      // Pas de données: utiliser la plage de référence avec marge
      if (range) {
        return [0, Math.ceil(range.max * 1.5)]
      }
      return [0, 100]
    }

    const dataMin = Math.min(...values)
    const dataMax = Math.max(...values)

    // Cas spécial: testostérone - échelle cliniquement pertinente selon le contexte
    if (marker === 'testosterone') {
      if (context === 'masculinizing') {
        // Plage cis-male: 3-10 ng/mL, on utilise le max comme référence
        const cisMaleMax = 10.0 // ng/mL
        const yMax = Math.max(dataMax, cisMaleMax) * 1.1
        return [0, Math.ceil(yMax * 10) / 10]
      }
      if (context === 'feminizing') {
        // Plage cis-female: 0.15-0.70 ng/mL, on utilise le max comme référence
        const cisFemaleMax = 0.7 // ng/mL
        const yMax = Math.max(dataMax, cisFemaleMax) * 1.2
        return [0, Math.ceil(yMax * 100) / 100]
      }
    }

    // Calculer le domaine basé sur les données RÉELLES
    // avec une marge pour la lisibilité
    const dataRange = dataMax - dataMin
    const padding = dataRange > 0 ? dataRange * 0.3 : dataMax * 0.2

    let min = Math.max(0, dataMin - padding)
    let max = dataMax + padding

    // Si on a une plage de référence, l'inclure seulement si elle est proche des données
    // (évite d'écraser les valeurs féminisant quand l'échelle masculinisant est très différente)
    if (range) {
      // Inclure la plage de référence uniquement si elle chevauche ou est proche des données
      const rangeIsRelevant =
        (range.min <= dataMax * 2 && range.max >= dataMin * 0.5) ||
        (dataMin >= range.min * 0.5 && dataMax <= range.max * 2)

      if (rangeIsRelevant) {
        min = Math.max(0, Math.min(min, range.min * 0.8))
        max = Math.max(max, range.max * 1.2)
      }
    }

    // Arrondir intelligemment selon l'échelle
    if (max < 10) {
      // Petites valeurs (ng/mL): arrondir à 1 décimale
      return [Math.floor(min * 10) / 10, Math.ceil(max * 10) / 10]
    }
    return [Math.floor(min), Math.ceil(max)]
  }

  // Détecter si on a besoin d'axes Y séparés (E2 et T ont des échelles incompatibles)
  const hasEstradiol = markers.includes('estradiol')
  const hasTestosterone = markers.includes('testosterone')
  const needsDualAxis = hasEstradiol && hasTestosterone

  // Calculer le domaine Y optimal pour tous les marqueurs affichés
  function getOptimalYDomain(): [number, number] {
    if (markers.length === 0) return [0, 100]

    // Si dual axis, on calcule le domaine pour les marqueurs NON-testostérone sur l'axe gauche
    if (needsDualAxis) {
      const leftMarkers = markers.filter((m) => m !== 'testosterone')
      if (leftMarkers.length === 0) return [0, 100]
      if (leftMarkers.length === 1) return getYDomain(leftMarkers[0])

      const domains = leftMarkers.map((m) => getYDomain(m))
      const minVal = Math.min(...domains.map((d) => d[0]))
      const maxVal = Math.max(...domains.map((d) => d[1]))
      return [minVal, maxVal]
    }

    // Si un seul marqueur, utiliser son domaine
    if (markers.length === 1) {
      return getYDomain(markers[0])
    }

    // Si plusieurs marqueurs, vérifier s'ils ont des échelles similaires
    const domains = markers.map((m) => getYDomain(m))

    // Trouver le domaine qui englobe toutes les données
    const minVal = Math.min(...domains.map((d) => d[0]))
    const maxVal = Math.max(...domains.map((d) => d[1]))

    // Si les échelles sont très différentes (ratio > 5), on utilise juste le premier marqueur
    const ratio = maxVal / (minVal || 1)
    if (ratio > 5 && markers.length > 1) {
      return getYDomain(markers[0])
    }

    return [minVal, maxVal]
  }

  const yDomain = getOptimalYDomain()
  const tDomain = hasTestosterone ? getYDomain('testosterone') : null

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />

        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          tickLine={false}
          axisLine={{ stroke: 'var(--border)' }}
        />

        <YAxis
          yAxisId="left"
          domain={yDomain}
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          tickLine={false}
          axisLine={{ stroke: 'var(--border)' }}
          width={45}
          label={
            needsDualAxis
              ? {
                  value: 'pg/mL',
                  angle: -90,
                  position: 'insideLeft',
                  fontSize: 10,
                  fill: 'var(--muted-foreground)',
                }
              : undefined
          }
        />

        {/* Second Y-axis for testosterone when dual axis mode */}
        {needsDualAxis && tDomain && (
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={tDomain}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            width={45}
            label={{
              value: 'ng/mL',
              angle: 90,
              position: 'insideRight',
              fontSize: 10,
              fill: 'var(--muted-foreground)',
            }}
          />
        )}

        <Tooltip
          content={
            <CustomTooltip context={context} translateMarker={(marker) => t('markers.' + marker)} />
          }
        />

        {markers.length > 1 && (
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value) => t('markers.' + value)}
          />
        )}

        {/* Reference areas for target ranges */}
        {markers.map((marker) => {
          const range = getReferenceRange(marker)
          if (!range) return null

          // Déterminer quel axe Y utiliser pour cette référence
          const axisId = needsDualAxis && marker === 'testosterone' ? 'right' : 'left'

          return (
            <ReferenceArea
              key={`ref-${marker}`}
              yAxisId={axisId}
              y1={range.min}
              y2={range.max}
              fill={MARKER_COLORS[marker] || '#888'}
              fillOpacity={0.15}
              stroke={MARKER_COLORS[marker] || '#888'}
              strokeOpacity={0.3}
              strokeDasharray="3 3"
            />
          )
        })}

        {/* Lines for each marker */}
        {markers.map((marker) => {
          // Déterminer quel axe Y utiliser pour cette ligne
          const axisId = needsDualAxis && marker === 'testosterone' ? 'right' : 'left'

          return (
            <Line
              key={marker}
              type="monotone"
              dataKey={marker}
              yAxisId={axisId}
              stroke={MARKER_COLORS[marker] || '#888'}
              strokeWidth={2}
              dot={{ fill: MARKER_COLORS[marker] || '#888', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'var(--background)', strokeWidth: 2 }}
              connectNulls
            />
          )
        })}
      </LineChart>
    </ResponsiveContainer>
  )
}
