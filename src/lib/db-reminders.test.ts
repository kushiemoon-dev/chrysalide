import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  db,
  getReminders,
  getReminder,
  getRemindersByType,
  addReminder,
  updateReminder,
  deleteReminder,
  toggleReminder,
} from './db'
import type { Reminder } from './types'

const baseReminder: Omit<Reminder, 'id' | 'createdAt'> = {
  type: 'medication',
  title: 'Prendre le traitement',
  schedule: '08:00',
  enabled: true,
}

beforeEach(async () => {
  await db.reminders.clear()
})

describe('Reminders CRUD', () => {
  it('addReminder crée un rappel avec createdAt', async () => {
    const id = await addReminder(baseReminder)
    const reminder = await getReminder(id as number)
    expect(reminder?.title).toBe('Prendre le traitement')
    expect(reminder?.createdAt).toBeInstanceOf(Date)
  })

  it('getReminders(true) ne retourne que les rappels activés', async () => {
    await addReminder(baseReminder)
    await addReminder({ ...baseReminder, title: 'Désactivé', enabled: false })

    expect(await getReminders(true)).toHaveLength(1)
    expect(await getReminders(false)).toHaveLength(2)
  })

  it('getRemindersByType filtre par type', async () => {
    await addReminder(baseReminder)
    await addReminder({ ...baseReminder, type: 'appointment', title: 'RDV' })

    const appointmentReminders = await getRemindersByType('appointment')
    expect(appointmentReminders).toHaveLength(1)
    expect(appointmentReminders[0]!.title).toBe('RDV')
  })

  it('updateReminder met à jour les champs', async () => {
    const id = await addReminder(baseReminder)
    await updateReminder(id as number, { title: 'Nouveau titre' })
    const reminder = await getReminder(id as number)
    expect(reminder?.title).toBe('Nouveau titre')
  })

  it('toggleReminder active/désactive un rappel', async () => {
    const id = await addReminder(baseReminder)
    await toggleReminder(id as number, false)
    expect((await getReminder(id as number))?.enabled).toBe(false)
  })

  it('deleteReminder supprime le rappel', async () => {
    const id = await addReminder(baseReminder)
    await deleteReminder(id as number)
    expect(await getReminder(id as number)).toBeUndefined()
  })
})
