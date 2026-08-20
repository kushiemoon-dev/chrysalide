import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, getUserProfile, saveUserProfile } from './db'

beforeEach(async () => {
  await db.userProfile.clear()
})

describe('User profile', () => {
  it('getUserProfile retourne null si aucun profil', async () => {
    expect(await getUserProfile()).toBeNull()
  })

  it('saveUserProfile crée un profil avec createdAt/updatedAt', async () => {
    await saveUserProfile({ firstName: 'Alex' })
    const profile = await getUserProfile()
    expect(profile?.firstName).toBe('Alex')
    expect(profile?.createdAt).toBeInstanceOf(Date)
    expect(profile?.updatedAt).toBeInstanceOf(Date)
  })

  it('saveUserProfile met à jour le profil existant plutôt que d’en créer un second', async () => {
    await saveUserProfile({ firstName: 'Alex' })
    await saveUserProfile({ firstName: 'Sam' })

    const all = await db.userProfile.toArray()
    expect(all).toHaveLength(1)
    expect(all[0]!.firstName).toBe('Sam')
  })
})
