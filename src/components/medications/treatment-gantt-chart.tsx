'use client'

import { useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { MEDICATION_TYPES } from '@/lib/constants'
import type { Medication } from '@/lib/types'
import { format, differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns'
import { fr } from 'date-fns/locale'

interface TreatmentGanttChartProps {
  medications: Medication[]
}

export function TreatmentGanttChart({ medications }: TreatmentGanttChartProps) {
  const t = useTranslations('medications')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentTime] = useState(() => Date.now())

  const { timelineStart, months, totalDays } = useMemo(() => {
    if (medications.length === 0) {
      const now = new Date()
      return {
        timelineStart: startOfMonth(now),
        timelineEnd: endOfMonth(now),
        months: [startOfMonth(now)],
        totalDays: 30,
      }
    }

    const starts = medications.map((m) => new Date(m.startDate))
    const ends = medications.map((m) => (m.endDate ? new Date(m.endDate) : new Date()))

    const earliest = startOfMonth(new Date(Math.min(...starts.map((d) => d.getTime()))))
    const latest = endOfMonth(new Date(Math.max(...ends.map((d) => d.getTime()), currentTime)))

    return {
      timelineStart: earliest,
      months: eachMonthOfInterval({ start: earliest, end: latest }),
      totalDays: Math.max(differenceInDays(latest, earliest), 1),
    }
  }, [medications, currentTime])

  if (medications.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-center text-sm">{t('history.noTreatments')}</p>
    )
  }

  const dayWidth = 3 // px per day
  const chartWidth = Math.max(totalDays * dayWidth, 300)
  const barHeight = 28
  const barGap = 8
  const labelWidth = 180

  function getBarLeft(date: Date): number {
    const days = differenceInDays(date, timelineStart)
    return Math.max(days * dayWidth, 0)
  }

  function getBarWidth(start: Date, end: Date): number {
    const days = differenceInDays(end, start)
    return Math.max(days * dayWidth, dayWidth)
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  return (
    <div className="flex overflow-hidden rounded-lg border">
      {/* Labels column */}
      <div className="bg-card border-border shrink-0 border-r" style={{ width: labelWidth }}>
        {/* Header spacer */}
        <div className="border-border h-8 border-b" />

        {medications.map((med) => {
          const typeInfo = MEDICATION_TYPES[med.type]
          const isEnded = med.endDate && new Date(med.endDate) < todayStart

          return (
            <div
              key={med.id}
              className="border-border flex items-center gap-1.5 border-b px-2"
              style={{ height: barHeight + barGap }}
            >
              <div
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: typeInfo.color, opacity: isEnded ? 0.5 : 1 }}
              />
              <span
                className="truncate text-xs font-medium"
                style={{ opacity: isEnded ? 0.5 : 1 }}
                title={med.name}
              >
                {med.name}
              </span>
            </div>
          )
        })}
      </div>

      {/* Scrollable chart area */}
      <div ref={scrollRef} className="flex-1 overflow-x-auto">
        <div style={{ width: chartWidth, minWidth: '100%' }}>
          {/* Month headers */}
          <div className="border-border relative flex h-8 border-b">
            {months.map((month) => {
              const left = getBarLeft(month)
              const monthEnd = endOfMonth(month)
              const width = getBarWidth(month, monthEnd)

              return (
                <div
                  key={month.toISOString()}
                  className="border-border absolute border-l px-1 text-[10px]"
                  style={{ left, width, lineHeight: '32px' }}
                >
                  <span className="text-muted-foreground capitalize">
                    {format(month, 'MMM yy', { locale: fr })}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Bars */}
          {medications.map((med) => {
            const start = new Date(med.startDate)
            const end = med.endDate ? new Date(med.endDate) : new Date()
            const typeInfo = MEDICATION_TYPES[med.type]
            const isEnded = med.endDate && new Date(med.endDate) < todayStart
            const left = getBarLeft(start)
            const width = getBarWidth(start, end)

            return (
              <div
                key={med.id}
                className="border-border relative border-b"
                style={{ height: barHeight + barGap }}
              >
                <div
                  className="absolute top-1 rounded"
                  style={{
                    left,
                    width,
                    height: barHeight,
                    backgroundColor: typeInfo.color,
                    opacity: isEnded ? 0.35 : 0.7,
                    borderStyle: isEnded ? 'dashed' : 'solid',
                    borderWidth: 1,
                    borderColor: typeInfo.color,
                  }}
                />
                {/* Active indicator: pulsing right edge */}
                {!isEnded && (
                  <div
                    className="absolute top-1 animate-pulse rounded-r"
                    style={{
                      left: left + width - 3,
                      width: 3,
                      height: barHeight,
                      backgroundColor: typeInfo.color,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
