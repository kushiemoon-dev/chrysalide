'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  ArrowLeft,
  Trash2,
  Calendar,
  Ruler,
  Camera,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'
import type { PhysicalProgress, Measurements } from '@/lib/types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getDateLocale } from '@/i18n/date-locale'
import type { Locale } from '@/i18n/config'

const MEASUREMENT_UNITS: Record<keyof Measurements, string> = {
  weight: 'kg',
  height: 'cm',
  chest: 'cm',
  underbust: 'cm',
  waist: 'cm',
  hips: 'cm',
  shoulders: 'cm',
}

export default function ProgressDetailPage() {
  const t = useTranslations('progress')
  const tc = useTranslations('common')

  const MEASUREMENT_LABELS: Record<keyof Measurements, string> = {
    weight: t('new.weightField'),
    height: t('new.heightField'),
    chest: t('new.chestField'),
    underbust: t('new.underChestField'),
    waist: t('new.waistField'),
    hips: t('new.hipsField'),
    shoulders: t('new.shouldersField'),
  }
  const params = useParams()
  const router = useRouter()
  const [entry, setEntry] = useState<PhysicalProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function loadEntry() {
      const id = parseInt(params.id as string)
      if (isNaN(id)) {
        router.push('/progress')
        return
      }

      const data = await db.physicalProgress.get(id)
      if (!data) {
        router.push('/progress')
        return
      }

      setEntry(data)
      setLoading(false)
    }
    loadEntry()
  }, [params.id, router])

  async function handleDelete() {
    if (!entry?.id || !confirm(t('detail.deleteConfirm'))) return

    setDeleting(true)
    try {
      await db.physicalProgress.delete(entry.id)
      router.push('/progress')
    } catch (error) {
      console.error('Error deleting entry:', error)
      setDeleting(false)
    }
  }

  function openLightbox(index: number) {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  function navigateLightbox(direction: 'prev' | 'next') {
    if (!entry?.photos) return

    if (direction === 'prev') {
      setLightboxIndex((prev) => (prev === 0 ? entry.photos!.length - 1 : prev - 1))
    } else {
      setLightboxIndex((prev) => (prev === entry.photos!.length - 1 ? 0 : prev + 1))
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <p className="text-muted-foreground">{tc('loading')}</p>
      </div>
    )
  }

  if (!entry) return null

  const measurementEntries = entry.measurements
    ? (Object.entries(entry.measurements) as [keyof Measurements, number | undefined][]).filter(
        (entry) => entry[1] !== undefined
      )
    : []

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Link href="/progress">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-foreground text-xl font-bold">
              {format(new Date(entry.date), 'd MMMM yyyy', { locale: fr })}
            </h1>
            <p className="text-muted-foreground flex items-center gap-1 text-sm">
              <Calendar className="h-3 w-3" />
              {format(new Date(entry.date), 'EEEE', { locale: fr })}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={deleting}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Photos */}
      {entry.photos && entry.photos.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="h-4 w-4" />
              {t('detail.photos')} ({entry.photos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {entry.photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => openLightbox(index)}
                  className="bg-muted focus:ring-primary aspect-square overflow-hidden rounded-lg focus:ring-2"
                >
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Measurements */}
      {measurementEntries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Ruler className="h-4 w-4" />
              {t('detail.measurements')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {measurementEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="bg-muted/30 flex items-center justify-between rounded-lg p-3"
                >
                  <span className="text-muted-foreground text-sm">{MEASUREMENT_LABELS[key]}</span>
                  <span className="font-medium">
                    {value} <span className="text-muted-foreground">{MEASUREMENT_UNITS[key]}</span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('detail.tags')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {entry.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('detail.notes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap">{entry.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-h-[95vh] max-w-[95vw] border-none bg-black p-0">
          <div className="relative flex h-full w-full items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation */}
            {entry.photos && entry.photos.length > 1 && (
              <>
                <button
                  onClick={() => navigateLightbox('prev')}
                  className="absolute left-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => navigateLightbox('next')}
                  className="absolute right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Image */}
            {entry.photos && (
              <img
                src={entry.photos[lightboxIndex]}
                alt={`Photo ${lightboxIndex + 1}`}
                className="max-h-[90vh] max-w-full object-contain"
              />
            )}

            {/* Counter */}
            {entry.photos && entry.photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                {lightboxIndex + 1} / {entry.photos.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
