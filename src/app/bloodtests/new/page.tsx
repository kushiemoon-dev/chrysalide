'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { addBloodTest } from '@/lib/db'
import type { BloodMarker, BloodTestResult } from '@/lib/types'
import { BLOOD_MARKERS } from '@/lib/constants'
import {
  BloodTestFormFields,
  EMPTY_MARKER_VALUES,
} from '@/components/bloodtests/BloodTestFormFields'

export default function NewBloodTestPage() {
  const t = useTranslations('bloodtests')
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]!)
  const [lab, setLab] = useState('')
  const [practitionerId, setPractitionerId] = useState<number | undefined>(undefined)
  const [notes, setNotes] = useState('')

  // Marker values: using a Record to track which markers have values
  const [markerValues, setMarkerValues] = useState<Record<BloodMarker, string>>(EMPTY_MARKER_VALUES)

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
      alert(t('new.noResultAlert'))
      return
    }

    setLoading(true)

    try {
      await addBloodTest({
        date: new Date(date),
        lab: lab || undefined,
        practitionerId: practitionerId || undefined,
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
      <div className="flex items-center gap-3 pt-2">
        <Link href="/bloodtests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-foreground text-xl font-bold">{t('new.title')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <BloodTestFormFields
          date={date}
          onDateChange={setDate}
          lab={lab}
          onLabChange={(name, pid) => {
            setLab(name)
            setPractitionerId(pid)
          }}
          notes={notes}
          onNotesChange={setNotes}
          markerValues={markerValues}
          updateMarkerValue={updateMarkerValue}
          saving={loading}
          backHref="/bloodtests"
          labels={{
            generalInfo: t('new.generalInfo'),
            dateLabel: t('new.dateLabel'),
            labLabel: t('new.labLabel'),
            labOptional: t('new.labOptional'),
            notesTitle: t('new.notesTitle'),
            notesPlaceholder: t('new.notesPlaceholder'),
            cancel: t('new.cancel'),
            save: t('new.save'),
            saving: t('new.saving'),
          }}
        />
      </form>
    </div>
  )
}
