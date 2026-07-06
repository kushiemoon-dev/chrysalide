import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  db,
  getTreatmentChanges,
  getTreatmentChange,
  getTreatmentChangesByDateRange,
  addTreatmentChange,
  deleteTreatmentChange,
  recordTreatmentChange,
} from './db'
import type { Medication, TreatmentChange } from './types'

const baseChange: Omit<TreatmentChange, 'id' | 'createdAt'> = {
  medicationId: 1,
  medicationName: 'Estradiol',
  changeType: 'started',
  date: new Date('2024-01-01'),
}

const medication: Medication = {
  id: 1,
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
}

beforeEach(async () => {
  await db.treatmentChanges.clear()
})

describe('Treatment changes CRUD', () => {
  it('addTreatmentChange crée une entrée avec createdAt', async () => {
    const id = await addTreatmentChange(baseChange)
    const change = await getTreatmentChange(id as number)
    expect(change?.medicationName).toBe('Estradiol')
    expect(change?.createdAt).toBeInstanceOf(Date)
  })

  it('getTreatmentChanges filtre par médicament si fourni, sinon trie par date décroissante', async () => {
    await addTreatmentChange({ ...baseChange, date: new Date('2024-01-01') })
    await addTreatmentChange({ ...baseChange, medicationId: 2, date: new Date('2024-02-01') })

    const forMed1 = await getTreatmentChanges(1)
    expect(forMed1).toHaveLength(1)

    const all = await getTreatmentChanges()
    expect(all).toHaveLength(2)
    expect(all[0].medicationId).toBe(2)
  })

  it('getTreatmentChangesByDateRange filtre par intervalle inclusif', async () => {
    await addTreatmentChange({ ...baseChange, date: new Date('2024-01-01') })
    await addTreatmentChange({ ...baseChange, date: new Date('2024-03-01') })

    const changes = await getTreatmentChangesByDateRange(
      new Date('2023-12-01'),
      new Date('2024-02-01')
    )
    expect(changes).toHaveLength(1)
  })

  it('deleteTreatmentChange supprime l’entrée', async () => {
    const id = await addTreatmentChange(baseChange)
    await deleteTreatmentChange(id as number)
    expect(await getTreatmentChange(id as number)).toBeUndefined()
  })

  it('recordTreatmentChange construit l’entrée à partir du médicament', async () => {
    const id = await recordTreatmentChange(medication, 'dosage_change', '2mg', '4mg', 'Titration')
    const change = await getTreatmentChange(id as number)
    expect(change?.medicationId).toBe(1)
    expect(change?.medicationName).toBe('Estradiol')
    expect(change?.changeType).toBe('dosage_change')
    expect(change?.oldValue).toBe('2mg')
    expect(change?.newValue).toBe('4mg')
    expect(change?.reason).toBe('Titration')
  })
})
