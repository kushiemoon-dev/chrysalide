'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { getDateLocale } from '@/i18n/date-locale'
import type { Locale } from '@/i18n/config'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Check, X, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import Link from 'next/link'
import {
  format,
  startOfMonth,
  endOfMonth,
  isSameDay,
  eachDayOfInterval,
  differenceInDays,
} from 'date-fns'
import { db, getMedications } from '@/lib/db'
import { getMedicationReminderTimes, shouldTakeMedicationOnDate } from '@/lib/notifications'
import type { Medication, MedicationLog } from '@/lib/types'

export default function MedicationsCalendarPage() {
  const locale = useLocale()
  const dateLocale = getDateLocale(locale as Locale)
  const [medications, setMedications] = useState<Medication[]>([])
  const [logs, setLogs] = useState<MedicationLog[]>([])
  const [totalDaysWithLogs, setTotalDaysWithLogs] = useState(0)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [togglingDose, setTogglingDose] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      // Load ALL medications (including inactive/ended) for historical calendar view
      const meds = await getMedications({ activeOnly: false })
      setMedications(meds)

      // Calculate total calendar days since first dose
      const allLogs = await db.medicationLogs.filter((log) => log.taken === true).toArray()
      if (allLogs.length > 0) {
        const firstDose = allLogs.reduce((earliest, log) => {
          const logDate = new Date(log.timestamp)
          return logDate < earliest ? logDate : earliest
        }, new Date(allLogs[0].timestamp))
        setTotalDaysWithLogs(differenceInDays(new Date(), firstDose) + 1)
      }

      setLoading(false)
    }
    loadData()
  }, [])

  // Load logs when month changes
  useEffect(() => {
    async function loadLogs() {
      const start = startOfMonth(currentMonth)
      const end = endOfMonth(currentMonth)

      const monthLogs = await db.medicationLogs.where('timestamp').between(start, end).toArray()

      setLogs(monthLogs)
    }
    loadLogs()
  }, [currentMonth])

  // Get logs for a specific day
  function getLogsForDay(date: Date) {
    return logs.filter((log) => isSameDay(new Date(log.timestamp), date))
  }

  // Get days with activity in current month (only days with taken doses)
  function getDaysWithLogs(): Date[] {
    const uniqueDays = new Map<string, Date>()
    logs.forEach((log) => {
      if (!log.taken) return // Only count taken doses
      const day = new Date(log.timestamp)
      const key = format(day, 'yyyy-MM-dd')
      if (!uniqueDays.has(key)) {
        uniqueDays.set(key, day)
      }
    })
    return Array.from(uniqueDays.values())
  }

  // Toggle a specific dose
  async function toggleDose(med: Medication, time: string, doseIndex: number) {
    const toggleKey = `${med.id}-${time}`
    setTogglingDose(toggleKey)

    try {
      // Find existing log for this dose
      const existingLog = logs.find(
        (l) =>
          l.medicationId === med.id &&
          isSameDay(new Date(l.timestamp), selectedDate) &&
          l.scheduledTime === time
      )

      if (existingLog) {
        // Toggle existing log
        await db.medicationLogs.update(existingLog.id!, { taken: !existingLog.taken })
      } else {
        // Create new log as taken
        await db.medicationLogs.add({
          medicationId: med.id!,
          timestamp: selectedDate,
          taken: true,
          scheduledTime: time,
          doseIndex,
        })
      }

      // Reload logs for the selected day
      const start = startOfMonth(currentMonth)
      const end = endOfMonth(currentMonth)
      const monthLogs = await db.medicationLogs.where('timestamp').between(start, end).toArray()
      setLogs(monthLogs)
    } catch (error) {
      console.error('Error toggling dose:', error)
    } finally {
      setTogglingDose(null)
    }
  }

  // Validate entire month - mark all doses as taken
  async function validateMonth() {
    if (
      !confirm(
        `Valider toutes les prises pour ${format(currentMonth, 'MMMM yyyy', { locale: dateLocale })} ?\n\nCela marquera automatiquement toutes les doses prévues comme prises.`
      )
    ) {
      return
    }

    setValidating(true)
    try {
      const start = startOfMonth(currentMonth)
      const end = endOfMonth(currentMonth)
      const days = eachDayOfInterval({ start, end })

      let totalAdded = 0

      for (const day of days) {
        for (const med of medications) {
          if (!shouldTakeMedicationOnDate(med, day)) continue

          const doseTimes = getMedicationReminderTimes(med)

          for (const time of doseTimes) {
            // Check if log already exists
            const existingLog = logs.find(
              (l) =>
                l.medicationId === med.id &&
                isSameDay(new Date(l.timestamp), day) &&
                l.scheduledTime === time
            )

            if (!existingLog) {
              // Create new log
              await db.medicationLogs.add({
                medicationId: med.id!,
                timestamp: day,
                taken: true,
                scheduledTime: time,
                doseIndex: doseTimes.indexOf(time),
              })
              totalAdded++
            } else if (!existingLog.taken) {
              // Update existing log to mark as taken
              await db.medicationLogs.update(existingLog.id!, { taken: true })
              totalAdded++
            }
          }
        }
      }

      // Reload logs
      const monthLogs = await db.medicationLogs.where('timestamp').between(start, end).toArray()
      setLogs(monthLogs)

      alert(`✅ Mois validé avec succès !\n${totalAdded} prises ajoutées/mises à jour.`)
    } catch (error) {
      console.error('Error validating month:', error)
      alert('❌ Erreur lors de la validation du mois')
    } finally {
      setValidating(false)
    }
  }

  // Calculate stats for selected day
  const selectedDayLogs = getLogsForDay(selectedDate)
  const takenCount = selectedDayLogs.filter((l) => l.taken).length

  // Médicaments à prendre pour le jour sélectionné (strictement dans leur période de prise)
  const medicationsForSelectedDay = medications.filter((med) =>
    shouldTakeMedicationOnDate(med, selectedDate)
  )

  // Total doses: compte les doses individuelles pour les médocs à prendre ce jour
  const totalDoses = medicationsForSelectedDay.reduce((sum, med) => {
    const doseTimes = getMedicationReminderTimes(med)
    return sum + doseTimes.length
  }, 0)

  // Days with logs for highlighting
  const daysWithLogs = getDaysWithLogs()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link href="/medications">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-xl font-bold">Calendrier des prises</h1>
          <p className="text-muted-foreground text-sm">Historique de vos prises</p>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            onMonthChange={setCurrentMonth}
            locale={dateLocale}
            modifiers={{
              hasLogs: daysWithLogs,
            }}
            modifiersStyles={{
              hasLogs: {
                fontWeight: 'bold',
                backgroundColor: 'var(--primary)',
                color: 'white',
                borderRadius: '50%',
              },
            }}
            className="rounded-md"
          />
        </CardContent>
      </Card>

      {/* Selected Day Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>{format(selectedDate, 'EEEE d MMMM yyyy', { locale: dateLocale })}</span>
            {takenCount > 0 && (
              <Badge variant="secondary">
                {takenCount}/{totalDoses} pris
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {medications.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              Aucun médicament configuré
            </p>
          ) : medicationsForSelectedDay.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              Aucune prise prévue ce jour
            </p>
          ) : (
            <div className="space-y-2">
              {medicationsForSelectedDay.map((med) => {
                const medLogs = selectedDayLogs.filter((l) => l.medicationId === med.id)
                const doseTimes = getMedicationReminderTimes(med)
                const hasMultipleDoses = doseTimes.length > 1

                // Multi-doses: afficher chaque dose séparément
                if (hasMultipleDoses) {
                  return (
                    <div key={med.id} className="space-y-1.5">
                      <p className="text-muted-foreground px-1 text-xs font-medium">
                        {med.name} ({med.dosage} {med.unit})
                      </p>
                      {doseTimes.map((time, idx) => {
                        const doseLog = medLogs.find((l) => l.scheduledTime === time)
                        const taken = doseLog?.taken ?? false
                        const toggleKey = `${med.id}-${time}`
                        const isToggling = togglingDose === toggleKey

                        return (
                          <div
                            key={toggleKey}
                            className={`flex items-center justify-between rounded-lg p-2.5 transition-colors ${
                              taken ? 'bg-primary/10' : 'bg-muted/30'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {isToggling ? (
                                <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                              ) : (
                                <Checkbox
                                  checked={taken}
                                  onCheckedChange={() => toggleDose(med, time, idx)}
                                  className="h-5 w-5"
                                />
                              )}
                              <span className="text-foreground text-sm font-medium">{time}</span>
                            </div>
                            {taken && doseLog && (
                              <span className="text-muted-foreground text-xs">
                                {format(new Date(doseLog.timestamp), 'HH:mm')}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                }

                // Dose unique: une seule entrée
                const taken = medLogs.some((l) => l.taken)
                const takenAt = medLogs.find((l) => l.taken)
                const time = doseTimes[0] || '00:00'
                const toggleKey = `${med.id}-${time}`
                const isToggling = togglingDose === toggleKey

                return (
                  <div
                    key={med.id}
                    className={`flex items-center justify-between rounded-lg p-3 transition-colors ${
                      taken ? 'bg-primary/10' : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isToggling ? (
                        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
                      ) : (
                        <Checkbox
                          checked={taken}
                          onCheckedChange={() => toggleDose(med, time, 0)}
                          className="h-5 w-5"
                        />
                      )}
                      <div>
                        <p className="text-foreground text-sm font-medium">{med.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {med.dosage} {med.unit}
                        </p>
                      </div>
                    </div>
                    {taken && takenAt && (
                      <span className="text-muted-foreground text-xs">
                        {format(new Date(takenAt.timestamp), 'HH:mm')}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Statistiques - {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-primary text-2xl font-bold">{daysWithLogs.length}</p>
              <p className="text-muted-foreground text-xs">Jours avec prises</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-foreground text-2xl font-bold">
                {logs.filter((l) => l.taken).length}
              </p>
              <p className="text-muted-foreground text-xs">Prises totales</p>
            </div>
          </div>

          {totalDaysWithLogs > 0 && (
            <div className="bg-primary/10 rounded-lg p-3 text-center">
              <p className="text-primary text-2xl font-bold">{totalDaysWithLogs}</p>
              <p className="text-muted-foreground text-xs">jours depuis le début</p>
            </div>
          )}

          <Button
            onClick={validateMonth}
            disabled={validating || medications.length === 0}
            variant="outline"
            className="w-full"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {validating ? 'Validation en cours...' : 'Valider le mois entier'}
          </Button>
          <p className="text-muted-foreground text-center text-xs">
            Marque toutes les prises prévues comme effectuées
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
