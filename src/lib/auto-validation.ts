import { addDays, isSameDay, set } from 'date-fns'
import { getMedicationReminderTimes, shouldTakeMedicationOnDate } from './notifications'
import type { Medication, MedicationLog } from './types'

/**
 * A dose that should have been auto-validated but has no matching log yet.
 */
export interface PendingAutoValidation {
  medicationId: number
  timestamp: Date
  scheduledTime: string
  doseIndex: number
}

interface ComputeMissingAutoValidationsInput {
  medications: Medication[]
  existingLogs: MedicationLog[]
  now: Date
  enabled: boolean
}

/**
 * Computes every past-due dose that has no matching log yet, across the
 * whole treatment period (from each medication's startDate up to now).
 * Pure: takes `now` as input instead of reading the clock, and `enabled`
 * instead of reading localStorage, so it stays trivially testable.
 */
export function computeMissingAutoValidations({
  medications,
  existingLogs,
  now,
  enabled,
}: ComputeMissingAutoValidationsInput): PendingAutoValidation[] {
  if (!enabled) return []

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const results: PendingAutoValidation[] = []

  for (const med of medications) {
    if (!med.id || !med.isActive) continue

    const medId = med.id
    const logsForMed = existingLogs.filter((log) => log.medicationId === medId)
    const doseTimes = getMedicationReminderTimes(med)

    const start = new Date(med.startDate)
    let day = new Date(start.getFullYear(), start.getMonth(), start.getDate())

    while (day <= todayStart) {
      if (shouldTakeMedicationOnDate(med, day)) {
        const dayLogs = logsForMed.filter((log) => isSameDay(new Date(log.timestamp), day))
        const claimedTimes = new Set(
          dayLogs.filter((log) => log.scheduledTime).map((log) => log.scheduledTime)
        )
        let unscopedLogs = dayLogs.filter((log) => !log.scheduledTime).length

        for (let doseIndex = 0; doseIndex < doseTimes.length; doseIndex++) {
          const scheduledTime = doseTimes[doseIndex]!
          if (claimedTimes.has(scheduledTime)) continue
          if (unscopedLogs > 0) {
            unscopedLogs--
            continue
          }

          const [hours, minutes] = scheduledTime.split(':').map(Number)
          const scheduledDateTime = set(day, {
            hours: hours!,
            minutes: minutes!,
            seconds: 0,
            milliseconds: 0,
          })
          if (scheduledDateTime > now) continue

          results.push({
            medicationId: medId,
            timestamp: scheduledDateTime,
            scheduledTime,
            doseIndex,
          })
        }
      }

      day = addDays(day, 1)
    }
  }

  return results
}
