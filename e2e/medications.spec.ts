import { test, expect } from '@playwright/test'
import { skipOnboarding } from './helpers'

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
    const today = new Date().toISOString().split('T')[0]
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
