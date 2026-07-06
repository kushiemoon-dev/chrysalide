import { db } from './db-schema'
import type { UserProfile } from './types'

// User Profile
export async function getUserProfile() {
  const profiles = await db.userProfile.toArray()
  return profiles[0] || null
}

export async function saveUserProfile(profile: Partial<UserProfile>) {
  const existing = await getUserProfile()
  const now = new Date()

  if (existing?.id) {
    return db.userProfile.update(existing.id, {
      ...profile,
      updatedAt: now,
    })
  }

  return db.userProfile.add({
    ...profile,
    createdAt: now,
    updatedAt: now,
  } as UserProfile)
}
