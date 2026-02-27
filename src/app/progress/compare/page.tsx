'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, ArrowLeftRight, Calendar } from 'lucide-react'
import Link from 'next/link'
import { getPhysicalProgress } from '@/lib/db'
import type { PhysicalProgress, Measurements } from '@/lib/types'
import { format, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'

const MEASUREMENT_LABELS: Record<keyof Measurements, string> = {
  weight: 'Poids',
  height: 'Taille',
  chest: 'Poitrine',
  underbust: 'Sous-poitrine',
  waist: 'Taille',
  hips: 'Hanches',
  shoulders: 'Épaules',
}

const MEASUREMENT_UNITS: Record<keyof Measurements, string> = {
  weight: 'kg',
  height: 'cm',
  chest: 'cm',
  underbust: 'cm',
  waist: 'cm',
  hips: 'cm',
  shoulders: 'cm',
}

export default function CompareProgressPage() {
  const [entries, setEntries] = useState<PhysicalProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [leftIndex, setLeftIndex] = useState(0)
  const [rightIndex, setRightIndex] = useState(0)

  useEffect(() => {
    async function loadData() {
      const data = await getPhysicalProgress(100)
      // Filter only entries with photos
      const withPhotos = data.filter((e) => e.photos && e.photos.length > 0)
      setEntries(withPhotos)

      // Set defaults: first = oldest, right = newest
      if (withPhotos.length > 1) {
        setLeftIndex(withPhotos.length - 1) // oldest
        setRightIndex(0) // newest
      }

      setLoading(false)
    }
    loadData()
  }, [])

  const leftEntry = entries[leftIndex]
  const rightEntry = entries[rightIndex]

  // Calculate days between selected entries
  const daysBetween =
    leftEntry && rightEntry
      ? Math.abs(differenceInDays(new Date(rightEntry.date), new Date(leftEntry.date)))
      : 0

  // Get common measurements
  const commonMeasurements =
    leftEntry?.measurements && rightEntry?.measurements
      ? (Object.keys(MEASUREMENT_LABELS) as (keyof Measurements)[]).filter(
          (key) =>
            leftEntry.measurements?.[key] !== undefined &&
            rightEntry.measurements?.[key] !== undefined
        )
      : []

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (entries.length < 2) {
    return (
      <div className="space-y-6 p-4 pb-24">
        <div className="flex items-center gap-3 pt-2">
          <Link href="/progress">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-foreground text-xl font-bold">Comparaison</h1>
            <p className="text-muted-foreground text-sm">Avant / Après</p>
          </div>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <div className="bg-muted/50 mx-auto mb-4 w-fit rounded-full p-4">
              <ArrowLeftRight className="text-muted-foreground h-8 w-8" />
            </div>
            <h3 className="text-foreground mb-2 font-medium">Pas assez d&apos;entrées</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Ajoutez au moins 2 entrées avec photos pour comparer
            </p>
            <Link href="/progress/new">
              <Button>Ajouter une entrée</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

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
          <h1 className="text-foreground text-xl font-bold">Comparaison</h1>
          <p className="text-muted-foreground flex items-center gap-1 text-sm">
            <Calendar className="h-3 w-3" />
            {daysBetween} jour{daysBetween > 1 ? 's' : ''} d&apos;écart
          </p>
        </div>
      </div>

      {/* Photo Comparison */}
      <div className="grid grid-cols-2 gap-2">
        {/* Left Photo */}
        <div className="space-y-2">
          <div className="bg-muted aspect-[3/4] overflow-hidden rounded-lg">
            {leftEntry?.photos?.[0] && (
              <img src={leftEntry.photos[0]} alt="Avant" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setLeftIndex((prev) => Math.min(prev + 1, entries.length - 1))}
              disabled={leftIndex >= entries.length - 1}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-center">
              <p className="text-foreground text-xs font-medium">
                {leftEntry && format(new Date(leftEntry.date), 'd MMM yyyy', { locale: fr })}
              </p>
              <p className="text-muted-foreground text-xs">Avant</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setLeftIndex((prev) => Math.max(prev - 1, 0))}
              disabled={leftIndex <= 0 || leftIndex <= rightIndex}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right Photo */}
        <div className="space-y-2">
          <div className="bg-muted aspect-[3/4] overflow-hidden rounded-lg">
            {rightEntry?.photos?.[0] && (
              <img src={rightEntry.photos[0]} alt="Après" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setRightIndex((prev) => Math.min(prev + 1, entries.length - 1))}
              disabled={rightIndex >= entries.length - 1 || rightIndex >= leftIndex}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-center">
              <p className="text-foreground text-xs font-medium">
                {rightEntry && format(new Date(rightEntry.date), 'd MMM yyyy', { locale: fr })}
              </p>
              <p className="text-muted-foreground text-xs">Après</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setRightIndex((prev) => Math.max(prev - 1, 0))}
              disabled={rightIndex <= 0}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLeftIndex(entries.length - 1)
                setRightIndex(0)
              }}
              className="text-xs"
            >
              Premier → Dernier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Find entries 1 month apart
                const today = new Date()
                const monthAgo = new Date(today)
                monthAgo.setMonth(monthAgo.getMonth() - 1)

                const closestToToday = entries.reduce(
                  (prev, curr, idx) =>
                    Math.abs(new Date(curr.date).getTime() - today.getTime()) <
                    Math.abs(new Date(entries[prev].date).getTime() - today.getTime())
                      ? idx
                      : prev,
                  0
                )

                const closestToMonthAgo = entries.reduce(
                  (prev, curr, idx) =>
                    Math.abs(new Date(curr.date).getTime() - monthAgo.getTime()) <
                    Math.abs(new Date(entries[prev].date).getTime() - monthAgo.getTime())
                      ? idx
                      : prev,
                  0
                )

                if (closestToMonthAgo > closestToToday) {
                  setLeftIndex(closestToMonthAgo)
                  setRightIndex(closestToToday)
                }
              }}
              className="text-xs"
            >
              ~1 mois
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Find entries 3 months apart
                const today = new Date()
                const threeMonthsAgo = new Date(today)
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

                const closestToToday = entries.reduce(
                  (prev, curr, idx) =>
                    Math.abs(new Date(curr.date).getTime() - today.getTime()) <
                    Math.abs(new Date(entries[prev].date).getTime() - today.getTime())
                      ? idx
                      : prev,
                  0
                )

                const closestTo3Months = entries.reduce(
                  (prev, curr, idx) =>
                    Math.abs(new Date(curr.date).getTime() - threeMonthsAgo.getTime()) <
                    Math.abs(new Date(entries[prev].date).getTime() - threeMonthsAgo.getTime())
                      ? idx
                      : prev,
                  0
                )

                if (closestTo3Months > closestToToday) {
                  setLeftIndex(closestTo3Months)
                  setRightIndex(closestToToday)
                }
              }}
              className="text-xs"
            >
              ~3 mois
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Measurements Comparison */}
      {commonMeasurements.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Évolution des mensurations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {commonMeasurements.map((key) => {
                const left = leftEntry.measurements![key]!
                const right = rightEntry.measurements![key]!
                const diff = right - left
                const sign = diff > 0 ? '+' : ''

                return (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{MEASUREMENT_LABELS[key]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{left}</span>
                      <ArrowRight className="text-muted-foreground h-3 w-3" />
                      <span className="font-medium">{right}</span>
                      <span className="text-muted-foreground text-xs">
                        {MEASUREMENT_UNITS[key]}
                      </span>
                      <Badge
                        variant={diff === 0 ? 'secondary' : 'outline'}
                        className={
                          diff > 0
                            ? 'border-green-500 text-green-500'
                            : diff < 0
                              ? 'border-red-500 text-red-500'
                              : ''
                        }
                      >
                        {sign}
                        {diff.toFixed(1)}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
