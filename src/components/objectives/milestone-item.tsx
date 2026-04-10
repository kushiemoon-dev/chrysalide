'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { getDateLocale } from '@/i18n/date-locale'
import type { Locale } from '@/i18n/config'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Calendar as CalendarIcon,
  Trash2,
  GripVertical,
  CheckCircle2,
  Circle,
  Edit2,
  Check,
  X,
} from 'lucide-react'
import type { Milestone } from '@/lib/types'
import { cn } from '@/lib/utils'

interface MilestoneItemProps {
  milestone: Milestone
  onToggle: (id: number, achieved: boolean) => void
  onUpdate?: (id: number, updates: Partial<Milestone>) => void
  onDelete?: (id: number) => void
  draggable?: boolean
  showActions?: boolean
}

export function MilestoneItem({
  milestone,
  onToggle,
  onUpdate,
  onDelete,
  draggable = false,
  showActions = true,
}: MilestoneItemProps) {
  const locale = useLocale()
  const dateLocale = getDateLocale(locale as Locale)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(milestone.title)
  const [editDate, setEditDate] = useState<Date | undefined>(
    milestone.date ? new Date(milestone.date) : undefined
  )

  const handleSave = () => {
    if (onUpdate && editTitle.trim()) {
      onUpdate(milestone.id!, {
        title: editTitle.trim(),
        date: editDate,
      })
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditTitle(milestone.title)
    setEditDate(milestone.date ? new Date(milestone.date) : undefined)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="bg-muted/50 flex items-start gap-3 rounded-lg border p-3">
        <div className="flex-1 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Titre</Label>
            <Input
              id="edit-title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Titre de l'étape"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Date cible (optionnel)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !editDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {editDate
                    ? format(editDate, 'd MMMM yyyy', { locale: dateLocale })
                    : 'Sélectionner une date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={editDate}
                  onSelect={setEditDate}
                  locale={dateLocale}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="mr-1 h-4 w-4" />
              Annuler
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!editTitle.trim()}>
              <Check className="mr-1 h-4 w-4" />
              Enregistrer
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg p-3 transition-colors',
        milestone.achieved
          ? 'border border-green-500/20 bg-green-500/10'
          : 'bg-muted/30 hover:bg-muted/50'
      )}
    >
      {draggable && (
        <div className="text-muted-foreground hover:text-foreground cursor-grab">
          <GripVertical className="h-5 w-5" />
        </div>
      )}

      <Checkbox
        checked={milestone.achieved}
        onCheckedChange={(checked) => onToggle(milestone.id!, checked as boolean)}
        className="mt-0.5"
      />

      <div className="min-w-0 flex-1">
        <p
          className={cn('font-medium', milestone.achieved && 'text-muted-foreground line-through')}
        >
          {milestone.title}
        </p>

        {milestone.description && (
          <p className="text-muted-foreground mt-1 text-sm">{milestone.description}</p>
        )}

        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-xs">
          {milestone.date && !milestone.achieved && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {format(new Date(milestone.date), 'd MMM yyyy', { locale: dateLocale })}
            </span>
          )}

          {milestone.achieved && milestone.achievedDate && (
            <span className="flex items-center gap-1 text-green-500">
              <CheckCircle2 className="h-3 w-3" />
              Fait le{' '}
              {format(new Date(milestone.achievedDate), 'd MMM yyyy', { locale: dateLocale })}
            </span>
          )}
        </div>
      </div>

      {showActions && (
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive h-8 w-8"
              onClick={() => onDelete(milestone.id!)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Compact version for timeline
export function MilestoneTimelineItem({
  milestone,
  isLast = false,
}: {
  milestone: Milestone
  isLast?: boolean
}) {
  const locale = useLocale()
  const dateLocale = getDateLocale(locale as Locale)
  return (
    <div className="flex gap-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
            milestone.achieved
              ? 'bg-green-500 text-white'
              : 'bg-muted border-muted-foreground/30 border-2'
          )}
        >
          {milestone.achieved ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Circle className="text-muted-foreground h-3 w-3" />
          )}
        </div>
        {!isLast && (
          <div
            className={cn(
              'min-h-8 w-0.5 flex-1',
              milestone.achieved ? 'bg-green-500/50' : 'bg-muted-foreground/20'
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <p className={cn('font-medium', milestone.achieved && 'text-green-500')}>
          {milestone.title}
        </p>
        {milestone.achievedDate && (
          <p className="text-muted-foreground mt-1 text-xs">
            {format(new Date(milestone.achievedDate), 'd MMM yyyy', { locale: dateLocale })}
          </p>
        )}
      </div>
    </div>
  )
}
