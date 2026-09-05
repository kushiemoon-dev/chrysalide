import { describe, it, expect } from 'vitest'
import { getContentWidthClass } from './content-width'

describe('getContentWidthClass', () => {
  it('classifies the dashboard', () => {
    expect(getContentWidthClass('/')).toBe('dashboard')
  })

  it('classifies onboarding regardless of depth', () => {
    expect(getContentWidthClass('/onboarding')).toBe('onboarding')
  })

  it('classifies the calendar and progress screens as large', () => {
    expect(getContentWidthClass('/appointments/calendar')).toBe('large')
    expect(getContentWidthClass('/medications/calendar')).toBe('large')
    expect(getContentWidthClass('/progress')).toBe('large')
    expect(getContentWidthClass('/progress/compare')).toBe('large')
  })

  it('classifies a single bloodtest detail view as large, but not the list or new form', () => {
    expect(getContentWidthClass('/bloodtests/42')).toBe('large')
    expect(getContentWidthClass('/bloodtests')).toBe('standard')
    expect(getContentWidthClass('/bloodtests/new')).toBe('standard')
  })

  it('classifies list, detail, new and edit screens as standard', () => {
    expect(getContentWidthClass('/medications')).toBe('standard')
    expect(getContentWidthClass('/medications/history')).toBe('standard')
    expect(getContentWidthClass('/medications/42')).toBe('standard')
    expect(getContentWidthClass('/medications/42/edit')).toBe('standard')
    expect(getContentWidthClass('/medications/new')).toBe('standard')
    expect(getContentWidthClass('/appointments')).toBe('standard')
    expect(getContentWidthClass('/appointments/42')).toBe('standard')
    expect(getContentWidthClass('/appointments/42/edit')).toBe('standard')
    expect(getContentWidthClass('/appointments/new')).toBe('standard')
    expect(getContentWidthClass('/progress/42')).toBe('standard')
    expect(getContentWidthClass('/progress/new')).toBe('standard')
    expect(getContentWidthClass('/journal')).toBe('standard')
    expect(getContentWidthClass('/objectives')).toBe('standard')
    expect(getContentWidthClass('/practitioners')).toBe('standard')
    expect(getContentWidthClass('/resources')).toBe('standard')
    expect(getContentWidthClass('/resources/faq')).toBe('standard')
    expect(getContentWidthClass('/settings')).toBe('standard')
    expect(getContentWidthClass('/acts')).toBe('standard')
  })
})
