import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  db,
  getBloodTests,
  addBloodTest,
  deleteBloodTest,
  getBloodTest,
  updateBloodTest,
} from './db'
import type { BloodTest } from './types'

const baseTest: Omit<BloodTest, 'id' | 'createdAt'> = {
  date: new Date('2024-01-01'),
  results: [{ marker: 'estradiol', value: 120, unit: 'pg/mL' }],
}

beforeEach(async () => {
  await db.bloodTests.clear()
})

describe('Blood tests CRUD', () => {
  it('addBloodTest crée un test avec createdAt', async () => {
    const id = await addBloodTest(baseTest)
    const test = await getBloodTest(id as number)
    expect(test?.results[0].marker).toBe('estradiol')
    expect(test?.createdAt).toBeInstanceOf(Date)
  })

  it('getBloodTests trie par date décroissante et respecte la limite', async () => {
    await addBloodTest({ ...baseTest, date: new Date('2024-01-01') })
    await addBloodTest({ ...baseTest, date: new Date('2024-03-01') })
    await addBloodTest({ ...baseTest, date: new Date('2024-02-01') })

    const tests = await getBloodTests(2)
    expect(tests).toHaveLength(2)
    expect(tests[0].date.toISOString()).toBe(new Date('2024-03-01').toISOString())
    expect(tests[1].date.toISOString()).toBe(new Date('2024-02-01').toISOString())
  })

  it('updateBloodTest met à jour les champs', async () => {
    const id = await addBloodTest(baseTest)
    await updateBloodTest(id as number, { lab: 'Labo A' })
    const test = await getBloodTest(id as number)
    expect(test?.lab).toBe('Labo A')
  })

  it('deleteBloodTest supprime le test', async () => {
    const id = await addBloodTest(baseTest)
    await deleteBloodTest(id as number)
    expect(await getBloodTest(id as number)).toBeUndefined()
  })
})
