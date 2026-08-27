import { describe, it, expect } from 'vitest'
import { flattenKeys, diffLocaleKeys } from './locale-keys.mjs'

describe('flattenKeys', () => {
  it('transforme un objet imbriqué en clés à chemin pointé', () => {
    const result = flattenKeys({ a: { b: 1, c: { d: 2 } } })
    expect(result).toEqual(expect.arrayContaining(['a.b', 'a.c.d']))
    expect(result).toHaveLength(2)
  })
})

describe('diffLocaleKeys', () => {
  it('confirme que fr/en/de sont en phase', () => {
    expect(diffLocaleKeys()).toEqual({
      inSync: true,
      missingByLocale: { fr: [], en: [], de: [] },
    })
  })
})
