import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  db,
  getActs,
  getAct,
  addAct,
  updateAct,
  deleteAct,
  getActTodos,
  addActTodo,
  updateActTodo,
  deleteActTodo,
} from './db'
import type { Act, ActTodo } from './types'

const baseAct: Omit<Act, 'id' | 'createdAt' | 'updatedAt'> = {
  title: 'FFS',
  category: 'ffs',
  status: 'planning',
  envisagedPractitionerIds: [],
  chosenPractitionerIds: [],
}

const baseTodo = (actId: number): Omit<ActTodo, 'id' | 'createdAt'> => ({
  actId,
  text: 'Prendre RDV',
  done: false,
  order: 0,
})

beforeEach(async () => {
  await db.acts.clear()
  await db.actTodos.clear()
})

describe('Acts CRUD (deprecated, conservé jusqu’à drop en v9)', () => {
  it('addAct crée un acte avec createdAt/updatedAt', async () => {
    const id = await addAct(baseAct)
    const act = await getAct(id as number)
    expect(act?.title).toBe('FFS')
    expect(act?.createdAt).toBeInstanceOf(Date)
  })

  it('getActs trie par createdAt décroissant', async () => {
    // createdAt isn't injectable via addAct (generated internally): we go through
    // db.acts.add directly to control distinct, deterministic timestamps.
    await db.acts.add({
      ...baseAct,
      title: 'Premier',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })
    await db.acts.add({
      ...baseAct,
      title: 'Second',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01'),
    })

    const acts = await getActs()
    expect(acts[0]!.title).toBe('Second')
  })

  it('updateAct met à jour les champs et updatedAt', async () => {
    const id = await addAct(baseAct)
    await updateAct(id as number, { status: 'in_progress' })
    expect((await getAct(id as number))?.status).toBe('in_progress')
  })

  it('deleteAct supprime aussi les actTodos associés', async () => {
    const id = await addAct(baseAct)
    await addActTodo(baseTodo(id as number))

    await deleteAct(id as number)

    expect(await getAct(id as number)).toBeUndefined()
    expect(await getActTodos(id as number)).toHaveLength(0)
  })
})

describe('Act todos CRUD', () => {
  it('addActTodo crée un todo avec createdAt', async () => {
    const actId = await addAct(baseAct)
    const id = await addActTodo(baseTodo(actId as number))
    const todos = await getActTodos(actId as number)
    expect(todos[0]!.id).toBe(id)
    expect(todos[0]!.createdAt).toBeInstanceOf(Date)
  })

  it('getActTodos trie par order', async () => {
    const actId = await addAct(baseAct)
    await addActTodo({ ...baseTodo(actId as number), text: 'Second', order: 1 })
    await addActTodo({ ...baseTodo(actId as number), text: 'Premier', order: 0 })

    const todos = await getActTodos(actId as number)
    expect(todos.map((t) => t.text)).toEqual(['Premier', 'Second'])
  })

  it('updateActTodo / deleteActTodo', async () => {
    const actId = await addAct(baseAct)
    const id = await addActTodo(baseTodo(actId as number))

    await updateActTodo(id as number, { done: true })
    let todos = await getActTodos(actId as number)
    expect(todos[0]!.done).toBe(true)

    await deleteActTodo(id as number)
    todos = await getActTodos(actId as number)
    expect(todos).toHaveLength(0)
  })
})
