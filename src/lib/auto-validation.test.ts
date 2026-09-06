import { describe, it, expect } from 'vitest'
import { computeMissingAutoValidations } from './auto-validation'
import type { Medication, MedicationLog } from './types'

function makeMedication(overrides: Partial<Medication> = {}): Medication {
  return {
    id: 1,
    name: 'Test',
    type: 'estrogen',
    dosage: 1,
    unit: 'comprimé',
    frequency: '1x/jour',
    method: 'pill',
    startDate: new Date('2024-01-01'),
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }
}

describe('computeMissingAutoValidations', () => {
  it("ne retourne rien quand l'option est désactivée", () => {
    const med = makeMedication({ startDate: new Date('2024-01-01') })
    const result = computeMissingAutoValidations({
      medications: [med],
      existingLogs: [],
      now: new Date('2024-01-05T12:00:00'),
      enabled: false,
    })
    expect(result).toEqual([])
  })

  it("ne retourne rien s'il n'y a aucun trou (déjà loguée aujourd'hui)", () => {
    const med = makeMedication({ startDate: new Date('2024-01-05') })
    const logs: MedicationLog[] = [
      { medicationId: 1, timestamp: new Date('2024-01-05T09:00:00'), taken: true },
    ]
    const result = computeMissingAutoValidations({
      medications: [med],
      existingLogs: logs,
      now: new Date('2024-01-05T12:00:00'),
      enabled: true,
    })
    expect(result).toEqual([])
  })

  it("comble un trou d'un seul jour (hier)", () => {
    const med = makeMedication({ startDate: new Date('2024-01-04') })
    const result = computeMissingAutoValidations({
      medications: [med],
      existingLogs: [],
      now: new Date('2024-01-05T12:00:00'),
      enabled: true,
    })
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      medicationId: 1,
      scheduledTime: '09:00',
      doseIndex: 0,
      timestamp: new Date('2024-01-04T09:00:00'),
    })
    expect(result[1]).toMatchObject({
      medicationId: 1,
      scheduledTime: '09:00',
      doseIndex: 0,
      timestamp: new Date('2024-01-05T09:00:00'),
    })
  })

  it('comble un trou de plusieurs jours (app fermée une semaine)', () => {
    const med = makeMedication({ startDate: new Date('2024-01-01') })
    const result = computeMissingAutoValidations({
      medications: [med],
      existingLogs: [],
      now: new Date('2024-01-08T12:00:00'),
      enabled: true,
    })
    expect(result).toHaveLength(8) // 1er au 8 janvier inclus
  })

  it("ignore la dose du jour si son horaire n'est pas encore passé", () => {
    const med = makeMedication({ startDate: new Date('2024-01-05') })
    const result = computeMissingAutoValidations({
      medications: [med],
      existingLogs: [],
      now: new Date('2024-01-05T08:00:00'), // avant 9h
      enabled: true,
    })
    expect(result).toEqual([])
  })

  it('ne remonte pas avant la date de début du traitement', () => {
    const med = makeMedication({ startDate: new Date('2024-01-05') })
    const result = computeMissingAutoValidations({
      medications: [med],
      existingLogs: [],
      now: new Date('2024-01-05T12:00:00'),
      enabled: true,
    })
    expect(result).toHaveLength(1)
  })

  it('ne remonte pas après la date de fin du traitement', () => {
    const med = makeMedication({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-03'),
    })
    const result = computeMissingAutoValidations({
      medications: [med],
      existingLogs: [],
      now: new Date('2024-01-08T12:00:00'),
      enabled: true,
    })
    expect(result).toHaveLength(3) // 1, 2, 3 janvier seulement
  })

  it('ignore un médicament inactif', () => {
    const med = makeMedication({ startDate: new Date('2024-01-01'), isActive: false })
    const result = computeMissingAutoValidations({
      medications: [med],
      existingLogs: [],
      now: new Date('2024-01-05T12:00:00'),
      enabled: true,
    })
    expect(result).toEqual([])
  })

  it('respecte les fréquences périodiques (1x/semaine)', () => {
    const med = makeMedication({ startDate: new Date('2024-01-01'), frequency: '1x/semaine' })
    const result = computeMissingAutoValidations({
      medications: [med],
      existingLogs: [],
      now: new Date('2024-01-15T12:00:00'),
      enabled: true,
    })
    // jours 1, 8, 15 (interval de 7 jours depuis le 1er)
    expect(result).toHaveLength(3)
    expect(result.map((r) => r.timestamp.getDate())).toEqual([1, 8, 15])
  })

  it('respecte un log sans scheduledTime (mode simple) pour ne pas dupliquer', () => {
    const med = makeMedication({ startDate: new Date('2024-01-05') })
    const logs: MedicationLog[] = [
      { medicationId: 1, timestamp: new Date('2024-01-05T10:00:00'), taken: true },
    ]
    const result = computeMissingAutoValidations({
      medications: [med],
      existingLogs: logs,
      now: new Date('2024-01-05T12:00:00'),
      enabled: true,
    })
    expect(result).toEqual([])
  })

  it('gère un jour multi-doses : ne comble que les créneaux non couverts', () => {
    const med = makeMedication({
      startDate: new Date('2024-01-05'),
      frequency: '2x/jour',
    })
    const logs: MedicationLog[] = [
      {
        medicationId: 1,
        timestamp: new Date('2024-01-05T09:00:00'),
        taken: true,
        scheduledTime: '09:00',
      },
    ]
    const result = computeMissingAutoValidations({
      medications: [med],
      existingLogs: logs,
      now: new Date('2024-01-05T23:00:00'),
      enabled: true,
    })
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ scheduledTime: '21:00', doseIndex: 1 })
  })
})
