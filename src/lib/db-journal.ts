import { db } from './db-schema'
import { fuzzySearch } from './utils'
import type { JournalEntry } from './types'

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
