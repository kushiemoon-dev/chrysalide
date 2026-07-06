import { db } from './db-schema'
import type { Objective, ObjectiveStatus } from './types'

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
    // v1.2.0+ tables
    acts: await db.acts.toArray(),
    actTodos: await db.actTodos.toArray(),
    exportedAt: new Date().toISOString(),
    version: 5,
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
      db.acts,
      db.actTodos,
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
      await db.acts.clear()
      await db.actTodos.clear()

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
      // v1.2.0+ tables
      if (data.acts?.length)
        await db.acts.bulkAdd(deserializeDates(data.acts, ['createdAt', 'updatedAt']))
      if (data.actTodos?.length)
        await db.actTodos.bulkAdd(deserializeDates(data.actTodos, ['createdAt']))

      // Rétro-compat : si le backup contient des `acts` sans source='act',
      // les replier en objectives (cas d'un backup v7 importé sur un client v8)
      if (data.acts?.length) {
        const STATUS_MAP: Record<string, string> = {
          planning: 'not_started',
          in_progress: 'in_progress',
          done: 'completed',
          cancelled: 'cancelled',
        }
        const existingTitles = new Set(
          (await db.objectives.toArray()).map((o: Objective) => o.title)
        )
        for (const act of data.acts) {
          // Évite les doublons si le backup est déjà fusionné
          if (existingTitles.has(act.title)) continue
          await db.objectives.add({
            title: act.title,
            category: 'medical',
            actCategory: act.category,
            status: (STATUS_MAP[act.status] ?? 'not_started') as ObjectiveStatus,
            information: act.information,
            notes: act.notes,
            envisagedPractitionerIds: act.envisagedPractitionerIds ?? [],
            chosenPractitionerIds: act.chosenPractitionerIds ?? [],
            source: 'act',
            progress: 0,
            createdAt: act.createdAt ? new Date(act.createdAt) : new Date(),
            updatedAt: act.updatedAt ? new Date(act.updatedAt) : new Date(),
          })
        }
      }
    }
  )
}
