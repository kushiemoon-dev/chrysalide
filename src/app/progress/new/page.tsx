'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Camera, X, Plus, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { addPhysicalProgress } from '@/lib/db'
import type { Measurements } from '@/lib/types'
import { format } from 'date-fns'

const SUGGESTED_TAGS = ['visage', 'corps', 'poitrine', 'cheveux', 'peau', 'énergie', 'humeur']

export default function NewProgressPage() {
  const t = useTranslations('progress')

  const MEASUREMENT_FIELDS: {
    key: keyof Measurements
    label: string
    unit: string
    placeholder: string
  }[] = [
    { key: 'weight', label: t('new.weightField'), unit: 'kg', placeholder: '65' },
    { key: 'height', label: t('new.heightField'), unit: 'cm', placeholder: '170' },
    { key: 'chest', label: t('new.chestField'), unit: 'cm', placeholder: '90' },
    { key: 'underbust', label: t('new.underChestField'), unit: 'cm', placeholder: '80' },
    { key: 'waist', label: t('new.waistField'), unit: 'cm', placeholder: '70' },
    { key: 'hips', label: t('new.hipsField'), unit: 'cm', placeholder: '95' },
    { key: 'shoulders', label: t('new.shouldersField'), unit: 'cm', placeholder: '45' },
  ]
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [measurements, setMeasurements] = useState<Partial<Measurements>>({})
  const [photos, setPhotos] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [saving, setSaving] = useState(false)

  function handleMeasurementChange(key: keyof Measurements, value: string) {
    const numValue = parseFloat(value)
    setMeasurements((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : numValue,
    }))
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return

    const newPhotos: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) continue

      // Convert to base64 for local storage
      const base64 = await fileToBase64(file)
      newPhotos.push(base64)
    }

    setPhotos((prev) => [...prev, ...newPhotos])
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  function addCustomTag() {
    if (customTag.trim() && !tags.includes(customTag.trim())) {
      setTags((prev) => [...prev, customTag.trim()])
      setCustomTag('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      // Filter out undefined measurements
      const cleanMeasurements: Measurements = {}
      Object.entries(measurements).forEach(([key, value]) => {
        if (value !== undefined && !isNaN(value)) {
          cleanMeasurements[key as keyof Measurements] = value
        }
      })

      await addPhysicalProgress({
        date: new Date(date),
        measurements: Object.keys(cleanMeasurements).length > 0 ? cleanMeasurements : undefined,
        photos: photos.length > 0 ? photos : undefined,
        notes: notes.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      })

      router.push('/progress')
    } catch (error) {
      console.error('Error saving progress:', error)
    } finally {
      setSaving(false)
    }
  }

  const hasData =
    photos.length > 0 || Object.values(measurements).some((v) => v !== undefined) || notes.trim()

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link href="/progress">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-xl font-bold">{t('new.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('new.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('new.date')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="h-4 w-4" />
              {t('new.photos')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Photo Grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className="bg-muted relative aspect-square overflow-hidden rounded-lg"
                  >
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                {t('new.addPhotos')}
              </Button>
            </div>

            <p className="text-muted-foreground text-center text-xs">{t('new.photosLocal')}</p>
          </CardContent>
        </Card>

        {/* Measurements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('new.measurements')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {MEASUREMENT_FIELDS.map(({ key, label, unit, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={key} className="text-sm">
                    {label}
                  </Label>
                  <div className="relative">
                    <Input
                      id={key}
                      type="number"
                      step="0.1"
                      placeholder={placeholder}
                      value={measurements[key] ?? ''}
                      onChange={(e) => handleMeasurementChange(key, e.target.value)}
                      className="pr-10"
                    />
                    <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm">
                      {unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('new.tags')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={tags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Custom tags */}
            {tags.filter((t) => !SUGGESTED_TAGS.includes(t)).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags
                  .filter((t) => !SUGGESTED_TAGS.includes(t))
                  .map((tag) => (
                    <Badge
                      key={tag}
                      variant="default"
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
              </div>
            )}

            {/* Add custom tag */}
            <div className="flex gap-2">
              <Input
                placeholder={t('new.customTag')}
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addCustomTag}
                disabled={!customTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('new.notes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={t('new.notesPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={!hasData || saving}>
          {saving ? t('new.saving') : t('new.save')}
        </Button>
      </form>
    </div>
  )
}
