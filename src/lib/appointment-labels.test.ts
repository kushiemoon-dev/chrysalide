import { describe, it, expect } from 'vitest'
import { getRelativeDayLabel } from './appointment-labels'

describe('getRelativeDayLabel', () => {
  const now = new Date('2026-09-04T10:00:00')

  it('returns today for the same calendar day, regardless of time of day', () => {
    expect(getRelativeDayLabel(new Date('2026-09-04T23:59:00'), now)).toEqual({ key: 'today' })
  })

  it('returns tomorrow for the next calendar day', () => {
    expect(getRelativeDayLabel(new Date('2026-09-05T08:00:00'), now)).toEqual({ key: 'tomorrow' })
  })

  it('returns inDays with a day count for 2+ days out', () => {
    expect(getRelativeDayLabel(new Date('2026-09-06T08:00:00'), now)).toEqual({
      key: 'inDays',
      days: 2,
    })
    expect(getRelativeDayLabel(new Date('2026-09-20T08:00:00'), now)).toEqual({
      key: 'inDays',
      days: 16,
    })
  })

  it('returns past for any earlier calendar day', () => {
    expect(getRelativeDayLabel(new Date('2026-09-03T23:59:00'), now)).toEqual({ key: 'past' })
    expect(getRelativeDayLabel(new Date('2026-08-01T00:00:00'), now)).toEqual({ key: 'past' })
  })
})
