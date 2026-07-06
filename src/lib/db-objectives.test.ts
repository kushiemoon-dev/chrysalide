import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  db,
  getObjectives,
  getObjective,
  getObjectivesByCategory,
  addObjective,
  updateObjective,
  deleteObjective,
  getMilestones,
  getMilestone,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  toggleMilestone,
  recalculateObjectiveProgress,
} from './db'
import type { Objective, Milestone } from './types'

const baseObjective: Omit<Objective, 'id' | 'createdAt' | 'updatedAt'> = {
  title: 'Commencer le THS',
  category: 'medical',
  status: 'not_started',
}

const baseMilestone = (objectiveId: number): Omit<Milestone, 'id' | 'createdAt'> => ({
  objectiveId,
  title: 'Premier RDV endocrino',
  achieved: false,
  order: 0,
})

beforeEach(async () => {
  await db.objectives.clear()
  await db.milestones.clear()
})

describe('Objectives CRUD', () => {
  it('addObjective crée un objectif avec createdAt/updatedAt', async () => {
    const id = await addObjective(baseObjective)
    const obj = await getObjective(id as number)
    expect(obj?.title).toBe('Commencer le THS')
    expect(obj?.createdAt).toBeInstanceOf(Date)
  })

  it('getObjectives trie par updatedAt décroissant, filtre par statut si fourni', async () => {
    await addObjective(baseObjective)
    await addObjective({ ...baseObjective, title: 'Autre', status: 'completed' })

    expect(await getObjectives()).toHaveLength(2)
    const completed = await getObjectives('completed')
    expect(completed).toHaveLength(1)
    expect(completed[0].title).toBe('Autre')
  })

  it('getObjectivesByCategory filtre par catégorie', async () => {
    await addObjective(baseObjective)
    await addObjective({ ...baseObjective, title: 'Social', category: 'social' })

    const medical = await getObjectivesByCategory('medical')
    expect(medical).toHaveLength(1)
    expect(medical[0].title).toBe('Commencer le THS')
  })

  it('updateObjective met à jour les champs et updatedAt', async () => {
    const id = await addObjective(baseObjective)
    await updateObjective(id as number, { status: 'in_progress' })
    const obj = await getObjective(id as number)
    expect(obj?.status).toBe('in_progress')
  })

  it('deleteObjective supprime aussi les milestones associés', async () => {
    const id = await addObjective(baseObjective)
    await addMilestone(baseMilestone(id as number))
    await addMilestone(baseMilestone(id as number))

    await deleteObjective(id as number)

    expect(await getObjective(id as number)).toBeUndefined()
    expect(await getMilestones(id as number)).toHaveLength(0)
  })
})

describe('Milestones CRUD', () => {
  it('addMilestone crée un milestone avec createdAt', async () => {
    const objId = await addObjective(baseObjective)
    const id = await addMilestone(baseMilestone(objId as number))
    const milestone = await getMilestone(id as number)
    expect(milestone?.title).toBe('Premier RDV endocrino')
    expect(milestone?.createdAt).toBeInstanceOf(Date)
  })

  it('getMilestones trie par order', async () => {
    const objId = await addObjective(baseObjective)
    await addMilestone({ ...baseMilestone(objId as number), title: 'Second', order: 1 })
    await addMilestone({ ...baseMilestone(objId as number), title: 'Premier', order: 0 })

    const milestones = await getMilestones(objId as number)
    expect(milestones.map((m) => m.title)).toEqual(['Premier', 'Second'])
  })

  it('updateMilestone / deleteMilestone', async () => {
    const objId = await addObjective(baseObjective)
    const id = await addMilestone(baseMilestone(objId as number))

    await updateMilestone(id as number, { title: 'Modifié' })
    expect((await getMilestone(id as number))?.title).toBe('Modifié')

    await deleteMilestone(id as number)
    expect(await getMilestone(id as number)).toBeUndefined()
  })

  it('toggleMilestone marque atteint et fixe/efface achievedDate', async () => {
    const objId = await addObjective(baseObjective)
    const id = await addMilestone(baseMilestone(objId as number))

    await toggleMilestone(id as number, true)
    let milestone = await getMilestone(id as number)
    expect(milestone?.achieved).toBe(true)
    expect(milestone?.achievedDate).toBeInstanceOf(Date)

    await toggleMilestone(id as number, false)
    milestone = await getMilestone(id as number)
    expect(milestone?.achieved).toBe(false)
    expect(milestone?.achievedDate).toBeUndefined()
  })

  it('recalculateObjectiveProgress calcule le % de milestones atteints', async () => {
    const objId = await addObjective(baseObjective)
    const m1 = await addMilestone(baseMilestone(objId as number))
    await addMilestone({ ...baseMilestone(objId as number), title: 'Second', order: 1 })
    await toggleMilestone(m1 as number, true)

    const progress = await recalculateObjectiveProgress(objId as number)

    expect(progress).toBe(50)
    expect((await getObjective(objId as number))?.progress).toBe(50)
  })

  it('recalculateObjectiveProgress ne fait rien si aucun milestone', async () => {
    const objId = await addObjective(baseObjective)
    const progress = await recalculateObjectiveProgress(objId as number)
    expect(progress).toBeUndefined()
  })
})
