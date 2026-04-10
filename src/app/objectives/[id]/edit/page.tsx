'use client'

import { useState, useEffect, use } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { ArrowLeft, Save, Calendar as CalendarIcon, Target } from 'lucide-react'
import { getObjective, updateObjective } from '@/lib/db'
import type { Objective, ObjectiveCategory, ObjectiveStatus } from '@/lib/types'
import { categoryConfig } from '@/components/objectives/objective-card'
import { cn } from '@/lib/utils'

export default function EditObjectivePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const t = useTranslations('objectives')
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

  useEffect(() => {
    loadObjective()
  }, [resolvedParams.id])

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
      }
    } finally {
      setLoading(false)
    }
  }

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
        {/* Main info */}
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Commencer le THS"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Détails sur cet objectif..."
                className="min-h-[100px] resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Category & Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="text-primary h-4 w-4" />
              Catégorie & Statut
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ObjectiveCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryConfig).map(([key, config]) => {
                    const Icon = config.icon
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${config.color}`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ObjectiveStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Pas commencé</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="paused">En pause</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date cible (optionnel)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !targetDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {targetDate
                      ? format(targetDate, 'd MMMM yyyy', { locale: fr })
                      : 'Sélectionner une date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={targetDate}
                    onSelect={setTargetDate}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
              {targetDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setTargetDate(undefined)}
                >
                  Supprimer la date
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes personnelles..."
              className="min-h-[80px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Link href={`/objectives/${objective.id}`} className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Annuler
            </Button>
          </Link>
          <Button type="submit" className="flex-1 gap-2" disabled={!isValid || saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </div>
  )
}
