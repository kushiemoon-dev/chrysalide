import { format, parseISO } from 'date-fns'

/**
 * Converts a Date to the yyyy-MM-dd string an <input type="date"> expects,
 * using local time (unlike `toISOString().split('T')[0]`, which uses UTC
 * and rolls back to the previous day for a local-midnight date west of
 * Greenwich or ahead of UTC before midnight local).
 */
export function toDateInput(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/**
 * Parses a yyyy-MM-dd date input value at local midnight (unlike
 * `new Date(str)`, which treats a date-only ISO string as UTC midnight).
 */
export function fromDateInput(value: string): Date {
  return parseISO(value)
}
