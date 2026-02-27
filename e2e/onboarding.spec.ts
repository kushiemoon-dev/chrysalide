import { test, expect } from '@playwright/test'

test.describe('Onboarding', () => {
  test('la page onboarding se charge', async ({ page }) => {
    await page.goto('/onboarding')
    // Should show welcome step
    await expect(page.getByRole('button', { name: /Commencer/i })).toBeVisible()
  })

  test('compléter le flux onboarding complet', async ({ page }) => {
    await page.goto('/onboarding')

    // Step 0 — Welcome
    await expect(page.getByRole('button', { name: /Commencer/i })).toBeVisible()
    await page.getByRole('button', { name: 'Commencer' }).click()

    // Step 1 — Profile (optional, click Continuer)
    await expect(page.getByRole('button', { name: /Continuer/i })).toBeVisible()
    await page.getByRole('button', { name: /Continuer/i }).click()

    // Step 2 — Medication (optional, click Plus tard)
    await expect(page.getByRole('button', { name: /Plus tard/i })).toBeVisible()
    await page.getByRole('button', { name: /Plus tard/i }).click()

    // Step 3 — Tour, click "Commencer mon suivi"
    await expect(page.getByRole('button', { name: /Commencer mon suivi/i })).toBeVisible()
    await page.getByRole('button', { name: /Commencer mon suivi/i }).click()

    // Should redirect to home
    await expect(page).toHaveURL('/')
  })

  test('un onboarding déjà complété redirige vers /', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'chrysalide-onboarding',
        JSON.stringify({ completed: true, currentStep: 3 })
      )
    })
    await page.goto('/onboarding')
    await expect(page).toHaveURL('/')
  })
})
