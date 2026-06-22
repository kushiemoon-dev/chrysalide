import type { Page } from '@playwright/test'

/**
 * Skip the onboarding flow by marking it as complete in localStorage
 * before the page loads.
 */
export async function skipOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'chrysalide-onboarding',
      JSON.stringify({ completed: true, currentStep: 3 })
    )
  })
}

/**
 * Delete the IndexedDB database before the app loads so tests start
 * from a known empty state (prevents data leaking between test runs).
 */
export async function resetDatabase(page: Page) {
  await page.addInitScript(() => {
    indexedDB.deleteDatabase('ChrysalideDB')
  })
}
