import { test, expect } from '@playwright/test'
import { skipOnboarding } from './helpers'

// Note: Playwright gives each test an isolated browser context, so IndexedDB
// starts empty for every test (same approach as medications.spec.ts, no
// manual DB reset needed). Default locale is `fr`, so French UI strings apply.

test.describe('Objectifs', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('affiche un état vide sans objectif', async ({ page }) => {
    await page.goto('/objectives')

    // Empty-state heading from messages/fr.json -> objectives.list.empty
    await expect(page.getByRole('heading', { name: 'Aucun objectif' })).toBeVisible()
    // Empty state offers a creation shortcut (a styled link, not a button).
    // Two "Nouveau" links exist (header + empty state), assert either is enough.
    await expect(page.getByRole('link', { name: 'Nouveau' }).first()).toBeVisible()
  })

  test('crée un objectif standard (non médical) et le retrouve dans la liste', async ({ page }) => {
    const title = 'Refaire mes papiers E2E'

    // Wait for network idle: this page hydrates a lot of template cards, and
    // clicking the tab before hydration completes silently no-ops the click.
    await page.goto('/objectives/new', { waitUntil: 'networkidle' })

    // The form lives in the "custom" tab (the page opens on the templates tab).
    // Plain buttons, not ARIA tabs, in this port.
    await page.getByRole('button', { name: /Personnalisé|Custom/i }).click()

    await page.locator('#title').click()
    await page.locator('#title').pressSequentially(title)
    await expect(page.locator('#title')).toHaveValue(title)

    // Pick a non-medical category to avoid the medical-only act fields
    // (native <select>, not a Radix combobox in this port).
    await page.locator('#category').selectOption({ label: 'Administratif' })

    // Submit
    await page.getByRole('button', { name: 'Enregistrer' }).click()

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
    await page.getByRole('button', { name: /Personnalisé|Custom/i }).click()
    await page.locator('#title').click()
    await page.locator('#title').pressSequentially(title)
    await page.locator('#category').selectOption({ label: 'Administratif' })
    await page.getByRole('button', { name: 'Enregistrer' }).click()

    // Land on the detail page.
    await expect(page).toHaveURL(/\/objectives\/\d+$/, { timeout: 15000 })

    // Delete uses a native confirm() dialog in this port, not a custom alertdialog.
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Supprimer' }).click()

    // Back to the list; the objective must be gone (empty state again).
    await expect(page).toHaveURL(/\/objectives$/, { timeout: 15000 })
    await expect(page.getByRole('heading', { name: title })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Aucun objectif' })).toBeVisible()
  })
})
