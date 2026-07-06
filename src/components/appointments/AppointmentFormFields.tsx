'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
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
import { Calendar as CalendarIcon, Clock, Bell, Coins } from 'lucide-react'
import { APPOINTMENT_TYPES, REMINDER_TIMES } from '@/lib/constants'
import type { AppointmentType, Objective, Practitioner } from '@/lib/types'
import { format } from 'date-fns'
import type { Locale as DateFnsLocale } from 'date-fns'
import { PractitionerInput } from '@/components/appointments/practitioner-input'

export interface AppointmentLabels {
  typeLabel: string
  selectType: string
  dateAndTime: string
  dateLabel: string
  selectDate: string
  timeLabel: string
  details: string
  practitionerLabel: string
  practitionerPlaceholder: string
  locationLabel: string
  locationPlaceholder: string
  notesLabel: string
  notesPlaceholder: string
  linkedObjective?: string
  noLinkedObjective?: string
  costLabel: string
  costPlaceholder: string
  reminderTitle: string
  reminderConfig: string
  noReminder: string
  save: string
  saving: string
}

interface Props {
  type: AppointmentType
  onTypeChange: (v: AppointmentType) => void
  date: Date | undefined
  onDateChange: (v: Date | undefined) => void
  time: string
  onTimeChange: (v: string) => void
  doctor: string
  onPractitionerChange: (name: string, id?: number) => void
  onPractitionerSelect: (practitioner: Practitioner) => void
  location: string
  onLocationChange: (v: string) => void
  notes: string
  onNotesChange: (v: string) => void
  reminderMinutes: number | undefined
  onReminderMinutesChange: (v: number | undefined) => void
  cost: string
  onCostChange: (v: string) => void
  showCostTracking: boolean
  linkedObjectives?: Objective[]
  objectiveId?: number
  onObjectiveIdChange?: (v: number | undefined) => void
  saving: boolean
  dateLocale: DateFnsLocale
  labels: AppointmentLabels
}

export function AppointmentFormFields({
  type,
  onTypeChange,
  date,
  onDateChange,
  time,
  onTimeChange,
  doctor,
  onPractitionerChange,
  onPractitionerSelect,
  location,
  onLocationChange,
  notes,
  onNotesChange,
  reminderMinutes,
  onReminderMinutesChange,
  cost,
  onCostChange,
  showCostTracking,
  linkedObjectives,
  objectiveId,
  onObjectiveIdChange,
  saving,
  dateLocale,
  labels,
}: Props) {
  const t = useTranslations('appointments')

  return (
    <>
      {/* Type */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{labels.typeLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={type} onValueChange={(v) => onTypeChange(v as AppointmentType)}>
            <SelectTrigger>
              <SelectValue placeholder={labels.selectType} />
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
          <CardTitle className="text-base">{labels.dateAndTime}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{labels.dateLabel}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? (
                    format(date, 'EEEE d MMMM yyyy', { locale: dateLocale })
                  ) : (
                    <span className="text-muted-foreground">{labels.selectDate}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={onDateChange}
                  locale={dateLocale}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">{labels.timeLabel}</Label>
            <div className="relative">
              <Clock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => onTimeChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{labels.details}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doctor">{labels.practitionerLabel}</Label>
            <PractitionerInput
              id="doctor"
              value={doctor}
              onChange={onPractitionerChange}
              onSelect={onPractitionerSelect}
              specialty={type}
              placeholder={labels.practitionerPlaceholder}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">{labels.locationLabel}</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder={labels.locationPlaceholder}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{labels.notesLabel}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder={labels.notesPlaceholder}
              rows={3}
            />
          </div>

          {linkedObjectives && linkedObjectives.length > 0 && onObjectiveIdChange && (
            <div className="space-y-2">
              <Label>{labels.linkedObjective}</Label>
              <Select
                value={objectiveId?.toString() || 'none'}
                onValueChange={(v) => onObjectiveIdChange(v === 'none' ? undefined : parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={labels.linkedObjective} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{labels.noLinkedObjective}</SelectItem>
                  {linkedObjectives.map((obj) => (
                    <SelectItem key={obj.id} value={obj.id!.toString()}>
                      {obj.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showCostTracking && (
            <div className="space-y-2">
              <Label htmlFor="cost" className="flex items-center gap-2">
                <Coins className="h-4 w-4" />
                {labels.costLabel}
              </Label>
              <Input
                id="cost"
                type="number"
                min="0"
                max="99999.99"
                step="0.01"
                value={cost}
                onChange={(e) => onCostChange(e.target.value)}
                placeholder={labels.costPlaceholder}
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
            {labels.reminderTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={reminderMinutes?.toString() || 'none'}
            onValueChange={(v) => onReminderMinutesChange(v === 'none' ? undefined : parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder={labels.reminderConfig} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{labels.noReminder}</SelectItem>
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
        {saving ? labels.saving : labels.save}
      </Button>
    </>
  )
}
