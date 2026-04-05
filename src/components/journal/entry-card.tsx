'use client'

import { useLocale } from 'next-intl'
import { getDateLocale } from '@/i18n/date-locale'
import type { Locale } from '@/i18n/config'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronRight, Lock } from 'lucide-react'
import Link from 'next/link'
import type { JournalEntry } from '@/lib/types'
import { MoodDisplay } from './mood-picker'
import { TagBadge } from './tag-input'

interface EntryCardProps {
  entry: JournalEntry
}

export function EntryCard({ entry }: EntryCardProps) {
  const locale = useLocale()
  const dateLocale = getDateLocale(locale as Locale)
  // Tronquer le contenu pour l'aperçu
  const preview = entry.content.length > 150 ? entry.content.slice(0, 150) + '...' : entry.content

  return (
    <Link href={`/journal/${entry.id}`}>
      <Card className="hover:bg-muted/30 cursor-pointer transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Mood indicator */}
            {entry.mood && (
              <div className="mt-0.5 shrink-0">
                <MoodDisplay mood={entry.mood} size="md" />
              </div>
            )}

            {/* Content */}
            <div className="min-w-0 flex-1 space-y-2">
              {/* Date et indicateurs */}
              <div className="flex items-center gap-2">
                <time className="text-foreground text-sm font-medium">
                  {format(new Date(entry.date), 'EEEE d MMMM yyyy', { locale: dateLocale })}
                </time>
                {entry.isPrivate && <Lock className="text-muted-foreground h-3 w-3" />}
              </div>

              {/* Preview text */}
              <p className="text-muted-foreground line-clamp-2 text-sm">{preview}</p>

              {/* Tags */}
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.tags.slice(0, 4).map((tag) => (
                    <TagBadge key={tag} tag={tag} />
                  ))}
                  {entry.tags.length > 4 && (
                    <span className="text-muted-foreground text-xs">+{entry.tags.length - 4}</span>
                  )}
                </div>
              )}
            </div>

            {/* Arrow */}
            <ChevronRight className="text-muted-foreground mt-1 h-5 w-5 shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function EntryCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-muted h-10 w-10 animate-pulse rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="bg-muted h-4 w-32 animate-pulse rounded" />
            <div className="bg-muted h-3 w-full animate-pulse rounded" />
            <div className="bg-muted h-3 w-2/3 animate-pulse rounded" />
            <div className="flex gap-1">
              <div className="bg-muted h-5 w-16 animate-pulse rounded" />
              <div className="bg-muted h-5 w-12 animate-pulse rounded" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
