import { db } from './db-schema'
import type { Medication, TreatmentChange } from './types'

// === TREATMENT CHANGES ===

export async function getTreatmentChanges(medicationId?: number, limit = 100) {
  if (medicationId) {
    return db.treatmentChanges
      .where('medicationId')
      .equals(medicationId)
      .reverse()
      .limit(limit)
      .toArray()
  }
  return db.treatmentChanges.orderBy('date').reverse().limit(limit).toArray()
}

export async function getTreatmentChange(id: number) {
  return db.treatmentChanges.get(id)
}

export async function getTreatmentChangesByDateRange(startDate: Date, endDate: Date) {
  return db.treatmentChanges
    .where('date')
    .between(startDate, endDate, true, true)
    .reverse()
    .toArray()
}

export async function addTreatmentChange(change: Omit<TreatmentChange, 'id' | 'createdAt'>) {
  return db.treatmentChanges.add({
    ...change,
    createdAt: new Date(),
  })
}

export async function deleteTreatmentChange(id: number) {
  return db.treatmentChanges.delete(id)
}

// Helper pour enregistrer automatiquement un changement de traitement
export async function recordTreatmentChange(
  medication: Medication,
  changeType: TreatmentChange['changeType'],
  oldValue?: string,
  newValue?: string,
  reason?: string
) {
  return addTreatmentChange({
    medicationId: medication.id!,
    medicationName: medication.name,
    changeType,
    date: new Date(),
    oldValue,
    newValue,
    reason,
  })
}
