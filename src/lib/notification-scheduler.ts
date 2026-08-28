/**
 * Notification Scheduler for Chrysalide
 * Handles scheduling and delivery of medication reminders
 *
 * @version 1.0.0
 */

import { db } from './db'
import type { Medication } from './types'

// Storage keys for notification state
const STORAGE_KEYS = {
  lastReminderCheck: 'chrysalide_last_reminder_check',
  pendingReminders: 'chrysalide_pending_reminders',
  snoozedReminders: 'chrysalide_snoozed_reminders',
} as const

export interface ScheduledReminder {
  id: string
  medicationId: string
  medicationName: string
  scheduledTime: string // HH:MM format
  scheduledTimestamp: number
  shown: boolean
}

/**
 * Check if Service Worker is supported and registered
 */
async function getServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[NotificationScheduler] Service Worker not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    return registration
  } catch (error) {
    console.error('[NotificationScheduler] Service Worker not ready:', error)
    return null
  }
}

/**
 * Check if notifications are enabled and permitted
 */
export function isNotificationEnabled(): boolean {
  if (typeof window === 'undefined') return false

  const enabled = localStorage.getItem('chrysalide_notifications_enabled') === 'true'
  const permitted = 'Notification' in window && Notification.permission === 'granted'

  return enabled && permitted
}

/**
 * Get today's scheduled reminders for all active medications
 */
export async function getTodayReminders(): Promise<ScheduledReminder[]> {
  const medications = await db.medications.toArray()
  const today = new Date()
  const reminders: ScheduledReminder[] = []

  for (const med of medications) {
    if (!med.isActive) continue

    // Get reminder times for this medication
    const times = getMedicationReminderTimes(med)

    for (const time of times) {
      const [hours, minutes] = time.split(':').map(Number)
      const scheduledDate = new Date(today)
      scheduledDate.setHours(hours!, minutes!, 0, 0)

      reminders.push({
        id: `${med.id}-${time}`,
        medicationId: String(med.id),
        medicationName: med.name,
        scheduledTime: time,
        scheduledTimestamp: scheduledDate.getTime(),
        shown: false,
      })
    }
  }

  // Sort by time
  return reminders.sort((a, b) => a.scheduledTimestamp - b.scheduledTimestamp)
}

/**
 * Get reminder times for a medication
 */
export function getMedicationReminderTimes(medication: Medication): string[] {
  // Advanced mode: use explicit scheduled times
  if (medication.schedulingMode === 'advanced' && medication.scheduledTimes?.length) {
    return medication.scheduledTimes
  }

  // Simple mode: derive from frequency
  const frequency = medication.frequency.toLowerCase()

  if (frequency.includes('3x') || frequency.includes('3 fois')) {
    return ['08:00', '14:00', '20:00']
  }
  if (frequency.includes('2x') || frequency.includes('2 fois')) {
    return ['09:00', '21:00']
  }
  if (frequency.includes('4x') || frequency.includes('4 fois')) {
    return ['08:00', '12:00', '17:00', '22:00']
  }

  // Default: once daily at 9:00
  return ['09:00']
}

export function shouldShowReminder(
  reminder: ScheduledReminder,
  shownIds: string[],
  now: number
): boolean {
  if (shownIds.includes(reminder.id)) return false
  if (reminder.scheduledTimestamp > now + 60000) return false
  if (now - reminder.scheduledTimestamp > 30 * 60000) return false
  return true
}

/**
 * Check for reminders that should be shown now
 */
export async function checkReminders(): Promise<void> {
  if (!isNotificationEnabled()) return

  const now = Date.now()
  const reminders = await getTodayReminders()
  const shownIds = getShownReminderIds()

  for (const reminder of reminders) {
    if (!shouldShowReminder(reminder, shownIds, now)) continue

    await showReminder(reminder)
    markReminderShown(reminder.id)
  }

  // Update last check time
  localStorage.setItem(STORAGE_KEYS.lastReminderCheck, String(now))
}

/**
 * Show a reminder notification
 */
async function showReminder(reminder: ScheduledReminder): Promise<void> {
  const sw = await getServiceWorker()

  if (sw) {
    // Use Service Worker for better reliability
    sw.active?.postMessage({
      type: 'SHOW_NOTIFICATION',
      payload: {
        title: `💊 ${reminder.medicationName}`,
        body: `Time for your ${reminder.scheduledTime} dose`,
        tag: `medication-${reminder.id}`,
        data: {
          medicationId: reminder.medicationId,
          scheduledTime: reminder.scheduledTime,
        },
      },
    })
  } else {
    // Fallback to regular notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`💊 ${reminder.medicationName}`, {
        body: `Time for your ${reminder.scheduledTime} dose`,
        icon: '/icon-192.png',
        tag: `medication-${reminder.id}`,
        requireInteraction: true,
      })
    }
  }
}

/**
 * Get IDs of reminders already shown today
 */
export function getShownReminderIds(): string[] {
  const today = new Date().toDateString()
  const stored = localStorage.getItem(STORAGE_KEYS.pendingReminders)

  if (!stored) return []

  try {
    const data = JSON.parse(stored)
    if (data.date !== today) {
      // New day, reset
      localStorage.removeItem(STORAGE_KEYS.pendingReminders)
      return []
    }
    return data.shownIds || []
  } catch {
    return []
  }
}

/**
 * Mark a reminder as shown
 */
export function markReminderShown(reminderId: string): void {
  const today = new Date().toDateString()
  const shownIds = getShownReminderIds()

  if (!shownIds.includes(reminderId)) {
    shownIds.push(reminderId)
  }

  localStorage.setItem(
    STORAGE_KEYS.pendingReminders,
    JSON.stringify({
      date: today,
      shownIds,
    })
  )
}

// Singleton interval ID to prevent multiple services
let reminderIntervalId: ReturnType<typeof setInterval> | null = null

/**
 * Start the reminder check interval
 * Should be called when app loads
 * Safe to call multiple times: only one interval will run
 */
export function startReminderService(): () => void {
  // Prevent multiple intervals
  if (reminderIntervalId !== null) {
    console.log('[NotificationScheduler] Reminder service already running')
    return () => stopReminderService()
  }

  console.log('[NotificationScheduler] Starting reminder service')

  // Initial check
  checkReminders()

  // Check every minute
  reminderIntervalId = setInterval(checkReminders, 60000)

  // Return cleanup function
  return () => stopReminderService()
}

/**
 * Stop the reminder service
 */
export function stopReminderService(): void {
  if (reminderIntervalId !== null) {
    console.log('[NotificationScheduler] Stopping reminder service')
    clearInterval(reminderIntervalId)
    reminderIntervalId = null
  }
}
