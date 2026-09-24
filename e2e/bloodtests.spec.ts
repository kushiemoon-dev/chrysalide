import { test, expect, type Page } from '@playwright/test'
import { skipOnboarding } from './helpers'

async function seedTwoEstradiolTests(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('ChrysalideDB')
        req.onsuccess = () => {
          const tx = req.result.transaction('bloodTests', 'readwrite')
          tx.objectStore('bloodTests').add({
            date: new Date('2026-01-10'),
            results: [{ marker: 'estradiol', value: 120, unit: 'pg/mL' }],
            createdAt: new Date(),
          })
          tx.objectStore('bloodTests').add({
            date: new Date('2026-02-10'),
            results: [{ marker: 'estradiol', value: 150, unit: 'pg/mL' }],
            createdAt: new Date(),
          })
          tx.oncomplete = () => resolve()
          tx.onerror = () => reject(tx.error)
        }
        req.onerror = () => reject(req.error)
      })
  )
}

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
    const today = new Date().toISOString().split('T')[0]!
    await expect(page.getByLabel("Date de l'analyse")).toHaveValue(today)
  })

  test('les groupes de marqueurs sont affichés', async ({ page }) => {
    await page.goto('/bloodtests/new')
    await expect(page.getByText('Hormones')).toBeVisible()
    await expect(page.getByText('Santé sanguine')).toBeVisible()
    await expect(page.getByText('Foie & Reins')).toBeVisible()
  })

  test('enregistrer une analyse avec au moins un marqueur', async ({ page }) => {
    // Wait for hydration: clicking Enregistrer before the client JS has attached
    // the submit handler falls through to a native form GET (page.svelte pattern
    // shared with objectives.spec.ts).
    await page.goto('/bloodtests/new', { waitUntil: 'networkidle' })

    // Use input id directly for special character label compatibility
    await page.locator('#estradiol').click()
    await page.locator('#estradiol').pressSequentially('120')
    await expect(page.locator('#estradiol')).toHaveValue('120')

    await page.getByRole('button', { name: 'Enregistrer' }).click()

    // Should redirect to blood tests list (DB operations can take a moment)
    await expect(page).toHaveURL('/bloodtests', { timeout: 15000 })
  })

  test('enregistrer une analyse avec plusieurs marqueurs', async ({ page }) => {
    await page.goto('/bloodtests/new', { waitUntil: 'networkidle' })

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

test.describe("Infobulle du graphique d'hormones", () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('un tap affiche date/marqueur/valeur, un tap dehors ferme, reste dans le conteneur à 360px (AC-5, AC-7)', async ({
    page,
  }) => {
    await page.goto('/bloodtests')
    await expect(page.locator('.loading')).toHaveCount(0)

    await seedTwoEstradiolTests(page)
    await page.reload()
    await expect(page.locator('.loading')).toHaveCount(0)

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
    await expect(tooltip).toContainText('Œstradiol (E2)')
    // The seeded value must actually reach the tooltip, not just the marker
    // label (both test dates use estradiol, so either 120 or 150 is correct
    // depending on which point the tap snapped to).
    await expect(tooltip).toContainText(/120 pg\/mL|150 pg\/mL/)

    await page.locator('h1').first().dispatchEvent('pointerdown', { bubbles: true })
    await expect(tooltip).toHaveCount(0)

    // AC-7: infobulle bornée horizontalement dans son conteneur, même à 360px.
    await page.setViewportSize({ width: 360, height: 800 })
    const boxAfterResize = (await svg.boundingBox())!
    await svg.dispatchEvent('pointerdown', {
      clientX: boxAfterResize.x + boxAfterResize.width * 0.9,
      clientY: boxAfterResize.y + boxAfterResize.height / 2,
      pointerType: 'touch',
      bubbles: true,
    })
    const tooltipBox = (await tooltip.boundingBox())!
    const wrapBox = (await page.locator('.chart-wrap').first().boundingBox())!
    expect(tooltipBox.x).toBeGreaterThanOrEqual(wrapBox.x - 1)
    expect(tooltipBox.x + tooltipBox.width).toBeLessThanOrEqual(wrapBox.x + wrapBox.width + 1)
  })
})

test.describe("Infobulle du graphique d'hormones sur un vrai écran tactile", () => {
  // Real touch emulation (not a single synthetic pointerdown): a real tap
  // fires pointerdown, pointerup, then pointerout/pointerleave in quick
  // succession for a pointer that can't hover, since it never "leaves" a
  // point it was never hovering. onpointerleave must not close the tooltip
  // for that pointer type, or lifting the finger closes it immediately.
  test.use({ hasTouch: true })

  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test("un vrai tap laisse l'infobulle ouverte après avoir relevé le doigt (AC-5)", async ({
    page,
  }) => {
    await page.goto('/bloodtests')
    await expect(page.locator('.loading')).toHaveCount(0)

    await seedTwoEstradiolTests(page)
    await page.reload()
    await expect(page.locator('.loading')).toHaveCount(0)

    const svg = page.locator('svg.chart').first()
    const box = (await svg.boundingBox())!
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)

    await expect(page.locator('.chart-tooltip')).toBeVisible()
  })
})
