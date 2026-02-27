import { describe, it, expect } from 'vitest'
import {
  cn,
  normalizeString,
  fuzzySearch,
  isAppointmentPast,
  getAppointmentDateTime,
} from './utils'
import type { Appointment } from './types'

const makeAppointment = (date: Date, time?: string): Appointment => ({
  type: 'general',
  date,
  time,
  createdAt: new Date(),
})

describe('cn', () => {
  it('fusionne les classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('résout les conflits Tailwind (dernière valeur gagne)', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('ignore les valeurs falsy', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar')
  })

  it('gère les chaînes vides', () => {
    expect(cn('')).toBe('')
    expect(cn('foo', '')).toBe('foo')
  })
})

describe('isAppointmentPast', () => {
  it('retourne true pour une date largement passée', () => {
    expect(isAppointmentPast(makeAppointment(new Date('2020-01-01')))).toBe(true)
  })

  it('retourne false pour une date future', () => {
    expect(isAppointmentPast(makeAppointment(new Date('2099-01-01')))).toBe(false)
  })

  it("avec une heure passée aujourd'hui, retourne true", () => {
    const today = new Date()
    today.setHours(0, 1, 0, 0) // 00:01 — toujours passé
    expect(isAppointmentPast(makeAppointment(today, '00:01'))).toBe(true)
  })

  it("avec une heure future aujourd'hui, retourne false", () => {
    const today = new Date()
    today.setHours(23, 59, 0, 0)
    expect(isAppointmentPast(makeAppointment(today, '23:59'))).toBe(false)
  })

  it("sans heure, une date d'aujourd'hui n'est pas encore passée (fin de journée)", () => {
    const today = new Date()
    const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    expect(isAppointmentPast(makeAppointment(dateOnly))).toBe(false)
  })
})

describe('getAppointmentDateTime', () => {
  it("utilise l'heure définie si disponible", () => {
    const date = new Date('2024-06-15')
    const result = getAppointmentDateTime(makeAppointment(date, '14:30'))
    expect(result.getHours()).toBe(14)
    expect(result.getMinutes()).toBe(30)
  })

  it('sans heure, retourne minuit (pour tri)', () => {
    const date = new Date('2024-06-15')
    const result = getAppointmentDateTime(makeAppointment(date))
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(0)
  })

  it('ne modifie pas la date originale', () => {
    const date = new Date('2024-06-15')
    const original = date.getTime()
    getAppointmentDateTime(makeAppointment(date, '10:00'))
    expect(date.getTime()).toBe(original)
  })
})

describe('normalizeString', () => {
  it('convertit en minuscules', () => {
    expect(normalizeString('BONJOUR')).toBe('bonjour')
    expect(normalizeString('Bonjour')).toBe('bonjour')
  })

  it('supprime les accents', () => {
    expect(normalizeString('médecin')).toBe('medecin')
    expect(normalizeString('français')).toBe('francais')
    expect(normalizeString('Éléonore')).toBe('eleonore')
    expect(normalizeString('àâäéèêëïîôùûüç')).toBe('aaaeeeeiiouuuc')
  })

  it('supprime la ponctuation', () => {
    expect(normalizeString('Dr. Dupont')).toBe('dr dupont')
    expect(normalizeString("aujourd'hui")).toBe('aujourdhui')
    expect(normalizeString('test-sanguin')).toBe('testsanguin')
  })

  it('gère les chaînes vides', () => {
    expect(normalizeString('')).toBe('')
  })

  it('préserve les espaces', () => {
    expect(normalizeString('mot un mot deux')).toBe('mot un mot deux')
  })
})

describe('fuzzySearch', () => {
  it('trouve une correspondance exacte', () => {
    expect(fuzzySearch('Dr. Dupont', 'Dr. Dupont')).toBe(true)
  })

  it('est insensible à la casse', () => {
    expect(fuzzySearch('Dr. Dupont', 'dr dupont')).toBe(true)
    expect(fuzzySearch('DR DUPONT', 'dr dupont')).toBe(true)
  })

  it('est insensible aux accents', () => {
    expect(fuzzySearch('médecin', 'medecin')).toBe(true)
    expect(fuzzySearch('medecin', 'médecin')).toBe(true)
    expect(fuzzySearch('Éléonore', 'eleonore')).toBe(true)
  })

  it('trouve avec une recherche partielle', () => {
    expect(fuzzySearch('Dr. Dupont', 'Dr Dup')).toBe(true)
    expect(fuzzySearch('Dr. Dupont', 'Dup')).toBe(true)
    expect(fuzzySearch('Dr. Dupont', 'pont')).toBe(true)
  })

  it("trouve tous les mots dans n'importe quel ordre", () => {
    expect(fuzzySearch('test sanguin complet', 'sanguin test')).toBe(true)
    expect(fuzzySearch('test sanguin complet', 'complet sanguin')).toBe(true)
  })

  it('retourne false si un mot est manquant', () => {
    expect(fuzzySearch('test sanguin', 'test urinaire')).toBe(false)
    expect(fuzzySearch('Dr. Dupont', 'Dr Martin')).toBe(false)
  })

  it('gère les chaînes vides', () => {
    expect(fuzzySearch('quelque chose', '')).toBe(true) // Pas de mots à chercher
    expect(fuzzySearch('', 'quelque chose')).toBe(false)
  })

  it('combine insensibilité accents + casse + partiel', () => {
    // Cas d'usage réel: "Dr Dup" trouve "Dr. Dupont"
    expect(fuzzySearch('Dr. Dupont', 'dr dup')).toBe(true)
    // Cas d'usage réel: "medecin" trouve "médecin"
    expect(fuzzySearch('médecin généraliste', 'medecin')).toBe(true)
    // Cas d'usage réel: "test sang" trouve "test sanguin"
    expect(fuzzySearch('test sanguin', 'test sang')).toBe(true)
  })
})
