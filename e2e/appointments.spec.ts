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
