'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { getDateLocale } from '@/i18n/date-locale'
import type { Locale } from '@/i18n/config'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import {
  getAppointment,
  updateAppointment,
  findOrCreatePractitioner,
  incrementPractitionerUsage,
} from '@/lib/db'
import { useTranslations } from 'next-intl'
import type { Appointment, AppointmentType, Practitioner } from '@/lib/types'
import { AppointmentFormFields } from '@/components/appointments/AppointmentFormFields'
import { getModulePreferences } from '@/lib/notifications'

export default function EditAppointmentPage() {
  const t = useTranslations('appointments')
  const locale = useLocale()
  const dateLocale = getDateLocale(locale as Locale)
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [appointment, setAppointment] = useState<Appointment | null>(null)

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

  useEffect(() => {
    async function loadAppointment() {
      const id = parseInt(params.id as string)
      if (isNaN(id)) {
        router.push('/appointments')
        return
      }

      const data = await getAppointment(id)
      if (!data) {
        router.push('/appointments')
        return
      }

      setAppointment(data)
      // Populate form with existing data
      setType(data.type)
      setDate(new Date(data.date))
      setTime(data.time || '')
      setDoctor(data.doctor || '')
      setPractitionerId(data.practitionerId)
      setLocation(data.location || '')
      setNotes(data.notes || '')
      setReminderMinutes(data.reminderMinutes)
      setCost(data.cost !== undefined && data.cost > 0 ? data.cost.toString() : '')
      setLoading(false)
    }
    loadAppointment()
  }, [params.id, router])

  // Handle practitioner text change
  const handlePractitionerChange = (name: string, id?: number) => {
    setDoctor(name)
    setPractitionerId(id)
  }

  // Handle practitioner selection - auto-fill location
  const handlePractitionerSelect = (practitioner: Practitioner) => {
    if (practitioner.location && !location) {
      setLocation(practitioner.location)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!date || !appointment?.id) {
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
      } else if (practitionerId && practitionerId !== appointment.practitionerId) {
        // Increment usage if practitioner changed
        await incrementPractitionerUsage(practitionerId)
      }

      // Update the appointment with practitioner link
      const parsedCost = parseFloat(cost)
      await updateAppointment(appointment.id, {
        type,
        date,
        time: time || undefined,
        practitionerId: finalPractitionerId,
        doctor: doctor || undefined,
        location: location || undefined,
        notes: notes || undefined,
        reminderMinutes,
        cost: !isNaN(parsedCost) && parsedCost > 0 ? parsedCost : undefined,
      })

      router.push(`/appointments/${appointment.id}`)
    } catch (error) {
      console.error('Error updating appointment:', error)
      alert(t('form.saveError'))
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <p className="text-muted-foreground">{t('detail.loading')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 pb-24">
      <div className="flex items-center gap-3 pt-2">
        <Link href={`/appointments/${appointment?.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-xl font-bold">{t('edit.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('edit.subtitle')}</p>
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
            costLabel: t('form.costLabel'),
            costPlaceholder: t('form.costPlaceholder'),
            reminderTitle: t('form.reminderTitle'),
            reminderConfig: t('form.reminderConfig'),
            noReminder: t('form.noReminder'),
            save: t('edit.save'),
            saving: t('edit.saving'),
          }}
        />
      </form>
    </div>
  )
}
