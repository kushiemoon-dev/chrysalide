/**
 * Notification system for Chrysalide
 * Uses the Web Notifications API (local only, no server)
 */

export type NotificationPermission = 'default' | 'granted' | 'denied'

/**
 * Checks whether notifications are supported
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/**
 * Gets the current permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied'
  return Notification.permission
}

/**
 * Requests permission for notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported')
    return 'denied'
  }

  try {
    const permission = await Notification.requestPermission()
    return permission
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return 'denied'
  }
}

/**
 * Storage keys for notification preferences
 */
const STORAGE_KEYS = {
  notificationsEnabled: 'chrysalide_notifications_enabled',
  medicationReminders: 'chrysalide_medication_reminders',
  appointmentReminders: 'chrysalide_appointment_reminders',
  stockAlerts: 'chrysalide_stock_alerts',
  evolutionModuleEnabled: 'chrysalide_evolution_module_enabled',
  costTrackingEnabled: 'chrysalide_cost_tracking_enabled',
}

/**
 * Gets notification preferences from localStorage
 */
export function getNotificationPreferences(): {
  notificationsEnabled: boolean
  medicationReminders: boolean
  appointmentReminders: boolean
  stockAlerts: boolean
} {
  if (typeof window === 'undefined') {
    return {
      notificationsEnabled: false,
      medicationReminders: true,
      appointmentReminders: true,
      stockAlerts: true,
    }
  }

  return {
    notificationsEnabled: localStorage.getItem(STORAGE_KEYS.notificationsEnabled) === 'true',
    medicationReminders: localStorage.getItem(STORAGE_KEYS.medicationReminders) !== 'false',
    appointmentReminders: localStorage.getItem(STORAGE_KEYS.appointmentReminders) !== 'false',
    stockAlerts: localStorage.getItem(STORAGE_KEYS.stockAlerts) !== 'false',
  }
}

/**
 * Saves notification preferences
 */
export function setNotificationPreferences(
  prefs: Partial<{
    notificationsEnabled: boolean
    medicationReminders: boolean
    appointmentReminders: boolean
    stockAlerts: boolean
  }>
): void {
  if (typeof window === 'undefined') return

  if (prefs.notificationsEnabled !== undefined) {
    localStorage.setItem(STORAGE_KEYS.notificationsEnabled, String(prefs.notificationsEnabled))
  }
  if (prefs.medicationReminders !== undefined) {
    localStorage.setItem(STORAGE_KEYS.medicationReminders, String(prefs.medicationReminders))
  }
  if (prefs.appointmentReminders !== undefined) {
    localStorage.setItem(STORAGE_KEYS.appointmentReminders, String(prefs.appointmentReminders))
  }
  if (prefs.stockAlerts !== undefined) {
    localStorage.setItem(STORAGE_KEYS.stockAlerts, String(prefs.stockAlerts))
  }
}

/**
 * Checks whether a frequency is periodic (non-daily)
 * E.g.: "1x/mois", "1x/2semaines", "1x/3jours" -> true
 * E.g.: "1x/jour", "2x/jour", "3x/jour" -> false
 */
export function isPeriodicFrequency(frequency: string): boolean {
  const lower = frequency.toLowerCase()
  // Frequencies that are NOT daily
  return (
    lower.includes('semaine') ||
    lower.includes('mois') ||
    lower.includes('1x/2jours') ||
    lower.includes('2 jours') ||
    lower.includes('1x/3jours') ||
    lower.includes('3 jours') ||
    lower.includes('1x/4jours') ||
    lower.includes('4 jours') ||
    lower.includes('1x/5jours') ||
    lower.includes('5 jours') ||
    lower.includes('1x/6jours') ||
    lower.includes('6 jours') ||
    lower.includes('1x/10jours') ||
    lower.includes('10 jours')
  )
}

/**
 * Computes the interval in days for a frequency
 * E.g.: "1x/mois" -> 28, "1x/2semaines" -> 14, "1x/3jours" -> 3
 */
export function getFrequencyIntervalDays(frequency: string): number {
  const lower = frequency.toLowerCase()

  if (lower.includes('1x/2jours') || lower.includes('2 jours')) return 2
  if (lower.includes('1x/3jours') || lower.includes('3 jours')) return 3
  if (lower.includes('1x/4jours') || lower.includes('4 jours')) return 4
  if (lower.includes('1x/5jours') || lower.includes('5 jours')) return 5
  if (lower.includes('1x/6jours') || lower.includes('6 jours')) return 6
  if (lower.includes('1x/10jours') || lower.includes('10 jours')) return 10
  if (lower.includes('2x/semaine')) return 3.5 // ~2 times per week
  if (lower.includes('1x/semaine') || lower.includes('hebdomadaire')) return 7
  if (lower.includes('1x/2semaines') || lower.includes('2 semaines')) return 14
  if (lower.includes('1x/mois') || lower.includes('mensuel')) return 28
  if (lower.includes('1x/3mois') || lower.includes('3 mois') || lower.includes('trimestriel'))
    return 84
  if (lower.includes('1x/6mois') || lower.includes('6 mois') || lower.includes('semestriel'))
    return 168

  return 1 // daily by default
}

