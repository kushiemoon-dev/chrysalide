'use client'

import { useTranslations } from 'next-intl'
import type { Locale as DateFnsLocale } from 'date-fns'
import { format } from 'date-fns'
import Link from 'next/link'
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
import { Save, Calendar as CalendarIcon, Target, Plus, X } from 'lucide-react'
import type { ObjectiveCategory, ObjectiveStatus, ActCategory } from '@/lib/types'
import { ACT_CATEGORIES } from '@/lib/constants'
import { categoryConfig } from '@/components/objectives/objective-card'
import { cn } from '@/lib/utils'

export interface MilestoneInput {
  title: string
  date?: Date
}

interface Props {
  title: string
  onTitleChange: (v: string) => void
  description: string
  onDescriptionChange: (v: string) => void
  category: ObjectiveCategory
  onCategoryChange: (v: ObjectiveCategory) => void
  actCategory: ActCategory | undefined
  onActCategoryChange: (v: ActCategory) => void
  information: string
  onInformationChange: (v: string) => void
  status: ObjectiveStatus
  onStatusChange: (v: ObjectiveStatus) => void
  showAllStatuses?: boolean
  targetDate: Date | undefined
  onTargetDateChange: (v: Date | undefined) => void
  showRemoveDateButton?: boolean
  disablePastDates?: boolean
  dateLocale: DateFnsLocale
  saving: boolean
  isValid: boolean
  backHref: string
  cancelLabel: string
  saveLabel: string
  savingLabel: string
  // new-only optional
  milestones?: MilestoneInput[]
  newMilestoneTitle?: string
  onNewMilestoneTitleChange?: (v: string) => void
  onAddMilestone?: () => void
  onRemoveMilestone?: (i: number) => void
  // edit-only optional
  notes?: string
  onNotesChange?: (v: string) => void
}

export function ObjectiveFormCore({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  category,
  onCategoryChange,
  actCategory,
  onActCategoryChange,
  information,
  onInformationChange,
  status,
  onStatusChange,
  showAllStatuses,
  targetDate,
  onTargetDateChange,
  showRemoveDateButton,
  disablePastDates,
  dateLocale,
  saving,
  isValid,
  backHref,
  cancelLabel,
  saveLabel,
  savingLabel,
  milestones,
  newMilestoneTitle,
  onNewMilestoneTitleChange,
  onAddMilestone,
  onRemoveMilestone,
  notes,
  onNotesChange,
}: Props) {
  const t = useTranslations('objectives')

  return (
    <>
      {/* Main info */}
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Ex: Commencer le THS"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
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
            <Select
              value={category}
              onValueChange={(v) => onCategoryChange(v as ObjectiveCategory)}
            >
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

          {category === 'medical' && (
            <>
              <div className="space-y-2">
                <Label>{t('act.categoryLabel')}</Label>
                <Select
                  value={actCategory ?? ''}
                  onValueChange={(v) => onActCategoryChange(v as ActCategory)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ACT_CATEGORIES) as ActCategory[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {t(`actCategories.${key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('act.informationLabel')}</Label>
                <Textarea
                  value={information}
                  onChange={(e) => onInformationChange(e.target.value)}
                  placeholder={t('act.informationPlaceholder')}
                  className="min-h-[80px] resize-none"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>{showAllStatuses ? 'Statut' : 'Statut initial'}</Label>
            <Select value={status} onValueChange={(v) => onStatusChange(v as ObjectiveStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">{t('detail.statuses.not_started')}</SelectItem>
                <SelectItem value="in_progress">{t('detail.statuses.in_progress')}</SelectItem>
                {showAllStatuses && (
                  <>
                    <SelectItem value="completed">{t('detail.statuses.completed')}</SelectItem>
                    <SelectItem value="paused">{t('detail.statuses.paused')}</SelectItem>
                    <SelectItem value="cancelled">{t('detail.statuses.cancelled')}</SelectItem>
                  </>
                )}
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
                    ? format(targetDate, 'd MMMM yyyy', { locale: dateLocale })
                    : 'Sélectionner une date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={targetDate}
                  onSelect={onTargetDateChange}
                  locale={dateLocale}
                  disabled={disablePastDates ? (date) => date < new Date() : undefined}
                />
              </PopoverContent>
            </Popover>
            {showRemoveDateButton && targetDate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => onTargetDateChange(undefined)}
              >
                Supprimer la date
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Milestones (new-only) */}
      {milestones !== undefined && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Étapes (optionnel)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Décompose ton objectif en étapes pour suivre ta progression
            </p>

            {milestones.length > 0 && (
              <div className="space-y-2">
                {milestones.map((milestone, index) => (
                  <div key={index} className="bg-muted/50 flex items-center gap-2 rounded-lg p-2">
                    <span className="bg-primary/20 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-sm">{milestone.title}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onRemoveMilestone?.(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={newMilestoneTitle ?? ''}
                onChange={(e) => onNewMilestoneTitleChange?.(e.target.value)}
                placeholder="Nouvelle étape..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onAddMilestone?.()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onAddMilestone}
                disabled={!newMilestoneTitle?.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes (edit-only) */}
      {notes !== undefined && onNotesChange && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Notes personnelles..."
              className="min-h-[80px] resize-none"
            />
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex gap-3">
        <Link href={backHref} className="flex-1">
          <Button type="button" variant="outline" className="w-full">
            {cancelLabel}
          </Button>
        </Link>
        <Button type="submit" className="flex-1 gap-2" disabled={!isValid || saving}>
          <Save className="h-4 w-4" />
          {saving ? savingLabel : saveLabel}
        </Button>
      </div>
    </>
  )
}
