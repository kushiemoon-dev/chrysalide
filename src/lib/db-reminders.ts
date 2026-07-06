import { db } from './db-schema'
import type { Reminder } from './types'

// === REMINDERS ===

export async function getReminders(enabledOnly = false) {
  if (enabledOnly) {
    return db.reminders.filter((r) => r.enabled === true).toArray()
  }
  return db.reminders.toArray()
}

export async function getReminder(id: number) {
  return db.reminders.get(id)
}

export async function getRemindersByType(type: Reminder['type']) {
  return db.reminders.where('type').equals(type).toArray()
}

export async function addReminder(reminder: Omit<Reminder, 'id' | 'createdAt'>) {
  return db.reminders.add({
    ...reminder,
    createdAt: new Date(),
  })
}

export async function updateReminder(id: number, updates: Partial<Reminder>) {
  return db.reminders.update(id, updates)
}

export async function deleteReminder(id: number) {
  return db.reminders.delete(id)
}

export async function toggleReminder(id: number, enabled: boolean) {
  return db.reminders.update(id, { enabled })
}
