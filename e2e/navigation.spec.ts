import { test, expect } from '@playwright/test'
import { skipOnboarding } from './helpers'

test.describe('Navigation principale', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test("la page d'accueil se charge", async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Chrysalide/)
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
})
