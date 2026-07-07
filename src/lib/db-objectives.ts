import { db } from './db-schema'
import type { Objective, Milestone } from './types'

// === OBJECTIVES ===

export async function getObjectives(status?: Objective['status']) {
  const collection = status
    ? db.objectives.where('status').equals(status)
    : db.objectives.toCollection()

  // Sort by updatedAt descending (most recent first)
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
  // Also delete the associated milestones
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

// Recalculate an objective's progress based on its milestones
export async function recalculateObjectiveProgress(objectiveId: number) {
  const milestones = await getMilestones(objectiveId)
  if (milestones.length === 0) return

  const achieved = milestones.filter((m) => m.achieved).length
  const progress = Math.round((achieved / milestones.length) * 100)

  await updateObjective(objectiveId, { progress })
  return progress
}
