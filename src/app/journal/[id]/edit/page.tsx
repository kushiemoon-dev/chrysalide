'use client'

import { useState, useEffect, use } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getDateLocale } from '@/i18n/date-locale'
import type { Locale } from '@/i18n/config'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getJournalEntry, updateJournalEntry } from '@/lib/db'
import type { JournalEntry, MoodLevel } from '@/lib/types'
import { JournalFormFields } from '@/components/journal/JournalFormFields'

export default function EditJournalEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('journal')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const dateLocale = getDateLocale(locale as Locale)
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

    loadEntry()
  }, [resolvedParams.id])

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
          <h1 className="text-2xl font-bold">{t('detail.notFound')}</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{t('detail.notFoundDesc')}</p>
            <Link href="/journal">
              <Button className="mt-4">{t('detail.backToJournal')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 pb-24">
      <div className="flex items-center gap-3 pt-2">
        <Link href={`/journal/${entry.id}`}>
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t('edit.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('edit.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <JournalFormFields
          content={content}
          onContentChange={setContent}
          mood={mood}
          onMoodChange={setMood}
          tags={tags}
          onTagsChange={setTags}
          energyLevel={energyLevel}
          onEnergyLevelChange={setEnergyLevel}
          sleepQuality={sleepQuality}
          onSleepQualityChange={setSleepQuality}
          isPrivate={isPrivate}
          onIsPrivateChange={setIsPrivate}
          entryDate={entryDate}
          onEntryDateChange={setEntryDate}
          dateLocale={dateLocale}
          saving={saving}
          isValid={content.trim().length > 0}
          cancelHref={`/journal/${entry.id}`}
          labels={{
            dateLabel: t('new.dateLabel'),
            contentLabel: t('edit.content'),
            contentPlaceholder: t('edit.placeholder'),
            howFeeling: t('new.howFeeling'),
            generalMood: t('new.generalMood'),
            energyLevel: t('new.energyLevel'),
            sleepQuality: t('new.sleepQuality'),
            tags: t('new.tags'),
            addTags: t('new.addTags'),
            privateEntry: t('new.privateEntry'),
            excludeExport: t('new.excludeExport'),
            cancel: tCommon('cancel'),
            save: t('new.save'),
            saving: t('new.saving'),
          }}
        />
      </form>
    </div>
  )
}
