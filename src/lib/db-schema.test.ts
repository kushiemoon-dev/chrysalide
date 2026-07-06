import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { db } from './db'

describe('Schéma Dexie', () => {
  it('ouvre la base au dernier numéro de version et expose toutes les tables attendues', async () => {
    await db.open()

    expect(db.name).toBe('ChrysalideDB')
    expect(db.verno).toBe(8)
    expect(db.tables.map((t) => t.name).sort()).toEqual(
      [
        'acts',
        'actTodos',
        'appointments',
        'bloodTests',
        'journalEntries',
        'medicationLogs',
        'medications',
        'milestones',
        'objectives',
        'physicalProgress',
        'practitioners',
        'reminders',
        'treatmentChanges',
        'userProfile',
      ].sort()
    )
  })
})
