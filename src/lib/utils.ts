import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { isPast } from 'date-fns'
import type { Appointment } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalise une chaîne pour la recherche:
 * - Minuscules
 * - Supprime les accents (é → e, ç → c, etc.)
 * - Supprime la ponctuation
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^\w\s]/g, '') // Supprime la ponctuation
}

/**
 * Recherche fuzzy/partielle:
 * - Insensible à la casse
 * - Insensible aux accents
 * - Tous les mots de la requête doivent être trouvés (dans n'importe quel ordre)
 *
 * Exemples:
 * - "Dr Dup" trouve "Dr. Dupont" ✓
 * - "medecin" trouve "médecin" ✓
 * - "test sang" trouve "test sanguin" ✓
 */
export function fuzzySearch(text: string, query: string): boolean {
  const normalizedText = normalizeString(text)
  const queryWords = normalizeString(query).split(/\s+/).filter(Boolean)
  return queryWords.every((word) => normalizedText.includes(word))
}

/**
 * Vérifie si un rendez-vous est passé en combinant date + heure
 * - Si une heure est définie, utilise date + heure
 * - Sinon, considère le RDV passé à la fin de la journée (23:59:59)
 */
export function isAppointmentPast(appointment: Appointment): boolean {
  const aptDate = new Date(appointment.date)

  if (appointment.time) {
    const [hours, minutes] = appointment.time.split(':').map(Number)
    aptDate.setHours(hours, minutes, 0, 0)
  } else {
    // Pas d'heure spécifiée = fin de journée
    aptDate.setHours(23, 59, 59, 999)
  }

  return isPast(aptDate)
}

/**
 * Retourne la date/heure effective d'un RDV pour le tri
 */
export function getAppointmentDateTime(appointment: Appointment): Date {
  const aptDate = new Date(appointment.date)

  if (appointment.time) {
    const [hours, minutes] = appointment.time.split(':').map(Number)
    aptDate.setHours(hours, minutes, 0, 0)
  } else {
    aptDate.setHours(0, 0, 0, 0)
  }

  return aptDate
}
