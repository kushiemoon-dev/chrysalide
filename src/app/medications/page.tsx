'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Plus,
  Pill,
  MoreVertical,
  Check,
  CalendarDays,
  Clock,
  ChevronDown,
  Droplet,
  History,
  BarChart3,
} from 'lucide-react'
import Link from 'next/link'
import {
  getMedications,
  addMedicationLog,
  getTodayLogs,
  getTodayLogsForMedication,
  getLastMedicationLog,
  getYesterdayLogs,
} from '@/lib/db'
import {
  getMedicationReminderTimes,
  isPeriodicFrequency,
  getFrequencyIntervalDays,
  isAutoValidationEnabled,
  isScheduledTimePassed,
  shouldTakeMedicationToday,
  shouldTakeMedicationOnDate,
} from '@/lib/notifications'
import type { Medication, MedicationLog, GelApplicationZone } from '@/lib/types'
import { MEDICATION_TYPES, GEL_APPLICATION_ZONES } from '@/lib/constants'
import { TreatmentGanttChart } from '@/components/medications/treatment-gantt-chart'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useConfetti } from '@/components/objectives/celebration-modal'

export default function MedicationsPage() {
  const t = useTranslations('medications')
  const [activeMedications, setActiveMedications] = useState<Medication[]>([])
  const [inactiveMedications, setInactiveMedications] = useState<Medication[]>([])
  const [todayLogs, setTodayLogs] = useState<MedicationLog[]>([])
  const [lastLogs, setLastLogs] = useState<Record<number, MedicationLog>>({})
  const [loading, setLoading] = useState(true)
  const [inactiveOpen, setInactiveOpen] = useState(false)
  const [ganttOpen, setGanttOpen] = useState(false)

  // Modal pour prise passée
  const [pastDoseModal, setPastDoseModal] = useState(false)
  const [selectedMedId, setSelectedMedId] = useState<number | null>(null)
  const [selectedMedName, setSelectedMedName] = useState('')
  const [pastDate, setPastDate] = useState('')
  const [pastTime, setPastTime] = useState('')
  const [pastScheduledTime, setPastScheduledTime] = useState<string | undefined>(undefined)
  const [pastDoseIndex, setPastDoseIndex] = useState<number | undefined>(undefined)
  const [pastDoseNote, setPastDoseNote] = useState('')

  // Modal pour zone d'application gel
  const [gelZoneModal, setGelZoneModal] = useState(false)
  const [gelMedId, setGelMedId] = useState<number | null>(null)
  const [gelMedName, setGelMedName] = useState('')
  const [selectedZone, setSelectedZone] = useState<GelApplicationZone | null>(null)
  const [gelScheduledTime, setGelScheduledTime] = useState<string | undefined>(undefined)
  const [gelDoseIndex, setGelDoseIndex] = useState<number | undefined>(undefined)
  const [gelNote, setGelNote] = useState('')

  // Confetti animation on medication taken
  const { fire: fireConfetti } = useConfetti()

  /**
   * Auto-validate past scheduled doses if the setting is enabled
   * Only creates logs for doses that haven't been logged yet
   * Also checks yesterday's missed doses on first load
   */
  async function autoValidatePastDoses(medications: Medication[], existingLogs: MedicationLog[]) {
    if (!isAutoValidationEnabled()) return 0

    let autoCreatedCount = 0

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    for (const med of medications) {
      if (!med.id || !med.isActive) continue

      // Skip ended treatments
      if (med.endDate && new Date(med.endDate) < todayStart) continue

      // Skip if medication shouldn't be taken today
      if (!shouldTakeMedicationToday(med)) continue

      const doseTimes = getMedicationReminderTimes(med)

      for (let i = 0; i < doseTimes.length; i++) {
        const time = doseTimes[i]

        // Skip if the scheduled time hasn't passed yet
        if (!isScheduledTimePassed(time)) continue

        // Check if this dose is already logged
        const alreadyLogged = existingLogs.some(
          (log) => log.medicationId === med.id && log.scheduledTime === time
        )

        if (alreadyLogged) continue

        // Auto-create log for this past dose
        try {
          await addMedicationLog({
            medicationId: med.id,
            timestamp: new Date(),
            taken: true,
            scheduledTime: time,
            doseIndex: i,
            notes: 'Auto-validé',
          })
          autoCreatedCount++
        } catch (error) {
          console.error('Error auto-validating dose:', error)
        }
      }
    }

    return autoCreatedCount
  }

  /**
   * Re-check auto-validation for newly passed dose times
   * Called periodically to catch doses as their scheduled time passes
   */
  const recheckAutoValidation = useCallback(async () => {
    if (!isAutoValidationEnabled()) return

    const meds = activeMedications
    if (meds.length === 0) return

    const logs = await getTodayLogs()
    const count = await autoValidatePastDoses(meds, logs)

    if (count > 0) {
      // Reload today's logs to reflect newly auto-validated doses
      const updatedLogs = await getTodayLogs()
      setTodayLogs(updatedLogs)
      console.log(
        `✅ Auto-validation (recheck): ${count} dose${count > 1 ? 's' : ''} validée${count > 1 ? 's' : ''}`
      )
    }
  }, [activeMedications])

  /**
   * Auto-validate yesterday's missed doses
   * Catches doses that were never validated because the user didn't reopen the app
   */
  async function autoValidateYesterdayDoses(medications: Medication[]) {
    if (!isAutoValidationEnabled()) return 0

    const yesterdayLogs = await getYesterdayLogs()
    let autoCreatedCount = 0

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStart = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    )

    for (const med of medications) {
      if (!med.id || !med.isActive) continue

      // Skip ended treatments
      if (med.endDate && new Date(med.endDate) < yesterdayStart) continue

      // Check if medication should have been taken yesterday
      if (!shouldTakeMedicationOnDate(med, yesterday)) continue

      const doseTimes = getMedicationReminderTimes(med)

      for (let i = 0; i < doseTimes.length; i++) {
        const time = doseTimes[i]

        // Check if this dose was already logged yesterday
        const alreadyLogged = yesterdayLogs.some(
          (log) => log.medicationId === med.id && log.scheduledTime === time
        )

        if (alreadyLogged) continue

        // Auto-create log for yesterday's missed dose
        try {
          const [hours, minutes] = time.split(':').map(Number)
          const yesterdayTimestamp = new Date(yesterday)
          yesterdayTimestamp.setHours(hours, minutes, 0, 0)

          await addMedicationLog({
            medicationId: med.id,
            timestamp: yesterdayTimestamp,
            taken: true,
            scheduledTime: time,
            doseIndex: i,
            notes: 'Auto-validé (veille)',
          })
          autoCreatedCount++
        } catch (error) {
          console.error('Error auto-validating yesterday dose:', error)
        }
      }
    }

    return autoCreatedCount
  }

  async function loadData() {
    try {
      const [allMeds, logs] = await Promise.all([
        getMedications({ activeOnly: false }),
        getTodayLogs(),
      ])

      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      const activeMeds = allMeds.filter((med) => {
        if (!med.isActive) return false
        if (med.endDate && new Date(med.endDate) < todayStart) return false
        return true
      })
      setActiveMedications(activeMeds)
      setInactiveMedications(allMeds.filter((med) => !activeMeds.includes(med)))

      // Auto-validate yesterday's missed doses first (one-time on load)
      const yesterdayCount = await autoValidateYesterdayDoses(activeMeds)
      if (yesterdayCount > 0) {
        console.log(
          `✅ Auto-validation (veille): ${yesterdayCount} dose${yesterdayCount > 1 ? 's' : ''} rattrapée${yesterdayCount > 1 ? 's' : ''}`
        )
      }

      // Auto-validate today's past doses if setting is enabled
      const autoCreatedCount = await autoValidatePastDoses(activeMeds, logs)

      // Reload today's logs if auto-validation created any
      const finalLogs = autoCreatedCount > 0 ? await getTodayLogs() : logs
      setTodayLogs(finalLogs)

      // Charger les dernières prises pour les médicaments périodiques
      const periodicMeds = activeMeds.filter((med) => isPeriodicFrequency(med.frequency))
      const lastLogsMap: Record<number, MedicationLog> = {}

      await Promise.all(
        periodicMeds.map(async (med) => {
          if (med.id) {
            const lastLog = await getLastMedicationLog(med.id)
            if (lastLog) {
              lastLogsMap[med.id] = lastLog
            }
          }
        })
      )

      setLastLogs(lastLogsMap)

      // Show subtle notification if doses were auto-validated
      if (autoCreatedCount > 0) {
        console.log(
          `✅ Auto-validation: ${autoCreatedCount} dose${autoCreatedCount > 1 ? 's' : ''} validée${autoCreatedCount > 1 ? 's' : ''}`
        )
      }
    } catch (error) {
      console.error('Error loading medications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Periodically re-check auto-validation every 5 minutes
  // This catches doses whose scheduled time passes while the page is open
  useEffect(() => {
    if (!isAutoValidationEnabled()) return

    const interval = setInterval(
      () => {
        recheckAutoValidation()
      },
      5 * 60 * 1000
    ) // 5 minutes

    return () => clearInterval(interval)
  }, [recheckAutoValidation])

  // Ouvrir modal gel zone
  function openGelZoneModal(med: Medication, scheduledTime?: string, doseIndex?: number) {
    setGelMedId(med.id!)
    setGelMedName(med.name)
    setGelScheduledTime(scheduledTime)
    setGelDoseIndex(doseIndex)
    setSelectedZone(null)
    setGelZoneModal(true)
  }

  function closeGelZoneModal() {
    setGelZoneModal(false)
    setGelMedId(null)
    setGelMedName('')
    setSelectedZone(null)
    setGelScheduledTime(undefined)
    setGelDoseIndex(undefined)
    setGelNote('')
  }

  async function handleSaveGelDose() {
    if (!gelMedId || !selectedZone) return

    try {
      await addMedicationLog({
        medicationId: gelMedId,
        timestamp: new Date(),
        taken: true,
        scheduledTime: gelScheduledTime,
        doseIndex: gelDoseIndex,
        applicationZone: selectedZone,
        notes: gelNote || undefined,
      })
      fireConfetti()
      closeGelZoneModal()
      await loadData()
    } catch (error) {
      console.error('Error logging gel dose:', error)
    }
  }

  // Mode simple: une seule prise par jour
  async function handleTakeMedication(
    medicationId: number,
    isGel: boolean = false,
    med?: Medication
  ) {
    const alreadyTaken = todayLogs.some((log) => log.medicationId === medicationId && log.taken)

    if (alreadyTaken) return

    // Si c'est un gel, ouvrir le modal de zone
    if (isGel && med) {
      openGelZoneModal(med)
      return
    }

    try {
      await addMedicationLog({
        medicationId,
        timestamp: new Date(),
        taken: true,
      })
      fireConfetti()
      await loadData()
    } catch (error) {
      console.error('Error logging medication:', error)
    }
  }

  // Mode avancé: prise par dose spécifique
  async function handleTakeDose(
    medicationId: number,
    scheduledTime: string,
    doseIndex: number,
    isGel: boolean = false,
    med?: Medication
  ) {
    // Vérifier si cette dose spécifique a déjà été prise
    const alreadyTaken = todayLogs.some(
      (log) => log.medicationId === medicationId && log.scheduledTime === scheduledTime && log.taken
    )

    if (alreadyTaken) return

    // Si c'est un gel, ouvrir le modal de zone
    if (isGel && med) {
      openGelZoneModal(med, scheduledTime, doseIndex)
      return
    }

    try {
      await addMedicationLog({
        medicationId,
        timestamp: new Date(),
        taken: true,
        scheduledTime,
        doseIndex,
      })
      fireConfetti()
      await loadData()
    } catch (error) {
      console.error('Error logging dose:', error)
    }
  }

  // Vérifie si une dose spécifique a été prise aujourd'hui
  function isDoseTaken(medicationId: number, scheduledTime: string): boolean {
    return todayLogs.some(
      (log) => log.medicationId === medicationId && log.scheduledTime === scheduledTime && log.taken
    )
  }

  // Calcule la prochaine date de prise pour un médicament périodique
  function getNextDoseDate(med: Medication): Date | null {
    if (!isPeriodicFrequency(med.frequency)) return null

    const interval = getFrequencyIntervalDays(med.frequency)
    const roundedInterval = Math.round(interval)
    const today = new Date()
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    // Utiliser la dernière prise si disponible, sinon la date de début
    const lastLog = med.id ? lastLogs[med.id] : null
    const referenceDate = lastLog ? new Date(lastLog.timestamp) : new Date(med.startDate)

    const refDay = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate()
    )

    // Calculer la prochaine date: dernière prise + intervalle
    const nextDate = new Date(refDay)
    nextDate.setDate(nextDate.getDate() + roundedInterval)

    // Si la prochaine date est aujourd'hui ou dans le passé, c'est aujourd'hui
    if (nextDate <= todayDay) return todayDay

    return nextDate
  }

  // Ouvrir le modal pour prise passée
  function openPastDoseModal(med: Medication, scheduledTime?: string, doseIndex?: number) {
    setSelectedMedId(med.id!)
    setSelectedMedName(med.name)
    setPastScheduledTime(scheduledTime)
    setPastDoseIndex(doseIndex)
    // Pré-remplir avec la date/heure actuelle
    const now = new Date()
    setPastDate(now.toISOString().split('T')[0])
    setPastTime(format(now, 'HH:mm'))
    setPastDoseModal(true)
  }

  function closePastDoseModal() {
    setPastDoseModal(false)
    setSelectedMedId(null)
    setSelectedMedName('')
    setPastDate('')
    setPastTime('')
    setPastScheduledTime(undefined)
    setPastDoseIndex(undefined)
    setPastDoseNote('')
  }

  async function handleSavePastDose() {
    if (!selectedMedId || !pastDate || !pastTime) return

    try {
      const timestamp = new Date(`${pastDate}T${pastTime}`)
      await addMedicationLog({
        medicationId: selectedMedId,
        timestamp,
        taken: true,
        scheduledTime: pastScheduledTime,
        doseIndex: pastDoseIndex,
        notes: pastDoseNote || undefined,
      })
      fireConfetti()
      closePastDoseModal()
      await loadData()
    } catch (error) {
      console.error('Error logging past dose:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Médicaments</h1>
          <p className="text-muted-foreground text-sm">
            {activeMedications.length} médicament{activeMedications.length > 1 ? 's' : ''} actif
            {activeMedications.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/medications/history">
            <Button size="sm" variant="outline" className="gap-2">
              <History className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/medications/calendar">
            <Button size="sm" variant="outline" className="gap-2">
              <CalendarDays className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/medications/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </Link>
        </div>
      </div>

      {/* Vue chronologique Gantt */}
      {(activeMedications.length > 0 || inactiveMedications.length > 0) && (
        <Collapsible open={ganttOpen} onOpenChange={setGanttOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Vue chronologique
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${ganttOpen ? 'rotate-180' : ''}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <TreatmentGanttChart medications={[...activeMedications, ...inactiveMedications]} />
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Medications List */}
      {activeMedications.length === 0 && inactiveMedications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="bg-muted/50 mx-auto mb-4 w-fit rounded-full p-4">
              <Pill className="text-muted-foreground h-8 w-8" />
            </div>
            <h3 className="text-foreground mb-2 font-medium">Aucun médicament</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Ajoutez vos médicaments THS pour commencer le suivi
            </p>
            <Link href="/medications/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un médicament
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeMedications.map((med) => {
            const isGel = med.method === 'gel'
            const typeInfo = MEDICATION_TYPES[med.type]
            const taken = todayLogs.some((log) => log.medicationId === med.id && log.taken)

            return (
              <Card key={med.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    {/* Color indicator */}
                    <div className="w-1.5" style={{ backgroundColor: typeInfo.color }} />

                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-foreground font-medium">{med.name}</h3>
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: typeInfo.color,
                                color: typeInfo.color,
                              }}
                            >
                              {t(`types.${med.type}`)}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {med.dosage} {med.unit} - {t(`methods.${med.method}`)}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {med.frequency} - depuis le{' '}
                            {format(new Date(med.startDate), 'd MMM yyyy', { locale: fr })}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link href={`/medications/${med.id}`}>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>

                      {/* Boutons de prise - Auto-détection des doses multiples */}
                      <div className="border-border mt-3 border-t pt-3">
                        {(() => {
                          // Vérifier si c'est un médicament périodique
                          const isPeriodic = isPeriodicFrequency(med.frequency)

                          // Pour les périodiques, calculer si on doit prendre aujourd'hui basé sur la dernière prise
                          let shouldTakeToday = true
                          if (isPeriodic && med.id) {
                            const nextDate = getNextDoseDate(med)
                            const today = new Date()
                            const todayDay = new Date(
                              today.getFullYear(),
                              today.getMonth(),
                              today.getDate()
                            )
                            shouldTakeToday = nextDate ? nextDate <= todayDay : true
                          }

                          // Si périodique et pas à prendre aujourd'hui, afficher la prochaine date
                          if (isPeriodic && !shouldTakeToday) {
                            const nextDate = getNextDoseDate(med)
                            return (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-sm">
                                  Prochaine prise:{' '}
                                  {nextDate ? format(nextDate, 'd MMM', { locale: fr }) : '-'}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openPastDoseModal(med)}
                                >
                                  <Clock className="mr-1 h-4 w-4" />
                                  Rattraper
                                </Button>
                              </div>
                            )
                          }

                          // Récupérer les horaires (explicites ou déduits de la fréquence)
                          const doseTimes = getMedicationReminderTimes(med)
                          const hasMultipleDoses = doseTimes.length > 1

                          if (hasMultipleDoses) {
                            // Multi-doses: afficher un bouton par horaire
                            return (
                              <div className="flex flex-wrap gap-2">
                                {doseTimes.map((time, index) => {
                                  const doseTaken = isDoseTaken(med.id!, time)
                                  return (
                                    <Button
                                      key={time}
                                      variant={doseTaken ? 'default' : 'outline'}
                                      size="sm"
                                      className={
                                        doseTaken
                                          ? 'bg-primary/20 text-primary hover:bg-primary/30'
                                          : ''
                                      }
                                      onClick={() =>
                                        handleTakeDose(med.id!, time, index, isGel, med)
                                      }
                                      disabled={doseTaken}
                                    >
                                      {isGel && !doseTaken && <Droplet className="mr-1 h-3 w-3" />}
                                      <Check
                                        className={`mr-1 h-3 w-3 ${doseTaken ? '' : isGel ? 'hidden' : 'opacity-0'}`}
                                      />
                                      {time}
                                    </Button>
                                  )
                                })}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openPastDoseModal(med)}
                                >
                                  <Clock className="mr-1 h-4 w-4" />
                                  Rattraper
                                </Button>
                              </div>
                            )
                          }

                          // Dose unique: un seul bouton + bouton prise passée
                          return (
                            <div className="flex gap-2">
                              <Button
                                variant={taken ? 'default' : 'outline'}
                                size="sm"
                                className={
                                  taken ? 'bg-primary/20 text-primary hover:bg-primary/30' : ''
                                }
                                onClick={() => handleTakeMedication(med.id!, isGel, med)}
                                disabled={taken}
                              >
                                {isGel && !taken && <Droplet className="mr-1 h-4 w-4" />}
                                <Check
                                  className={`mr-1 h-4 w-4 ${taken ? '' : isGel ? 'hidden' : ''}`}
                                />
                                {taken ? 'Pris' : isGel ? 'Appliquer' : 'Prendre'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openPastDoseModal(med)}
                                title="Ajouter une prise passée"
                              >
                                <Clock className="mr-1 h-3 w-3" />+
                              </Button>
                            </div>
                          )
                        })()}
                      </div>

                      {/* Stock indicator */}
                      {med.stock !== undefined && med.stockAlert !== undefined && (
                        <div className="border-border mt-3 border-t pt-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Stock</span>
                            <span
                              className={
                                med.stock <= med.stockAlert
                                  ? 'text-destructive font-medium'
                                  : 'text-foreground'
                              }
                            >
                              {med.stock} {med.stockUnit || med.unit}
                              {med.stock <= med.stockAlert && ' - Stock bas!'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Section médicaments inactifs */}
      {inactiveMedications.length > 0 && (
        <Collapsible open={inactiveOpen} onOpenChange={setInactiveOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground w-full justify-between"
            >
              <span>
                {inactiveMedications.length} médicament{inactiveMedications.length > 1 ? 's' : ''}{' '}
                inactif{inactiveMedications.length > 1 ? 's' : ''}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${inactiveOpen ? 'rotate-180' : ''}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3">
            {inactiveMedications.map((med) => {
              const typeInfo = MEDICATION_TYPES[med.type]

              return (
                <Card key={med.id} className="overflow-hidden border-dashed opacity-60">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      {/* Color indicator */}
                      <div
                        className="w-1.5 opacity-50"
                        style={{ backgroundColor: typeInfo.color }}
                      />

                      {/* Content */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-foreground font-medium">{med.name}</h3>
                              <Badge variant="secondary" className="text-xs">
                                Inactif
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {med.dosage} {med.unit} - {t(`methods.${med.method}`)}
                            </p>
                          </div>

                          <Link href={`/medications/${med.id}`}>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Modal pour zone d'application gel */}
      <Dialog open={gelZoneModal} onOpenChange={setGelZoneModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplet className="text-primary h-5 w-5" />
              Zone d&apos;application
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground text-sm">
              Sélectionnez la zone d&apos;application pour{' '}
              <span className="text-foreground font-medium">{gelMedName}</span>
            </p>
            <div className="grid gap-2">
              {Object.keys(GEL_APPLICATION_ZONES).map((key) => (
                <Button
                  key={key}
                  variant={selectedZone === key ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setSelectedZone(key as GelApplicationZone)}
                >
                  {t(`gelZones.${key}`)}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gelNote">Note (optionnel)</Label>
              <Textarea
                id="gelNote"
                value={gelNote}
                onChange={(e) => setGelNote(e.target.value)}
                placeholder="Remarques, effets..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeGelZoneModal}>
              Annuler
            </Button>
            <Button onClick={handleSaveGelDose} disabled={!selectedZone}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal pour prise passée */}
      <Dialog open={pastDoseModal} onOpenChange={setPastDoseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une prise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground text-sm">
              Enregistrer une prise de{' '}
              <span className="text-foreground font-medium">{selectedMedName}</span>
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pastDate">Date</Label>
                <Input
                  id="pastDate"
                  type="date"
                  value={pastDate}
                  onChange={(e) => setPastDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pastTime">Heure</Label>
                <Input
                  id="pastTime"
                  type="time"
                  value={pastTime}
                  onChange={(e) => setPastTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pastDoseNote">Note (optionnel)</Label>
              <Textarea
                id="pastDoseNote"
                value={pastDoseNote}
                onChange={(e) => setPastDoseNote(e.target.value)}
                placeholder="Remarques, effets..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closePastDoseModal}>
              Annuler
            </Button>
            <Button onClick={handleSavePastDose}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
