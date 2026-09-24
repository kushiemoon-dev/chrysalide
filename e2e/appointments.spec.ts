import { test, expect, type Page } from '@playwright/test'
import { skipOnboarding, resetDatabase } from './helpers'

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

// Raw IndexedDB inserts: this describe deliberately skips resetDatabase (see
// its own comment below) so a plain page.reload() is safe and simply makes
// the list page re-fetch and pick up what was just seeded here.
async function seedAppointments(
  page: Page,
  appointments: { date: Date; time?: string; type: string; doctor?: string; objectiveId?: number }[]
) {
  await page.evaluate((apts) => {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('ChrysalideDB')
      req.onsuccess = () => {
        const tx = req.result.transaction('appointments', 'readwrite')
        for (const apt of apts) {
          tx.objectStore('appointments').add({ ...apt, createdAt: new Date() })
        }
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
  }, appointments)
}

test.describe('Calendrier des rendez-vous', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await resetDatabase(page)
  })

  test('le calendrier annuel affiche les 12 mois et la légende des types', async ({ page }) => {
    await page.goto('/appointments/calendar')
    await expect(page.getByText(String(new Date().getFullYear()), { exact: true })).toBeVisible()
    await expect(page.getByText('Endocrinologue')).toBeVisible()
    for (const month of ['janvier', 'juin', 'décembre']) {
      await expect(page.getByText(month, { exact: true })).toBeVisible()
    }
  })

  test("la navigation d'année change l'année affichée", async ({ page }) => {
    await page.goto('/appointments/calendar')
    const currentYear = new Date().getFullYear()
    await page.getByRole('button', { name: '→' }).click()
    await expect(page.getByText(String(currentYear + 1))).toBeVisible()
  })
})

test.describe('Suivi des coûts', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await resetDatabase(page)
  })

  test('le champ coût est masqué par défaut et apparaît quand le suivi est activé', async ({
    page,
  }) => {
    await page.goto('/appointments/new')
    await expect(page.getByLabel('Reste à charge (€)')).toHaveCount(0)

    await page.evaluate(() => localStorage.setItem('chrysalide_cost_tracking_enabled', 'true'))
    await page.reload()
    await expect(page.getByLabel('Reste à charge (€)')).toBeVisible()
  })

  test('la carte de coût total et le détail du coût restent masqués si le suivi est désactivé après coup', async ({
    page,
  }) => {
    await page.goto('/appointments/new')
    await page.evaluate(() => localStorage.setItem('chrysalide_cost_tracking_enabled', 'true'))
    await page.reload()
    await page.locator('#date').fill('2026-01-01')
    await page.getByLabel('Reste à charge (€)').fill('42.5')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page).toHaveURL('/appointments', { timeout: 15000 })

    await expect(page.getByText('42,50 €')).toBeVisible()

    await page.evaluate(() => localStorage.removeItem('chrysalide_cost_tracking_enabled'))
    await page.reload()
    await expect(page.getByText('42,50 €')).toHaveCount(0)
  })
})

test.describe('Tri des RDV passés', () => {
  // No resetDatabase here: each test gets its own isolated browser context
  // (empty IndexedDB) already, and skipping it means a plain page.reload()
  // after seeding doesn't wipe what was just seeded (same convention as
  // objectives.spec.ts).
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('trie et regroupe par mois, sans affecter le compteur ni l’onglet à venir (AC-1, AC-2, AC-3)', async ({
    page,
  }) => {
    const recentDay = daysAgo(10)
    const olderDay = daysAgo(65)
    // Sanity check the fixture this test relies on: the two past days must
    // land in different months for the month-grouping assertion below.
    expect(
      recentDay.getFullYear() === olderDay.getFullYear() &&
        recentDay.getMonth() === olderDay.getMonth()
    ).toBe(false)

    await page.goto('/appointments')
    // Wait for the page's own initial Dexie round-trip to settle before
    // opening a second raw connection to seed data — racing a fresh
    // connection against Dexie's still-in-progress first open on this
    // browser context is what caused the seed to hang (observed as an
    // "Upgrade blocked by other connection" warning).
    await expect(page.locator('.loading')).toHaveCount(0)
    await seedAppointments(page, [
      { date: recentDay, time: '16:00', type: 'endocrinologist' },
      { date: recentDay, time: '09:00', type: 'psychiatrist' },
      { date: olderDay, type: 'surgeon' },
      { date: daysAgo(-10), type: 'nurse' }, // future, must stay out of "past"
    ])
    await page.reload()

    // "À venir" (default tab) is unaffected: only the future appointment.
    await expect(page.getByRole('button', { name: 'À venir (1)' })).toBeVisible()
    await expect(page.getByText('Infirmier·e').first()).toBeVisible()

    await page.getByRole('button', { name: 'Passés (3)' }).click()

    // Descending date+time order: same-day 16:00 before 09:00, then the
    // older month.
    await expect(page.locator('.apt-type')).toHaveText([
      'Endocrinologue',
      'Psychiatre',
      'Chirurgien·ne',
    ])

    // Two distinct month headings (the two past days are in different
    // months, most recent first — implied by the type order already
    // checked above).
    await expect(page.locator('.month-heading')).toHaveCount(2)
  })

  test('les RDV liés à un objectif sont triés par date+heure décroissant (AC-4)', async ({
    page,
  }) => {
    const title = 'Objectif avec RDV E2E'
    await page.goto('/objectives/new', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /Personnalisé|Custom/i }).click()
    await page.locator('#title').click()
    await page.locator('#title').pressSequentially(title)
    await page.locator('#category').selectOption({ label: 'Administratif' })
    await page.getByRole('button', { name: 'Enregistrer' }).click()

    await expect(page).toHaveURL(/\/objectives\/\d+$/, { timeout: 15000 })
    const objectiveId = Number(page.url().match(/\/objectives\/(\d+)$/)![1])

    await seedAppointments(page, [
      { date: daysAgo(20), type: 'endocrinologist', doctor: 'Dr Ancien', objectiveId },
      { date: daysAgo(5), type: 'psychiatrist', doctor: 'Dr Récent', objectiveId },
    ])
    await page.reload()

    await expect(page.locator('.appointment-who')).toHaveText(['Dr Récent', 'Dr Ancien'])
  })
})
