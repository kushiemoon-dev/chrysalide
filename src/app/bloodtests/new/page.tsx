'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, FlaskConical, Heart, Activity } from 'lucide-react'
import Link from 'next/link'
import { addBloodTest } from '@/lib/db'
import type { BloodMarker, BloodTestResult } from '@/lib/types'
import { BLOOD_MARKERS } from '@/lib/constants'

// Groupes de marqueurs pour une meilleure organisation
const MARKER_GROUPS = {
  hormones: {
    label: 'Hormones',
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
    label: 'Santé sanguine',
    icon: Heart,
    markers: ['hematocrit', 'hemoglobin'] as BloodMarker[],
  },
  organs: {
    label: 'Foie & Reins',
    icon: Activity,
    markers: ['alt', 'ast', 'creatinine', 'potassium'] as BloodMarker[],
  },
}

export default function NewBloodTestPage() {
  const t = useTranslations('bloodtests')
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [lab, setLab] = useState('')
  const [notes, setNotes] = useState('')

  // Marker values - using a Record to track which markers have values
  const [markerValues, setMarkerValues] = useState<Record<BloodMarker, string>>({
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
  })

  function updateMarkerValue(marker: BloodMarker, value: string) {
    setMarkerValues((prev) => ({ ...prev, [marker]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

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
      alert('Veuillez entrer au moins un résultat')
      return
    }

    setLoading(true)

    try {
      await addBloodTest({
        date: new Date(date),
        lab: lab || undefined,
        results,
        notes: notes || undefined,
      })

      router.push('/bloodtests')
    } catch (error) {
      console.error('Error adding blood test:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link href="/bloodtests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-foreground text-xl font-bold">Nouvelle analyse</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date de l&apos;analyse</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lab">Laboratoire</Label>
                <Input
                  id="lab"
                  value={lab}
                  onChange={(e) => setLab(e.target.value)}
                  placeholder="Optionnel"
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
                  {group.label}
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
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations, contexte de la prise de sang..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Link href="/bloodtests" className="flex-1">
            <Button variant="outline" className="w-full" type="button">
              Annuler
            </Button>
          </Link>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </div>
  )
}
