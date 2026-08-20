import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, exportAllData, importAllData, addJournalEntry, addAct } from './db'

beforeEach(async () => {
  await Promise.all([
    db.medications.clear(),
    db.medicationLogs.clear(),
    db.bloodTests.clear(),
    db.physicalProgress.clear(),
    db.appointments.clear(),
    db.reminders.clear(),
    db.userProfile.clear(),
    db.journalEntries.clear(),
    db.objectives.clear(),
    db.milestones.clear(),
    db.treatmentChanges.clear(),
    db.practitioners.clear(),
    db.acts.clear(),
    db.actTodos.clear(),
  ])
})

describe('exportAllData', () => {
  it('exporte toutes les tables et exclut les entrées de journal privées', async () => {
    await addJournalEntry({ date: new Date(), content: 'Public', tags: [] })
    await addJournalEntry({ date: new Date(), content: 'Privé', tags: [], isPrivate: true })
    await db.medications.add({
      name: 'Estradiol',
      type: 'estrogen',
      dosage: 2,
      unit: 'mg',
      frequency: '1x/jour',
      method: 'pill',
      startDate: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const data = await exportAllData()

    expect(data.journalEntries).toHaveLength(1)
    expect(data.journalEntries[0]!.content).toBe('Public')
    expect(data.medications).toHaveLength(1)
    expect(data.version).toBe(5)
    expect(typeof data.exportedAt).toBe('string')
  })
})

describe('importAllData', () => {
  it('vide les tables puis réimporte les données en désérialisant les dates (round-trip JSON)', async () => {
    await db.medications.add({
      name: 'Estradiol',
      type: 'estrogen',
      dosage: 2,
      unit: 'mg',
      frequency: '1x/jour',
      method: 'pill',
      startDate: new Date('2024-01-01'),
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })
    const exported = await exportAllData()

    // Simulate a backup persisted as JSON (Date -> string) then reloaded
    const roundTripped = JSON.parse(JSON.stringify(exported)) as typeof exported

    await db.medications.clear()
    // Add pre-existing data that must be cleared by the import
    await db.bloodTests.add({ date: new Date(), results: [], createdAt: new Date() })

    await importAllData(roundTripped)

    const meds = await db.medications.toArray()
    expect(meds).toHaveLength(1)
    expect(meds[0]!.startDate).toBeInstanceOf(Date)
    expect(meds[0]!.startDate.toISOString()).toBe(new Date('2024-01-01').toISOString())
    expect(await db.bloodTests.count()).toBe(0)
  })

  it('replie en objectives les acts d’un backup v7 pur (sans entrée objectives correspondante)', async () => {
    await addAct({
      title: 'FFS',
      category: 'ffs',
      status: 'planning',
      envisagedPractitionerIds: [],
      chosenPractitionerIds: [],
    })
    const exported = await exportAllData()
    const roundTripped = JSON.parse(JSON.stringify(exported)) as typeof exported

    await importAllData(roundTripped)

    const objectives = await db.objectives.toArray()
    const ffsObjective = objectives.find((o) => o.title === 'FFS' && o.source === 'act')
    expect(ffsObjective).toBeDefined()
  })

  it('n’ajoute pas de doublon si le backup contient déjà l’objective fusionnée pour cet act', async () => {
    const exported = await exportAllData()
    const backup: typeof exported = {
      ...exported,
      objectives: [
        {
          id: 1,
          title: 'FFS',
          category: 'medical',
          status: 'not_started',
          source: 'act',
          envisagedPractitionerIds: [],
          chosenPractitionerIds: [],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
      acts: [
        {
          id: 1,
          title: 'FFS',
          category: 'ffs',
          status: 'planning',
          information: undefined,
          notes: undefined,
          envisagedPractitionerIds: [],
          chosenPractitionerIds: [],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
    }
    const roundTripped = JSON.parse(JSON.stringify(backup)) as typeof exported

    await importAllData(roundTripped)

    const objectives = await db.objectives.toArray()
    expect(objectives.filter((o) => o.title === 'FFS')).toHaveLength(1)
  })
})
