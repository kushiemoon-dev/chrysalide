/**
 * Configuration Dexie.js - Base de données locale IndexedDB
 * Toutes les données restent sur l'appareil de l'utilisateur
 */

import Dexie, { type EntityTable } from 'dexie'
import { fuzzySearch } from './utils'
import type {
  Medication,
  MedicationLog,
  BloodTest,
  PhysicalProgress,
  Appointment,
  Reminder,
  UserProfile,
  JournalEntry,
  Objective,
  Milestone,
  TreatmentChange,
  Practitioner,
} from './types'

// Définition de la base de données
const db = new Dexie('ChrysalideDB') as Dexie & {
  medications: EntityTable<Medication, 'id'>
  medicationLogs: EntityTable<MedicationLog, 'id'>
  bloodTests: EntityTable<BloodTest, 'id'>
  physicalProgress: EntityTable<PhysicalProgress, 'id'>
  appointments: EntityTable<Appointment, 'id'>
  reminders: EntityTable<Reminder, 'id'>
  userProfile: EntityTable<UserProfile, 'id'>
  // v0.2.0 - Nouveaux modules
  journalEntries: EntityTable<JournalEntry, 'id'>
  objectives: EntityTable<Objective, 'id'>
  milestones: EntityTable<Milestone, 'id'>
  treatmentChanges: EntityTable<TreatmentChange, 'id'>
  // v0.2.1 - Annuaire praticien·nes
  practitioners: EntityTable<Practitioner, 'id'>
}

// Schéma de la base de données
db.version(1).stores({
  medications: '++id, name, type, isActive, startDate',
  medicationLogs: '++id, medicationId, timestamp, taken',
  bloodTests: '++id, date',
  physicalProgress: '++id, date',
  appointments: '++id, date, type',
  reminders: '++id, type, enabled',
  userProfile: '++id',
})

// Version 2: Ajout de applicationZone pour les gels
db.version(2).stores({
  medications: '++id, name, type, isActive, startDate',
  medicationLogs: '++id, medicationId, timestamp, taken, applicationZone',
  bloodTests: '++id, date',
  physicalProgress: '++id, date',
  appointments: '++id, date, type',
  reminders: '++id, type, enabled',
  userProfile: '++id',
})

// Version 3: v0.2.0 - Journal, Objectifs, Milestones, Historique Traitements
db.version(3).stores({
  medications: '++id, name, type, isActive, startDate',
  medicationLogs: '++id, medicationId, timestamp, taken, applicationZone',
  bloodTests: '++id, date',
  physicalProgress: '++id, date',
  appointments: '++id, date, type',
  reminders: '++id, type, enabled',
  userProfile: '++id',
  // Nouveaux modules v0.2.0
  journalEntries: '++id, date, mood, *tags', // *tags = multi-entry index
  objectives: '++id, category, status, targetDate',
  milestones: '++id, objectiveId, achieved, order',
  treatmentChanges: '++id, medicationId, date, changeType',
})

// Version 4: v0.2.1 - Annuaire praticien·nes
db.version(4).stores({
  medications: '++id, name, type, isActive, startDate',
  medicationLogs: '++id, medicationId, timestamp, taken, applicationZone',
  bloodTests: '++id, date',
  physicalProgress: '++id, date',
  appointments: '++id, date, type',
  reminders: '++id, type, enabled',
  userProfile: '++id',
  journalEntries: '++id, date, mood, *tags',
  objectives: '++id, category, status, targetDate',
  milestones: '++id, objectiveId, achieved, order',
  treatmentChanges: '++id, medicationId, date, changeType',
  // Nouveau v0.2.1
  practitioners: '++id, name, specialty, lastUsed, usageCount',
})