/**
 * Checks whether a medication should be taken on a given day
 * Based on the frequency, start date, and end date
 */
export function shouldTakeMedicationOnDate(
  medication: { frequency: string; startDate: Date | string; endDate?: Date | string },
  date: Date
): boolean {
  const interval = getFrequencyIntervalDays(medication.frequency)

  const start = new Date(medication.startDate)
  // Normalize the dates to ignore the time portion
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const daysSinceStart = Math.floor(
    (targetDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)
  )

  // If the date is before the start date, don't take it
  if (daysSinceStart < 0) return false

  // If the medication has an end date and the target date is after it, don't take it
  if (medication.endDate) {
    const end = new Date(medication.endDate)
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
    if (targetDay > endDay) return false
  }

  // If daily, take every day
  if (interval === 1) return true

  // For fractional intervals (2x/week), round
  const roundedInterval = Math.round(interval)
  return daysSinceStart % roundedInterval === 0
}

/**
 * Checks whether a medication should be taken today
 */
export function shouldTakeMedicationToday(medication: {
  frequency: string
  startDate: Date | string
  endDate?: Date | string
}): boolean {
  return shouldTakeMedicationOnDate(medication, new Date())
}

/**
 * Parses a frequency into reminder hours (legacy simple mode)
 * E.g.: "1x/jour" -> [9] (9am)
 * E.g.: "2x/jour" -> [9, 21]
 * Returns null for periodic (non-daily) frequencies
 */
export function parseFrequencyToHours(frequency: string): number[] | null {
  const lower = frequency.toLowerCase()

  // Periodic frequencies: return null
  if (isPeriodicFrequency(frequency)) {
    return null
  }

  if (lower.includes('2x/jour') || lower.includes('2 fois')) {
    return [9, 21] // 9am and 9pm
  }
  if (lower.includes('3x/jour') || lower.includes('3 fois')) {
    return [8, 14, 20] // 8am, 2pm, 8pm
  }
  if (
    lower.includes('1x/jour') ||
    lower.includes('quotidien') ||
    lower.includes('tous les jours')
  ) {
    return [9] // 9am
  }

  // Default: 9am (daily)
  return [9]
}

/**
 * Extracts the notification times for a medication
 * In advanced mode, uses the explicit scheduledTimes
 * In simple mode, parses the frequency
 * Returns an empty array for periodic frequencies without explicit times
 */
export function getMedicationReminderTimes(medication: {
  schedulingMode?: 'simple' | 'advanced'
  scheduledTimes?: string[]
  frequency: string
}): string[] {
  // Advanced mode: use the explicit times
  if (medication.schedulingMode === 'advanced' && medication.scheduledTimes?.length) {
    return medication.scheduledTimes
  }

  // Simple mode: parse the frequency into default times
  const hours = parseFrequencyToHours(medication.frequency)

  // Periodic frequencies: return a default time of 9am
  // (the "which day" logic is handled by shouldTakeMedicationOnDate)
  if (hours === null) {
    return ['09:00']
  }

  return hours.map((h) => `${h.toString().padStart(2, '0')}:00`)
}

// === MODULE PREFERENCES ===

/**
 * Gets the module visibility preferences
 */
export function getModulePreferences(): {
  evolutionEnabled: boolean
  costTrackingEnabled: boolean
} {
  if (typeof window === 'undefined') {
    return { evolutionEnabled: true, costTrackingEnabled: false }
  }

  return {
    evolutionEnabled: localStorage.getItem(STORAGE_KEYS.evolutionModuleEnabled) !== 'false',
    // Cost tracking disabled by default
    costTrackingEnabled: localStorage.getItem(STORAGE_KEYS.costTrackingEnabled) === 'true',
  }
}

/**
 * Saves the module visibility preferences
 */
export function setModulePreferences(
  prefs: Partial<{
    evolutionEnabled: boolean
    costTrackingEnabled: boolean
  }>
): void {
  if (typeof window === 'undefined') return

  if (prefs.evolutionEnabled !== undefined) {
    localStorage.setItem(STORAGE_KEYS.evolutionModuleEnabled, String(prefs.evolutionEnabled))
  }
  if (prefs.costTrackingEnabled !== undefined) {
    localStorage.setItem(STORAGE_KEYS.costTrackingEnabled, String(prefs.costTrackingEnabled))
  }
}

// === AUTO-VALIDATION ===

/**
 * Checks whether auto-validation is enabled
 */
export function isAutoValidationEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('medication-auto-validation') === 'true'
}

/**
 * Checks whether a scheduled time has already passed today
 * @param scheduledTime Time in "HH:MM" format
 * @returns true if the time has passed
 */
export function isScheduledTimePassed(scheduledTime: string): boolean {
  const now = new Date()
  const [hours, minutes] = scheduledTime.split(':').map(Number)

  const scheduledDateTime = new Date()
  scheduledDateTime.setHours(hours!, minutes!, 0, 0)

  return now >= scheduledDateTime
}
