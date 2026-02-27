'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, Lock, Sparkles, Calendar as CalendarIcon } from 'lucide-react'
import Link from 'next/link'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { getJournalEntry, updateJournalEntry } from '@/lib/db'
import type { JournalEntry, MoodLevel } from '@/lib/types'
import { MoodPicker } from '@/components/journal/mood-picker'
import { TagInput } from '@/components/journal/tag-input'

export default function EditJournalEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [entry, setEntry] = useState<JournalEntry | null>(null)

  // Form state
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<MoodLevel | undefined>()
  const [tags, setTags] = useState<string[]>([])
  const [energyLevel, setEnergyLevel] = useState<MoodLevel | undefined>()
  const [sleepQuality, setSleepQuality] = useState<MoodLevel | undefined>()
  const [isPrivate, setIsPrivate] = useState(false)
  const [entryDate, setEntryDate] = useState<Date>(new Date())

  useEffect(() => {
    loadEntry()
  }, [resolvedParams.id])

  async function loadEntry() {
    setLoading(true)
    try {
      const data = await getJournalEntry(Number(resolvedParams.id))
      if (data) {
        setEntry(data)
        setContent(data.content)
        setMood(data.mood)
        setTags(data.tags)
        setEnergyLevel(data.energyLevel)
        setSleepQuality(data.sleepQuality)
        setIsPrivate(data.isPrivate || false)
        setEntryDate(new Date(data.date))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim() || !entry?.id) return

    setSaving(true)
    try {
      await updateJournalEntry(entry.id, {
        date: entryDate,
        content: content.trim(),
        mood,
        tags,
        energyLevel,
        sleepQuality,
        isPrivate,
      })
      router.push(`/journal/${entry.id}`)
    } catch (error) {
      console.error('Failed to update entry:', error)
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

  if (!entry) {
    return (
      <div className="space-y-6 p-4 pb-24">
        <div className="flex items-center gap-3 pt-2">
          <Link href="/journal">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Entrée introuvable</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Cette entrée n&apos;existe pas ou a été supprimée.
            </p>
            <Link href="/journal">
              <Button className="mt-4">Retour au journal</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isValid = content.trim().length > 0

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link href={`/journal/${entry.id}`}>
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-2xl font-bold">Modifier l&apos;entrée</h1>
          <p className="text-muted-foreground text-sm">Mets à jour ton entrée</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Label>Date de l&apos;entrée</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(entryDate, 'EEEE d MMMM yyyy', { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={entryDate}
                    onSelect={(date) => date && setEntryDate(date)}
                    locale={fr}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="content">Contenu</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Écris ici..."
                className="min-h-[200px] resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Mood */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="text-primary h-4 w-4" />
              Comment tu te sens ?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MoodPicker value={mood} onChange={setMood} label="Humeur générale" size="lg" />

            <MoodPicker
              value={energyLevel}
              onChange={setEnergyLevel}
              label="Niveau d'énergie"
              size="md"
            />

            <MoodPicker
              value={sleepQuality}
              onChange={setSleepQuality}
              label="Qualité du sommeil"
              size="md"
            />
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <TagInput value={tags} onChange={setTags} placeholder="Ajouter des tags..." />
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-muted rounded-lg p-2">
                  <Lock className="text-muted-foreground h-4 w-4" />
                </div>
                <div>
                  <p className="text-foreground font-medium">Entrée privée</p>
                  <p className="text-muted-foreground text-sm">Exclue des exports</p>
                </div>
              </div>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Link href={`/journal/${entry.id}`} className="flex-1">
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
