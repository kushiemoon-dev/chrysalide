import { test, expect } from '@playwright/test'
import { skipOnboarding, resetDatabase } from './helpers'

test.describe('Annuaire des praticien·nes', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await resetDatabase(page)
  })

  test('la liste vide affiche un état vide', async ({ page }) => {
    await page.goto('/practitioners')

    await expect(page.getByText('Aucun·e praticien·ne', { exact: true })).toBeVisible()
    await expect(
      page.getByText('Ajoutez vos praticien·nes pour les retrouver facilement')
    ).toBeVisible()
  })

  test('le formulaire de nouveau·elle praticien·ne se charge', async ({ page }) => {
    await page.goto('/practitioners/new')

    await expect(page.getByLabel('Nom complet *')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeVisible()
  })

  test('le bouton Enregistrer est désactivé tant que le nom est vide', async ({ page }) => {
    await page.goto('/practitioners/new')

    await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()

    // Use pressSequentially for React 19 controlled inputs
    await page.locator('#name').click()
    await page.locator('#name').pressSequentially('Dr. Test')
    await expect(page.locator('#name')).toHaveValue('Dr. Test')

    await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeEnabled()
  })

  test('créer un·e praticien·ne → apparaît dans la liste', async ({ page }) => {
    await page.goto('/practitioners/new')

    // Use input id directly for React 19 controlled input compatibility
    await page.locator('#name').click()
    await page.locator('#name').pressSequentially('Dr. Praticien·ne E2E')
    await expect(page.locator('#name')).toHaveValue('Dr. Praticien·ne E2E')

    await page.getByRole('button', { name: 'Enregistrer' }).click()

    // Should redirect to the practitioners list (DB writes can take a moment)
    await expect(page).toHaveURL('/practitioners', { timeout: 15000 })

    // The new practitioner should now be listed
    await expect(page.getByText('Dr. Praticien·ne E2E')).toBeVisible()
  })

  test('supprimer un·e praticien·ne → disparaît de la liste', async ({ page }) => {
    // Arrange: create a practitioner first
    await page.goto('/practitioners/new')
    await page.locator('#name').click()
    await page.locator('#name').pressSequentially('Dr. À Supprimer')
    await expect(page.locator('#name')).toHaveValue('Dr. À Supprimer')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page).toHaveURL('/practitioners', { timeout: 15000 })

    const card = page.getByText('Dr. À Supprimer')
    await expect(card).toBeVisible()

    // Act: delete uses a native confirm() dialog in this port, not a custom
    // alertdialog. The trash icon button carries an aria-label, not text.
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Supprimer' }).click()

    // Assert: the practitioner is gone and the empty state is shown again
    await expect(page.getByText('Dr. À Supprimer')).toHaveCount(0)
    await expect(page.getByText('Aucun·e praticien·ne', { exact: true })).toBeVisible()
  })
})
