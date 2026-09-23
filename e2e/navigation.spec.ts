import { test, expect } from '@playwright/test'
import { skipOnboarding, resetDatabase } from './helpers'

test.describe('Navigation principale', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test("la page d'accueil se charge", async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Chrysalide/)
  })

  test("la page d'accueil affiche un état vide sans données", async ({ page }) => {
    await resetDatabase(page)
    await page.goto('/')
    await expect(
      page.getByText('Aucun médicament configuré').and(page.locator(':visible'))
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ajouter un médicament' })).toBeVisible()
    await expect(
      page.getByText('Aucun rendez-vous à venir').and(page.locator(':visible'))
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ajouter un RDV' })).toBeVisible()
  })

  test('la barre de navigation inférieure est visible', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation')
    await expect(nav).toBeVisible()
  })

  test('navigation vers Médicaments via la bottom nav', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /Medocs/i }).click()
    await expect(page).toHaveURL(/\/medications/)
  })

  test('navigation vers Analyses via la bottom nav', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /Analyses/i }).click()
    await expect(page).toHaveURL(/\/bloodtests/)
  })

  test('la page médicaments contient un lien pour ajouter', async ({ page }) => {
    await page.goto('/medications')
    const addLink = page.getByRole('link', { name: /ajouter|nouveau|new|\+/i })
    await expect(addLink.first()).toBeVisible()
  })

  test('la page analyses contient un lien pour ajouter', async ({ page }) => {
    await page.goto('/bloodtests')
    const addLink = page.getByRole('link', { name: /ajouter|nouveau|new|\+/i })
    await expect(addLink.first()).toBeVisible()
  })

  test("une entrée de journal privée n'apparaît pas sur le tableau de bord", async ({ page }) => {
    // resetDatabase registers a persistent init script that wipes the DB on
    // every navigation, not just the next one, so it can't be used before a
    // test that navigates more than once. One-off delete instead.
    await page.goto('/journal/new')
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          const req = indexedDB.deleteDatabase('ChrysalideDB')
          req.onsuccess = resolve
          req.onerror = resolve
          req.onblocked = resolve
        })
    )
    await page.reload()

    await page.locator('#content').fill('Contenu strictement privé')
    await page.locator('.switch input[type="checkbox"]').click()
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page).toHaveURL('/journal', { timeout: 15000 })

    await page.goto('/')
    await expect(
      page.getByText('Aucun médicament configuré').and(page.locator(':visible'))
    ).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Contenu strictement privé')).toHaveCount(0)
  })
})
