import { test, expect } from '@playwright/test'
import { skipOnboarding, resetDatabase } from './helpers'

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
