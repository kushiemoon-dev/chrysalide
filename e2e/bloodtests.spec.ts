import { test, expect } from '@playwright/test'
import { skipOnboarding } from './helpers'

test.describe('Ajout de résultat sanguin', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('le formulaire de nouvelle analyse se charge', async ({ page }) => {
    await page.goto('/bloodtests/new')
    await expect(page.getByLabel("Date de l'analyse")).toBeVisible()
    await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeVisible()
  })

  test("la date est pré-remplie avec aujourd'hui", async ({ page }) => {
    await page.goto('/bloodtests/new')
    const today = new Date().toISOString().split('T')[0]
    await expect(page.getByLabel("Date de l'analyse")).toHaveValue(today)
  })

  test('les groupes de marqueurs sont affichés', async ({ page }) => {
    await page.goto('/bloodtests/new')
    await expect(page.getByText('Hormones')).toBeVisible()
    await expect(page.getByText('Santé sanguine')).toBeVisible()
    await expect(page.getByText('Foie & Reins')).toBeVisible()
  })

  test('enregistrer une analyse avec au moins un marqueur', async ({ page }) => {
    await page.goto('/bloodtests/new')

    // Use input id directly for special character label compatibility
    await page.locator('#estradiol').click()
    await page.locator('#estradiol').pressSequentially('120')
    await expect(page.locator('#estradiol')).toHaveValue('120')

    await page.getByRole('button', { name: 'Enregistrer' }).click()

    // Should redirect to blood tests list (DB operations can take a moment)
    await expect(page).toHaveURL('/bloodtests', { timeout: 15000 })
  })

  test('enregistrer une analyse avec plusieurs marqueurs', async ({ page }) => {
    await page.goto('/bloodtests/new')

    await page.locator('#estradiol').click()
    await page.locator('#estradiol').pressSequentially('150')
    await page.locator('#testosterone').click()
    await page.locator('#testosterone').pressSequentially('0.3')

    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page).toHaveURL('/bloodtests', { timeout: 15000 })
  })

  test('le champ laboratoire est optionnel', async ({ page }) => {
    await page.goto('/bloodtests/new')
    const labInput = page.getByLabel('Laboratoire')
    await expect(labInput).toBeVisible()
    // placeholder should say "Optionnel"
    await expect(labInput).toHaveAttribute('placeholder', 'Optionnel')
  })
})
