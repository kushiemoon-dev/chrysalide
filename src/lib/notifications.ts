/**
 * Système de notifications pour Chrysalide
 * Utilise l'API Web Notifications (local, pas de serveur)
 */

export type NotificationPermission = 'default' | 'granted' | 'denied'

/**
 * Vérifie si les notifications sont supportées
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/**
 * Récupère le statut actuel de la permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied'
  return Notification.permission
}

/**
 * Demande la permission pour les notifications
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
 * Affiche une notification
 */
export function showNotification(
  title: string,
  options?: {
    body?: string
    icon?: string
    tag?: string
    requireInteraction?: boolean
    actions?: { action: string; title: string }[]
  }
): Notification | null {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    console.warn('Notifications not available or not permitted')
    return null
  }

  try {
    const notification = new Notification(title, {
      body: options?.body,
      icon: options?.icon || '/icon-192.png',
      tag: options?.tag,
      requireInteraction: options?.requireInteraction ?? false,
      badge: '/icon-192.png',
    })

    // Auto-close après 10 secondes si pas requireInteraction
    if (!options?.requireInteraction) {
      setTimeout(() => notification.close(), 10000)
    }

    return notification
  } catch (error) {
    console.error('Error showing notification:', error)
    return null
  }
}

/**
 * Types de rappels avec leurs messages
 */
export const REMINDER_MESSAGES = {
  medication: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    title: (name: string) => `Prise de médicament`,
    body: (name: string) => `N'oublie pas de prendre: ${name}`,
  },
  refill: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    title: (name: string) => `Stock bas`,
    body: (name: string) => `Il est temps de renouveler: ${name}`,
  },
  appointment: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    title: (type: string) => `Rendez-vous`,
    body: (details: string) => `Rappel: ${details}`,
  },
  bloodtest: {
    title: () => `Analyse sanguine`,
    body: () => `N'oublie pas ton prochain bilan sanguin`,
  },
}

/**
 * Notification de rappel de médicament (mode simple)
 */
export function notifyMedicationReminder(medicationName: string): Notification | null {
  return showNotification(REMINDER_MESSAGES.medication.title(medicationName), {
    body: REMINDER_MESSAGES.medication.body(medicationName),
    tag: 'medication-reminder',
    requireInteraction: true,
  })
}

/**
 * Notification de rappel de dose (mode avancé)
 * @param medicationName Nom du médicament
 * @param scheduledTime Horaire prévu (ex: "08:00")
 */
export function notifyDoseReminder(
  medicationName: string,
  scheduledTime: string
): Notification | null {
  return showNotification(`Prise de ${scheduledTime}`, {
    body: `C'est l'heure de prendre: ${medicationName}`,
    tag: `dose-${medicationName}-${scheduledTime}`,
    requireInteraction: true,
  })
}

/**
 * Notification de stock bas
 */
export function notifyLowStock(medicationName: string, remaining: number): Notification | null {
  return showNotification(REMINDER_MESSAGES.refill.title(medicationName), {
    body: `${medicationName}: ${remaining} restant(s)`,
    tag: `stock-${medicationName}`,
  })
}

/**
 * Notification de rendez-vous
 */
export function notifyAppointment(
  type: string,
  doctor: string | undefined,
  minutesBefore: number
): Notification | null {
  const timeText =
    minutesBefore === 0
      ? "C'est maintenant !"
      : `Dans ${minutesBefore} minute${minutesBefore > 1 ? 's' : ''}`

  return showNotification(REMINDER_MESSAGES.appointment.title(type), {
    body: `${timeText}${doctor ? ` avec ${doctor}` : ''}`,
    tag: 'appointment-reminder',
    requireInteraction: true,
  })
}

/**
 * Storage keys pour les préférences de notification
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
 * Récupère les préférences de notifications depuis localStorage
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
 * Sauvegarde les préférences de notifications
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
 * Vérifie si une fréquence est périodique (non-quotidienne)
 * Ex: "1x/mois", "1x/2semaines", "1x/3jours" -> true
 * Ex: "1x/jour", "2x/jour", "3x/jour" -> false
 */
