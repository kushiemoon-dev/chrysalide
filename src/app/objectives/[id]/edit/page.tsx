'use client'

import { useState, useEffect, use } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getDateLocale } from '@/i18n/date-locale'
import type { Locale } from '@/i18n/config'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { getObjective, updateObjective } from '@/lib/db'
import type { Objective, ObjectiveCategory, ObjectiveStatus, ActCategory } from '@/lib/types'
import { ObjectiveFormCore } from '@/components/objectives/ObjectiveFormCore'

export default function EditObjectivePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const t = useTranslations('objectives')
  const locale = useLocale()
  const dateLocale = getDateLocale(locale as Locale)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [objective, setObjective] = useState<Objective | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ObjectiveCategory>('medical')
  const [status, setStatus] = useState<ObjectiveStatus>('not_started')
  const [targetDate, setTargetDate] = useState<Date | undefined>()
  const [notes, setNotes] = useState('')
  const [actCategory, setActCategory] = useState<ActCategory | undefined>(undefined)
  const [information, setInformation] = useState('')

  useEffect(() => {
    async function loadObjective() {
      setLoading(true)
      try {
        const data = await getObjective(Number(resolvedParams.id))
        if (data) {
          setObjective(data)
          setTitle(data.title)
          setDescription(data.description || '')
          setCategory(data.category)
          setStatus(data.status)
          setTargetDate(data.targetDate ? new Date(data.targetDate) : undefined)
          setNotes(data.notes || '')
          setActCategory(data.actCategory)
          setInformation(data.information ?? '')
        }
      } finally {
        setLoading(false)
      }
    }

    loadObjective()
  }, [resolvedParams.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !objective?.id) return

    setSaving(true)
    try {
      const updates: Partial<Objective> = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        status,
        targetDate,
        notes: notes.trim() || undefined,
        actCategory: category === 'medical' ? actCategory : undefined,
        information: category === 'medical' ? information.trim() || undefined : undefined,
      }

      // Handle status changes
      if (status === 'completed' && objective.status !== 'completed') {
        updates.completedDate = new Date()
        updates.progress = 100
      } else if (status !== 'completed' && objective.status === 'completed') {
        updates.completedDate = undefined
      }

      await updateObjective(objective.id, updates)
      router.push(`/objectives/${objective.id}`)
    } catch (error) {
      console.error('Failed to update objective:', error)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 pb-24">
        <div className="flex items-center gap-3 pt-2">
          <div className="bg-muted h-10 w-10 animate-pulse rounded" />
          <div className="flex-1 space-y-2">
            <div className="bg-muted h-6 w-48 animate-pulse rounded" />
            <div className="bg-muted h-4 w-32 animate-pulse rounded" />
          </div>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="bg-muted h-32 animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!objective) {
    return (
      <div className="space-y-6 p-4 pb-24">
        <div className="flex items-center gap-3 pt-2">
          <Link href="/objectives">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Objectif introuvable</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Cet objectif n&apos;existe pas ou a été supprimé.
            </p>
            <Link href="/objectives">
              <Button className="mt-4">Retour aux objectifs</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isValid = title.trim().length > 0

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link href={`/objectives/${objective.id}`}>
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t('edit.title')}</h1>
          <p className="text-muted-foreground text-sm">Mets à jour les informations</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <ObjectiveFormCore
          title={title}
          onTitleChange={setTitle}
          description={description}
          onDescriptionChange={setDescription}
          category={category}
          onCategoryChange={setCategory}
          actCategory={actCategory}
          onActCategoryChange={setActCategory}
          information={information}
          onInformationChange={setInformation}
          status={status}
          onStatusChange={setStatus}
          showAllStatuses
          targetDate={targetDate}
          onTargetDateChange={setTargetDate}
          showRemoveDateButton
          dateLocale={dateLocale}
          saving={saving}
          isValid={isValid}
          backHref={`/objectives/${objective.id}`}
          cancelLabel="Annuler"
          saveLabel="Enregistrer"
          savingLabel="Enregistrement..."
          notes={notes}
          onNotesChange={setNotes}
        />
      </form>
    </div>
  )
}
