import { db } from './db-schema'
import type { Act, ActTodo } from './types'

// === MEDICAL PROCEDURES ===

export async function getActs() {
  const all = await db.acts.toArray()
  return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getAct(id: number) {
  return db.acts.get(id)
}

export async function addAct(act: Omit<Act, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date()
  return db.acts.add({ ...act, createdAt: now, updatedAt: now })
}

export async function updateAct(id: number, updates: Partial<Act>) {
  return db.acts.update(id, { ...updates, updatedAt: new Date() })
}

export async function deleteAct(id: number) {
  await db.actTodos.where('actId').equals(id).delete()
  return db.acts.delete(id)
}

// === ACT TODOS ===

export async function getActTodos(actId: number) {
  const todos = await db.actTodos.where('actId').equals(actId).toArray()
  return todos.sort((a, b) => a.order - b.order)
}

export async function addActTodo(todo: Omit<ActTodo, 'id' | 'createdAt'>) {
  return db.actTodos.add({ ...todo, createdAt: new Date() })
}

export async function updateActTodo(id: number, updates: Partial<ActTodo>) {
  return db.actTodos.update(id, updates)
}

export async function deleteActTodo(id: number) {
  return db.actTodos.delete(id)
}
