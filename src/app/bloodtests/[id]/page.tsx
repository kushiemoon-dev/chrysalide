'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Trash2,
  Pencil,
  FlaskConical,
  Heart,
  Activity,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { db, deleteBloodTest, getUserProfile } from '@/lib/db'
import type { BloodTest, BloodMarker } from '@/lib/types'
import { REFERENCE_RANGES } from '@/lib/constants'

// Marker groups for display
const MARKER_GROUPS: Record<
  string,
  { label: string; icon: typeof FlaskConical; markers: BloodMarker[] }
> = {
  hormones: {
    label: 'Hormones',
    icon: FlaskConical,
    markers: [
      'estradiol',
      'testosterone',
      'lh',
      'fsh',
      'prolactin',
      'shbg',
      'dheas',
      'progesterone',
    ],
  },
  blood: {
    label: 'Santé sanguine',
    icon: Heart,
    markers: ['hematocrit', 'hemoglobin'],
  },
  organs: {
    label: 'Foie & Reins',
    icon: Activity,
    markers: ['alt', 'ast', 'creatinine', 'potassium'],
  },
}

export default function BloodTestDetailPage() {
  const t = useTranslations('bloodtests')
  const params = useParams()
  const router = useRouter()
  const [test, setTest] = useState<BloodTest | null>(null)
  const [loading, setLoading] = useState(true)
  const [context, setContext] = useState<'feminizing' | 'masculinizing'>('feminizing')

  useEffect(() => {
    async function load() {
      const id = parseInt(params.id as string)
      if (isNaN(id)) {
        router.push('/bloodtests')
        return
      }

      const [testData, profile] = await Promise.all([db.bloodTests.get(id), getUserProfile()])

      if (!testData) {
        router.push('/bloodtests')
        return
      }

      setTest(testData)
      if (profile?.targetGender) {
        setContext(profile.targetGender === 'masculinizing' ? 'masculinizing' : 'feminizing')
      }
      setLoading(false)
    }
    load()
  }, [params.id, router])

  async function handleDelete() {
    if (!test?.id) return
    if (!confirm('Supprimer cette analyse?')) return

    await deleteBloodTest(test.id)
    router.push('/bloodtests')
  }

  // Get status for a marker value
  function getMarkerStatus(marker: BloodMarker, value: number): 'normal' | 'low' | 'high' {
    const range = REFERENCE_RANGES.find((r) => r.marker === marker && r.context === context)
    if (!range) return 'normal'
    if (value < range.min) return 'low'
    if (value > range.max) return 'high'
    return 'normal'
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="pt-2">
          <h1 className="text-foreground text-xl font-bold">Chargement...</h1>
        </div>
      </div>
    )
  }

  if (!test) return null

  // Group results by category
  const resultsByMarker = new Map(test.results.map((r) => [r.marker, r]))

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Link href="/bloodtests">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-foreground text-xl font-bold">
              {format(new Date(test.date), 'dd MMMM yyyy', { locale: fr })}
            </h1>
            {test.lab && (
              <Badge variant="secondary" className="mt-1">
                {test.lab}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link href={`/bloodtests/${params.id}/edit`}>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Pencil className="h-5 w-5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Results by group */}
      {Object.entries(MARKER_GROUPS).map(([groupKey, group]) => {
        const groupResults = group.markers
          .filter((marker) => resultsByMarker.has(marker))
          .map((marker) => ({
            marker,
            result: resultsByMarker.get(marker)!,
          }))

        if (groupResults.length === 0) return null

        const Icon = group.icon

        return (
          <Card key={groupKey}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="text-primary h-4 w-4" />
                {group.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupResults.map(({ marker, result }) => {
                const status = getMarkerStatus(marker, result.value)
                const range = REFERENCE_RANGES.find(
                  (r) => r.marker === marker && r.context === context
                )

                return (
                  <div
                    key={marker}
                    className={`flex items-center justify-between rounded-lg p-3 ${
                      status === 'normal'
                        ? 'bg-muted/30'
                        : status === 'low'
                          ? 'bg-yellow-500/10'
                          : 'bg-red-500/10'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-medium">
                          {t('markers.' + marker)}
                        </span>
                        {status !== 'normal' && (
                          <AlertTriangle
                            className={`h-4 w-4 ${
                              status === 'low' ? 'text-yellow-500' : 'text-red-500'
                            }`}
                          />
                        )}
                        {status === 'normal' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {t('descriptions.' + marker)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-semibold ${
                          status === 'normal'
                            ? 'text-foreground'
                            : status === 'low'
                              ? 'text-yellow-500'
                              : 'text-red-500'
                        }`}
                      >
                        {result.value}{' '}
                        <span className="text-muted-foreground text-sm font-normal">
                          {result.unit}
                        </span>
                      </div>
                      {range && (
                        <p className="text-muted-foreground text-xs">
                          Cible: {range.min} - {range.max}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}

      {/* Notes */}
      {test.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">{test.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 rounded-full p-2">
              <FlaskConical className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-foreground font-medium">
                {test.results.length} marqueur{test.results.length > 1 ? 's' : ''} enregistré
                {test.results.length > 1 ? 's' : ''}
              </p>
              <p className="text-muted-foreground text-sm">
                {test.results.filter((r) => getMarkerStatus(r.marker, r.value) === 'normal').length}{' '}
                dans la plage cible
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
