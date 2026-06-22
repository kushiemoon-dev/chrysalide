'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { getDateLocale } from '@/i18n/date-locale'
import type { Locale } from '@/i18n/config'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import {
  addAppointment,
  addReminder,
  findOrCreatePractitioner,
  incrementPractitionerUsage,
  getObjectives,
} from '@/lib/db'
import { useTranslations } from 'next-intl'
import type { AppointmentType, Objective, Practitioner } from '@/lib/types'
import { AppointmentFormFields } from '@/components/appointments/AppointmentFormFields'
import { getModulePreferences } from '@/lib/notifications'

export default function NewAppointmentPage() {
  const t = useTranslations('appointments')
  const router = useRouter()
  const locale = useLocale()
  const dateLocale = getDateLocale(locale as Locale)
  const [saving, setSaving] = useState(false)

  // Form state
  const [type, setType] = useState<AppointmentType>('endocrinologist')
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [time, setTime] = useState('')
  const [doctor, setDoctor] = useState('')
  const [practitionerId, setPractitionerId] = useState<number | undefined>()
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [reminderMinutes, setReminderMinutes] = useState<number | undefined>(60)
  const [cost, setCost] = useState<string>('')
  const [showCostTracking, setShowCostTracking] = useState(
    () => getModulePreferences().costTrackingEnabled
  )
  const [objectiveId, setObjectiveId] = useState<number | undefined>(undefined)
  const [linkedObjectives, setLinkedObjectives] = useState<Objective[]>([])

  useEffect(() => {
    getObjectives()
      .then((all) =>
        setLinkedObjectives(all.filter((o) => o.source === 'act' || o.category === 'medical'))
      )
      .catch((error) => console.error('Error loading objectives:', error))
  }, [])

  // Handle practitioner text change
  const handlePractitionerChange = (name: string, id?: number) => {
    setDoctor(name)
    setPractitionerId(id)
  }

  // Handle practitioner selection - auto-fill location
  const handlePractitionerSelect = (practitioner: Practitioner) => {
    // Auto-remplir le lieu si le praticien a une adresse et que le champ est vide
    if (practitioner.location && !location) {
      setLocation(practitioner.location)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!date) {
      alert(t('form.selectDateAlert'))
      return
    }

    setSaving(true)

    try {
      // Get or create practitioner ID
      let finalPractitionerId = practitionerId
      if (doctor && !practitionerId) {
        // Auto-create practitioner if name provided but no ID
        finalPractitionerId = await findOrCreatePractitioner(doctor, type)
      } else if (practitionerId) {
        // Increment usage if existing practitioner selected
        await incrementPractitionerUsage(practitionerId)
      }

      // Create the appointment with practitioner link
      const parsedCost = parseFloat(cost)
      const appointmentId = await addAppointment({
        type,
        date,
        time: time || undefined,
        practitionerId: finalPractitionerId,
        doctor: doctor || undefined,
        location: location || undefined,
        notes: notes || undefined,
        reminderMinutes,
        cost: !isNaN(parsedCost) && parsedCost > 0 ? parsedCost : undefined,
        objectiveId: objectiveId || undefined,
      })

      // Create a reminder if set
      if (reminderMinutes && appointmentId) {
        const reminderTime = new Date(date)
        if (time) {
          const [hours, minutes] = time.split(':').map(Number)
          reminderTime.setHours(hours, minutes)
        }
        reminderTime.setMinutes(reminderTime.getMinutes() - reminderMinutes)

        await addReminder({
          type: 'appointment',
          referenceId: appointmentId as number,
          title: t('new.reminderTitle', { type: t('types.' + type) }),
          message: doctor ? t('new.reminderMessage', { doctor }) : undefined,
          schedule: reminderTime.toISOString(),
          enabled: true,
        })
      }

      router.push('/appointments')
    } catch (error) {
      console.error('Error saving appointment:', error)
      alert(t('form.saveError'))
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 p-4 pb-24">
      <div className="flex items-center gap-3 pt-2">
        <Link href="/appointments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-xl font-bold">{t('new.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('new.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AppointmentFormFields
          type={type}
          onTypeChange={setType}
          date={date}
          onDateChange={setDate}
          time={time}
          onTimeChange={setTime}
          doctor={doctor}
          onPractitionerChange={handlePractitionerChange}
          onPractitionerSelect={handlePractitionerSelect}
          location={location}
          onLocationChange={setLocation}
          notes={notes}
          onNotesChange={setNotes}
          reminderMinutes={reminderMinutes}
          onReminderMinutesChange={setReminderMinutes}
          cost={cost}
          onCostChange={setCost}
          showCostTracking={showCostTracking}
          linkedObjectives={linkedObjectives}
          objectiveId={objectiveId}
          onObjectiveIdChange={setObjectiveId}
          saving={saving}
          dateLocale={dateLocale}
          labels={{
            typeLabel: t('form.typeLabel'),
            selectType: t('form.selectType'),
            dateAndTime: t('form.dateAndTime'),
            dateLabel: t('form.dateLabel'),
            selectDate: t('form.selectDate'),
            timeLabel: t('form.timeLabel'),
            details: t('form.details'),
            practitionerLabel: t('form.practitionerLabel'),
            practitionerPlaceholder: t('form.practitionerPlaceholder'),
            locationLabel: t('form.locationLabel'),
            locationPlaceholder: t('form.locationPlaceholder'),
            notesLabel: t('form.notesLabel'),
            notesPlaceholder: t('form.notesPlaceholder'),
            linkedObjective: t('form.linkedObjective'),
            noLinkedObjective: t('form.noLinkedObjective'),
            costLabel: t('form.costLabel'),
            costPlaceholder: t('form.costPlaceholder'),
            reminderTitle: t('form.reminderTitle'),
            reminderConfig: t('form.reminderConfig'),
            noReminder: t('form.noReminder'),
            save: t('new.save'),
            saving: t('new.saving'),
          }}
        />
      </form>
    </div>
  )
}
