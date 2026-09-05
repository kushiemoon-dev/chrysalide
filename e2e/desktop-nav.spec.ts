import { test, expect } from '@playwright/test'
import { skipOnboarding } from './helpers'

const DESKTOP_VIEWPORT = { width: 1440, height: 900 }
const MOBILE_VIEWPORT = { width: 768, height: 1024 }

test.describe('Nav rail desktop (>= 1024px)', () => {
  test.use({ viewport: DESKTOP_VIEWPORT })

  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('la nav rail desktop est visible, la pill mobile est absente', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('desktop-nav')).toBeVisible()
    await expect(page.getByTestId('glass-nav')).toBeHidden()
  })

  test('le dashboard affiche la grille 2 colonnes (hero + timeline côte à côte)', async ({
    page,
  }) => {
    await page.goto('/')
    const heroBox = await page.locator('.hero-col').boundingBox()
    const timelineBox = await page.locator('.timeline-col').boundingBox()
    expect(heroBox).toBeTruthy()
    expect(timelineBox).toBeTruthy()
    expect(timelineBox!.x).toBeGreaterThan(heroBox!.x + heroBox!.width - 5)
  })

  test('une route standard reste recentrée sous ~640px', async ({ page }) => {
    await page.goto('/practitioners')
    const box = await page.locator('.content').boundingBox()
    expect(box?.width).toBeLessThanOrEqual(641)
  })

  test("une route large monte jusqu'à ~960px", async ({ page }) => {
    await page.goto('/progress')
    const box = await page.locator('.content').boundingBox()
    expect(box?.width).toBeGreaterThan(641)
    expect(box?.width).toBeLessThanOrEqual(961)
  })

  test("l'onboarding n'affiche aucune nav même en desktop", async ({ page }) => {
    await page.goto('/onboarding')
    await expect(page.getByTestId('desktop-nav')).toHaveCount(0)
    await expect(page.getByTestId('glass-nav')).toBeHidden()
  })
})

test.describe('Nav pill mobile (< 1024px) reste inchangée', () => {
  test.use({ viewport: MOBILE_VIEWPORT })

  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('la pill mobile est visible, la nav rail desktop est absente', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('glass-nav')).toBeVisible()
    await expect(page.getByTestId('desktop-nav')).toBeHidden()
  })
})
