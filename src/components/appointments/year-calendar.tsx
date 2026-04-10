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

// Jours de la semaine (commence lundi)
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/**
 * Calendrier annuel - grille 12 mois (4x3)
 * Affiche les RDV avec des indicateurs colorés par type
 */
export function YearCalendar({ appointments, onDayClick, onAppointmentClick }: YearCalendarProps) {
  const t = useTranslations('appointments')
  const [year, setYear] = useState(new Date().getFullYear())

  // Calculer les mois de l'année
  const yearStart = startOfYear(new Date(year, 0, 1))
  const yearEnd = endOfYear(new Date(year, 0, 1))
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd })

  // Indexer les RDV par date pour un accès rapide
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
      {/* Navigation année */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigateYear(-1)} className="shrink-0">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-foreground text-xl font-bold">{year}</h2>
        <Button variant="ghost" size="icon" onClick={() => navigateYear(1)} className="shrink-0">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(APPOINTMENT_TYPES).map(([type, info]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: info.color }} />
            <span className="text-muted-foreground">{t('types.' + type)}</span>
          </div>
        ))}
      </div>

      {/* Grille des mois (4 colonnes x 3 lignes) */}
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

// Mini calendrier pour un mois
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

  // Décalage pour le premier jour (0 = dimanche, on veut commencer lundi)
  const firstDayOffset = (getDay(monthStart) + 6) % 7

  return (
    <div className="bg-card border-border rounded-lg border p-2">
      {/* Nom du mois */}
      <h3 className="text-foreground mb-2 text-center text-sm font-medium capitalize">
        {format(month, 'MMMM', { locale: dateLocale })}
      </h3>

      {/* En-têtes jours de la semaine */}
      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((day, i) => (
          <div key={i} className="text-muted-foreground text-center text-[9px] font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Jours */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Cases vides pour le décalage */}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Jours du mois */}
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayAppointments = appointmentsByDate.get(dateKey) || []
          const hasAppointments = dayAppointments.length > 0
          const today = isToday(day)

          // Obtenir les couleurs uniques des RDV du jour
          const appointmentColors = [
            ...new Set(
              dayAppointments.map((apt) => APPOINTMENT_TYPES[apt.type]?.color || '#6B7280')
            ),
          ].slice(0, 3) // Max 3 indicateurs

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

              {/* Indicateurs de RDV */}
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
