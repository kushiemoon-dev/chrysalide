import { db } from './db-schema'
import type { Appointment, AppointmentType, Practitioner } from './types'

// Appointments
/**
 * Récupère les RDV à venir (date+heure > maintenant)
 * Utilise un filtrage JS pour combiner date et time correctement
 */
export async function getUpcomingAppointments() {
  const now = new Date()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Récupérer tous les RDV d'aujourd'hui et futur
  const appointments = await db.appointments.where('date').aboveOrEqual(todayStart).toArray()

  // Filtrer ceux qui sont réellement dans le futur (en tenant compte de l'heure)
  return appointments
    .filter((apt) => {
      const aptDate = new Date(apt.date)
      if (apt.time) {
        const [hours, minutes] = apt.time.split(':').map(Number)
        aptDate.setHours(hours, minutes, 0, 0)
      } else {
        // Pas d'heure = considéré en début de journée
        aptDate.setHours(0, 0, 0, 0)
      }
      return aptDate > now
    })
    .sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      if (a.time) {
        const [h, m] = a.time.split(':').map(Number)
        dateA.setHours(h, m)
      }
      if (b.time) {
        const [h, m] = b.time.split(':').map(Number)
        dateB.setHours(h, m)
      }
      return dateA.getTime() - dateB.getTime()
    })
}

export async function addAppointment(appointment: Omit<Appointment, 'id' | 'createdAt'>) {
  return db.appointments.add({
    ...appointment,
    createdAt: new Date(),
  })
}

// === APPOINTMENTS ===

export async function getAppointments(limit = 50) {
  return db.appointments.orderBy('date').reverse().limit(limit).toArray()
}

export async function getAppointment(id: number) {
  return db.appointments.get(id)
}

/**
 * Récupère un RDV avec son praticien lié (si présent)
 * Utilisé pour l'affichage avec les infos à jour du praticien
 */
export async function getAppointmentWithPractitioner(id: number) {
  const appointment = await db.appointments.get(id)
  if (!appointment) return null

  let practitioner: Practitioner | null = null
  if (appointment.practitionerId) {
    const found = await db.practitioners.get(appointment.practitionerId)
    practitioner = found ?? null
  }

  return { appointment, practitioner }
}

export async function getAppointmentsInRange(startDate: Date, endDate: Date) {
  return db.appointments.where('date').between(startDate, endDate, true, true).sortBy('date')
}

export async function updateAppointment(id: number, updates: Partial<Appointment>) {
  return db.appointments.update(id, updates)
}

export async function deleteAppointment(id: number) {
  // Delete associated reminders (using filter - no index on referenceId)
  const remindersToDelete = await db.reminders
    .filter((r) => r.type === 'appointment' && r.referenceId === id)
    .toArray()

  for (const reminder of remindersToDelete) {
    if (reminder.id) await db.reminders.delete(reminder.id)
  }

  return db.appointments.delete(id)
}

// === COST TRACKING ===

/**
 * Calcule le total des coûts de RDV
 * Retourne le total global, ce mois-ci, cette année, et par type
 */
export async function getTotalAppointmentsCost(): Promise<{
  total: number
  thisMonth: number
  thisYear: number
  byType: Record<AppointmentType, number>
}> {
  const appointments = await db.appointments.toArray()

  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth()

  const result: {
    total: number
    thisMonth: number
    thisYear: number
    byType: Record<AppointmentType, number>
  } = {
    total: 0,
    thisMonth: 0,
    thisYear: 0,
    byType: {} as Record<AppointmentType, number>,
  }

  for (const apt of appointments) {
    if (apt.cost === undefined || apt.cost === null || apt.cost <= 0) continue

    const aptDate = new Date(apt.date)
    // Round to 2 decimal places to avoid floating-point precision issues
    result.total = Math.round((result.total + apt.cost) * 100) / 100

    // Cette année
    if (aptDate.getFullYear() === thisYear) {
      result.thisYear = Math.round((result.thisYear + apt.cost) * 100) / 100

      // Ce mois-ci
      if (aptDate.getMonth() === thisMonth) {
        result.thisMonth = Math.round((result.thisMonth + apt.cost) * 100) / 100
      }
    }

    // Par type
    result.byType[apt.type] = Math.round(((result.byType[apt.type] || 0) + apt.cost) * 100) / 100
  }

  return result
}

/** @deprecated Utiliser getAppointmentsByObjective depuis v1.3.0 */
export async function getAppointmentsByAct(actId: number) {
  return db.appointments.where('actId').equals(actId).sortBy('date')
}

export async function getAppointmentsByObjective(objectiveId: number): Promise<Appointment[]> {
  return db.appointments.where('objectiveId').equals(objectiveId).toArray()
}
