import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  db,
  getUpcomingAppointments,
  addAppointment,
  getAppointments,
  getAppointment,
  getAppointmentWithPractitioner,
  getAppointmentsInRange,
  updateAppointment,
  deleteAppointment,
  getTotalAppointmentsCost,
  getAppointmentsByAct,
  getAppointmentsByObjective,
  addReminder,
  addPractitioner,
} from './db'
import type { Appointment } from './types'

const baseAppointment: Omit<Appointment, 'id' | 'createdAt'> = {
  date: new Date('2099-01-01'),
  type: 'endocrinologist',
}

beforeEach(async () => {
  await db.appointments.clear()
  await db.reminders.clear()
  await db.practitioners.clear()
})

describe('Appointments CRUD', () => {
  it('addAppointment crée un RDV avec createdAt', async () => {
    const id = await addAppointment(baseAppointment)
    const apt = await getAppointment(id as number)
    expect(apt?.type).toBe('endocrinologist')
    expect(apt?.createdAt).toBeInstanceOf(Date)
  })

  it('getAppointments trie par date décroissante et respecte la limite', async () => {
    await addAppointment({ ...baseAppointment, date: new Date('2024-01-01') })
    await addAppointment({ ...baseAppointment, date: new Date('2024-03-01') })
    await addAppointment({ ...baseAppointment, date: new Date('2024-02-01') })

    const apts = await getAppointments(2)
    expect(apts).toHaveLength(2)
    expect(apts[0].date.toISOString()).toBe(new Date('2024-03-01').toISOString())
  })

  it('getAppointmentsInRange filtre par intervalle inclusif triée par date', async () => {
    await addAppointment({ ...baseAppointment, date: new Date('2024-01-01') })
    await addAppointment({ ...baseAppointment, date: new Date('2024-03-01') })
    await addAppointment({ ...baseAppointment, date: new Date('2024-02-01') })

    const apts = await getAppointmentsInRange(new Date('2024-01-15'), new Date('2024-03-15'))
    expect(apts.map((a) => a.date.toISOString())).toEqual([
      new Date('2024-02-01').toISOString(),
      new Date('2024-03-01').toISOString(),
    ])
  })

  it('updateAppointment met à jour les champs', async () => {
    const id = await addAppointment(baseAppointment)
    await updateAppointment(id as number, { notes: 'RAS' })
    expect((await getAppointment(id as number))?.notes).toBe('RAS')
  })

  it('deleteAppointment supprime aussi les rappels liés', async () => {
    const id = await addAppointment(baseAppointment)
    await addReminder({
      type: 'appointment',
      referenceId: id as number,
      title: 'Rappel RDV',
      schedule: '08:00',
      enabled: true,
    })
    await addReminder({
      type: 'medication',
      title: 'Autre rappel',
      schedule: '08:00',
      enabled: true,
    })

    await deleteAppointment(id as number)

    expect(await getAppointment(id as number)).toBeUndefined()
    expect(await db.reminders.count()).toBe(1)
  })

  it('getAppointmentWithPractitioner retourne le RDV avec son praticien si lié', async () => {
    const practitionerId = await addPractitioner({
      name: 'Dr Dupont',
      specialty: 'endocrinologist',
    })
    const id = await addAppointment({
      ...baseAppointment,
      practitionerId: practitionerId as number,
    })

    const result = await getAppointmentWithPractitioner(id as number)
    expect(result?.appointment.id).toBe(id)
    expect(result?.practitioner?.name).toBe('Dr Dupont')
  })

  it('getAppointmentWithPractitioner retourne practitioner=null si pas de lien', async () => {
    const id = await addAppointment(baseAppointment)
    const result = await getAppointmentWithPractitioner(id as number)
    expect(result?.practitioner).toBeNull()
  })

  it('getAppointmentWithPractitioner retourne null si le RDV n’existe pas', async () => {
    expect(await getAppointmentWithPractitioner(9999)).toBeNull()
  })
})

describe('getUpcomingAppointments', () => {
  it('ne retourne que les RDV dont date+heure sont dans le futur, triés chronologiquement', async () => {
    await addAppointment({ ...baseAppointment, date: new Date('2000-01-01') }) // passé
    await addAppointment({ ...baseAppointment, date: new Date('2099-03-01'), time: '09:00' })
    await addAppointment({ ...baseAppointment, date: new Date('2099-02-01'), time: '09:00' })

    const upcoming = await getUpcomingAppointments()
    expect(upcoming).toHaveLength(2)
    expect(upcoming[0].date.toISOString()).toBe(new Date('2099-02-01').toISOString())
    expect(upcoming[1].date.toISOString()).toBe(new Date('2099-03-01').toISOString())
  })
})

describe('getTotalAppointmentsCost', () => {
  it('additionne total/thisYear/thisMonth/byType en ignorant les coûts nuls ou absents', async () => {
    const now = new Date()

    await addAppointment({ ...baseAppointment, date: now, cost: 50, type: 'endocrinologist' })
    await addAppointment({ ...baseAppointment, date: now, cost: 30, type: 'surgeon' })
    // hors année — compte quand même dans total/byType (non filtré par date), mais pas dans thisYear/thisMonth
    await addAppointment({
      ...baseAppointment,
      date: new Date('2000-01-01'),
      cost: 20,
      type: 'psychiatrist',
    })
    await addAppointment({ ...baseAppointment, date: now, cost: 0 }) // ignoré
    await addAppointment({ ...baseAppointment, date: now }) // pas de coût

    const result = await getTotalAppointmentsCost()
    expect(result.total).toBe(100)
    expect(result.thisYear).toBe(80)
    expect(result.thisMonth).toBe(80)
    expect(result.byType.endocrinologist).toBe(50)
    expect(result.byType.surgeon).toBe(30)
    expect(result.byType.psychiatrist).toBe(20)
  })
})

describe('getAppointmentsByAct / getAppointmentsByObjective', () => {
  it('getAppointmentsByAct (deprecated) filtre par actId', async () => {
    await addAppointment({ ...baseAppointment, actId: 1 })
    await addAppointment({ ...baseAppointment, actId: 2 })

    const apts = await getAppointmentsByAct(1)
    expect(apts).toHaveLength(1)
  })

  it('getAppointmentsByObjective filtre par objectiveId', async () => {
    await addAppointment({ ...baseAppointment, objectiveId: 1 })
    await addAppointment({ ...baseAppointment, objectiveId: 2 })

    const apts = await getAppointmentsByObjective(1)
    expect(apts).toHaveLength(1)
  })
})
