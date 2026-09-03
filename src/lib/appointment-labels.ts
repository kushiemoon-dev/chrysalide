import { differenceInCalendarDays } from 'date-fns'

export type RelativeDayLabel =
  { key: 'today' } | { key: 'tomorrow' } | { key: 'inDays'; days: number } | { key: 'past' }

/**
 * Classifies a date relative to now into an i18n key (+ day count for the plural
 * interpolation), matching appointments.list.{today,tomorrow,inDays,past}.
 * `tomorrow` covers day 1, so `inDays` only ever needs the plural form (2+).
 */
export function getRelativeDayLabel(date: Date, now: Date): RelativeDayLabel {
  const days = differenceInCalendarDays(date, now)

  if (days < 0) return { key: 'past' }
  if (days === 0) return { key: 'today' }
  if (days === 1) return { key: 'tomorrow' }
  return { key: 'inDays', days }
}
