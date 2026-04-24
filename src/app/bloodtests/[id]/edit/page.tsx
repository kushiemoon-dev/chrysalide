'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, FlaskConical, Heart, Activity } from 'lucide-react'
import Link from 'next/link'
import { getBloodTest, updateBloodTest } from '@/lib/db'
import type { BloodMarker, BloodTestResult } from '@/lib/types'
import { BLOOD_MARKERS } from '@/lib/constants'
import { PractitionerInput } from '@/components/appointments/practitioner-input'

// Groupes de marqueurs pour une meilleure organisation
const MARKER_GROUPS = {
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

// Initial empty marker values
const EMPTY_MARKER_VALUES: Record<BloodMarker, string> = {
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

export default function EditBloodTestPage() {
  const t = useTranslations('bloodtests')
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [date, setDate] = useState('')
  const [lab, setLab] = useState('')
  const [practitionerId, setPractitionerId] = useState<number | undefined>(undefined)
  const [notes, setNotes] = useState('')
  const [markerValues, setMarkerValues] = useState<Record<BloodMarker, string>>(EMPTY_MARKER_VALUES)

  // Load existing data
  useEffect(() => {
    async function loadTest() {
      const id = parseInt(params.id as string)
      if (isNaN(id)) {
        router.push('/bloodtests')
        return
      }

      const test = await getBloodTest(id)
      if (!test) {
        router.push('/bloodtests')
        return
      }

      // Populate form
      setDate(new Date(test.date).toISOString().split('T')[0])
      setLab(test.lab || '')
      setPractitionerId(test.practitionerId)
      setNotes(test.notes || '')

      // Populate marker values from results
      const values = { ...EMPTY_MARKER_VALUES }
      for (const result of test.results) {
        values[result.marker] = result.value.toString()
      }
      setMarkerValues(values)

      setLoading(false)
    }
    loadTest()
  }, [params.id, router])

  function updateMarkerValue(marker: BloodMarker, value: string) {
    setMarkerValues((prev) => ({ ...prev, [marker]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const id = parseInt(params.id as string)
    if (isNaN(id)) return

    // Collect only markers that have values
    const results: BloodTestResult[] = []
    for (const [marker, value] of Object.entries(markerValues)) {
      if (value && value.trim() !== '') {
        const markerInfo = BLOOD_MARKERS[marker as BloodMarker]
        results.push({
          marker: marker as BloodMarker,
          value: parseFloat(value),
          unit: markerInfo.unit,
        })
      }
    }

    if (results.length === 0) {
      alert(t('new.noResultAlert'))
      return
    }

    setSaving(true)

    try {
      await updateBloodTest(id, {
        date: new Date(date),
        lab: lab || undefined,
        practitionerId: practitionerId || undefined,
        results,
        notes: notes || undefined,
      })

      router.push(`/bloodtests/${id}`)
    } catch (error) {
      console.error('Error updating blood test:', error)
    } finally {
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
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link href={`/bloodtests/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-foreground text-xl font-bold">{t('edit.title')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('new.generalInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">{t('new.dateLabel')}</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t('new.labLabel')}</Label>
                <PractitionerInput
                  value={lab}
                  onChange={(name, pid) => {
                    setLab(name)
                    setPractitionerId(pid)
                  }}
                  specialty="laboratoire"
                  placeholder={t('new.labOptional')}
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
            <CardTitle className="text-base">{t('new.notesTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('new.notesPlaceholder')}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Link href={`/bloodtests/${params.id}`} className="flex-1">
            <Button variant="outline" className="w-full" type="button">
              {t('new.cancel')}
            </Button>
          </Link>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? t('edit.saving') : t('new.save')}
          </Button>
        </div>
      </form>
    </div>
  )
}
