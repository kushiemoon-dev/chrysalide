import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { toDateInput, fromDateInput } from './date-input'

describe('date-input (TZ=Europe/Paris)', () => {
  const originalTZ = process.env.TZ

  beforeAll(() => {
    process.env.TZ = 'Europe/Paris'
  })

  afterAll(() => {
    process.env.TZ = originalTZ
  })

  it('keeps a local-midnight date on the same day (the toISOString bug)', () => {
    const localMidnight = new Date(2024, 0, 15) // 15 janvier 2024, minuit local
    expect(toDateInput(localMidnight)).toBe('2024-01-15')
  })

  it('keeps a legacy UTC-midnight date (old new Date(str) data) on the same day', () => {
    const utcMidnight = new Date('2024-01-15T00:00:00.000Z')
    expect(toDateInput(utcMidnight)).toBe('2024-01-15')
  })

  it('parses a date-only string at local midnight, not UTC midnight', () => {
    const parsed = fromDateInput('2024-01-15')
    expect(parsed.getFullYear()).toBe(2024)
    expect(parsed.getMonth()).toBe(0)
    expect(parsed.getDate()).toBe(15)
    expect(parsed.getHours()).toBe(0)
  })

  it('round-trips a date input string without shifting', () => {
    const input = '2024-06-01'
    expect(toDateInput(fromDateInput(input))).toBe(input)
  })
})
