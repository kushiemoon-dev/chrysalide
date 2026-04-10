'use client'

import { useState, useEffect, use } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Edit, Trash2, Lock, Calendar, Zap, Moon, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { getJournalEntry, deleteJournalEntry } from '@/lib/db'
import type { JournalEntry } from '@/lib/types'
import { MoodDisplay } from '@/components/journal/mood-picker'
import { TagBadge } from '@/components/journal/tag-input'

export default function JournalEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('journal')
  const tCommon = useTranslations('common')
  const resolvedParams = use(params)
  const router = useRouter()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadEntry()
  }, [resolvedParams.id])

  async function loadEntry() {
    setLoading(true)
    try {
      const data = await getJournalEntry(Number(resolvedParams.id))
      setEntry(data || null)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!entry?.id) return
    setDeleting(true)
    try {
      await deleteJournalEntry(entry.id)
      router.push('/journal')
    } catch (error) {
      console.error('Failed to delete entry:', error)
      setDeleting(false)
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
          <CardContent className="space-y-3 p-4">
            <div className="bg-muted h-4 w-full animate-pulse rounded" />
            <div className="bg-muted h-4 w-full animate-pulse rounded" />
            <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
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
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Link href="/journal">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-foreground text-xl font-bold">
                {format(new Date(entry.date), 'EEEE d MMMM', { locale: fr })}
              </h1>
              {entry.isPrivate && <Lock className="text-muted-foreground h-4 w-4" />}
            </div>
            <p className="text-muted-foreground text-sm">
              {format(new Date(entry.date), 'HH:mm', { locale: fr })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/journal/${entry.id}/edit`}>
            <Button variant="outline" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('detail.confirmDelete')}</AlertDialogTitle>
                <AlertDialogDescription>{t('detail.confirmDeleteDesc')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? t('detail.deleting') : tCommon('delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Mood & Metrics */}
      {(entry.mood || entry.energyLevel || entry.sleepQuality) && (
        <div className="flex flex-wrap gap-3">
          {entry.mood && (
            <Card className="min-w-[140px] flex-1">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <MoodDisplay mood={entry.mood} size="lg" />
                  <div>
                    <p className="text-muted-foreground text-xs">{t('detail.mood')}</p>
                    <p className="font-medium">{t(`moods.${entry.mood}`)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {entry.energyLevel && (
            <Card className="min-w-[140px] flex-1">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
                    <Zap className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{t('detail.energy')}</p>
                    <p className="font-medium">{t(`moods.${entry.energyLevel}`)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {entry.sleepQuality && (
            <Card className="min-w-[140px] flex-1">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                    <Moon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{t('detail.sleep')}</p>
                    <p className="font-medium">{t(`moods.${entry.sleepQuality}`)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Content */}
      <Card>
        <CardContent className="p-4">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{entry.content}</p>
        </CardContent>
      </Card>

      {/* Tags */}
      {entry.tags.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm">{t('detail.tags')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            <span>
              {t('detail.createdAt')}{' '}
              {format(new Date(entry.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
            </span>
          </div>
          {entry.updatedAt &&
            new Date(entry.updatedAt).getTime() !== new Date(entry.createdAt).getTime() && (
              <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                <Edit className="h-4 w-4" />
                <span>
                  {t('detail.modifiedAt')}{' '}
                  {format(new Date(entry.updatedAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </span>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
