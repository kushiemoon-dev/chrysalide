import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  db,
  getPractitioners,
  getPractitioner,
  searchPractitioners,
  addPractitioner,
  updatePractitioner,
  deletePractitioner,
  countAppointmentsByPractitioner,
  countAppointmentsForAllPractitioners,
  incrementPractitionerUsage,
  findOrCreatePractitioner,
} from './db'
import type { Practitioner } from './types'

const basePractitioner: Omit<Practitioner, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'> = {
  name: 'Dr Dupont',
  specialty: 'endocrinologist',
}

beforeEach(async () => {
  await db.practitioners.clear()
  await db.appointments.clear()
})

describe('Practitioners CRUD', () => {
  it('addPractitioner crée un praticien avec usageCount=1 et lastUsed/createdAt', async () => {
    const id = await addPractitioner(basePractitioner)
    const p = await getPractitioner(id as number)
    expect(p?.name).toBe('Dr Dupont')
    expect(p?.usageCount).toBe(1)
    expect(p?.lastUsed).toBeInstanceOf(Date)
    expect(p?.createdAt).toBeInstanceOf(Date)
  })

  it('getPractitioners trie par lastUsed décroissant, et priorise la spécialité si fournie', async () => {
    await addPractitioner({ ...basePractitioner, name: 'Ancien' })
    await addPractitioner({ ...basePractitioner, name: 'Récent', specialty: 'surgeon' })

    const all = await getPractitioners()
    expect(all[0]!.name).toBe('Récent')

    const bySpecialty = await getPractitioners('endocrinologist')
    expect(bySpecialty[0]!.name).toBe('Ancien')
  })

  it('searchPractitioners trouve par nom (fuzzy) et priorise la spécialité correspondante', async () => {
    await addPractitioner({ name: 'Dr Martin', specialty: 'surgeon' })
    await addPractitioner({ name: 'Dr Martineau', specialty: 'endocrinologist' })

    const results = await searchPractitioners('martin', 'endocrinologist')
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results[0]!.name).toBe('Dr Martineau')
  })

  it('updatePractitioner met à jour les champs', async () => {
    const id = await addPractitioner(basePractitioner)
    await updatePractitioner(id as number, { location: 'Paris' })
    expect((await getPractitioner(id as number))?.location).toBe('Paris')
  })

  it('deletePractitioner supprime le praticien', async () => {
    const id = await addPractitioner(basePractitioner)
    await deletePractitioner(id as number)
    expect(await getPractitioner(id as number)).toBeUndefined()
  })

  it('incrementPractitionerUsage incrémente usageCount et met à jour lastUsed', async () => {
    const id = await addPractitioner(basePractitioner)
    await incrementPractitionerUsage(id as number)
    expect((await getPractitioner(id as number))?.usageCount).toBe(2)
  })
})

describe('findOrCreatePractitioner', () => {
  it('crée un nouveau praticien si aucun match', async () => {
    const id = await findOrCreatePractitioner('Dr Nouveau', 'psychiatrist')
    const p = await getPractitioner(id)
    expect(p?.name).toBe('Dr Nouveau')
    expect(p?.usageCount).toBe(1)
  })

  it("réutilise un praticien existant (nom+spécialité) et incrémente l'usage", async () => {
    const id = await addPractitioner(basePractitioner)
    const foundId = await findOrCreatePractitioner('dr dupont', 'endocrinologist')

    expect(foundId).toBe(id)
    expect((await getPractitioner(id as number))?.usageCount).toBe(2)
  })
})

describe('Appointment counts', () => {
  it('countAppointmentsByPractitioner compte par practitionerId et par nom (fallback)', async () => {
    const id = await addPractitioner(basePractitioner)
    await db.appointments.add({
      date: new Date(),
      type: 'endocrinologist',
      practitionerId: id as number,
      createdAt: new Date(),
    })
    await db.appointments.add({
      date: new Date(),
      type: 'endocrinologist',
      doctor: 'Dr Dupont',
      createdAt: new Date(),
    })

    const count = await countAppointmentsByPractitioner(id as number)
    expect(count).toBe(2)
  })

  it('countAppointmentsForAllPractitioners retourne une Map<practitionerId, count>', async () => {
    const id = await addPractitioner(basePractitioner)
    await db.appointments.add({
      date: new Date(),
      type: 'endocrinologist',
      practitionerId: id as number,
      createdAt: new Date(),
    })

    const counts = await countAppointmentsForAllPractitioners()
    expect(counts.get(id as number)).toBe(1)
  })
})
