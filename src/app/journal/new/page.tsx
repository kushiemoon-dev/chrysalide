'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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
import { addJournalEntry } from '@/lib/db'
import type { MoodLevel } from '@/lib/types'
import { MoodPicker } from '@/components/journal/mood-picker'
import { TagInput } from '@/components/journal/tag-input'

export default function NewJournalEntryPage() {
  const t = useTranslations('journal')
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // Form state
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<MoodLevel | undefined>()
  const [tags, setTags] = useState<string[]>([])
  const [energyLevel, setEnergyLevel] = useState<MoodLevel | undefined>()
  const [sleepQuality, setSleepQuality] = useState<MoodLevel | undefined>()
  const [isPrivate, setIsPrivate] = useState(false)
  const [entryDate, setEntryDate] = useState<Date>(new Date())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) return

    setSaving(true)
    try {
      await addJournalEntry({
        date: entryDate,
        content: content.trim(),
        mood,
        tags,
        energyLevel,
        sleepQuality,
        isPrivate,
      })
      router.push('/journal')
    } catch (error) {
      console.error('Failed to save entry:', error)
      setSaving(false)
    }
  }

  const isValid = content.trim().length > 0

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link href="/journal">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t('new.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('new.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Label>{t('new.dateLabel')}</Label>
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
              <Label htmlFor="content">{t('new.contentLabel')}</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('new.contentPlaceholder')}
                className="min-h-[200px] resize-none"
                autoFocus
              />
            </div>
          </CardContent>
        </Card>

        {/* Mood */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="text-primary h-4 w-4" />
              {t('new.howFeeling')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MoodPicker value={mood} onChange={setMood} label={t('new.generalMood')} size="lg" />

            <MoodPicker
              value={energyLevel}
              onChange={setEnergyLevel}
              label={t('new.energyLevel')}
              size="md"
            />

            <MoodPicker
              value={sleepQuality}
              onChange={setSleepQuality}
              label={t('new.sleepQuality')}
              size="md"
            />
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('new.tags')}</CardTitle>
          </CardHeader>
          <CardContent>
            <TagInput value={tags} onChange={setTags} placeholder={t('new.addTags')} />
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
                  <p className="text-foreground font-medium">{t('new.privateEntry')}</p>
                  <p className="text-muted-foreground text-sm">{t('new.excludeExport')}</p>
                </div>
              </div>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button type="submit" className="w-full gap-2" disabled={!isValid || saving}>
          <Save className="h-4 w-4" />
          {saving ? t('new.saving') : t('new.save')}
        </Button>
      </form>
    </div>
  )
}
