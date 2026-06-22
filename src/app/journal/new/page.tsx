'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getDateLocale } from '@/i18n/date-locale'
import type { Locale } from '@/i18n/config'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { addJournalEntry } from '@/lib/db'
import type { MoodLevel } from '@/lib/types'
import { JournalFormFields } from '@/components/journal/JournalFormFields'

export default function NewJournalEntryPage() {
  const t = useTranslations('journal')
  const router = useRouter()
  const locale = useLocale()
  const dateLocale = getDateLocale(locale as Locale)
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

  return (
    <div className="space-y-6 p-4 pb-24">
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
          labels={{
            dateLabel: t('new.dateLabel'),
            contentLabel: t('new.contentLabel'),
            contentPlaceholder: t('new.contentPlaceholder'),
            howFeeling: t('new.howFeeling'),
            generalMood: t('new.generalMood'),
            energyLevel: t('new.energyLevel'),
            sleepQuality: t('new.sleepQuality'),
            tags: t('new.tags'),
            addTags: t('new.addTags'),
            privateEntry: t('new.privateEntry'),
            excludeExport: t('new.excludeExport'),
            save: t('new.save'),
            saving: t('new.saving'),
          }}
        />
      </form>
    </div>
  )
}