// Version 5: Lien RDV <-> Praticien
db.version(5).stores({
  medications: '++id, name, type, isActive, startDate',
  medicationLogs: '++id, medicationId, timestamp, taken, applicationZone',
  bloodTests: '++id, date',
  physicalProgress: '++id, date',
  appointments: '++id, date, type, practitionerId', // Nouvel index
  reminders: '++id, type, enabled',
  userProfile: '++id',
  journalEntries: '++id, date, mood, *tags',
  objectives: '++id, category, status, targetDate',
  milestones: '++id, objectiveId, achieved, order',
  treatmentChanges: '++id, medicationId, date, changeType',
  practitioners: '++id, name, specialty, lastUsed, usageCount',
})

// Version 6: Suivi des coûts RDV (champ cost ajouté aux appointments)
db.version(6).stores({
  medications: '++id, name, type, isActive, startDate',
  medicationLogs: '++id, medicationId, timestamp, taken, applicationZone',
  bloodTests: '++id, date',
  physicalProgress: '++id, date',
  appointments: '++id, date, type, practitionerId', // cost n'est pas indexé
  reminders: '++id, type, enabled',
  userProfile: '++id',
  journalEntries: '++id, date, mood, *tags',
  objectives: '++id, category, status, targetDate',
  milestones: '++id, objectiveId, achieved, order',
  treatmentChanges: '++id, medicationId, date, changeType',
  practitioners: '++id, name, specialty, lastUsed, usageCount',
})

export { db }

// === HELPERS CRUD ===

// Options pour getMedications
export interface GetMedicationsOptions {
  activeOnly?: boolean
  sortInactiveAtEnd?: boolean
}

// Medications
export async function getMedications(options: GetMedicationsOptions | boolean = true) {
  // Rétrocompatibilité: si on passe un boolean, c'est activeOnly
  const opts: GetMedicationsOptions =
    typeof options === 'boolean' ? { activeOnly: options } : options

  const { activeOnly = true, sortInactiveAtEnd = false } = opts

  if (activeOnly) {
    // Filter by isActive boolean - Dexie stores booleans as true/false
    return db.medications.filter((med) => med.isActive === true).toArray()
  }

  const meds = await db.medications.toArray()

  if (sortInactiveAtEnd) {
    // Trier: actifs en premier, inactifs à la fin
    return meds.sort((a, b) => {
      if (a.isActive === b.isActive) return 0
      return a.isActive ? -1 : 1
    })
  }

  return meds
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

  // Trier par timestamp (date de prise), pas par ordre d'insertion
  return logs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

export async function getLastMedicationLog(medicationId: number) {
  const logs = await db.medicationLogs.where('medicationId').equals(medicationId).toArray()

  if (logs.length === 0) return null

  // Retourner le log le plus récent
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
 * Récupère les logs d'hier
 * Utilisé pour auto-valider les doses manquées de la veille
 */
export async function getYesterdayLogs() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return db.medicationLogs.where('timestamp').between(yesterday, today).toArray()
}

/**
 * Récupère les logs d'aujourd'hui pour un médicament spécifique
 * Utile pour le mode avancé: savoir quelles doses ont déjà été prises
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
  return db.medicationLogs.add(log)
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

// Historique des zones d'application pour les gels
export async function getGelApplicationHistory(medicationId: number, limit = 20) {
  const logs = await db.medicationLogs
    .where('medicationId')
    .equals(medicationId)
    .filter((log) => log.applicationZone !== undefined)
    .toArray()

  // Trier par timestamp (date de prise)
  return logs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

// Blood Tests
export async function getBloodTests(limit = 20) {
  return db.bloodTests.orderBy('date').reverse().limit(limit).toArray()
}

export async function addBloodTest(test: Omit<BloodTest, 'id' | 'createdAt'>) {
  return db.bloodTests.add({
    ...test,
    createdAt: new Date(),
  })
}

export async function deleteBloodTest(id: number) {
  return db.bloodTests.delete(id)
}

export async function getBloodTest(id: number) {
  return db.bloodTests.get(id)
}

export async function updateBloodTest(id: number, updates: Partial<BloodTest>) {
  return db.bloodTests.update(id, updates)
}

// Physical Progress
export async function getPhysicalProgress(limit = 20) {
  return db.physicalProgress.orderBy('date').reverse().limit(limit).toArray()
}

export async function addPhysicalProgress(progress: Omit<PhysicalProgress, 'id' | 'createdAt'>) {
  return db.physicalProgress.add({
    ...progress,
    createdAt: new Date(),
  })
}

// Appointments
/**
 * Récupère les RDV à venir (date+heure > maintenant)
 * Utilise un filtrage JS pour combiner date et time correctement
 */
export async function getUpcomingAppointments() {
  const now = new Date()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Récupérer tous les RDV d'aujourd'hui et futur
  const appointments = await db.appointments.where('date').aboveOrEqual(todayStart).toArray()

  // Filtrer ceux qui sont réellement dans le futur (en tenant compte de l'heure)
  return appointments
    .filter((apt) => {
      const aptDate = new Date(apt.date)
      if (apt.time) {
        const [hours, minutes] = apt.time.split(':').map(Number)
        aptDate.setHours(hours, minutes, 0, 0)
      } else {
        // Pas d'heure = considéré en début de journée
        aptDate.setHours(0, 0, 0, 0)
      }
      return aptDate > now
    })
    .sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      if (a.time) {
        const [h, m] = a.time.split(':').map(Number)
        dateA.setHours(h, m)
      }
      if (b.time) {
        const [h, m] = b.time.split(':').map(Number)
        dateB.setHours(h, m)
      }
      return dateA.getTime() - dateB.getTime()
    })
}

