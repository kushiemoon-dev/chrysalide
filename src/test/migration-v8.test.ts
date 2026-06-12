import { describe, it, expect } from 'vitest'
import Dexie, { type Table } from 'dexie'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'

// Minimal record shapes used only in this migration test
interface ActRecord {
  id?: number
  title: string
  category: string
  status: string
  information: string | null
  notes: string | null
  envisagedPractitionerIds: number[]
  chosenPractitionerIds: number[]
  createdAt: Date
  updatedAt: Date
}

interface ActTodoRecord {
  id?: number
  actId: number
  text: string
  done: boolean
  order: number
  createdAt: Date
}

interface ObjectiveRecord {
  id?: number
  title: string
  category: string
  actCategory?: string
  status: string
  source?: string
  information: string | null
  notes: string | null
  envisagedPractitionerIds: number[]
  chosenPractitionerIds: number[]
  progress: number
  createdAt: Date
  updatedAt: Date
}

interface MilestoneRecord {
  id?: number
  objectiveId: number
  title: string
  achieved: boolean
  order: number
  createdAt: Date
}

interface AppointmentRecord {
  id?: number
  date: Date
  type: string
  actId?: number
  objectiveId?: number
}

class TestDBV7 extends Dexie {
  acts!: Table<ActRecord>
  actTodos!: Table<ActTodoRecord>
  appointments!: Table<AppointmentRecord>
  objectives!: Table<ObjectiveRecord>
  milestones!: Table<MilestoneRecord>
}

class TestDBV8 extends Dexie {
  acts!: Table<ActRecord>
  actTodos!: Table<ActTodoRecord>
  appointments!: Table<AppointmentRecord>
  objectives!: Table<ObjectiveRecord>
  milestones!: Table<MilestoneRecord>
}

async function seedV7AndUpgradeToV8(): Promise<TestDBV8> {
  const dbName = 'test-migration-v8-' + Date.now() + '-' + Math.floor(Math.random() * 10000)
  // Each call gets its own IDBFactory instance so tests are fully isolated
  const indexedDB = new IDBFactory()

  // Seed v7
  const dbV7 = new TestDBV7(dbName, { indexedDB, IDBKeyRange })
  dbV7.version(7).stores({
    objectives: '++id, category, status, targetDate',
    milestones: '++id, objectiveId, achieved, order',
    appointments: '++id, date, type, practitionerId, actId',
    acts: '++id, category, status, createdAt',
    actTodos: '++id, actId, done, order',
  })
  await dbV7.open()

  await dbV7.acts.bulkAdd([
    {
      id: 1,
      title: 'FFS',
      category: 'ffs',
      status: 'planning',
      information: 'Info FFS',
      notes: 'notes FFS',
      envisagedPractitionerIds: [],
      chosenPractitionerIds: [],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 2,
      title: 'THS',
      category: 'hrt',
      status: 'done',
      information: null,
      notes: null,
      envisagedPractitionerIds: [5],
      chosenPractitionerIds: [5],
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01'),
    },
  ])
  await dbV7.actTodos.bulkAdd([
    {
      id: 1,
      actId: 1,
      text: 'Prendre RDV',
      done: false,
      order: 0,
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 2,
      actId: 1,
      text: 'Devis reçu',
      done: true,
      order: 1,
      createdAt: new Date('2024-01-02'),
    },
  ])
  await dbV7.appointments.bulkAdd([
    { id: 1, date: new Date('2024-03-01'), type: 'surgeon', actId: 1 },
  ])
  dbV7.close()

  // Upgrade vers v8 — rejouer la MÊME migration que db.ts
  const dbV8 = new TestDBV8(dbName, { indexedDB, IDBKeyRange })
  dbV8.version(7).stores({
    objectives: '++id, category, status, targetDate',
    milestones: '++id, objectiveId, achieved, order',
    appointments: '++id, date, type, practitionerId, actId',
    acts: '++id, category, status, createdAt',
    actTodos: '++id, actId, done, order',
  })
  dbV8
    .version(8)
    .stores({
      objectives: '++id, category, status, targetDate, actCategory, source',
      milestones: '++id, objectiveId, achieved, order',
      appointments: '++id, date, type, practitionerId, actId, objectiveId',
      acts: '++id, category, status, createdAt',
      actTodos: '++id, actId, done, order',
    })
    .upgrade(async (tx) => {
      const STATUS_MAP: Record<string, string> = {
        planning: 'not_started',
        in_progress: 'in_progress',
        done: 'completed',
        cancelled: 'cancelled',
      }
      const acts = await tx.table<ActRecord>('acts').toArray()
      const actIdToObjectiveId = new Map<number, number>()
      for (const act of acts) {
        const objId = await tx.table<ObjectiveRecord>('objectives').add({
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
      const todos = await tx.table<ActTodoRecord>('actTodos').toArray()
      for (const todo of todos) {
        const objId = actIdToObjectiveId.get(todo.actId)
        if (objId == null) continue
        await tx.table<MilestoneRecord>('milestones').add({
          objectiveId: objId,
          title: todo.text,
          achieved: todo.done,
          order: todo.order,
          createdAt: todo.createdAt,
        })
      }
      await tx
        .table<AppointmentRecord>('appointments')
        .toCollection()
        .modify((apt) => {
          if (apt.actId != null && actIdToObjectiveId.has(apt.actId)) {
            apt.objectiveId = actIdToObjectiveId.get(apt.actId)
          }
        })
    })
  await dbV8.open()
  return dbV8
}

describe('Migration Dexie v7→v8 — fusion acts→objectives', () => {
  it('migre 2 actes en 2 objectifs avec source="act"', async () => {
    const db = await seedV7AndUpgradeToV8()
    const objectives = await db.objectives.toArray()
    const actObjectives = objectives.filter((o) => o.source === 'act')
    expect(actObjectives).toHaveLength(2)
    expect(actObjectives.find((o) => o.title === 'FFS')).toBeDefined()
    expect(actObjectives.find((o) => o.title === 'THS')).toBeDefined()
    db.close()
  })

  it('mappe correctement les statuts acts → ObjectiveStatus', async () => {
    const db = await seedV7AndUpgradeToV8()
    const objectives = await db.objectives.toArray()
    const ffs = objectives.find((o) => o.title === 'FFS')
    const ths = objectives.find((o) => o.title === 'THS')
    expect(ffs?.status).toBe('not_started') // planning → not_started
    expect(ths?.status).toBe('completed') // done → completed
    expect(ffs?.actCategory).toBe('ffs')
    db.close()
  })

  it('migre 2 actTodos en 2 milestones liés au bon objectif', async () => {
    const db = await seedV7AndUpgradeToV8()
    const milestones = await db.milestones.toArray()
    expect(milestones).toHaveLength(2)
    const rdv = milestones.find((m) => m.title === 'Prendre RDV')
    const devis = milestones.find((m) => m.title === 'Devis reçu')
    expect(rdv?.achieved).toBe(false)
    expect(devis?.achieved).toBe(true)
    db.close()
  })

  it('remplace actId par objectiveId dans appointments', async () => {
    const db = await seedV7AndUpgradeToV8()
    const apts = await db.appointments.toArray()
    expect(apts[0].objectiveId).toBeDefined()
    expect(typeof apts[0].objectiveId).toBe('number')
    db.close()
  })

  it('laisse les tables acts/actTodos intactes (pas de drop en v8)', async () => {
    const db = await seedV7AndUpgradeToV8()
    const acts = await db.acts.toArray()
    const todos = await db.actTodos.toArray()
    expect(acts).toHaveLength(2)
    expect(todos).toHaveLength(2)
    db.close()
  })
})
