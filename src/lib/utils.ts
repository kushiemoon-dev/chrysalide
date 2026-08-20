import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { isPast } from 'date-fns'
import type { Appointment } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a string for search:
 * - Lowercase
 * - Strips accents (é → e, ç → c, etc.)
 * - Strips punctuation
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Strip accents
    .replace(/[^\w\s]/g, '') // Strip punctuation
}

/**
 * Fuzzy/partial search:
 * - Case-insensitive
 * - Accent-insensitive
 * - All words in the query must be found (in any order)
 *
 * Examples:
 * - "Dr Dup" finds "Dr. Dupont" ✓
 * - "medecin" finds "médecin" ✓
 * - "test sang" finds "test sanguin" ✓
 */
export function fuzzySearch(text: string, query: string): boolean {
  const normalizedText = normalizeString(text)
  const queryWords = normalizeString(query).split(/\s+/).filter(Boolean)
  return queryWords.every((word) => normalizedText.includes(word))
}

/**
 * Checks whether an appointment is in the past by combining date + time
 * - If a time is set, uses date + time
 * - Otherwise, considers the appointment past at the end of the day (23:59:59)
 */
export function isAppointmentPast(appointment: Appointment): boolean {
  const aptDate = new Date(appointment.date)

  if (appointment.time) {
    const [hours, minutes] = appointment.time.split(':').map(Number)
    aptDate.setHours(hours!, minutes!, 0, 0)
  } else {
    // No time specified = end of day
    aptDate.setHours(23, 59, 59, 999)
  }

  return isPast(aptDate)
}

/**
 * Returns the effective date/time of an appointment for sorting
 */
export function getAppointmentDateTime(appointment: Appointment): Date {
  const aptDate = new Date(appointment.date)

  if (appointment.time) {
    const [hours, minutes] = appointment.time.split(':').map(Number)
    aptDate.setHours(hours!, minutes!, 0, 0)
  } else {
    aptDate.setHours(0, 0, 0, 0)
  }

  return aptDate
}