export async function addAppointment(appointment: Omit<Appointment, 'id' | 'createdAt'>) {
  return db.appointments.add({
    ...appointment,
    createdAt: new Date(),
  })
}

// User Profile
export async function getUserProfile() {
  const profiles = await db.userProfile.toArray()
  return profiles[0] || null
}

export async function saveUserProfile(profile: Partial<UserProfile>) {
  const existing = await getUserProfile()
  const now = new Date()

  if (existing?.id) {
    return db.userProfile.update(existing.id, {
      ...profile,
      updatedAt: now,
    })
  }

  return db.userProfile.add({
    ...profile,
    createdAt: now,
    updatedAt: now,
  } as UserProfile)
}

// Export/Import pour backup
export async function exportAllData() {
  return {
    medications: await db.medications.toArray(),
    medicationLogs: await db.medicationLogs.toArray(),
    bloodTests: await db.bloodTests.toArray(),
    physicalProgress: await db.physicalProgress.toArray(),
    appointments: await db.appointments.toArray(),
    reminders: await db.reminders.toArray(),
    userProfile: await db.userProfile.toArray(),
    // v0.2.0 tables
    journalEntries: await db.journalEntries.filter((e) => !e.isPrivate).toArray(),
    objectives: await db.objectives.toArray(),
    milestones: await db.milestones.toArray(),
    treatmentChanges: await db.treatmentChanges.toArray(),
    // v0.2.1+ tables
    practitioners: await db.practitioners.toArray(),
    exportedAt: new Date().toISOString(),
    version: 3,
  }
}

function deserializeDates<T>(records: T[], dateFields: (keyof T)[]): T[] {
  return records.map((record) => {
    const result = { ...record }
    for (const field of dateFields) {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = new Date(result[field] as string) as T[keyof T]
      }
    }
    return result
  })
}

