import { test, expect, type Page } from '@playwright/test'
import { skipOnboarding, resetDatabase } from './helpers'

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

async function selectCalendarDay(page: Page, date: Date) {
  const dayNum = date.getDate().toString()
  await page
    .locator('.cal-day:not(.outside)')
    .filter({ hasText: new RegExp(`^${dayNum}$`) })
    .click()
}

async function waitForLogCount(page: Page, min: number) {
  await page.waitForFunction(
    (min) =>
      new Promise((resolve) => {
        const req = indexedDB.open('ChrysalideDB')
        req.onsuccess = () => {
          const tx = req.result.transaction('medicationLogs', 'readonly')
          tx.objectStore('medicationLogs').count().onsuccess = (e) =>
            resolve((e.target as IDBRequest<number>).result >= min)
        }
        req.onerror = () => resolve(false)
      }),
    min,
    { timeout: 15000 }
  )
}

async function getAllLogs(page: Page) {
  return page.evaluate(
    () =>
      new Promise<{ medicationId: number; timestamp: string; notes?: string }[]>((resolve) => {
        const req = indexedDB.open('ChrysalideDB')
        req.onsuccess = () => {
          const tx = req.result.transaction('medicationLogs', 'readonly')
          tx.objectStore('medicationLogs').getAll().onsuccess = (e) =>
            resolve(
              (
                e.target as IDBRequest<
                  { medicationId: number; timestamp: string; notes?: string }[]
                >
              ).result
            )
        }
      })
  )
}

async function getMedicationStock(page: Page, name: string) {
  return page.evaluate(
    (name) =>
      new Promise<number | undefined>((resolve) => {
        const req = indexedDB.open('ChrysalideDB')
        req.onsuccess = () => {
          const tx = req.result.transaction('medications', 'readonly')
          tx.objectStore('medications').getAll().onsuccess = (e) => {
            const meds = (e.target as IDBRequest<{ name: string; stock?: number }[]>).result
            resolve(meds.find((m) => m.name === name)?.stock)
          }
        }
      }),
    name
  )
}

// Creates a medication through the real form and waits for the app's own
// post-submit redirect. Callers then navigate onward by clicking in-app
// links rather than page.goto(), since a real navigation would re-run
// resetDatabase's addInitScript and wipe what was just created.
async function createMedicationWithStartDate(page: Page, name: string, startDate: Date) {
  // networkidle: clicking Enregistrer before the client JS has attached the
  // submit handler falls through to a native form GET (same cold-start race
  // documented in bloodtests.spec.ts and objectives.spec.ts).
  await page.goto('/medications/new', { waitUntil: 'networkidle' })
  await page.locator('#name').click()
  await page.locator('#name').pressSequentially(name)
  await page.locator('#dosage').click()
  await page.locator('#dosage').pressSequentially('1')
  await page.locator('input[type="date"]').first().fill(startDate.toISOString().split('T')[0]!)
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page).toHaveURL('/medications', { timeout: 15000 })
}

test.describe('Ajout de médicament', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('le formulaire de nouveau médicament se charge', async ({ page }) => {
    await page.goto('/medications/new')
    await expect(page.getByLabel('Nom du médicament')).toBeVisible()
    await expect(page.getByLabel('Dosage')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeVisible()
  })

  test('ajouter un médicament avec les champs obligatoires', async ({ page }) => {
    // networkidle: clicking Enregistrer before the client JS has attached
    // the submit handler falls through to a native form GET (same cold-start
    // race documented in bloodtests.spec.ts and objectives.spec.ts).
    await page.goto('/medications/new', { waitUntil: 'networkidle' })

    // Use pressSequentially for React 19 controlled inputs
    await page.locator('#name').click()
    await page.locator('#name').pressSequentially('Estradiol test E2E')
    await page.locator('#dosage').click()
    await page.locator('#dosage').pressSequentially('2')

    // Verify fields are filled before submitting
    await expect(page.locator('#name')).toHaveValue('Estradiol test E2E')
    await expect(page.locator('#dosage')).toHaveValue('2')

    // Submit
    await page.getByRole('button', { name: 'Enregistrer' }).click()

    // Should redirect to medications list (DB operations can take a moment)
    await expect(page).toHaveURL('/medications', { timeout: 15000 })
  })

  test('affiche une erreur si nom ou dosage manquant', async ({ page }) => {
    await page.goto('/medications/new')

    // Submit without filling required fields
    await page.getByRole('button', { name: 'Enregistrer' }).click()

    // Should stay on the form page
    await expect(page).toHaveURL(/\/medications\/new/)
  })

  test("le champ date de début est pré-rempli avec aujourd'hui", async ({ page }) => {
    await page.goto('/medications/new')
    const today = new Date().toISOString().split('T')[0]!
    const startDateInput = page.locator('input[type="date"]').first()
    await expect(startDateInput).toHaveValue(today)
  })

  test('le formulaire a un lien Annuler vers la liste', async ({ page }) => {
    await page.goto('/medications/new')
    const cancelLink = page.getByRole('link', { name: 'Annuler' })
    await expect(cancelLink).toBeVisible()
    await expect(cancelLink).toHaveAttribute('href', '/medications')
  })
})

