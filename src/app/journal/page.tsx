'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, BookOpen, TrendingUp, Calendar, Tag } from 'lucide-react'
import Link from 'next/link'
import { getJournalEntries, searchJournalEntries, getJournalStats } from '@/lib/db'
import type { JournalEntry } from '@/lib/types'
import { EntryCard, EntryCardSkeleton } from '@/components/journal/entry-card'
import { moodConfig, MoodDisplay } from '@/components/journal/mood-picker'
import { predefinedTags, getTagCategory } from '@/components/journal/tag-input'
import { cn } from '@/lib/utils'

interface JournalStats {
  totalEntries: number
  averageMood: number | null
  entriesPerWeek: number
  tagFrequency: Record<string, number>
}

export default function JournalPage() {
  const t = useTranslations('journal')
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [stats, setStats] = useState<JournalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      searchJournalEntries(searchQuery).then(setEntries)
    } else {
      getJournalEntries(50).then(setEntries)
    }
  }, [searchQuery])

  async function loadData() {
    setLoading(true)
    try {
      const [entriesData, statsData] = await Promise.all([
        getJournalEntries(50),
        getJournalStats(30),
      ])
      setEntries(entriesData)
      setStats(statsData)
    } finally {
      setLoading(false)
    }
  }

  // Filtrer par tag si sélectionné
  const filteredEntries = selectedTag
    ? entries.filter((e) => e.tags.includes(selectedTag))
    : entries

  // Top 5 tags les plus utilisés
  const topTags = stats?.tagFrequency
    ? Object.entries(stats.tagFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : []

  const categoryColors: Record<string, string> = {
    mood: 'bg-purple-500/20 text-purple-300',
    side_effects: 'bg-red-500/20 text-red-300',
    energy: 'bg-yellow-500/20 text-yellow-300',
    sleep: 'bg-blue-500/20 text-blue-300',
    social: 'bg-green-500/20 text-green-300',
    custom: 'bg-gray-500/20 text-gray-300',
  }

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </div>
        <Link href="/journal/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t('newEntry')}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setSelectedTag(null)
          }}
          className="pl-9"
        />
      </div>

      {/* Stats Cards */}
      {stats && !searchQuery && !selectedTag && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 rounded-lg p-2">
                  <BookOpen className="text-primary h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalEntries}</p>
                  <p className="text-muted-foreground text-xs">{t('entries30d')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                {stats.averageMood ? (
                  <MoodDisplay
                    mood={Math.round(stats.averageMood) as 1 | 2 | 3 | 4 | 5}
                    size="md"
                  />
                ) : (
                  <div className="bg-muted rounded-lg p-2">
                    <TrendingUp className="text-muted-foreground h-4 w-4" />
                  </div>
                )}
                <div>
                  <p className="text-2xl font-bold">
                    {stats.averageMood ? stats.averageMood.toFixed(1) : '-'}
                  </p>
                  <p className="text-muted-foreground text-xs">{t('avgMood')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.entriesPerWeek.toFixed(1)}</p>
                  <p className="text-muted-foreground text-xs">{t('perWeek')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-green-500/10 p-2">
                  <Tag className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Object.keys(stats.tagFrequency).length}</p>
                  <p className="text-muted-foreground text-xs">{t('tagsUsed')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Tags Filter */}
      {topTags.length > 0 && !searchQuery && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
          <Button
            variant={selectedTag === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTag(null)}
            className="shrink-0"
          >
            {t('all')}
          </Button>
          {topTags.map(([tag, count]) => {
            const category = getTagCategory(tag)
            const isSelected = selectedTag === tag
            return (
              <Button
                key={tag}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={cn('shrink-0 gap-1', !isSelected && categoryColors[category])}
              >
                {tag}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {count}
                </Badge>
              </Button>
            )
          })}
        </div>
      )}

      {/* Entries List */}
      <div className="space-y-3">
        {loading ? (
          <>
            <EntryCardSkeleton />
            <EntryCardSkeleton />
            <EntryCardSkeleton />
          </>
        ) : filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="text-muted-foreground/50 mx-auto mb-3 h-12 w-12" />
              <p className="text-foreground mb-1 font-medium">
                {searchQuery || selectedTag ? t('noResults') : t('noEntries')}
              </p>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchQuery
                  ? t('tryOtherSearch')
                  : selectedTag
                    ? t('noEntriesWithTag')
                    : t('startWriting')}
              </p>
              {!searchQuery && !selectedTag && (
                <Link href="/journal/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('newEntry')}
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map((entry) => <EntryCard key={entry.id} entry={entry} />)
        )}
      </div>

      {/* Results count */}
      {(searchQuery || selectedTag) && filteredEntries.length > 0 && (
        <p className="text-muted-foreground text-center text-sm">
          {filteredEntries.length} {filteredEntries.length > 1 ? t('results') : t('result')}
          {searchQuery && ` pour "${searchQuery}"`}
          {selectedTag && ` avec #${selectedTag}`}
        </p>
      )}
    </div>
  )
}
