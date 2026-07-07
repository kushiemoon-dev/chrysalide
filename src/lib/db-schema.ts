/**
 * Dexie.js configuration - Local IndexedDB database
 * All data stays on the user's device
 */

import Dexie, { type EntityTable } from 'dexie'
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
  Act,
  ActTodo,
} from './types'

// Database definition
const db = new Dexie('ChrysalideDB') as Dexie & {
  medications: EntityTable<Medication, 'id'>
  medicationLogs: EntityTable<MedicationLog, 'id'>
  bloodTests: EntityTable<BloodTest, 'id'>
  physicalProgress: EntityTable<PhysicalProgress, 'id'>
  appointments: EntityTable<Appointment, 'id'>
  reminders: EntityTable<Reminder, 'id'>
  userProfile: EntityTable<UserProfile, 'id'>
  // v0.2.0 - New modules
  journalEntries: EntityTable<JournalEntry, 'id'>
  objectives: EntityTable<Objective, 'id'>
  milestones: EntityTable<Milestone, 'id'>
  treatmentChanges: EntityTable<TreatmentChange, 'id'>
  // v0.2.1 - Practitioners directory
  practitioners: EntityTable<Practitioner, 'id'>
  // v1.2.0 - Medical procedures (notes)
  acts: EntityTable<Act, 'id'>
  actTodos: EntityTable<ActTodo, 'id'>
}

// Database schema
db.version(1).stores({
  medications: '++id, name, type, isActive, startDate',
  medicationLogs: '++id, medicationId, timestamp, taken',
  bloodTests: '++id, date',
  physicalProgress: '++id, date',
  appointments: '++id, date, type',
  reminders: '++id, type, enabled',
  userProfile: '++id',
})

// Version 2: Added applicationZone for gels
db.version(2).stores({
  medications: '++id, name, type, isActive, startDate',
  medicationLogs: '++id, medicationId, timestamp, taken, applicationZone',
  bloodTests: '++id, date',
  physicalProgress: '++id, date',
  appointments: '++id, date, type',
  reminders: '++id, type, enabled',
  userProfile: '++id',
})

// Version 3: v0.2.0 - Journal, Objectives, Milestones, Treatment history
db.version(3).stores({
  medications: '++id, name, type, isActive, startDate',
  medicationLogs: '++id, medicationId, timestamp, taken, applicationZone',
  bloodTests: '++id, date',
  physicalProgress: '++id, date',
  appointments: '++id, date, type',
  reminders: '++id, type, enabled',
  userProfile: '++id',
  // New modules v0.2.0
  journalEntries: '++id, date, mood, *tags', // *tags = multi-entry index
  objectives: '++id, category, status, targetDate',
  milestones: '++id, objectiveId, achieved, order',
  treatmentChanges: '++id, medicationId, date, changeType',
})

// Version 4: v0.2.1 - Practitioners directory
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
  // New in v0.2.1
  practitioners: '++id, name, specialty, lastUsed, usageCount',
})

// Version 5: Appointment <-> Practitioner link
db.version(5).stores({
  medications: '++id, name, type, isActive, startDate',
  medicationLogs: '++id, medicationId, timestamp, taken, applicationZone',
  bloodTests: '++id, date',
  physicalProgress: '++id, date',
  appointments: '++id, date, type, practitionerId', // New index
  reminders: '++id, type, enabled',
  userProfile: '++id',
  journalEntries: '++id, date, mood, *tags',
  objectives: '++id, category, status, targetDate',
  milestones: '++id, objectiveId, achieved, order',
  treatmentChanges: '++id, medicationId, date, changeType',
  practitioners: '++id, name, specialty, lastUsed, usageCount',
})

// Version 6: Appointment cost tracking (cost field added to appointments)
db.version(6).stores({
  medications: '++id, name, type, isActive, startDate',
  medicationLogs: '++id, medicationId, timestamp, taken, applicationZone',
  bloodTests: '++id, date',
  physicalProgress: '++id, date',
  appointments: '++id, date, type, practitionerId', // cost is not indexed
  reminders: '++id, type, enabled',
  userProfile: '++id',
  journalEntries: '++id, date, mood, *tags',
  objectives: '++id, category, status, targetDate',
  milestones: '++id, objectiveId, achieved, order',
  treatmentChanges: '++id, medicationId, date, changeType',
  practitioners: '++id, name, specialty, lastUsed, usageCount',
})

