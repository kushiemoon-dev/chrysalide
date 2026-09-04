import { describe, it, expect } from 'vitest'
import {
  chronological,
  availableMeasurements,
  measurementDiff,
  closestEntryIndex,
} from './progress-charts'
import type { PhysicalProgress } from '$lib/types'

function entry(date: string, weight?: number, chest?: number): PhysicalProgress {
  return {
    date: new Date(date),
    measurements: weight === undefined && chest === undefined ? undefined : { weight, chest },
    createdAt: new Date(date),
  }
}

describe('chronological', () => {
  it('inverse un tableau trié par date décroissante', () => {
    const entries = [entry('2024-03-01'), entry('2024-02-01'), entry('2024-01-01')]
    expect(chronological(entries).map((e) => e.date.toISOString())).toEqual([
      new Date('2024-01-01').toISOString(),
      new Date('2024-02-01').toISOString(),
      new Date('2024-03-01').toISOString(),
    ])
  })
})

describe('availableMeasurements', () => {
  it('ne retient que les mensurations renseignées dans au moins une entrée', () => {
    const entries = [entry('2024-01-01', 65, undefined), entry('2024-02-01', undefined, 90)]
    expect(availableMeasurements(entries)).toEqual(['weight', 'chest'])
  })

  it('renvoie un tableau vide sans mensurations', () => {
    expect(availableMeasurements([entry('2024-01-01')])).toEqual([])
  })
})

describe('measurementDiff', () => {
  it('calcule la différence entre première et dernière valeur', () => {
    expect(measurementDiff(65, 60)).toBe(-5)
  })

  it('renvoie undefined si une des deux valeurs manque', () => {
    expect(measurementDiff(undefined, 60)).toBeUndefined()
    expect(measurementDiff(65, undefined)).toBeUndefined()
  })
})

describe('closestEntryIndex', () => {
  it("trouve l'entrée dont la date est la plus proche de la cible", () => {
    const entries = [{ date: new Date('2024-01-01') }, { date: new Date('2024-03-01') }]
    expect(closestEntryIndex(entries, new Date('2024-03-10'))).toBe(1)
    expect(closestEntryIndex(entries, new Date('2024-01-10'))).toBe(0)
  })

  it('renvoie 0 sur une liste à une entrée', () => {
    expect(closestEntryIndex([{ date: new Date('2024-01-01') }], new Date('2024-06-01'))).toBe(0)
  })
})
