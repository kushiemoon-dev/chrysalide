import { test, expect } from '@playwright/test'
import { skipOnboarding } from './helpers'

// Note: Playwright gives each test an isolated browser context, so IndexedDB
// starts empty for every test (same approach as medications.spec.ts — no
// manual DB reset needed). Default locale is `fr`, so French UI strings apply.

test.describe('Objectifs', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('affiche un état vide sans objectif', async ({ page }) => {
    await page.goto('/objectives')

    // Empty-state heading from messages/fr.json -> objectives.list.empty
    await expect(page.getByRole('heading', { name: 'Aucun objectif' })).toBeVisible()
    // Empty state offers a creation shortcut
    await expect(page.getByRole('button', { name: 'Créer un objectif' })).toBeVisible()
  })

  test('crée un objectif standard (non médical) et le retrouve dans la liste', async ({ page }) => {
    const title = 'Refaire mes papiers E2E'

    // Wait for network idle: this page hydrates a lot of template cards, and
    // clicking the tab before hydration completes silently no-ops the click.
    await page.goto('/objectives/new', { waitUntil: 'networkidle' })

    // The form lives in the "custom" tab (the page opens on the templates tab).
    await page.getByRole('tab', { name: /Personnalisé|Custom/i }).click()

    // Title (React-controlled input — type sequentially like medications spec).
    await page.locator('#title').click()
    await page.locator('#title').pressSequentially(title)
    await expect(page.locator('#title')).toHaveValue(title)

    // Pick a non-medical category to avoid the medical-only act fields.
    // First combobox is the category Select (Radix -> role=combobox / option).
    await page.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Administratif' }).click()

    // Submit
    await page.getByRole('button', { name: 'Créer' }).click()

    // After creation the app redirects to the objective detail page.
    await expect(page).toHaveURL(/\/objectives\/\d+$/, { timeout: 15000 })

    // The new objective must appear in the list.
    await page.goto('/objectives')
    await expect(page.getByRole('heading', { name: title })).toBeVisible({ timeout: 15000 })
  })

  test('redirige /acts vers /objectives', async ({ page }) => {
    await page.goto('/acts')
    await expect(page).toHaveURL(/\/objectives$/)
    await expect(page.getByRole('heading', { name: 'Mes Objectifs' })).toBeVisible()
  })

  test('supprime un objectif', async ({ page }) => {
    const title = 'Objectif à supprimer E2E'

    // Create one objective first.
    await page.goto('/objectives/new', { waitUntil: 'networkidle' })
    await page.getByRole('tab', { name: /Personnalisé|Custom/i }).click()
    await page.locator('#title').click()
    await page.locator('#title').pressSequentially(title)
    await page.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Administratif' }).click()
    await page.getByRole('button', { name: 'Créer' }).click()

    // Land on the detail page.
    await expect(page).toHaveURL(/\/objectives\/\d+$/, { timeout: 15000 })

    // Open the delete confirmation dialog. The delete trigger is the only
    // button styled `text-destructive` (an icon button with no text label).
    await page.locator('button.text-destructive').click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Supprimer' }).click()

    // Back to the list; the objective must be gone (empty state again).
    await expect(page).toHaveURL(/\/objectives$/, { timeout: 15000 })
    await expect(page.getByRole('heading', { name: title })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Aucun objectif' })).toBeVisible()
  })
})
