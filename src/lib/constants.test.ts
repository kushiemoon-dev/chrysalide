import { describe, it, expect } from 'vitest'
import {
  BLOOD_MARKERS,
  REFERENCE_RANGES,
  getFrequenciesForMethod,
  getTemplatesForContext,
} from './constants'

describe('BLOOD_MARKERS', () => {
  it('testostérone utilise ng/mL comme unité', () => {
    expect(BLOOD_MARKERS.testosterone.unit).toBe('ng/mL')
  })

  it('estradiol utilise pg/mL comme unité', () => {
    expect(BLOOD_MARKERS.estradiol.unit).toBe('pg/mL')
  })

  it('tous les marqueurs ont un label et une unité', () => {
    Object.entries(BLOOD_MARKERS).forEach(([key, marker]) => {
      expect(marker.label).toBeDefined()
      expect(marker.label.length).toBeGreaterThan(0)
      expect(marker.unit).toBeDefined()
      expect(marker.unit.length).toBeGreaterThan(0)
    })
  })
})

describe('REFERENCE_RANGES - Testosterone (ng/mL)', () => {
  const getTestosteroneRange = (context: string) =>
    REFERENCE_RANGES.find((r) => r.marker === 'testosterone' && r.context === context)

  describe('THS féminisant', () => {
    it('cible 0.15-0.50 ng/mL (équivalent 15-50 ng/dL)', () => {
      const range = getTestosteroneRange('feminizing')
      expect(range).toBeDefined()
      expect(range?.unit).toBe('ng/mL')
      expect(range?.min).toBe(0.15)
      expect(range?.max).toBe(0.5)
    })
  })

  describe('THS masculinisant', () => {
    it('cible 4.0-7.0 ng/mL (équivalent 400-700 ng/dL)', () => {
      const range = getTestosteroneRange('masculinizing')
      expect(range).toBeDefined()
      expect(range?.unit).toBe('ng/mL')
      expect(range?.min).toBe(4.0)
      expect(range?.max).toBe(7.0)
    })
  })

  describe('Référence cis-female', () => {
    it('référence 0.15-0.70 ng/mL', () => {
      const range = getTestosteroneRange('cis-female')
      expect(range).toBeDefined()
      expect(range?.unit).toBe('ng/mL')
      expect(range?.min).toBe(0.15)
      expect(range?.max).toBe(0.7)
    })
  })

  describe('Référence cis-male', () => {
    it('référence 3.0-10.0 ng/mL', () => {
      const range = getTestosteroneRange('cis-male')
      expect(range).toBeDefined()
      expect(range?.unit).toBe('ng/mL')
      expect(range?.min).toBe(3.0)
      expect(range?.max).toBe(10.0)
    })
  })
})

describe('REFERENCE_RANGES - Estradiol (pg/mL)', () => {
  const getEstradiolRange = (context: string) =>
    REFERENCE_RANGES.find((r) => r.marker === 'estradiol' && r.context === context)

  it('THS féminisant: 100-200 pg/mL', () => {
    const range = getEstradiolRange('feminizing')
    expect(range).toBeDefined()
    expect(range?.min).toBe(100)
    expect(range?.max).toBe(200)
  })

  it('THS masculinisant: 20-50 pg/mL', () => {
    const range = getEstradiolRange('masculinizing')
    expect(range).toBeDefined()
    expect(range?.min).toBe(20)
    expect(range?.max).toBe(50)
  })
})

describe('REFERENCE_RANGES - Cohérence', () => {
  it('toutes les plages ont min < max', () => {
    REFERENCE_RANGES.forEach((range) => {
      expect(range.min).toBeLessThan(range.max)
    })
  })

  it('toutes les plages ont des valeurs positives', () => {
    REFERENCE_RANGES.forEach((range) => {
      expect(range.min).toBeGreaterThanOrEqual(0)
      expect(range.max).toBeGreaterThan(0)
    })
  })

  it('la testostérone féminisant est bien inférieure à masculinisant', () => {
    const feminizing = REFERENCE_RANGES.find(
      (r) => r.marker === 'testosterone' && r.context === 'feminizing'
    )
    const masculinizing = REFERENCE_RANGES.find(
      (r) => r.marker === 'testosterone' && r.context === 'masculinizing'
    )

    expect(feminizing?.max).toBeLessThan(masculinizing?.min ?? 0)
  })
})

describe('getFrequenciesForMethod', () => {
  it('retourne des fréquences pour chaque méthode', () => {
    const methods = ['pill', 'gel', 'patch', 'injection', 'implant'] as const
    methods.forEach((method) => {
      const freqs = getFrequenciesForMethod(method)
      expect(freqs.length).toBeGreaterThan(0)
    })
  })

  it('les fréquences pill incluent quotidien', () => {
    expect(getFrequenciesForMethod('pill')).toContain('1x/jour')
  })

  it('les fréquences injection incluent mensuel', () => {
    expect(getFrequenciesForMethod('injection')).toContain('1x/mois')
  })
})

describe('getTemplatesForContext', () => {
  it('retourne des templates pour chaque contexte', () => {
    const contexts = ['feminizing', 'masculinizing', 'non-binary'] as const
    contexts.forEach((ctx) => {
      expect(getTemplatesForContext(ctx).length).toBeGreaterThan(0)
    })
  })

  it('non-binary inclut les templates féminisants et masculinisants', () => {
    const nonBinary = getTemplatesForContext('non-binary')
    const feminizing = getTemplatesForContext('feminizing')
    const masculinizing = getTemplatesForContext('masculinizing')
    // non-binary doit avoir au moins autant de templates
    expect(nonBinary.length).toBeGreaterThanOrEqual(
      Math.max(feminizing.length, masculinizing.length)
    )
  })

  it('retourne COMMON_TEMPLATES pour un contexte non reconnu', () => {
    // @ts-expect-error test de la branche default
    const result = getTemplatesForContext('unknown')
    expect(result.length).toBeGreaterThan(0)
  })
})
