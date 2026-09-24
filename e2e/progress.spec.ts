import { test, expect, type Page } from '@playwright/test'
import { skipOnboarding } from './helpers'

async function seedTwoWeightEntries(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('ChrysalideDB')
        req.onsuccess = () => {
          const tx = req.result.transaction('physicalProgress', 'readwrite')
          tx.objectStore('physicalProgress').add({
            date: new Date('2026-01-10'),
            measurements: { weight: 65 },
            createdAt: new Date(),
          })
          tx.objectStore('physicalProgress').add({
            date: new Date('2026-02-10'),
            measurements: { weight: 63 },
            createdAt: new Date(),
          })
          tx.oncomplete = () => resolve()
          tx.onerror = () => reject(tx.error)
        }
        req.onerror = () => reject(req.error)
      })
  )
}

test.describe("Infobulle du graphique d'évolution physique", () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('un tap affiche date/libellé/valeur, un tap dehors ferme (AC-6)', async ({ page }) => {
    await page.goto('/progress')
    await expect(page.locator('.loading')).toHaveCount(0)

    await seedTwoWeightEntries(page)
    await page.reload()
    await expect(page.locator('.loading')).toHaveCount(0)

    await page.getByRole('button', { name: 'Graphiques' }).click()

    const svg = page.locator('svg.chart').first()
    const box = (await svg.boundingBox())!
    await svg.dispatchEvent('pointerdown', {
      clientX: box.x + box.width / 2,
      clientY: box.y + box.height / 2,
      pointerType: 'touch',
      bubbles: true,
    })

    const tooltip = page.locator('.chart-tooltip')
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toContainText('Poids')
    // The seeded value must actually reach the tooltip, not just the label
    // (either entry is a correct tap target depending on which point the
    // tap snapped to).
    await expect(tooltip).toContainText(/65 kg|63 kg/)

    await page.locator('h1').first().dispatchEvent('pointerdown', { bubbles: true })
    await expect(tooltip).toHaveCount(0)
  })
})

test.describe("Infobulle du graphique d'évolution physique sur un vrai écran tactile", () => {
  // Real touch emulation: a real tap fires pointerdown/pointerup then
  // pointerout/pointerleave for a pointer that can't hover, so
  // onpointerleave must not close the tooltip for that pointer type.
  test.use({ hasTouch: true })

  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test("un vrai tap laisse l'infobulle ouverte après avoir relevé le doigt (AC-6)", async ({
    page,
  }) => {
    await page.goto('/progress')
    await expect(page.locator('.loading')).toHaveCount(0)

    await seedTwoWeightEntries(page)
    await page.reload()
    await expect(page.locator('.loading')).toHaveCount(0)

    await page.getByRole('button', { name: 'Graphiques' }).click()

    const svg = page.locator('svg.chart').first()
    const box = (await svg.boundingBox())!
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)

    await expect(page.locator('.chart-tooltip')).toBeVisible()
  })
})
