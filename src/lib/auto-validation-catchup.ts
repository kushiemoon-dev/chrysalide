import { addDays, startOfDay } from 'date-fns'
import { getMedications, getMedicationLogsBetween, addMedicationLog } from './db'
import { computeMissingAutoValidations } from './auto-validation'
import { isAutoValidationEnabled } from './notifications'
import { i18n } from './i18n.svelte'

const SINCE_STORAGE_KEY = 'chrysalide_auto_validation_since'
let inFlight: Promise<number> | null = null

export async function runAutoValidationCatchUp(now: Date = new Date()): Promise<number> {
  if (inFlight) return inFlight
  inFlight = performCatchUp(now).finally(() => {
    inFlight = null
  })
  return inFlight
}

async function performCatchUp(now: Date): Promise<number> {
  if (!isAutoValidationEnabled()) return 0
  const medications = await getMedications(true)
  if (medications.length === 0) return 0

  const earliestStart = medications.reduce((earliest, med) => {
    const start = new Date(med.startDate)
    return start < earliest ? start : earliest
  }, new Date(medications[0]!.startDate))

  const storedSince = localStorage.getItem(SINCE_STORAGE_KEY)
  const since = storedSince ? new Date(storedSince) : startOfDay(addDays(now, -1))
  const rangeStart = startOfDay(since > earliestStart ? since : earliestStart)

  const existingLogs = await getMedicationLogsBetween(rangeStart, now)
  const pending = computeMissingAutoValidations({
    medications,
    existingLogs,
    now,
    enabled: true,
    since,
  })

  for (const dose of pending) {
    await addMedicationLog({
      medicationId: dose.medicationId,
      timestamp: dose.timestamp,
      taken: true,
      scheduledTime: dose.scheduledTime,
      doseIndex: dose.doseIndex,
      notes: i18n.t('medications.list.autoValidated'),
    })
  }
  localStorage.setItem(SINCE_STORAGE_KEY, now.toISOString())
  return pending.length
}