export async function importAllData(data: Awaited<ReturnType<typeof exportAllData>>) {
  await db.transaction(
    'rw',
    [
      db.medications,
      db.medicationLogs,
      db.bloodTests,
      db.physicalProgress,
      db.appointments,
      db.reminders,
      db.userProfile,
      db.journalEntries,
      db.objectives,
      db.milestones,
      db.treatmentChanges,
      db.practitioners,
    ],
    async () => {
      // Clear existing data
      await db.medications.clear()
      await db.medicationLogs.clear()
      await db.bloodTests.clear()
      await db.physicalProgress.clear()
      await db.appointments.clear()
      await db.reminders.clear()
      await db.userProfile.clear()
      await db.journalEntries.clear()
      await db.objectives.clear()
      await db.milestones.clear()
      await db.treatmentChanges.clear()
      await db.practitioners.clear()

      // Import data with date deserialization
      // JSON.stringify converts Date objects to ISO strings; we must convert them back
      // so that Dexie indexed queries (e.g. .between()) work correctly.
      if (data.medications?.length)
        await db.medications.bulkAdd(
          deserializeDates(data.medications, ['startDate', 'endDate', 'createdAt', 'updatedAt'])
        )
      if (data.medicationLogs?.length)
        await db.medicationLogs.bulkAdd(deserializeDates(data.medicationLogs, ['timestamp']))
      if (data.bloodTests?.length)
        await db.bloodTests.bulkAdd(deserializeDates(data.bloodTests, ['date', 'createdAt']))
      if (data.physicalProgress?.length)
        await db.physicalProgress.bulkAdd(
          deserializeDates(data.physicalProgress, ['date', 'createdAt'])
        )
      if (data.appointments?.length)
        await db.appointments.bulkAdd(deserializeDates(data.appointments, ['date', 'createdAt']))
      if (data.reminders?.length)
        await db.reminders.bulkAdd(deserializeDates(data.reminders, ['lastTriggered', 'createdAt']))
      if (data.userProfile?.length)
        await db.userProfile.bulkAdd(
          deserializeDates(data.userProfile, ['transitionStartDate', 'createdAt', 'updatedAt'])
        )
      // v0.2.0+ tables
      if (data.journalEntries?.length)
        await db.journalEntries.bulkAdd(
          deserializeDates(data.journalEntries, ['date', 'createdAt', 'updatedAt'])
        )
      if (data.objectives?.length)
        await db.objectives.bulkAdd(
          deserializeDates(data.objectives, [
            'targetDate',
            'completedDate',
            'createdAt',
            'updatedAt',
          ])
        )
      if (data.milestones?.length)
        await db.milestones.bulkAdd(
          deserializeDates(data.milestones, ['date', 'achievedDate', 'createdAt'])
        )
      if (data.treatmentChanges?.length)
        await db.treatmentChanges.bulkAdd(
          deserializeDates(data.treatmentChanges, ['date', 'createdAt'])
        )
      // v0.2.1+ tables
      if (data.practitioners?.length)
        await db.practitioners.bulkAdd(
          deserializeDates(data.practitioners, ['lastUsed', 'createdAt'])
        )
    }
  )
}

// === APPOINTMENTS ===

export async function getAppointments(limit = 50) {
  return db.appointments.orderBy('date').reverse().limit(limit).toArray()
}

export async function getAppointment(id: number) {
  return db.appointments.get(id)
}

/**
 * Récupère un RDV avec son praticien lié (si présent)
 * Utilisé pour l'affichage avec les infos à jour du praticien
 */
export async function getAppointmentWithPractitioner(id: number) {
  const appointment = await db.appointments.get(id)
  if (!appointment) return null

  let practitioner: Practitioner | null = null
  if (appointment.practitionerId) {
    const found = await db.practitioners.get(appointment.practitionerId)
    practitioner = found ?? null
  }

  return { appointment, practitioner }
}

export async function getAppointmentsInRange(startDate: Date, endDate: Date) {
  return db.appointments.where('date').between(startDate, endDate, true, true).sortBy('date')
}

export async function updateAppointment(id: number, updates: Partial<Appointment>) {
  return db.appointments.update(id, updates)
}

export async function deleteAppointment(id: number) {
  // Delete associated reminders (using filter - no index on referenceId)
  const remindersToDelete = await db.reminders
    .filter((r) => r.type === 'appointment' && r.referenceId === id)
    .toArray()

  for (const reminder of remindersToDelete) {
    if (reminder.id) await db.reminders.delete(reminder.id)
  }

  return db.appointments.delete(id)
}