// Version 7: Medical procedures + blood test/lab link + procedure/appointment link
// Upgrader: normalizes bloodTests dates stored as strings (buggy import/export)
db.version(7)
  .stores({
    medications: '++id, name, type, isActive, startDate',
    medicationLogs: '++id, medicationId, timestamp, taken, applicationZone',
    bloodTests: '++id, date, practitionerId',
    physicalProgress: '++id, date',
    appointments: '++id, date, type, practitionerId, actId',
    reminders: '++id, type, enabled',
    userProfile: '++id',
    journalEntries: '++id, date, mood, *tags',
    objectives: '++id, category, status, targetDate',
    milestones: '++id, objectiveId, achieved, order',
    treatmentChanges: '++id, medicationId, date, changeType',
    practitioners: '++id, name, specialty, lastUsed, usageCount',
    acts: '++id, category, status, createdAt',
    actTodos: '++id, actId, done, order',
  })
  .upgrade(async (tx) => {
    // Normalize bloodTests.date to a Date if stored as a string
    await tx
      .table('bloodTests')
      .toCollection()
      .modify((bt) => {
        if (typeof bt.date === 'string') bt.date = new Date(bt.date)
        if (typeof bt.createdAt === 'string') bt.createdAt = new Date(bt.createdAt)
      })
  })

// Version 8: Merge acts → objectives, actTodos → milestones, remap appointments.actId → objectiveId
db.version(8)
  .stores({
    medications: '++id, name, type, isActive, startDate',
    medicationLogs: '++id, medicationId, timestamp, taken, applicationZone',
    bloodTests: '++id, date, practitionerId',
    physicalProgress: '++id, date',
    appointments: '++id, date, type, practitionerId, actId, objectiveId',
    reminders: '++id, type, enabled',
    userProfile: '++id',
    journalEntries: '++id, date, mood, *tags',
    objectives: '++id, category, status, targetDate, actCategory, source',
    milestones: '++id, objectiveId, achieved, order',
    treatmentChanges: '++id, medicationId, date, changeType',
    practitioners: '++id, name, specialty, lastUsed, usageCount',
    acts: '++id, category, status, createdAt', // kept — dropped in v9
    actTodos: '++id, actId, done, order', // kept — dropped in v9
  })
  .upgrade(async (tx) => {
    const STATUS_MAP: Record<string, string> = {
      planning: 'not_started',
      in_progress: 'in_progress',
      done: 'completed',
      cancelled: 'cancelled',
    }

    const acts = await tx.table('acts').toArray()
    const actIdToObjectiveId = new Map<number, number>()

    for (const act of acts) {
      const objId = await tx.table('objectives').add({
        title: act.title,
        category: 'medical',
        actCategory: act.category,
        status: STATUS_MAP[act.status] ?? 'not_started',
        information: act.information,
        notes: act.notes,
        envisagedPractitionerIds: act.envisagedPractitionerIds ?? [],
        chosenPractitionerIds: act.chosenPractitionerIds ?? [],
        source: 'act',
        progress: 0,
        createdAt: act.createdAt,
        updatedAt: act.updatedAt,
      })
      if (act.id != null) actIdToObjectiveId.set(act.id, objId as number)
    }

    // actTodos → milestones
    const todos = await tx.table('actTodos').toArray()
    for (const todo of todos) {
      const objId = todo.actId != null ? actIdToObjectiveId.get(todo.actId) : undefined
      if (objId == null) continue
      await tx.table('milestones').add({
        objectiveId: objId,
        title: todo.text,
        achieved: todo.done,
        order: todo.order,
        createdAt: todo.createdAt,
      })
    }

    // Remap appointments.actId → appointments.objectiveId
    await tx
      .table('appointments')
      .toCollection()
      .modify((apt: Record<string, unknown>) => {
        if (apt.actId != null && actIdToObjectiveId.has(apt.actId as number)) {
          apt.objectiveId = actIdToObjectiveId.get(apt.actId as number)
        }
      })
  })

export { db }