test.describe('Rattrapage de la validation automatique', () => {
  test.beforeEach(async ({ page }) => {
    await resetDatabase(page)
    await skipOnboarding(page)
    await page.addInitScript(() => {
      localStorage.setItem('medication-auto-validation', 'true')
      // Repère du dernier rattrapage bien avant le traitement ajouté par le
      // test, pour que le rattrapage remonte jusqu'au début du traitement
      // et non pas seulement à hier (comportement par défaut sans repère).
      const since = new Date()
      since.setDate(since.getDate() - 30)
      localStorage.setItem('chrysalide_auto_validation_since', since.toISOString())
    })
  })

  // A medication started several days before the app was reopened must
  // have its earlier doses caught up, bounded by the last catch-up marker
  // rather than always replaying the whole treatment history.
  test('valide les prises manquées depuis le début du traitement, pas seulement la veille', async ({
    page,
  }) => {
    await page.goto('/medications/new', { waitUntil: 'networkidle' })
    await page.locator('#name').click()
    await page.locator('#name').pressSequentially('Test rattrapage E2E')
    await page.locator('#dosage').click()
    await page.locator('#dosage').pressSequentially('1')

    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    await page.locator('input[type="date"]').first().fill(threeDaysAgo.toISOString().split('T')[0]!)

    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page).toHaveURL('/medications', { timeout: 15000 })

    // The catch-up runs on mount and writes to IndexedDB asynchronously;
    // poll instead of a fixed sleep.
    await page.waitForFunction(
      () =>
        new Promise((resolve) => {
          const req = indexedDB.open('ChrysalideDB')
          req.onsuccess = () => {
            const tx = req.result.transaction('medicationLogs', 'readonly')
            tx.objectStore('medicationLogs').count().onsuccess = (e) =>
              resolve((e.target as IDBRequest<number>).result >= 3)
          }
          req.onerror = () => resolve(false)
        }),
      { timeout: 15000 }
    )

    const loggedDays = await page.evaluate(
      () =>
        new Promise<string[]>((resolve) => {
          const req = indexedDB.open('ChrysalideDB')
          req.onsuccess = () => {
            const tx = req.result.transaction('medicationLogs', 'readonly')
            tx.objectStore('medicationLogs').getAll().onsuccess = (e) => {
              const logs = (e.target as IDBRequest<{ timestamp: Date }[]>).result
              resolve(logs.map((log) => new Date(log.timestamp).toISOString().split('T')[0]!))
            }
          }
        })
    )

    // The two full days before today must have been caught up (today's own
    // dose depends on whether 9am has already passed at test time, so it's
    // not asserted here to avoid flakiness).
    for (const daysAgo of [1, 2]) {
      const day = new Date()
      day.setDate(day.getDate() - daysAgo)
      expect(loggedDays).toContain(day.toISOString().split('T')[0])
    }
  })

  test('valide aussi en ouvrant directement le calendrier (AC-9)', async ({ page }) => {
    // Yesterday would fall in the previous month, and the day lookup below
    // only searches the currently-displayed month.
    test.skip(new Date().getDate() === 1, 'yesterday falls in the previous month on the 1st')

    await createMedicationWithStartDate(page, 'Calendrier direct E2E', daysAgo(5))

    await page.getByRole('link', { name: 'Calendrier des prises' }).click()
    await expect(page).toHaveURL('/medications/calendar')

    // Days -1..-5 are always past their 09:00 reminder by test time; today's
    // own dose depends on whether 9am has already passed, so it's excluded
    // from both the wait count and the day checked below (same caution as
    // the pre-existing catch-up test above).
    await waitForLogCount(page, 5)

    await selectCalendarDay(page, daysAgo(1))
    await expect(page.locator('input[type="checkbox"]').first()).toBeChecked()

    const logs = await getAllLogs(page)
    const yesterdayKey = daysAgo(1).toISOString().split('T')[0]
    const yesterdayLog = logs.find(
      (l) => new Date(l.timestamp).toISOString().split('T')[0] === yesterdayKey
    )
    expect(yesterdayLog?.notes).toBe('Auto-validé')
  })

  test('le tableau de bord ne compte plus une dose déjà auto-validée comme due (AC-10)', async ({
    page,
  }) => {
    // The dashboard's "next dose" only ever considers *today*, so unlike the
    // other catch-up tests this one can't sidestep the 9am boundary by
    // checking a different day — it's skipped outside that window rather
    // than risking a flaky assertion.
    test.skip(new Date().getHours() < 9, "depends on today's dose already being past 09:00")

    await createMedicationWithStartDate(page, 'Dashboard E2E', daysAgo(5))

    await page.getByRole('link', { name: 'Accueil' }).click()
    await expect(page).toHaveURL('/')

    await waitForLogCount(page, 6)

    await expect(page.getByText('Prochaine prise', { exact: true })).not.toBeVisible()
  })

  test('ne duplique aucune dose en visitant plusieurs écrans successivement, stock décrémenté une fois par dose (AC-11)', async ({
    page,
  }) => {
    const initialStock = 20

    await page.goto('/medications/new', { waitUntil: 'networkidle' })
    await page.locator('#name').click()
    await page.locator('#name').pressSequentially('Multi-écrans E2E')
    await page.locator('#dosage').click()
    await page.locator('#dosage').pressSequentially('1')
    await page.locator('input[type="date"]').first().fill(daysAgo(5).toISOString().split('T')[0]!)
    await page.locator('#stock').fill(String(initialStock))
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page).toHaveURL('/medications', { timeout: 15000 })

    // Successive visits, each screen triggering its own catch-up: dashboard,
    // then calendar, then back to the medications list.
    await page.getByRole('link', { name: 'Accueil' }).click()
    await expect(page).toHaveURL('/')
    await page.getByRole('link', { name: 'Medocs' }).click()
    await expect(page).toHaveURL('/medications')
    await page.getByRole('link', { name: 'Calendrier des prises' }).click()
    await expect(page).toHaveURL('/medications/calendar')
    await page.getByRole('link', { name: 'Medocs' }).click()
    await expect(page).toHaveURL('/medications')

    // Doses due since day -5, excluding today (see AC-9 above); the
    // duplicate/stock checks below hold regardless of whether today's own
    // dose ends up included.
    await waitForLogCount(page, 5)

    const logs = await getAllLogs(page)
    const dayKeys = logs.map((l) => new Date(l.timestamp).toISOString().split('T')[0])
    expect(new Set(dayKeys).size).toBe(dayKeys.length)

    const stockAfter = await getMedicationStock(page, 'Multi-écrans E2E')
    expect(stockAfter).toBe(initialStock - logs.length)
  })
})

