'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FlaskConical, Heart, Activity } from 'lucide-react'
import { BLOOD_MARKERS } from '@/lib/constants'
import type { BloodMarker } from '@/lib/types'
import { PractitionerInput } from '@/components/appointments/practitioner-input'

export const MARKER_GROUPS = {
  hormones: {
    icon: FlaskConical,
    markers: [
      'estradiol',
      'testosterone',
      'lh',
      'fsh',
      'prolactin',
      'shbg',
      'dheas',
      'progesterone',
    ] as BloodMarker[],
  },
  blood: {
    icon: Heart,
    markers: ['hematocrit', 'hemoglobin'] as BloodMarker[],
  },
  organs: {
    icon: Activity,
    markers: ['alt', 'ast', 'creatinine', 'potassium'] as BloodMarker[],
  },
}

export const EMPTY_MARKER_VALUES: Record<BloodMarker, string> = {
  estradiol: '',
  testosterone: '',
  lh: '',
  fsh: '',
  prolactin: '',
  shbg: '',
  hematocrit: '',
  hemoglobin: '',
  alt: '',
  ast: '',
  creatinine: '',
  potassium: '',
  dheas: '',
  progesterone: '',
}

export interface BloodTestLabels {
  generalInfo: string
  dateLabel: string
  labLabel: string
  labOptional: string
  notesTitle: string
  notesPlaceholder: string
  cancel: string
  save: string
  saving: string
}

interface Props {
  date: string
  onDateChange: (v: string) => void
  lab: string
  onLabChange: (name: string, pid?: number) => void
  notes: string
  onNotesChange: (v: string) => void
  markerValues: Record<BloodMarker, string>
  updateMarkerValue: (marker: BloodMarker, value: string) => void
  saving: boolean
  backHref: string
  labels: BloodTestLabels
}

export function BloodTestFormFields({
  date,
  onDateChange,
  lab,
  onLabChange,
  notes,
  onNotesChange,
  markerValues,
  updateMarkerValue,
  saving,
  backHref,
  labels,
}: Props) {
  const t = useTranslations('bloodtests')

  return (
    <>
      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{labels.generalInfo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">{labels.dateLabel}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => onDateChange(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{labels.labLabel}</Label>
              <PractitionerInput
                value={lab}
                onChange={onLabChange}
                specialty="laboratoire"
                placeholder={labels.labOptional}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marker Groups */}
      {Object.entries(MARKER_GROUPS).map(([groupKey, group]) => {
        const Icon = group.icon
        return (
          <Card key={groupKey}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="text-primary h-4 w-4" />
                {t('groups.' + groupKey)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {group.markers.map((marker) => {
                  const markerInfo = BLOOD_MARKERS[marker]
                  return (
                    <div key={marker} className="space-y-1.5">
                      <Label htmlFor={marker} className="text-sm">
                        {t('markers.' + marker)}
                        <span className="text-muted-foreground ml-1 text-xs">
                          ({markerInfo.unit})
                        </span>
                      </Label>
                      <Input
                        id={marker}
                        type="number"
                        step="0.01"
                        value={markerValues[marker]}
                        onChange={(e) => updateMarkerValue(marker, e.target.value)}
                        placeholder="—"
                        className="h-9"
                      />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{labels.notesTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={labels.notesPlaceholder}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-3">
        <Link href={backHref} className="flex-1">
          <Button variant="outline" className="w-full" type="button">
            {labels.cancel}
          </Button>
        </Link>
        <Button type="submit" className="flex-1" disabled={saving}>
          {saving ? labels.saving : labels.save}
        </Button>
      </div>
    </>
  )
}
