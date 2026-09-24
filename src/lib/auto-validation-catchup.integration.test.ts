import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { addDays, set } from 'date-fns'
import { db, addMedication, getMedication, addMedicationLog } from './db'
import { runAutoValidationCatchUp } from './auto-validation-catchup'

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
  localStorage.clear()
  localStorage.setItem('medication-auto-validation', 'true')
  // No prior catch-up run recorded: matches the local test helper's old
  // default `since = new Date(0)`.
  localStorage.setItem('chrysalide_auto_validation_since', new Date(0).toISOString())
})

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

    const count = await runAutoValidationCatchUp(now)

    // 61 jours (0 à 60 inclus) moins les 2 déjà loguées manuellement.
    expect(count).toBe(59)

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

    const count = await runAutoValidationCatchUp(now)

    expect(count).toBe(0)
    const stockAfter = await getMedication(medId)
    expect(stockAfter?.stock).toBe(10)
  })

  it("deux appels concurrents ne produisent qu'un seul passage de rattrapage (pas de doublon)", async () => {
    const startDate = new Date('2024-01-01')
    const now = set(addDays(startDate, 5), { hours: 12 })

    const medId = (await addMedication({
      name: 'Traitement concurrent',
      type: 'estrogen',
      dosage: 2,
      unit: 'mg',
      frequency: '1x/jour',
      method: 'pill',
      startDate,
      stock: 10,
      isActive: true,
    })) as number

    const [countA, countB] = await Promise.all([
      runAutoValidationCatchUp(now),
      runAutoValidationCatchUp(now),
    ])

    // The second call joins the first's in-flight promise instead of
    // starting a second pass: both resolve to the same single-run result.
    expect(countA).toBe(countB)
    expect(countA).toBe(6) // days 0 to 5 inclusive

    const allLogs = await db.medicationLogs.where('medicationId').equals(medId).toArray()
    expect(allLogs).toHaveLength(6)

    const updatedMedication = await getMedication(medId)
    expect(updatedMedication?.stock).toBe(4) // 10 - 6, not 10 - 12
  })
})
