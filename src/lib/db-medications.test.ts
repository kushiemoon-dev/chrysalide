import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  db,
  getMedications,
  getMedication,
  addMedication,
  updateMedication,
  deleteMedication,
  getMedicationLogs,
  getLastMedicationLog,
  getTodayLogs,
  getYesterdayLogs,
  getTodayLogsForMedication,
  addMedicationLog,
  updateMedicationLog,
  deleteMedicationLog,
  getMedicationLog,
  getGelApplicationHistory,
  getMedicationsWithLowStock,
} from './db'
import type { Medication } from './types'

const baseMedication: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Estradiol',
  type: 'estrogen',
  dosage: 2,
  unit: 'mg',
  frequency: '1x/jour',
  method: 'pill',
  startDate: new Date('2024-01-01'),
  isActive: true,
}

beforeEach(async () => {
  await db.medications.clear()
  await db.medicationLogs.clear()
})

describe('Medications CRUD', () => {
  it('addMedication crée un médicament avec createdAt/updatedAt', async () => {
    const id = await addMedication(baseMedication)
    const med = await getMedication(id as number)
    expect(med?.name).toBe('Estradiol')
    expect(med?.createdAt).toBeInstanceOf(Date)
    expect(med?.updatedAt).toBeInstanceOf(Date)
  })

  it('getMedications(true) ne retourne que les médicaments actifs', async () => {
    await addMedication(baseMedication)
    await addMedication({ ...baseMedication, name: 'Inactif', isActive: false })

    const active = await getMedications(true)
    const all = await getMedications(false)

    expect(active).toHaveLength(1)
    expect(active[0].name).toBe('Estradiol')
    expect(all).toHaveLength(2)
  })

  it('updateMedication met à jour les champs et updatedAt', async () => {
    const id = await addMedication(baseMedication)
    const before = await getMedication(id as number)

    await updateMedication(id as number, { dosage: 4 })
    const after = await getMedication(id as number)

    expect(after?.dosage).toBe(4)
    expect(after?.updatedAt.getTime()).toBeGreaterThanOrEqual(before!.updatedAt.getTime())
  })

  it('deleteMedication supprime le médicament', async () => {
    const id = await addMedication(baseMedication)
    await deleteMedication(id as number)
    const med = await getMedication(id as number)
    expect(med).toBeUndefined()
  })
})

