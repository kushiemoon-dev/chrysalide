import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getMedicationReminderTimes,
  shouldShowReminder,
  getShownReminderIds,
  markReminderShown,
  getTodayReminders,
  checkReminders,
} from './notification-scheduler'
import { db, addMedication } from './db'
import type { Medication } from './types'

const baseMedication: Medication = {
  id: 1,
  name: 'Test',
  type: 'estrogen',
  dosage: 1,
  unit: 'mg',
  frequency: '1x/jour',
  method: 'pill',
  startDate: new Date('2024-01-01'),
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

describe('getMedicationReminderTimes', () => {
  it('mode avancé retourne les horaires explicites', () => {
    const result = getMedicationReminderTimes({
      ...baseMedication,
      schedulingMode: 'advanced',
      scheduledTimes: ['07:30', '19:30'],
    })
    expect(result).toEqual(['07:30', '19:30'])
  })

  it('fréquence "3x/jour" retourne trois horaires', () => {
    const result = getMedicationReminderTimes({ ...baseMedication, frequency: '3x/jour' })
    expect(result).toEqual(['08:00', '14:00', '20:00'])
  })

  it('fréquence "3 fois par jour" retourne trois horaires', () => {
    const result = getMedicationReminderTimes({ ...baseMedication, frequency: '3 fois par jour' })
    expect(result).toEqual(['08:00', '14:00', '20:00'])
  })

  it('fréquence "2x/jour" retourne deux horaires', () => {
    const result = getMedicationReminderTimes({ ...baseMedication, frequency: '2x/jour' })
    expect(result).toEqual(['09:00', '21:00'])
  })

  it('fréquence "2 fois" retourne deux horaires', () => {
    const result = getMedicationReminderTimes({ ...baseMedication, frequency: '2 fois' })
    expect(result).toEqual(['09:00', '21:00'])
  })

  it('fréquence "4x/jour" retourne quatre horaires', () => {
    const result = getMedicationReminderTimes({ ...baseMedication, frequency: '4x/jour' })
    expect(result).toEqual(['08:00', '12:00', '17:00', '22:00'])
  })

  it('fréquence "4 fois" retourne quatre horaires', () => {
    const result = getMedicationReminderTimes({ ...baseMedication, frequency: '4 fois' })
    expect(result).toEqual(['08:00', '12:00', '17:00', '22:00'])
  })

  it('fréquence non reconnue retombe sur un rappel quotidien par défaut', () => {
    const result = getMedicationReminderTimes({ ...baseMedication, frequency: '1x/jour' })
    expect(result).toEqual(['09:00'])
  })
})

describe('shouldShowReminder', () => {
  const now = 1_700_000_000_000
  const reminder = {
    id: 'med1-09:00',
    medicationId: 'med1',
    medicationName: 'Test',
    scheduledTime: '09:00',
    scheduledTimestamp: now,
    shown: false,
  }

  it('déjà montré → false', () => {
    expect(shouldShowReminder(reminder, [reminder.id], now)).toBe(false)
  })

  it('pas encore dû → false', () => {
    const future = { ...reminder, scheduledTimestamp: now + 120_000 }
    expect(shouldShowReminder(future, [], now)).toBe(false)
  })

  it('plus de 30 minutes de retard → false', () => {
    const late = { ...reminder, scheduledTimestamp: now - 31 * 60_000 }
    expect(shouldShowReminder(late, [], now)).toBe(false)
  })

  it('dû et pas montré → true', () => {
    const due = { ...reminder, scheduledTimestamp: now - 1000 }
    expect(shouldShowReminder(due, [], now)).toBe(true)
  })
})

describe('getShownReminderIds / markReminderShown', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('aucune entrée en storage → tableau vide', () => {
    expect(getShownReminderIds()).toEqual([])
  })

  it("JSON invalide en storage → tableau vide, pas d'exception", () => {
    localStorage.setItem('chrysalide_pending_reminders', 'not-json')
    expect(getShownReminderIds()).toEqual([])
  })

  it('changement de jour → réinitialise les IDs montrés', () => {
    localStorage.setItem(
      'chrysalide_pending_reminders',
      JSON.stringify({ date: new Date('2020-01-01').toDateString(), shownIds: ['stale-id'] })
    )
    expect(getShownReminderIds()).toEqual([])
  })
})

describe('getTodayReminders', () => {
  beforeEach(async () => {
    await db.medications.clear()
  })

  it('exclut les médicaments inactifs', async () => {
    await addMedication({ ...baseMedication, id: undefined, isActive: false })
    const activeId = await addMedication({ ...baseMedication, id: undefined, isActive: true })

    const reminders = await getTodayReminders()
    expect(reminders).toHaveLength(1)
    expect(reminders[0]!.medicationId).toBe(String(activeId))
  })

  it('trie les rappels par horaire croissant', async () => {
    await addMedication({
      ...baseMedication,
      id: undefined,
      isActive: true,
      schedulingMode: 'advanced',
      scheduledTimes: ['15:00'],
    })
    await addMedication({
      ...baseMedication,
      id: undefined,
      isActive: true,
      schedulingMode: 'advanced',
      scheduledTimes: ['08:00'],
    })

    const reminders = await getTodayReminders()
    expect(reminders[0]!.scheduledTime).toBe('08:00')
  })
})

describe('checkReminders', () => {
  beforeEach(async () => {
    await db.medications.clear()
    localStorage.clear()
  })

  it('marque un rappel dû comme montré', async () => {
    localStorage.setItem('chrysalide_notifications_enabled', 'true')
    vi.stubGlobal(
      'Notification',
      class {
        static permission = 'granted'
        constructor() {}
      }
    )

    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const medId = await addMedication({
      ...baseMedication,
      id: undefined,
      isActive: true,
      schedulingMode: 'advanced',
      scheduledTimes: [currentTime],
    })

    await checkReminders()

    expect(getShownReminderIds()).toContain(`${medId}-${currentTime}`)
  })
})
