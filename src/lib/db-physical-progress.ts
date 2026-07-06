import { db } from './db-schema'
import type { PhysicalProgress } from './types'

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
