import { db } from './db-schema'
import { fuzzySearch } from './utils'
import type { AppointmentType, Practitioner } from './types'

// === PRACTITIONERS (Annuaire) ===

/**
 * Récupère tous les praticien·nes, triés par dernière utilisation
 */
export async function getPractitioners(specialty?: AppointmentType) {
  const all = await db.practitioners.orderBy('lastUsed').reverse().toArray()

  if (specialty) {
    // Trier: spécialité correspondante en premier, puis les autres
    return all.sort((a, b) => {
      const aMatch = a.specialty === specialty ? 1 : 0
      const bMatch = b.specialty === specialty ? 1 : 0
      return bMatch - aMatch
    })
  }
  return all
}

/**
 * Récupère un·e praticien·ne par ID
 */
export async function getPractitioner(id: number) {
  return db.practitioners.get(id)
}

/**
 * Recherche des praticien·nes par nom (autocomplete)
 * Utilise fuzzySearch pour:
 * - Recherche insensible aux accents (medecin → médecin)
 * - Recherche partielle (Dr Dup → Dr. Dupont)
 */
export async function searchPractitioners(query: string, specialty?: AppointmentType) {
  const practitioners = await db.practitioners.toArray()

  return practitioners
    .filter((p) => fuzzySearch(p.name, query))
    .sort((a, b) => {
      // Priorité 1: spécialité correspondante (mais on garde tous les résultats)
      if (specialty) {
        const aMatchSpecialty = a.specialty === specialty ? 1 : 0
        const bMatchSpecialty = b.specialty === specialty ? 1 : 0
        if (aMatchSpecialty !== bMatchSpecialty) return bMatchSpecialty - aMatchSpecialty
      }

      // Priorité 2: match exact au début
      const lowerQuery = query.toLowerCase()
      const aStartsWith = a.name.toLowerCase().startsWith(lowerQuery) ? 1 : 0
      const bStartsWith = b.name.toLowerCase().startsWith(lowerQuery) ? 1 : 0
      if (aStartsWith !== bStartsWith) return bStartsWith - aStartsWith

      // Priorité 3: usage
      if (a.usageCount !== b.usageCount) return b.usageCount - a.usageCount

      // Priorité 4: récence
      return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    })
    .slice(0, 10)
}

/**
 * Ajoute un·e nouveau·elle praticien·ne
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
 * Met à jour un·e praticien·ne
 */
export async function updatePractitioner(id: number, updates: Partial<Practitioner>) {
  return db.practitioners.update(id, updates)
}

/**
 * Supprime un·e praticien·ne
 */
export async function deletePractitioner(id: number) {
  return db.practitioners.delete(id)
}

/**
 * Compte le nombre de RDV liés à un·e praticien·ne
 * Compte à la fois par practitionerId ET par correspondance de nom
 */
export async function countAppointmentsByPractitioner(practitionerId: number): Promise<number> {
  const practitioner = await db.practitioners.get(practitionerId)
  if (!practitioner) return 0

  const appointments = await db.appointments.toArray()
  let count = 0

  for (const apt of appointments) {
    // Compter si practitionerId correspond
    if (apt.practitionerId === practitionerId) {
      count++
      continue
    }
    // Ou si le nom du doctor correspond
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
 * Compte les RDV pour tous les praticien·nes (batch)
 * Retourne un Map<practitionerId, count>
 * Compte à la fois les RDV liés par practitionerId ET par correspondance de nom
 */
export async function countAppointmentsForAllPractitioners(): Promise<Map<number, number>> {
  const [appointments, practitioners] = await Promise.all([
    db.appointments.toArray(),
    db.practitioners.toArray(),
  ])

  const counts = new Map<number, number>()

  // Créer un index des noms de praticiens (lowercase) -> id
  const nameToId = new Map<string, number>()
  for (const p of practitioners) {
    if (p.id && p.name) {
      nameToId.set(p.name.toLowerCase().trim(), p.id)
    }
  }

  for (const apt of appointments) {
    let practitionerId: number | undefined = apt.practitionerId

    // Si pas de practitionerId direct, chercher par correspondance de nom
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
 * Incrémente l'usage et met à jour lastUsed
 * Appelé quand un·e praticien·ne est sélectionné·e pour un RDV
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
 * Trouve ou crée un·e praticien·ne par nom
 * Utile pour l'auto-création depuis le formulaire de RDV
 */
export async function findOrCreatePractitioner(
  name: string,
  specialty: AppointmentType
): Promise<number> {
  // Cherche un·e praticien·ne existant·e avec ce nom et cette spécialité
  const existing = await db.practitioners
    .where('name')
    .equalsIgnoreCase(name)
    .filter((p) => p.specialty === specialty)
    .first()

  if (existing?.id) {
    await incrementPractitionerUsage(existing.id)
    return existing.id
  }

  // Crée un·e nouveau·elle praticien·ne
  const id = await addPractitioner({ name, specialty })
  return id as number
}
