import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { addDays, set, startOfDay } from 'date-fns'
import { db, addMedication, getMedication, addMedicationLog, getMedicationLogsBetween } from './db'
import { computeMissingAutoValidations } from './auto-validation'
import type { Medication } from './types'

/**
 * Exercises the exact pipeline used by catchUpAutoValidation
 * (medications/+page.svelte) against a real (fake-indexeddb) database, to
 * check that existing users' saved data survives an update: a treatment
 * neglected for months, mixed with genuine manually-logged doses, must
 * back-fill without duplicating real entries and without corrupting stock.
 */

beforeEach(async () => {
  await db.medications.clear()
  await db.medicationLogs.clear()
})

async function runCatchUp(medications: Medication[], now: Date) {
  const earliestStart = medications.reduce((earliest, med) => {
    const start = new Date(med.startDate)
    return start < earliest ? start : earliest
  }, new Date(medications[0]!.startDate))
  const rangeStart = startOfDay(earliestStart)

  const existingLogs = await getMedicationLogsBetween(rangeStart, now)
  const pending = computeMissingAutoValidations({ medications, existingLogs, now, enabled: true })

  for (const dose of pending) {
    await addMedicationLog({
      medicationId: dose.medicationId,
      timestamp: dose.timestamp,
      taken: true,
      scheduledTime: dose.scheduledTime,
      doseIndex: dose.doseIndex,
      notes: 'Auto-validé',
    })
  }

  return pending
}

describe('Rattrapage sur un traitement négligé (scénario utilisateur existant)', () => {
  it('comble 60 jours de trou sans dupliquer les prises déjà loguées, et sans stock négatif', async () => {
    const startDate = new Date('2024-01-01')
    // Midi pour être sûr que la dose de 9h du jour 60 est déjà passée.
    const now = set(addDays(startDate, 60), { hours: 12 })

    const medId = (await addMedication({
      name: 'Traitement négligé',
      type: 'estrogen',
      dosage: 2,
      unit: 'mg',
      frequency: '1x/jour',
      method: 'pill',
      startDate,
      stock: 10,
      isActive: true,
    })) as number

    // Deux jours où la personne a réellement cliqué "pris" elle-même,
    // avant que l'app ne soit délaissée.
    await addMedicationLog({
      medicationId: medId,
      timestamp: addDays(startDate, 10),
      taken: true,
      scheduledTime: '09:00',
    })
    await addMedicationLog({
      medicationId: medId,
      timestamp: addDays(startDate, 30),
      taken: true,
      scheduledTime: '09:00',
    })

    const medication = (await getMedication(medId))!
    const pending = await runCatchUp([medication], now)

    // 61 jours (0 à 60 inclus) moins les 2 déjà loguées manuellement.
    expect(pending).toHaveLength(59)

    const allLogs = await db.medicationLogs.where('medicationId').equals(medId).toArray()
    expect(allLogs).toHaveLength(61)

    // Les deux prises manuelles n'ont pas été dupliquées.
    const day10Logs = allLogs.filter(
      (log) => new Date(log.timestamp).toDateString() === addDays(startDate, 10).toDateString()
    )
    expect(day10Logs).toHaveLength(1)

    // Le stock ne descend jamais sous zéro même avec 61 prises pour 10 unités.
    const updatedMedication = await getMedication(medId)
    expect(updatedMedication?.stock).toBe(0)
  })

  it('respecte un médicament désactivé entre-temps (ne rattrape rien après isActive=false)', async () => {
    const startDate = new Date('2024-01-01')
    const now = addDays(startDate, 30)

    const medId = (await addMedication({
      name: 'Traitement arrêté',
      type: 'estrogen',
      dosage: 2,
      unit: 'mg',
      frequency: '1x/jour',
      method: 'pill',
      startDate,
      stock: 10,
      isActive: false,
    })) as number

    const medication = (await getMedication(medId))!
    const pending = await runCatchUp([medication], now)

    expect(pending).toHaveLength(0)
    const stockAfter = await getMedication(medId)
    expect(stockAfter?.stock).toBe(10)
  })
})