describe('Medication logs', () => {
  it('addMedicationLog décrémente le stock si taken=true et stock défini', async () => {
    const medId = await addMedication({ ...baseMedication, stock: 10 })

    await addMedicationLog({ medicationId: medId as number, timestamp: new Date(), taken: true })

    const med = await getMedication(medId as number)
    expect(med?.stock).toBe(9)
  })

  it('addMedicationLog ne touche pas le stock si taken=false', async () => {
    const medId = await addMedication({ ...baseMedication, stock: 10 })

    await addMedicationLog({ medicationId: medId as number, timestamp: new Date(), taken: false })

    const med = await getMedication(medId as number)
    expect(med?.stock).toBe(10)
  })

  it('addMedicationLog ne décrémente pas sous 0 (stock déjà à 0)', async () => {
    const medId = await addMedication({ ...baseMedication, stock: 0 })

    await addMedicationLog({ medicationId: medId as number, timestamp: new Date(), taken: true })

    const med = await getMedication(medId as number)
    expect(med?.stock).toBe(0)
  })

  it('getMedicationLogs trie par timestamp décroissant et respecte la limite', async () => {
    const medId = await addMedication(baseMedication)
    await addMedicationLog({
      medicationId: medId as number,
      timestamp: new Date('2024-01-01'),
      taken: true,
    })
    await addMedicationLog({
      medicationId: medId as number,
      timestamp: new Date('2024-01-03'),
      taken: true,
    })
    await addMedicationLog({
      medicationId: medId as number,
      timestamp: new Date('2024-01-02'),
      taken: true,
    })

    const logs = await getMedicationLogs(medId as number, 2)
    expect(logs).toHaveLength(2)
    expect(logs[0].timestamp.toISOString()).toBe(new Date('2024-01-03').toISOString())
    expect(logs[1].timestamp.toISOString()).toBe(new Date('2024-01-02').toISOString())
  })

  it('getLastMedicationLog retourne null si aucun log', async () => {
    const medId = await addMedication(baseMedication)
    expect(await getLastMedicationLog(medId as number)).toBeNull()
  })

  it('getLastMedicationLog retourne le log le plus récent', async () => {
    const medId = await addMedication(baseMedication)
    await addMedicationLog({
      medicationId: medId as number,
      timestamp: new Date('2024-01-01'),
      taken: true,
    })
    const id2 = await addMedicationLog({
      medicationId: medId as number,
      timestamp: new Date('2024-01-05'),
      taken: true,
    })

    const last = await getLastMedicationLog(medId as number)
    expect(last?.id).toBe(id2)
  })

  it("getTodayLogs / getYesterdayLogs isolent bien aujourd'hui vs hier", async () => {
    const medId = await addMedication(baseMedication)
    const now = new Date()
    const todayNoon = new Date(now)
    todayNoon.setHours(12, 0, 0, 0)
    const yesterdayNoon = new Date(now)
    yesterdayNoon.setDate(yesterdayNoon.getDate() - 1)
    yesterdayNoon.setHours(12, 0, 0, 0)

    await addMedicationLog({ medicationId: medId as number, timestamp: todayNoon, taken: true })
    await addMedicationLog({ medicationId: medId as number, timestamp: yesterdayNoon, taken: true })

    const today = await getTodayLogs()
    const yesterday = await getYesterdayLogs()

    expect(today).toHaveLength(1)
    expect(today[0].timestamp.toISOString()).toBe(todayNoon.toISOString())
    expect(yesterday).toHaveLength(1)
    expect(yesterday[0].timestamp.toISOString()).toBe(yesterdayNoon.toISOString())
  })

  it("getTodayLogsForMedication filtre par médicament et par aujourd'hui", async () => {
    const medId = await addMedication(baseMedication)
    const otherMedId = await addMedication({ ...baseMedication, name: 'Autre' })
    const todayNoon = new Date()
    todayNoon.setHours(12, 0, 0, 0)

    await addMedicationLog({ medicationId: medId as number, timestamp: todayNoon, taken: true })
    await addMedicationLog({
      medicationId: otherMedId as number,
      timestamp: todayNoon,
      taken: true,
    })

    const logs = await getTodayLogsForMedication(medId as number)
    expect(logs).toHaveLength(1)
    expect(logs[0].medicationId).toBe(medId)
  })

  it('updateMedicationLog / deleteMedicationLog / getMedicationLog', async () => {
    const medId = await addMedication(baseMedication)
    const logId = await addMedicationLog({
      medicationId: medId as number,
      timestamp: new Date(),
      taken: false,
    })

    await updateMedicationLog(logId as number, { taken: true })
    let log = await getMedicationLog(logId as number)
    expect(log?.taken).toBe(true)

    await deleteMedicationLog(logId as number)
    log = await getMedicationLog(logId as number)
    expect(log).toBeUndefined()
  })

  it('getGelApplicationHistory ne retourne que les logs avec applicationZone', async () => {
    const medId = await addMedication({ ...baseMedication, method: 'gel' })
    await addMedicationLog({ medicationId: medId as number, timestamp: new Date(), taken: true })
    await addMedicationLog({
      medicationId: medId as number,
      timestamp: new Date(),
      taken: true,
      applicationZone: 'forearm_left',
    })

    const history = await getGelApplicationHistory(medId as number)
    expect(history).toHaveLength(1)
    expect(history[0].applicationZone).toBe('forearm_left')
  })
})

describe('Stock alerts', () => {
  it('getMedicationsWithLowStock ne retourne que les médicaments actifs sous le seuil', async () => {
    await addMedication({ ...baseMedication, name: 'Bas', stock: 2, stockAlert: 5 })
    await addMedication({ ...baseMedication, name: 'OK', stock: 10, stockAlert: 5 })
    await addMedication({
      ...baseMedication,
      name: 'Inactif bas',
      stock: 1,
      stockAlert: 5,
      isActive: false,
    })

    const lowStock = await getMedicationsWithLowStock()
    expect(lowStock).toHaveLength(1)
    expect(lowStock[0].name).toBe('Bas')
  })
})
