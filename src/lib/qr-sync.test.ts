import { describe, it, expect, beforeEach } from 'vitest'
import { splitIntoChunks, reassembleChunks, QRScanSession } from './qr-sync'
import type { DataChunk } from './qr-sync'

describe('splitIntoChunks', () => {
  it('retourne un seul chunk si les données rentrent', () => {
    const data = 'hello'
    const chunks = splitIntoChunks(data, 100)
    expect(chunks).toHaveLength(1)
    expect(chunks[0].i).toBe(0)
    expect(chunks[0].t).toBe(1)
    expect(chunks[0].d).toBe('hello')
  })

  it('découpe en plusieurs chunks si les données dépassent la taille', () => {
    const data = 'abcdefghij' // 10 chars
    const chunks = splitIntoChunks(data, 3)
    expect(chunks).toHaveLength(4) // ceil(10/3) = 4
    expect(chunks[0].d).toBe('abc')
    expect(chunks[1].d).toBe('def')
    expect(chunks[2].d).toBe('ghi')
    expect(chunks[3].d).toBe('j')
  })

  it('tous les chunks partagent le même sessionId', () => {
    const chunks = splitIntoChunks('abcdefghij', 3)
    const sessionId = chunks[0].s
    expect(chunks.every((c) => c.s === sessionId)).toBe(true)
  })

  it('les index sont consécutifs et t est correct', () => {
    const chunks = splitIntoChunks('abcde', 2)
    chunks.forEach((c, i) => {
      expect(c.i).toBe(i)
      expect(c.t).toBe(chunks.length)
    })
  })

  it('gère les chaînes vides', () => {
    const chunks = splitIntoChunks('', 100)
    expect(chunks).toHaveLength(0)
  })
})

describe('reassembleChunks', () => {
  const makeChunks = (data: string, chunkSize: number): DataChunk[] =>
    splitIntoChunks(data, chunkSize)

  it('reconstruit les données originales', () => {
    const original = 'hello world'
    const chunks = makeChunks(original, 3)
    expect(reassembleChunks(chunks)).toBe(original)
  })

  it('fonctionne avec un seul chunk', () => {
    const chunks = makeChunks('simple', 100)
    expect(reassembleChunks(chunks)).toBe('simple')
  })

  it('retourne null si la liste est vide', () => {
    expect(reassembleChunks([])).toBeNull()
  })

  it('retourne null si des chunks manquent', () => {
    const chunks = makeChunks('abcdefghij', 3)
    const incomplete = chunks.slice(0, 2) // 2 sur 4
    expect(reassembleChunks(incomplete)).toBeNull()
  })

  it('retourne null si les sessions sont mélangées', () => {
    const chunksA = makeChunks('aaaa', 2)
    const chunksB = makeChunks('bbbb', 2)
    // Mélanger les sessions
    const mixed = [chunksA[0], { ...chunksB[1], s: chunksA[0].s + 'x' }]
    expect(reassembleChunks(mixed)).toBeNull()
  })

  it('reconstitue correctement même si les chunks sont dans le désordre', () => {
    const chunks = makeChunks('abcdefghij', 3)
    const shuffled = [...chunks].reverse()
    expect(reassembleChunks(shuffled)).toBe('abcdefghij')
  })
})

describe('QRScanSession', () => {
  let session: QRScanSession

  beforeEach(() => {
    session = new QRScanSession()
  })

  it('démarre non complet', () => {
    expect(session.isComplete()).toBe(false)
  })

  it('accepte un chunk et rapporte le progrès', () => {
    const chunk: DataChunk = { i: 0, t: 2, s: 'abc', d: 'hello' }
    const result = session.addChunk(chunk)
    expect(result.progress).toBe(1)
    expect(result.total).toBe(2)
    expect(result.complete).toBe(false)
  })

  it('est complet quand tous les chunks sont reçus', () => {
    const chunks = splitIntoChunks('abcdefghij', 5)
    expect(chunks).toHaveLength(2)

    session.addChunk(chunks[0])
    expect(session.isComplete()).toBe(false)

    session.addChunk(chunks[1])
    expect(session.isComplete()).toBe(true)
  })

  it('retourne une erreur pour un chunk de session différente', () => {
    const chunk1: DataChunk = { i: 0, t: 2, s: 'session-1', d: 'hello' }
    const chunk2: DataChunk = { i: 1, t: 2, s: 'session-2', d: 'world' }

    session.addChunk(chunk1)
    const result = session.addChunk(chunk2)

    expect(result.error).toBeDefined()
    expect(result.complete).toBe(false)
  })

  it('retourne tous les chunks collectés', () => {
    const chunks = splitIntoChunks('abcde', 2)
    chunks.forEach((c) => session.addChunk(c))
    expect(session.getChunks()).toHaveLength(chunks.length)
  })

  it('reset remet à zéro', () => {
    const chunks = splitIntoChunks('abcde', 2)
    chunks.forEach((c) => session.addChunk(c))
    session.reset()

    expect(session.isComplete()).toBe(false)
    expect(session.getChunks()).toHaveLength(0)
  })
})
