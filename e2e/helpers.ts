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