export function isPeriodicFrequency(frequency: string): boolean {
  const lower = frequency.toLowerCase()
  // Fréquences qui NE sont PAS quotidiennes
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
 * Calcule l'intervalle en jours pour une fréquence
 * Ex: "1x/mois" -> 28, "1x/2semaines" -> 14, "1x/3jours" -> 3
 */
export function getFrequencyIntervalDays(frequency: string): number {
  const lower = frequency.toLowerCase()

  if (lower.includes('1x/2jours') || lower.includes('2 jours')) return 2
  if (lower.includes('1x/3jours') || lower.includes('3 jours')) return 3
  if (lower.includes('1x/4jours') || lower.includes('4 jours')) return 4
  if (lower.includes('1x/5jours') || lower.includes('5 jours')) return 5
  if (lower.includes('1x/6jours') || lower.includes('6 jours')) return 6
  if (lower.includes('1x/10jours') || lower.includes('10 jours')) return 10
  if (lower.includes('2x/semaine')) return 3.5 // ~2 fois par semaine
  if (lower.includes('1x/semaine') || lower.includes('hebdomadaire')) return 7
  if (lower.includes('1x/2semaines') || lower.includes('2 semaines')) return 14
  if (lower.includes('1x/mois') || lower.includes('mensuel')) return 28
  if (lower.includes('1x/3mois') || lower.includes('3 mois') || lower.includes('trimestriel'))
    return 84
  if (lower.includes('1x/6mois') || lower.includes('6 mois') || lower.includes('semestriel'))
    return 168

  return 1 // quotidien par défaut
}

/**
 * Vérifie si un médicament doit être pris un jour donné
 * Basé sur la fréquence, la date de début et la date de fin
 */
export function shouldTakeMedicationOnDate(
  medication: { frequency: string; startDate: Date | string; endDate?: Date | string },
  date: Date
): boolean {
  const interval = getFrequencyIntervalDays(medication.frequency)

  const start = new Date(medication.startDate)
  // Normaliser les dates pour ignorer les heures
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const daysSinceStart = Math.floor(
    (targetDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Si la date est avant le début, ne pas prendre
  if (daysSinceStart < 0) return false

  // Si le médicament a une date de fin et la date cible est après, ne pas prendre
  if (medication.endDate) {
    const end = new Date(medication.endDate)
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
    if (targetDay > endDay) return false
  }

  // Si quotidien, prendre tous les jours
  if (interval === 1) return true

  // Pour les intervalles fractionnaires (2x/semaine), arrondir
  const roundedInterval = Math.round(interval)
  return daysSinceStart % roundedInterval === 0
}

/**
 * Vérifie si un médicament doit être pris aujourd'hui
 */
export function shouldTakeMedicationToday(medication: {
  frequency: string
  startDate: Date | string
  endDate?: Date | string
}): boolean {
  return shouldTakeMedicationOnDate(medication, new Date())
}

/**
 * Parse une fréquence en heures de rappel (mode simple legacy)
 * Ex: "1x/jour" -> [9] (9h du matin)
 * Ex: "2x/jour" -> [9, 21]
 * Retourne null pour les fréquences périodiques (non-quotidiennes)
 */
export function parseFrequencyToHours(frequency: string): number[] | null {
  const lower = frequency.toLowerCase()

  // Fréquences périodiques: retourner null
  if (isPeriodicFrequency(frequency)) {
    return null
  }

  if (lower.includes('2x/jour') || lower.includes('2 fois')) {
    return [9, 21] // 9h et 21h
  }
  if (lower.includes('3x/jour') || lower.includes('3 fois')) {
    return [8, 14, 20] // 8h, 14h, 20h
  }
  if (
    lower.includes('1x/jour') ||
    lower.includes('quotidien') ||
    lower.includes('tous les jours')
  ) {
    return [9] // 9h
  }

  // Par défaut: 9h (quotidien)
  return [9]
}

/**
 * Extrait les horaires de notification d'un médicament
 * En mode avancé, utilise les scheduledTimes explicites
 * En mode simple, parse la fréquence
 * Retourne un tableau vide pour les fréquences périodiques sans horaires explicites
 */
export function getMedicationReminderTimes(medication: {
  schedulingMode?: 'simple' | 'advanced'
  scheduledTimes?: string[]
  frequency: string
}): string[] {
  // Mode avancé: utiliser les horaires explicites
  if (medication.schedulingMode === 'advanced' && medication.scheduledTimes?.length) {
    return medication.scheduledTimes
  }

  // Mode simple: parser la fréquence en horaires par défaut
  const hours = parseFrequencyToHours(medication.frequency)

  // Fréquences périodiques: retourner un horaire par défaut de 9h
  // (la logique de "quel jour" est gérée par shouldTakeMedicationOnDate)
  if (hours === null) {
    return ['09:00']
  }

  return hours.map((h) => `${h.toString().padStart(2, '0')}:00`)
}

// === MODULE PREFERENCES ===

/**
 * Récupère les préférences de visibilité des modules
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
    // Suivi des coûts désactivé par défaut
    costTrackingEnabled: localStorage.getItem(STORAGE_KEYS.costTrackingEnabled) === 'true',
  }
}

/**
 * Sauvegarde les préférences de visibilité des modules
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
 * Vérifie si l'auto-validation est activée
 */
export function isAutoValidationEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('medication-auto-validation') === 'true'
}

/**
 * Vérifie si un horaire prévu est déjà passé aujourd'hui
 * @param scheduledTime Horaire au format "HH:MM"
 * @returns true si l'horaire est passé
 */
export function isScheduledTimePassed(scheduledTime: string): boolean {
  const now = new Date()
  const [hours, minutes] = scheduledTime.split(':').map(Number)

  const scheduledDateTime = new Date()
  scheduledDateTime.setHours(hours, minutes, 0, 0)

  return now >= scheduledDateTime
}
