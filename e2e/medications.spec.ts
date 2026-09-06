import { test, expect } from '@playwright/test'
import { skipOnboarding, resetDatabase } from './helpers'

test.describe('Ajout de médicament', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('le formulaire de nouveau médicament se charge', async ({ page }) => {
    await page.goto('/medications/new')
    await expect(page.getByLabel('Nom du médicament')).toBeVisible()
    await expect(page.getByLabel('Dosage')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeVisible()
  })

  test('ajouter un médicament avec les champs obligatoires', async ({ page }) => {
    await page.goto('/medications/new')

    // Use pressSequentially for React 19 controlled inputs
    await page.locator('#name').click()
    await page.locator('#name').pressSequentially('Estradiol test E2E')
    await page.locator('#dosage').click()
    await page.locator('#dosage').pressSequentially('2')

    // Verify fields are filled before submitting
    await expect(page.locator('#name')).toHaveValue('Estradiol test E2E')
    await expect(page.locator('#dosage')).toHaveValue('2')

    // Submit
    await page.getByRole('button', { name: 'Enregistrer' }).click()

    // Should redirect to medications list (DB operations can take a moment)
    await expect(page).toHaveURL('/medications', { timeout: 15000 })
  })

  test('affiche une erreur si nom ou dosage manquant', async ({ page }) => {
    await page.goto('/medications/new')

    // Submit without filling required fields
    await page.getByRole('button', { name: 'Enregistrer' }).click()

    // Should stay on the form page
    await expect(page).toHaveURL(/\/medications\/new/)
  })

  test("le champ date de début est pré-rempli avec aujourd'hui", async ({ page }) => {
    await page.goto('/medications/new')
    const today = new Date().toISOString().split('T')[0]!
    const startDateInput = page.locator('input[type="date"]').first()
    await expect(startDateInput).toHaveValue(today)
  })

  test('le formulaire a un lien Annuler vers la liste', async ({ page }) => {
    await page.goto('/medications/new')
    const cancelLink = page.getByRole('link', { name: 'Annuler' })
    await expect(cancelLink).toBeVisible()
    await expect(cancelLink).toHaveAttribute('href', '/medications')
  })
})

test.describe('Rattrapage de la validation automatique', () => {
  test.beforeEach(async ({ page }) => {
    await resetDatabase(page)
    await skipOnboarding(page)
    await page.addInitScript(() => {
      localStorage.setItem('medication-auto-validation', 'true')
    })
  })

  // Reproduces the original bug: only "today" and "yesterday" used to be
  // caught up, so a medication started several days before the app was
  // reopened never got its earlier doses validated.
  test('valide les prises manquées depuis le début du traitement, pas seulement la veille', async ({
    page,
  }) => {
    await page.goto('/medications/new')
    await page.locator('#name').click()
    await page.locator('#name').pressSequentially('Test rattrapage E2E')
    await page.locator('#dosage').click()
    await page.locator('#dosage').pressSequentially('1')

    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    await page.locator('input[type="date"]').first().fill(threeDaysAgo.toISOString().split('T')[0]!)

    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page).toHaveURL('/medications', { timeout: 15000 })

    // The catch-up runs on mount and writes to IndexedDB asynchronously;
    // poll instead of a fixed sleep.
    await page.waitForFunction(
      () =>
        new Promise((resolve) => {
          const req = indexedDB.open('ChrysalideDB')
          req.onsuccess = () => {
            const tx = req.result.transaction('medicationLogs', 'readonly')
            tx.objectStore('medicationLogs').count().onsuccess = (e) =>
              resolve((e.target as IDBRequest<number>).result >= 3)
          }
          req.onerror = () => resolve(false)
        }),
      { timeout: 15000 }
    )

    const loggedDays = await page.evaluate(
      () =>
        new Promise<string[]>((resolve) => {
          const req = indexedDB.open('ChrysalideDB')
          req.onsuccess = () => {
            const tx = req.result.transaction('medicationLogs', 'readonly')
            tx.objectStore('medicationLogs').getAll().onsuccess = (e) => {
              const logs = (e.target as IDBRequest<{ timestamp: Date }[]>).result
              resolve(logs.map((log) => new Date(log.timestamp).toISOString().split('T')[0]!))
            }
          }
        })
    )

    // The two full days before today must have been caught up (today's own
    // dose depends on whether 9am has already passed at test time, so it's
    // not asserted here to avoid flakiness).
    for (const daysAgo of [1, 2]) {
      const day = new Date()
      day.setDate(day.getDate() - daysAgo)
      expect(loggedDays).toContain(day.toISOString().split('T')[0])
    }
  })
})
