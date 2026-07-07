import { db } from './db-schema'
import { fuzzySearch } from './utils'
import type { AppointmentType, Practitioner } from './types'

// === PRACTITIONERS (Directory) ===

/**
 * Gets all practitioners, sorted by last used
 */
export async function getPractitioners(specialty?: AppointmentType) {
  const all = await db.practitioners.orderBy('lastUsed').reverse().toArray()

  if (specialty) {
    // Sort: matching specialty first, then the rest
    return all.sort((a, b) => {
      const aMatch = a.specialty === specialty ? 1 : 0
      const bMatch = b.specialty === specialty ? 1 : 0
      return bMatch - aMatch
    })
  }
  return all
}

/**
 * Gets a practitioner by ID
 */
export async function getPractitioner(id: number) {
  return db.practitioners.get(id)
}

/**
 * Searches for practitioners by name (autocomplete)
 * Uses fuzzySearch for:
 * - Accent-insensitive search (medecin → médecin)
 * - Partial matching (Dr Dup → Dr. Dupont)
 */
export async function searchPractitioners(query: string, specialty?: AppointmentType) {
  const practitioners = await db.practitioners.toArray()

  return practitioners
    .filter((p) => fuzzySearch(p.name, query))
    .sort((a, b) => {
      // Priority 1: matching specialty (but we keep all results)
      if (specialty) {
        const aMatchSpecialty = a.specialty === specialty ? 1 : 0
        const bMatchSpecialty = b.specialty === specialty ? 1 : 0
        if (aMatchSpecialty !== bMatchSpecialty) return bMatchSpecialty - aMatchSpecialty
      }

      // Priority 2: exact match at the start
      const lowerQuery = query.toLowerCase()
      const aStartsWith = a.name.toLowerCase().startsWith(lowerQuery) ? 1 : 0
      const bStartsWith = b.name.toLowerCase().startsWith(lowerQuery) ? 1 : 0
      if (aStartsWith !== bStartsWith) return bStartsWith - aStartsWith

      // Priority 3: usage
      if (a.usageCount !== b.usageCount) return b.usageCount - a.usageCount

      // Priority 4: recency
      return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    })
    .slice(0, 10)
}

/**
 * Adds a new practitioner
 */
export async function addPractitioner(
  practitioner: Omit<Practitioner, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>
) {
  const now = new Date()
  return db.practitioners.add({
    ...practitioner,
    lastUsed: now,
    usageCount: 1,
    createdAt: now,
  })
}

/**
 * Updates a practitioner
 */
export async function updatePractitioner(id: number, updates: Partial<Practitioner>) {
  return db.practitioners.update(id, updates)
}

/**
 * Deletes a practitioner
 */
export async function deletePractitioner(id: number) {
  return db.practitioners.delete(id)
}

/**
 * Counts the number of appointments linked to a practitioner
 * Counts both by practitionerId AND by name match
 */
export async function countAppointmentsByPractitioner(practitionerId: number): Promise<number> {
  const practitioner = await db.practitioners.get(practitionerId)
  if (!practitioner) return 0

  const appointments = await db.appointments.toArray()
  let count = 0

  for (const apt of appointments) {
    // Count if practitionerId matches
    if (apt.practitionerId === practitionerId) {
      count++
      continue
    }
    // Or if the doctor's name matches
    if (
      apt.doctor &&
      practitioner.name &&
      apt.doctor.toLowerCase().trim() === practitioner.name.toLowerCase().trim()
    ) {
      count++
    }
  }

  return count
}

/**
 * Counts appointments for all practitioners (batch)
 * Returns a Map<practitionerId, count>
 * Counts both appointments linked by practitionerId AND by name match
 */
export async function countAppointmentsForAllPractitioners(): Promise<Map<number, number>> {
  const [appointments, practitioners] = await Promise.all([
    db.appointments.toArray(),
    db.practitioners.toArray(),
  ])

  const counts = new Map<number, number>()

  // Build an index of practitioner names (lowercase) -> id
  const nameToId = new Map<string, number>()
  for (const p of practitioners) {
    if (p.id && p.name) {
      nameToId.set(p.name.toLowerCase().trim(), p.id)
    }
  }

  for (const apt of appointments) {
    let practitionerId: number | undefined = apt.practitionerId

    // If there's no direct practitionerId, look up by name match
    if (!practitionerId && apt.doctor) {
      practitionerId = nameToId.get(apt.doctor.toLowerCase().trim())
    }

    if (practitionerId) {
      counts.set(practitionerId, (counts.get(practitionerId) || 0) + 1)
    }
  }
  return counts
}

/**
 * Increments usage and updates lastUsed
 * Called when a practitioner is selected for an appointment
 */
export async function incrementPractitionerUsage(id: number) {
  const practitioner = await db.practitioners.get(id)
  if (practitioner) {
    return db.practitioners.update(id, {
      usageCount: (practitioner.usageCount || 0) + 1,
      lastUsed: new Date(),
    })
  }
}

/**
 * Finds or creates a practitioner by name
 * Useful for auto-creation from the appointment form
 */
export async function findOrCreatePractitioner(
  name: string,
  specialty: AppointmentType
): Promise<number> {
  // Look for an existing practitioner with this name and specialty
  const existing = await db.practitioners
    .where('name')
    .equalsIgnoreCase(name)
    .filter((p) => p.specialty === specialty)
    .first()

  if (existing?.id) {
    await incrementPractitionerUsage(existing.id)
    return existing.id
  }

  // Create a new practitioner
  const id = await addPractitioner({ name, specialty })
  return id as number
}
