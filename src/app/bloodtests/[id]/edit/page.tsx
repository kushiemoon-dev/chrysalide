'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getBloodTest, updateBloodTest } from '@/lib/db'
import type { BloodMarker, BloodTestResult } from '@/lib/types'
import { BLOOD_MARKERS } from '@/lib/constants'
import {
  BloodTestFormFields,
  EMPTY_MARKER_VALUES,
} from '@/components/bloodtests/BloodTestFormFields'

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
          saving={saving}
          backHref={`/bloodtests/${params.id}`}
          labels={{
            generalInfo: t('new.generalInfo'),
            dateLabel: t('new.dateLabel'),
            labLabel: t('new.labLabel'),
            labOptional: t('new.labOptional'),
            notesTitle: t('new.notesTitle'),
            notesPlaceholder: t('new.notesPlaceholder'),
            cancel: t('new.cancel'),
            save: t('new.save'),
            saving: t('edit.saving'),
          }}
        />
      </form>
    </div>
  )
}
