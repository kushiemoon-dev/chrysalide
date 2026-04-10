'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ArrowLeft, Calendar as CalendarIcon, Clock, Bell, Coins } from 'lucide-react'
import Link from 'next/link'
import {
  addAppointment,
  addReminder,
  findOrCreatePractitioner,
  incrementPractitionerUsage,
} from '@/lib/db'
import { useTranslations } from 'next-intl'
import { APPOINTMENT_TYPES, REMINDER_TIMES } from '@/lib/constants'
import type { AppointmentType, Practitioner } from '@/lib/types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { PractitionerInput } from '@/components/appointments/practitioner-input'
import { getModulePreferences } from '@/lib/notifications'

export default function NewAppointmentPage() {
  const t = useTranslations('appointments')
  const router = useRouter()
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
      {/* Header */}
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
        {/* Type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('form.typeLabel')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={type} onValueChange={(v) => setType(v as AppointmentType)}>
              <SelectTrigger>
                <SelectValue placeholder={t('form.selectType')} />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(APPOINTMENT_TYPES) as [
                    AppointmentType,
                    { label: string; color: string },
                  ][]
                ).map(([key, { color }]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                      {t('types.' + key)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('form.dateAndTime')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label>{t('form.dateLabel')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(date, 'EEEE d MMMM yyyy', { locale: fr })
                    ) : (
                      <span className="text-muted-foreground">{t('form.selectDate')}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={fr}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label htmlFor="time">{t('form.timeLabel')}</Label>
              <div className="relative">
                <Clock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('form.details')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doctor">{t('form.practitionerLabel')}</Label>
              <PractitionerInput
                value={doctor}
                onChange={handlePractitionerChange}
                onSelect={handlePractitionerSelect}
                specialty={type}
                placeholder={t('form.practitionerPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">{t('form.locationLabel')}</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('form.locationPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('form.notesLabel')}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('form.notesPlaceholder')}
                rows={3}
              />
            </div>

            {showCostTracking && (
              <div className="space-y-2">
                <Label htmlFor="cost" className="flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  {t('form.costLabel')}
                </Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  max="99999.99"
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder={t('form.costPlaceholder')}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reminder */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              {t('form.reminderTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={reminderMinutes?.toString() || 'none'}
              onValueChange={(v) => setReminderMinutes(v === 'none' ? undefined : parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('form.reminderConfig')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('form.noReminder')}</SelectItem>
                {REMINDER_TIMES.map(({ value }) => (
                  <SelectItem key={value} value={value.toString()}>
                    {t('reminderTimes.' + value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={saving || !date}>
          {saving ? t('new.saving') : t('new.save')}
        </Button>
      </form>
    </div>
  )
}
