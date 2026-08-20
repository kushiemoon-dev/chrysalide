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

// Colors for the different markers
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
        {t('notEnoughForChart')}
      </div>
    )
  }

  /**
   * Computes the Y domain by adapting to the actual data.
   * Prioritizes the data to avoid squashing values
   * when the reference scale is very different.
   */
  function getYDomain(marker: BloodMarker): [number, number] {
    const values = chartData.map((d) => d[marker] as number).filter((v) => v !== undefined)

    const range = getReferenceRange(marker)

    if (values.length === 0) {
      // No data: use the reference range with some margin
      if (range) {
        return [0, Math.ceil(range.max * 1.5)]
      }
      return [0, 100]
    }

    const dataMin = Math.min(...values)
    const dataMax = Math.max(...values)

    // Special case: testosterone - clinically relevant scale depending on context
    if (marker === 'testosterone') {
      if (context === 'masculinizing') {
        // Cis-male range: 3-10 ng/mL, we use the max as a reference point
        const cisMaleMax = 10.0 // ng/mL
        const yMax = Math.max(dataMax, cisMaleMax) * 1.1
        return [0, Math.ceil(yMax * 10) / 10]
      }
      if (context === 'feminizing') {
        // Cis-female range: 0.15-0.70 ng/mL, we use the max as a reference point
        const cisFemaleMax = 0.7 // ng/mL
        const yMax = Math.max(dataMax, cisFemaleMax) * 1.2
        return [0, Math.ceil(yMax * 100) / 100]
      }
    }

    // Compute the domain based on the ACTUAL data
    // with a margin for readability
    const dataRange = dataMax - dataMin
    const padding = dataRange > 0 ? dataRange * 0.3 : dataMax * 0.2

    let min = Math.max(0, dataMin - padding)
    let max = dataMax + padding

    // If we have a reference range, only include it if it's close to the data
    // (avoids squashing feminizing values when the masculinizing scale is very different)
    if (range) {
      // Only include the reference range if it overlaps with or is close to the data
      const rangeIsRelevant =
        (range.min <= dataMax * 2 && range.max >= dataMin * 0.5) ||
        (dataMin >= range.min * 0.5 && dataMax <= range.max * 2)

      if (rangeIsRelevant) {
        min = Math.max(0, Math.min(min, range.min * 0.8))
        max = Math.max(max, range.max * 1.2)
      }
    }

    // Round intelligently based on the scale
    if (max < 10) {
      // Small values (ng/mL): round to 1 decimal place
      return [Math.floor(min * 10) / 10, Math.ceil(max * 10) / 10]
    }
    return [Math.floor(min), Math.ceil(max)]
  }

  // Detect whether separate Y axes are needed (E2 and T have incompatible scales)
  const hasEstradiol = markers.includes('estradiol')
  const hasTestosterone = markers.includes('testosterone')
  const needsDualAxis = hasEstradiol && hasTestosterone

  // Compute the optimal Y domain for all displayed markers
  function getOptimalYDomain(): [number, number] {
    if (markers.length === 0) return [0, 100]

    // If dual axis, compute the domain for the NON-testosterone markers on the left axis
    if (needsDualAxis) {
      const leftMarkers = markers.filter((m) => m !== 'testosterone')
      if (leftMarkers.length === 0) return [0, 100]
      if (leftMarkers.length === 1) return getYDomain(leftMarkers[0]!)

      const domains = leftMarkers.map((m) => getYDomain(m))
      const minVal = Math.min(...domains.map((d) => d[0]))
      const maxVal = Math.max(...domains.map((d) => d[1]))
      return [minVal, maxVal]
    }

    // If there's only one marker, use its domain
    if (markers.length === 1) {
      return getYDomain(markers[0]!)
    }

    // If there are multiple markers, check whether they have similar scales
    const domains = markers.map((m) => getYDomain(m))

    // Find the domain that encompasses all the data
    const minVal = Math.min(...domains.map((d) => d[0]))
    const maxVal = Math.max(...domains.map((d) => d[1]))

    // If the scales are very different (ratio > 5), just use the first marker
    const ratio = maxVal / (minVal || 1)
    if (ratio > 5 && markers.length > 1) {
      return getYDomain(markers[0]!)
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

          // Determine which Y axis to use for this reference
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
          // Determine which Y axis to use for this line
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
