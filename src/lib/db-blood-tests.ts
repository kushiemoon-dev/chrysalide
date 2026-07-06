import { db } from './db-schema'
import type { BloodTest } from './types'

// Blood Tests
export async function getBloodTests(limit = 20) {
  const all = await db.bloodTests.toArray()
  return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit)
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
