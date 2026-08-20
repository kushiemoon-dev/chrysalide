import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  db,
  getJournalEntries,
  getJournalEntry,
  getJournalEntriesByDateRange,
  getJournalEntriesByTag,
  searchJournalEntries,
  addJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getJournalStats,
} from './db'
import type { JournalEntry } from './types'

const baseEntry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'> = {
  date: new Date('2024-01-01'),
  content: 'Journée calme',
  tags: ['mood'],
}

beforeEach(async () => {
  await db.journalEntries.clear()
})

describe('Journal entries CRUD', () => {
  it('addJournalEntry crée une entrée avec createdAt/updatedAt', async () => {
    const id = await addJournalEntry(baseEntry)
    const entry = await getJournalEntry(id as number)
    expect(entry?.content).toBe('Journée calme')
    expect(entry?.createdAt).toBeInstanceOf(Date)
  })

  it('getJournalEntries trie par date décroissante et respecte la limite', async () => {
    await addJournalEntry({ ...baseEntry, date: new Date('2024-01-01') })
    await addJournalEntry({ ...baseEntry, date: new Date('2024-03-01') })
    await addJournalEntry({ ...baseEntry, date: new Date('2024-02-01') })

    const entries = await getJournalEntries(2)
    expect(entries).toHaveLength(2)
    expect(entries[0]!.date.toISOString()).toBe(new Date('2024-03-01').toISOString())
  })

  it('getJournalEntriesByDateRange filtre par intervalle inclusif', async () => {
    await addJournalEntry({ ...baseEntry, date: new Date('2024-01-01') })
    await addJournalEntry({ ...baseEntry, date: new Date('2024-02-01') })
    await addJournalEntry({ ...baseEntry, date: new Date('2024-03-01') })

    const entries = await getJournalEntriesByDateRange(
      new Date('2024-01-15'),
      new Date('2024-02-15')
    )
    expect(entries).toHaveLength(1)
    expect(entries[0]!.date.toISOString()).toBe(new Date('2024-02-01').toISOString())
  })

  it('getJournalEntriesByTag filtre par tag', async () => {
    await addJournalEntry(baseEntry)
    await addJournalEntry({ ...baseEntry, tags: ['sleep'] })

    const entries = await getJournalEntriesByTag('mood')
    expect(entries).toHaveLength(1)
  })

  it('searchJournalEntries trouve par contenu ou par tag (fuzzy)', async () => {
    await addJournalEntry({ ...baseEntry, content: 'Effets secondaires légers' })
    await addJournalEntry({ ...baseEntry, content: 'Rien à signaler', tags: ['energie'] })

    const byContent = await searchJournalEntries('effets')
    expect(byContent).toHaveLength(1)

    const byTag = await searchJournalEntries('energie')
    expect(byTag).toHaveLength(1)
  })

  it('updateJournalEntry met à jour les champs et updatedAt', async () => {
    const id = await addJournalEntry(baseEntry)
    await updateJournalEntry(id as number, { content: 'Modifié' })
    const entry = await getJournalEntry(id as number)
    expect(entry?.content).toBe('Modifié')
  })

  it('deleteJournalEntry supprime l’entrée', async () => {
    const id = await addJournalEntry(baseEntry)
    await deleteJournalEntry(id as number)
    expect(await getJournalEntry(id as number)).toBeUndefined()
  })
})

describe('getJournalStats', () => {
  it('calcule le total, la moyenne d’humeur et la fréquence des tags', async () => {
    const now = new Date()
    await addJournalEntry({ ...baseEntry, date: now, mood: 4, tags: ['mood', 'sleep'] })
    await addJournalEntry({ ...baseEntry, date: now, mood: 2, tags: ['mood'] })

    const stats = await getJournalStats(30)
    expect(stats.totalEntries).toBe(2)
    expect(stats.averageMood).toBe(3)
    expect(stats.tagFrequency.mood).toBe(2)
    expect(stats.tagFrequency.sleep).toBe(1)
  })

  it('averageMood est null si aucune entrée n’a de mood', async () => {
    const now = new Date()
    await addJournalEntry({ ...baseEntry, date: now })

    const stats = await getJournalStats(30)
    expect(stats.averageMood).toBeNull()
  })
})
