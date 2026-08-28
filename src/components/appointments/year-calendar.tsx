'use client'

import { useState, useMemo } from 'react'
import {
  format,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  getDay,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations, useLocale } from 'next-intl'
import { getDateLocale } from '@/i18n/date-locale'
import type { Locale } from '@/i18n/config'
import { cn } from '@/lib/utils'
import { APPOINTMENT_TYPES } from '@/lib/constants'
import type { Appointment, AppointmentType } from '@/lib/types'

interface YearCalendarProps {
  appointments: Appointment[]
  onDayClick?: (date: Date, dayAppointments: Appointment[]) => void
  onAppointmentClick?: (appointment: Appointment) => void
}

// Days of the week (starts Monday)
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/**
 * Year calendar: 12-month grid (4x3)
 * Displays appointments with color-coded indicators by type
 */
export function YearCalendar({ appointments, onDayClick, onAppointmentClick }: YearCalendarProps) {
  const t = useTranslations('appointments')
  const [year, setYear] = useState(new Date().getFullYear())

  // Compute the months of the year
  const yearStart = startOfYear(new Date(year, 0, 1))
  const yearEnd = endOfYear(new Date(year, 0, 1))
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd })

  // Index appointments by date for fast access
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    appointments.forEach((apt) => {
      const dateKey = format(new Date(apt.date), 'yyyy-MM-dd')
      if (!map.has(dateKey)) {
        map.set(dateKey, [])
      }
      map.get(dateKey)!.push(apt)
    })
    return map
  }, [appointments])

  const navigateYear = (delta: number) => {
    setYear((y) => y + delta)
  }

  return (
    <div className="space-y-4">
      {/* Year navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigateYear(-1)} className="shrink-0">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-foreground text-xl font-bold">{year}</h2>
        <Button variant="ghost" size="icon" onClick={() => navigateYear(1)} className="shrink-0">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(APPOINTMENT_TYPES).map(([type, info]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: info.color }} />
            <span className="text-muted-foreground">{t('types.' + type)}</span>
          </div>
        ))}
      </div>

      {/* Month grid (4 columns x 3 rows) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {months.map((month) => (
          <MonthMiniCalendar
            key={month.toISOString()}
            month={month}
            appointmentsByDate={appointmentsByDate}
            onDayClick={onDayClick}
          />
        ))}
      </div>
    </div>
  )
}

// Mini calendar for a month
function MonthMiniCalendar({
  month,
  appointmentsByDate,
  onDayClick,
}: {
  month: Date
  appointmentsByDate: Map<string, Appointment[]>
  onDayClick?: (date: Date, appointments: Appointment[]) => void
}) {
  const locale = useLocale()
  const dateLocale = getDateLocale(locale as Locale)
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Offset for the first day (0 = Sunday, we want to start on Monday)
  const firstDayOffset = (getDay(monthStart) + 6) % 7

  return (
    <div className="bg-card border-border rounded-lg border p-2">
      {/* Month name */}
      <h3 className="text-foreground mb-2 text-center text-sm font-medium capitalize">
        {format(month, 'MMMM', { locale: dateLocale })}
      </h3>

      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((day, i) => (
          <div key={i} className="text-muted-foreground text-center text-[9px] font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Empty cells for the offset */}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Days of the month */}
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayAppointments = appointmentsByDate.get(dateKey) || []
          const hasAppointments = dayAppointments.length > 0
          const today = isToday(day)

          // Get the unique colors of the day's appointments
          const appointmentColors = [
            ...new Set(
              dayAppointments.map((apt) => APPOINTMENT_TYPES[apt.type]?.color || '#6B7280')
            ),
          ].slice(0, 3) // Max 3 indicators

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick?.(day, dayAppointments)}
              className={cn(
                'relative flex aspect-square flex-col items-center justify-center rounded text-[10px]',
                'hover:bg-muted/50 transition-colors',
                today && 'bg-primary/20 font-bold',
                hasAppointments && 'font-medium'
              )}
            >
              <span
                className={cn(today && 'text-primary')}
                style={hasAppointments && !today ? { color: appointmentColors[0] } : undefined}
              >
                {format(day, 'd')}
              </span>

              {/* Appointment indicators */}
              {hasAppointments && (
                <div className="mt-0.5 flex gap-0.5">
                  {appointmentColors.map((color, i) => (
                    <div
                      key={i}
                      className="h-1 w-1 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