test.describe('Rattrapage désactivé', () => {
  test.beforeEach(async ({ page }) => {
    await resetDatabase(page)
    await skipOnboarding(page)
  })

  test('ne valide aucune prise quand le rattrapage est désactivé (AC-12)', async ({ page }) => {
    await createMedicationWithStartDate(page, 'Désactivé E2E', daysAgo(5))

    await page.getByRole('link', { name: 'Accueil' }).click()
    await expect(page).toHaveURL('/')
    await page.getByRole('link', { name: 'Medocs' }).click()
    await expect(page).toHaveURL('/medications')
    await page.getByRole('link', { name: 'Calendrier des prises' }).click()
    await expect(page).toHaveURL('/medications/calendar')

    const logs = await getAllLogs(page)
    expect(logs).toHaveLength(0)
  })

  // Auto-validation disabled here so creating the medication can't itself
  // produce a log before it's deactivated below — this isolates R3.7's
  // "inactive with no log" case from the (already covered) "inactive with a
  // log" case in Task 3.
  test('un médicament désactivé sans log disparaît du calendrier et de "valider le mois" (AC-14)', async ({
    page,
  }) => {
    await createMedicationWithStartDate(page, 'Inactif E2E', new Date())

    await page.getByRole('link', { name: 'Détails' }).click()
    await expect(page).toHaveURL(/\/medications\/\d+$/)
    await page.getByRole('link', { name: 'Modifier' }).click()
    await expect(page).toHaveURL(/\/medications\/\d+\/edit$/)

    await page.locator('.switch-row').first().locator('input[type="checkbox"]').uncheck()
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page).toHaveURL(/\/medications\/\d+$/)

    await page.getByRole('link', { name: 'Retour' }).click()
    await expect(page).toHaveURL('/medications')
    await page.getByRole('link', { name: 'Calendrier des prises' }).click()
    await expect(page).toHaveURL('/medications/calendar')

    await expect(page.getByText('Inactif E2E')).not.toBeVisible()

    page.once('dialog', (d) => d.accept())
    await page.getByRole('button', { name: 'Valider le mois entier' }).click()
    page.once('dialog', (d) => d.accept())
    await expect(page.getByRole('button', { name: 'Valider le mois entier' })).toBeEnabled()

    const logs = await getAllLogs(page)
    expect(logs).toHaveLength(0)
  })
})
