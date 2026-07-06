import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, getPhysicalProgress, addPhysicalProgress } from './db'
import type { PhysicalProgress } from './types'

const baseProgress: Omit<PhysicalProgress, 'id' | 'createdAt'> = {
  date: new Date('2024-01-01'),
  measurements: { weight: 65 },
}

beforeEach(async () => {
  await db.physicalProgress.clear()
})

describe('Physical progress', () => {
  it('addPhysicalProgress crée une entrée avec createdAt', async () => {
    await addPhysicalProgress(baseProgress)
    const [entry] = await getPhysicalProgress()
    expect(entry.measurements?.weight).toBe(65)
    expect(entry.createdAt).toBeInstanceOf(Date)
  })

  it('getPhysicalProgress trie par date décroissante et respecte la limite', async () => {
    await addPhysicalProgress({ ...baseProgress, date: new Date('2024-01-01') })
    await addPhysicalProgress({ ...baseProgress, date: new Date('2024-03-01') })
    await addPhysicalProgress({ ...baseProgress, date: new Date('2024-02-01') })

    const entries = await getPhysicalProgress(2)
    expect(entries).toHaveLength(2)
    expect(entries[0].date.toISOString()).toBe(new Date('2024-03-01').toISOString())
    expect(entries[1].date.toISOString()).toBe(new Date('2024-02-01').toISOString())
  })
})