// === REMINDERS ===

export async function getReminders(enabledOnly = false) {
  if (enabledOnly) {
    return db.reminders.filter((r) => r.enabled === true).toArray()
  }
  return db.reminders.toArray()
}

export async function getReminder(id: number) {
  return db.reminders.get(id)
}

export async function getRemindersByType(type: Reminder['type']) {
  return db.reminders.where('type').equals(type).toArray()
}

export async function addReminder(reminder: Omit<Reminder, 'id' | 'createdAt'>) {
  return db.reminders.add({
    ...reminder,
    createdAt: new Date(),
  })
}

export async function updateReminder(id: number, updates: Partial<Reminder>) {
  return db.reminders.update(id, updates)
}

export async function deleteReminder(id: number) {
  return db.reminders.delete(id)
}

export async function toggleReminder(id: number, enabled: boolean) {
  return db.reminders.update(id, { enabled })
}

// === STOCK ALERTS ===

export async function getMedicationsWithLowStock() {
  const meds = await getMedications(true)
  return meds.filter(
    (med) => med.stock !== undefined && med.stockAlert !== undefined && med.stock <= med.stockAlert
  )
}

// === JOURNAL ENTRIES ===

export async function getJournalEntries(limit = 50) {
  return db.journalEntries.orderBy('date').reverse().limit(limit).toArray()
}

export async function getJournalEntry(id: number) {
  return db.journalEntries.get(id)
}

export async function getJournalEntriesByDateRange(startDate: Date, endDate: Date) {
  return db.journalEntries.where('date').between(startDate, endDate, true, true).reverse().toArray()
}

export async function getJournalEntriesByTag(tag: string, limit = 50) {
  return db.journalEntries.where('tags').equals(tag).reverse().limit(limit).toArray()
}

export async function searchJournalEntries(query: string, limit = 50) {
  return db.journalEntries
    .filter(
      (entry) =>
        fuzzySearch(entry.content, query) || entry.tags.some((tag) => fuzzySearch(tag, query))
    )
    .limit(limit)
    .toArray()
}

export async function addJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date()
  return db.journalEntries.add({
    ...entry,
    createdAt: now,
    updatedAt: now,
  })
}

export async function updateJournalEntry(id: number, updates: Partial<JournalEntry>) {
  return db.journalEntries.update(id, {
    ...updates,
    updatedAt: new Date(),
  })
}

export async function deleteJournalEntry(id: number) {
  return db.journalEntries.delete(id)
}

// Stats du journal
export async function getJournalStats(days = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const entries = await db.journalEntries.where('date').above(startDate).toArray()

  const moodSum = entries.reduce((sum, e) => sum + (e.mood || 0), 0)
  const moodCount = entries.filter((e) => e.mood).length

  return {
    totalEntries: entries.length,
    averageMood: moodCount > 0 ? moodSum / moodCount : null,
    entriesPerWeek: (entries.length / days) * 7,
    tagFrequency: entries.reduce(
      (acc, e) => {
        e.tags.forEach((tag) => {
          acc[tag] = (acc[tag] || 0) + 1
        })
        return acc
      },
      {} as Record<string, number>
    ),
  }
}

// === OBJECTIVES ===

