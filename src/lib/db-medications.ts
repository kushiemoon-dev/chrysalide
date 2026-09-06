import { db } from './db-schema'
import type { Medication, MedicationLog } from './types'

// Medications
export async function getMedications(activeOnly = true) {
  if (activeOnly) {
    return db.medications.filter((med) => med.isActive === true).toArray()
  }
  return db.medications.toArray()
}

export async function getMedication(id: number) {
  return db.medications.get(id)
}

export async function addMedication(
  medication: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>
) {
  const now = new Date()
  return db.medications.add({
    ...medication,
    createdAt: now,
    updatedAt: now,
  })
}

export async function updateMedication(id: number, updates: Partial<Medication>) {
  return db.medications.update(id, {
    ...updates,
    updatedAt: new Date(),
  })
}

export async function deleteMedication(id: number) {
  return db.medications.delete(id)
}

// Medication Logs
export async function getMedicationLogs(medicationId: number, limit = 30) {
  const logs = await db.medicationLogs.where('medicationId').equals(medicationId).toArray()

  // Sort by timestamp (dose date), not by insertion order
  return logs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

export async function getLastMedicationLog(medicationId: number) {
  const logs = await db.medicationLogs.where('medicationId').equals(medicationId).toArray()

  if (logs.length === 0) return null

  // Return the most recent log
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
}

export async function getTodayLogs() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return db.medicationLogs.where('timestamp').between(today, tomorrow).toArray()
}

/**
 * Gets all logs between two dates (inclusive of `from`, exclusive of `to`)
 * Used to auto-validate doses missed over an arbitrary gap
 */
export async function getMedicationLogsBetween(from: Date, to: Date) {
  return db.medicationLogs.where('timestamp').between(from, to).toArray()
}

/**
 * Gets today's logs for a specific medication
 * Useful for advanced mode: knowing which doses have already been taken
 */
export async function getTodayLogsForMedication(medicationId: number) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return db.medicationLogs
    .where('medicationId')
    .equals(medicationId)
    .filter((log) => {
      const logDate = new Date(log.timestamp)
      return logDate >= today && logDate < tomorrow
    })
    .toArray()
}

export async function addMedicationLog(log: Omit<MedicationLog, 'id'>) {
  const id = await db.medicationLogs.add(log)

  if (log.taken) {
    const medication = await db.medications.get(log.medicationId)
    if (medication && medication.stock !== undefined && medication.stock > 0) {
      await db.medications.update(log.medicationId, {
        stock: medication.stock - 1,
        updatedAt: new Date(),
      })
    }
  }

  return id
}

export async function updateMedicationLog(id: number, updates: Partial<MedicationLog>) {
  return db.medicationLogs.update(id, updates)
}

export async function deleteMedicationLog(id: number) {
  return db.medicationLogs.delete(id)
}

export async function getMedicationLog(id: number) {
  return db.medicationLogs.get(id)
}

// History of application zones for gels
export async function getGelApplicationHistory(medicationId: number, limit = 20) {
  const logs = await db.medicationLogs
    .where('medicationId')
    .equals(medicationId)
    .filter((log) => log.applicationZone !== undefined)
    .toArray()

  // Sort by timestamp (dose date)
  return logs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

// === STOCK ALERTS ===

export async function getMedicationsWithLowStock() {
  const meds = await getMedications(true)
  return meds.filter(
    (med) => med.stock !== undefined && med.stockAlert !== undefined && med.stock <= med.stockAlert
  )
}
