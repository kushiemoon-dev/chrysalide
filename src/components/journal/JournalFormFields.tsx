'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Save, Lock, Sparkles, Calendar as CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Locale as DateFnsLocale } from 'date-fns'
import type { MoodLevel } from '@/lib/types'
import { MoodPicker } from '@/components/journal/mood-picker'
import { TagInput } from '@/components/journal/tag-input'

interface JournalLabels {
  dateLabel: string
  contentLabel: string
  contentPlaceholder: string
  howFeeling: string
  generalMood: string
  energyLevel: string
  sleepQuality: string
  tags: string
  addTags: string
  privateEntry: string
  excludeExport: string
  save: string
  saving: string
  cancel?: string
}

interface Props {
  content: string
  onContentChange: (v: string) => void
  mood: MoodLevel | undefined
  onMoodChange: (v: MoodLevel | undefined) => void
  tags: string[]
  onTagsChange: (v: string[]) => void
  energyLevel: MoodLevel | undefined
  onEnergyLevelChange: (v: MoodLevel | undefined) => void
  sleepQuality: MoodLevel | undefined
  onSleepQualityChange: (v: MoodLevel | undefined) => void
  isPrivate: boolean
  onIsPrivateChange: (v: boolean) => void
  entryDate: Date
  onEntryDateChange: (v: Date) => void
  dateLocale: DateFnsLocale
  saving: boolean
  isValid: boolean
  cancelHref?: string
  labels: JournalLabels
}

export function JournalFormFields({
  content,
  onContentChange,
  mood,
  onMoodChange,
  tags,
  onTagsChange,
  energyLevel,
  onEnergyLevelChange,
  sleepQuality,
  onSleepQualityChange,
  isPrivate,
  onIsPrivateChange,
  entryDate,
  onEntryDateChange,
  dateLocale,
  saving,
  isValid,
  cancelHref,
  labels,
}: Props) {
  return (
    <>
      {/* Date */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <Label>{labels.dateLabel}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(entryDate, 'EEEE d MMMM yyyy', { locale: dateLocale })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={entryDate}
                  onSelect={(date) => date && onEntryDateChange(date)}
                  locale={dateLocale}
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
            <Label htmlFor="content">{labels.contentLabel}</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder={labels.contentPlaceholder}
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
            {labels.howFeeling}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MoodPicker value={mood} onChange={onMoodChange} label={labels.generalMood} size="lg" />
          <MoodPicker
            value={energyLevel}
            onChange={onEnergyLevelChange}
            label={labels.energyLevel}
            size="md"
          />
          <MoodPicker
            value={sleepQuality}
            onChange={onSleepQualityChange}
            label={labels.sleepQuality}
            size="md"
          />
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{labels.tags}</CardTitle>
        </CardHeader>
        <CardContent>
          <TagInput value={tags} onChange={onTagsChange} placeholder={labels.addTags} />
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
                <p className="text-foreground font-medium">{labels.privateEntry}</p>
                <p className="text-muted-foreground text-sm">{labels.excludeExport}</p>
              </div>
            </div>
            <Switch checked={isPrivate} onCheckedChange={onIsPrivateChange} />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      {cancelHref ? (
        <div className="flex gap-3">
          <Link href={cancelHref} className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              {labels.cancel}
            </Button>
          </Link>
          <Button type="submit" className="flex-1 gap-2" disabled={!isValid || saving}>
            <Save className="h-4 w-4" />
            {saving ? labels.saving : labels.save}
          </Button>
        </div>
      ) : (
        <Button type="submit" className="w-full gap-2" disabled={!isValid || saving}>
          <Save className="h-4 w-4" />
          {saving ? labels.saving : labels.save}
        </Button>
      )}
    </>
  )
}