export async function getObjectives(status?: Objective['status']) {
  const collection = status
    ? db.objectives.where('status').equals(status)
    : db.objectives.toCollection()

  // Tri par updatedAt décroissant (plus récent en premier)
  const objectives = await collection.toArray()
  return objectives.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export async function getObjective(id: number) {
  return db.objectives.get(id)
}

export async function getObjectivesByCategory(category: Objective['category']) {
  return db.objectives.where('category').equals(category).toArray()
}

export async function addObjective(objective: Omit<Objective, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date()
  return db.objectives.add({
    ...objective,
    createdAt: now,
    updatedAt: now,
  })
}

export async function updateObjective(id: number, updates: Partial<Objective>) {
  return db.objectives.update(id, {
    ...updates,
    updatedAt: new Date(),
  })
}

export async function deleteObjective(id: number) {
  // Supprimer aussi les milestones associés
  await db.milestones.where('objectiveId').equals(id).delete()
  return db.objectives.delete(id)
}

// === MILESTONES ===

export async function getMilestones(objectiveId: number) {
  return db.milestones.where('objectiveId').equals(objectiveId).sortBy('order')
}

export async function getMilestone(id: number) {
  return db.milestones.get(id)
}

export async function addMilestone(milestone: Omit<Milestone, 'id' | 'createdAt'>) {
  return db.milestones.add({
    ...milestone,
    createdAt: new Date(),
  })
}

export async function updateMilestone(id: number, updates: Partial<Milestone>) {
  return db.milestones.update(id, updates)
}

export async function deleteMilestone(id: number) {
  return db.milestones.delete(id)
}

export async function toggleMilestone(id: number, achieved: boolean) {
  return db.milestones.update(id, {
    achieved,
    achievedDate: achieved ? new Date() : undefined,
  })
}

// Recalculer le progress d'un objectif basé sur ses milestones
export async function recalculateObjectiveProgress(objectiveId: number) {
  const milestones = await getMilestones(objectiveId)
  if (milestones.length === 0) return

  const achieved = milestones.filter((m) => m.achieved).length
  const progress = Math.round((achieved / milestones.length) * 100)

  await updateObjective(objectiveId, { progress })
  return progress
}

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

// === EXPORT/IMPORT v0.2.0 ===

export async function exportAllDataV2() {
  return {
    medications: await db.medications.toArray(),
    medicationLogs: await db.medicationLogs.toArray(),
    bloodTests: await db.bloodTests.toArray(),
    physicalProgress: await db.physicalProgress.toArray(),
    appointments: await db.appointments.toArray(),
    reminders: await db.reminders.toArray(),
    userProfile: await db.userProfile.toArray(),
    // Nouvelles tables v0.2.0
    journalEntries: await db.journalEntries.filter((e) => !e.isPrivate).toArray(),
    objectives: await db.objectives.toArray(),
    milestones: await db.milestones.toArray(),
    treatmentChanges: await db.treatmentChanges.toArray(),
    exportedAt: new Date().toISOString(),
    version: 2,
  }
}

export async function importAllDataV2(data: Awaited<ReturnType<typeof exportAllDataV2>>) {
  await db.transaction(
    'rw',
    [
      db.medications,
      db.medicationLogs,
      db.bloodTests,
      db.physicalProgress,
      db.appointments,
      db.reminders,
      db.userProfile,
      db.journalEntries,
      db.objectives,
      db.milestones,
      db.treatmentChanges,
    ],
    async () => {
      // Clear existing data
      await db.medications.clear()
      await db.medicationLogs.clear()
      await db.bloodTests.clear()
      await db.physicalProgress.clear()
      await db.appointments.clear()
      await db.reminders.clear()
      await db.userProfile.clear()
      await db.journalEntries.clear()
      await db.objectives.clear()
      await db.milestones.clear()
      await db.treatmentChanges.clear()

      // Import data
      if (data.medications?.length) await db.medications.bulkAdd(data.medications)
      if (data.medicationLogs?.length) await db.medicationLogs.bulkAdd(data.medicationLogs)
      if (data.bloodTests?.length) await db.bloodTests.bulkAdd(data.bloodTests)
      if (data.physicalProgress?.length) await db.physicalProgress.bulkAdd(data.physicalProgress)
      if (data.appointments?.length) await db.appointments.bulkAdd(data.appointments)
      if (data.reminders?.length) await db.reminders.bulkAdd(data.reminders)
      if (data.userProfile?.length) await db.userProfile.bulkAdd(data.userProfile)
      // Nouvelles tables v0.2.0
      if (data.journalEntries?.length) await db.journalEntries.bulkAdd(data.journalEntries)
      if (data.objectives?.length) await db.objectives.bulkAdd(data.objectives)
      if (data.milestones?.length) await db.milestones.bulkAdd(data.milestones)
      if (data.treatmentChanges?.length) await db.treatmentChanges.bulkAdd(data.treatmentChanges)
    }
  )
}

// === PRACTITIONERS (Annuaire) ===

import type { AppointmentType } from './types'

/**
 * Récupère tous les praticien·nes, triés par dernière utilisation
 */
export async function getPractitioners(specialty?: AppointmentType) {
  const all = await db.practitioners.orderBy('lastUsed').reverse().toArray()

  if (specialty) {
    // Trier: spécialité correspondante en premier, puis les autres
    return all.sort((a, b) => {
      const aMatch = a.specialty === specialty ? 1 : 0
      const bMatch = b.specialty === specialty ? 1 : 0
      return bMatch - aMatch
    })
  }
  return all
}

/**
 * Récupère un·e praticien·ne par ID
 */
export async function getPractitioner(id: number) {
  return db.practitioners.get(id)
}

/**
 * Recherche des praticien·nes par nom (autocomplete)
 * Utilise fuzzySearch pour:
 * - Recherche insensible aux accents (medecin → médecin)
 * - Recherche partielle (Dr Dup → Dr. Dupont)
 */
export async function searchPractitioners(query: string, specialty?: AppointmentType) {
  const practitioners = await db.practitioners.toArray()

  return practitioners
    .filter((p) => fuzzySearch(p.name, query))
    .sort((a, b) => {
      // Priorité 1: spécialité correspondante (mais on garde tous les résultats)
      if (specialty) {
        const aMatchSpecialty = a.specialty === specialty ? 1 : 0
        const bMatchSpecialty = b.specialty === specialty ? 1 : 0
        if (aMatchSpecialty !== bMatchSpecialty) return bMatchSpecialty - aMatchSpecialty
      }

      // Priorité 2: match exact au début
      const lowerQuery = query.toLowerCase()
      const aStartsWith = a.name.toLowerCase().startsWith(lowerQuery) ? 1 : 0
      const bStartsWith = b.name.toLowerCase().startsWith(lowerQuery) ? 1 : 0
      if (aStartsWith !== bStartsWith) return bStartsWith - aStartsWith

      // Priorité 3: usage
      if (a.usageCount !== b.usageCount) return b.usageCount - a.usageCount

      // Priorité 4: récence
      return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    })
    .slice(0, 10)
}

/**
 * Ajoute un·e nouveau·elle praticien·ne
 */
export async function addPractitioner(
  practitioner: Omit<Practitioner, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>
) {
  const now = new Date()
  return db.practitioners.add({
    ...practitioner,
    lastUsed: now,
    usageCount: 1,
    createdAt: now,
  })
}

/**
 * Met à jour un·e praticien·ne
 */
export async function updatePractitioner(id: number, updates: Partial<Practitioner>) {
  return db.practitioners.update(id, updates)
}

/**
 * Supprime un·e praticien·ne
 */
export async function deletePractitioner(id: number) {
  return db.practitioners.delete(id)
}

/**
 * Compte le nombre de RDV liés à un·e praticien·ne
 * Compte à la fois par practitionerId ET par correspondance de nom
 */
export async function countAppointmentsByPractitioner(practitionerId: number): Promise<number> {
  const practitioner = await db.practitioners.get(practitionerId)
  if (!practitioner) return 0

  const appointments = await db.appointments.toArray()
  let count = 0

  for (const apt of appointments) {
    // Compter si practitionerId correspond
    if (apt.practitionerId === practitionerId) {
      count++
      continue
    }
    // Ou si le nom du doctor correspond
    if (
      apt.doctor &&
      practitioner.name &&
      apt.doctor.toLowerCase().trim() === practitioner.name.toLowerCase().trim()
    ) {
      count++
    }
  }

  return count
}

/**
 * Compte les RDV pour tous les praticien·nes (batch)
 * Retourne un Map<practitionerId, count>
 * Compte à la fois les RDV liés par practitionerId ET par correspondance de nom
 */
export async function countAppointmentsForAllPractitioners(): Promise<Map<number, number>> {
  const [appointments, practitioners] = await Promise.all([
    db.appointments.toArray(),
    db.practitioners.toArray(),
  ])

  const counts = new Map<number, number>()

  // Créer un index des noms de praticiens (lowercase) -> id
  const nameToId = new Map<string, number>()
  for (const p of practitioners) {
    if (p.id && p.name) {
      nameToId.set(p.name.toLowerCase().trim(), p.id)
    }
  }

  for (const apt of appointments) {
    let practitionerId: number | undefined = apt.practitionerId

    // Si pas de practitionerId direct, chercher par correspondance de nom
    if (!practitionerId && apt.doctor) {
      practitionerId = nameToId.get(apt.doctor.toLowerCase().trim())
    }

    if (practitionerId) {
      counts.set(practitionerId, (counts.get(practitionerId) || 0) + 1)
    }
  }
  return counts
}

/**
 * Incrémente l'usage et met à jour lastUsed
 * Appelé quand un·e praticien·ne est sélectionné·e pour un RDV
 */
export async function incrementPractitionerUsage(id: number) {
  const practitioner = await db.practitioners.get(id)
  if (practitioner) {
    return db.practitioners.update(id, {
      usageCount: (practitioner.usageCount || 0) + 1,
      lastUsed: new Date(),
    })
  }
}

/**
 * Trouve ou crée un·e praticien·ne par nom
 * Utile pour l'auto-création depuis le formulaire de RDV
 */
export async function findOrCreatePractitioner(
  name: string,
  specialty: AppointmentType
): Promise<number> {
  // Cherche un·e praticien·ne existant·e avec ce nom et cette spécialité
  const existing = await db.practitioners
    .where('name')
    .equalsIgnoreCase(name)
    .filter((p) => p.specialty === specialty)
    .first()

  if (existing?.id) {
    await incrementPractitionerUsage(existing.id)
    return existing.id
  }

  // Crée un·e nouveau·elle praticien·ne
  const id = await addPractitioner({ name, specialty })
  return id as number
}

// === COST TRACKING ===

/**
 * Calcule le total des coûts de RDV
 * Retourne le total global, ce mois-ci, cette année, et par type
 */
export async function getTotalAppointmentsCost(): Promise<{
  total: number
  thisMonth: number
  thisYear: number
  byType: Record<AppointmentType, number>
}> {
  const appointments = await db.appointments.toArray()

  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth()

  const result: {
    total: number
    thisMonth: number
    thisYear: number
    byType: Record<AppointmentType, number>
  } = {
    total: 0,
    thisMonth: 0,
    thisYear: 0,
    byType: {} as Record<AppointmentType, number>,
  }

  for (const apt of appointments) {
    if (apt.cost === undefined || apt.cost === null || apt.cost <= 0) continue

    const aptDate = new Date(apt.date)
    // Round to 2 decimal places to avoid floating-point precision issues
    result.total = Math.round((result.total + apt.cost) * 100) / 100

    // Cette année
    if (aptDate.getFullYear() === thisYear) {
      result.thisYear = Math.round((result.thisYear + apt.cost) * 100) / 100

      // Ce mois-ci
      if (aptDate.getMonth() === thisMonth) {
        result.thisMonth = Math.round((result.thisMonth + apt.cost) * 100) / 100
      }
    }

    // Par type
    result.byType[apt.type] = Math.round(((result.byType[apt.type] || 0) + apt.cost) * 100) / 100
  }

  return result
}
