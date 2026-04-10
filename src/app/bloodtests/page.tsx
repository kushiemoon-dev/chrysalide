'use client'

import { useEffect, useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TestTube, Plus, TrendingUp, List, ChevronRight, Trash2, Pencil } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getBloodTests, deleteBloodTest, getUserProfile } from '@/lib/db'
import type { BloodTest, BloodMarker } from '@/lib/types'
import { BLOOD_MARKERS, REFERENCE_RANGES } from '@/lib/constants'
import { HormoneChart } from '@/components/bloodtests/hormone-chart'
import { ExportButton } from '@/components/ui/export-button'

export default function BloodTestsPage() {
  const t = useTranslations('bloodtests')
  const [tests, setTests] = useState<BloodTest[]>([])
  const [loading, setLoading] = useState(true)
  const [context, setContext] = useState<'feminizing' | 'masculinizing'>('feminizing')
  const [userName, setUserName] = useState<string | undefined>()
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const [testsData, profile] = await Promise.all([getBloodTests(50), getUserProfile()])
      setTests(testsData)
      if (profile?.targetGender) {
        setContext(profile.targetGender === 'masculinizing' ? 'masculinizing' : 'feminizing')
      }
      if (profile?.firstName) {
        setUserName(profile.firstName)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleDelete(id: number) {
    if (!confirm('Supprimer cette analyse?')) return
    await deleteBloodTest(id)
    setTests(tests.filter((t) => t.id !== id))
  }

  // Get status for a marker value
  function getMarkerStatus(marker: BloodMarker, value: number): 'normal' | 'low' | 'high' {
    const range = REFERENCE_RANGES.find((r) => r.marker === marker && r.context === context)
    if (!range) return 'normal'
    if (value < range.min) return 'low'
    if (value > range.max) return 'high'
    return 'normal'
  }

  // Main hormone markers for summary
  const mainHormones: BloodMarker[] =
    context === 'feminizing' ? ['estradiol', 'testosterone'] : ['testosterone', 'estradiol']

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="pt-2">
          <h1 className="text-foreground text-2xl font-bold">Analyses</h1>
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  if (tests.length === 0) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-foreground text-2xl font-bold">Analyses</h1>
            <p className="text-muted-foreground text-sm">Suivi de vos bilans sanguins</p>
          </div>
          <Link href="/bloodtests/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <div className="bg-muted/50 mx-auto mb-4 w-fit rounded-full p-4">
              <TestTube className="text-muted-foreground h-8 w-8" />
            </div>
            <h3 className="text-foreground mb-2 font-medium">Aucune analyse</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Ajoutez vos résultats de bilans sanguins pour suivre votre évolution hormonale
            </p>
            <Link href="/bloodtests/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter une analyse
              </Button>
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
        <div>
          <h1 className="text-foreground text-2xl font-bold">Analyses</h1>
          <p className="text-muted-foreground text-sm">
            {tests.length} bilan{tests.length > 1 ? 's' : ''} enregistré
            {tests.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/bloodtests/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </Link>
      </div>

      {/* Tabs: Charts / List */}
      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="charts" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Graphiques
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-4">
          {/* Main hormones chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {context === 'feminizing'
                    ? 'Hormones (THS féminisant)'
                    : 'Hormones (THS masculinisant)'}
                </CardTitle>
                {tests.length > 0 && (
                  <ExportButton
                    chartRef={chartRef}
                    title="Suivi hormonal"
                    subtitle={context === 'feminizing' ? 'THS féminisant' : 'THS masculinisant'}
                    userName={userName}
                    data={mainHormones
                      .map((marker) => {
                        const lastValue = tests[0]?.results.find((r) => r.marker === marker)
                        const range = REFERENCE_RANGES.find(
                          (r) => r.marker === marker && r.context === context
                        )
                        const markerInfo = BLOOD_MARKERS[marker]
                        if (!lastValue) return null
                        return {
                          marker,
                          label: t('markers.' + marker),
                          value: lastValue.value,
                          unit: markerInfo.unit,
                          targetMin: range?.min,
                          targetMax: range?.max,
                          status: getMarkerStatus(marker, lastValue.value),
                        }
                      })
                      .filter((d): d is NonNullable<typeof d> => d !== null)}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div ref={chartRef}>
                {tests.length >= 1 ? (
                  <HormoneChart
                    tests={tests}
                    markers={mainHormones}
                    context={context}
                    height={280}
                  />
                ) : (
                  <p className="text-muted-foreground py-8 text-center text-sm">
                    Ajoutez au moins une analyse pour voir l&apos;évolution
                  </p>
                )}
              </div>

              {/* Legend with current values */}
              {tests.length > 0 && (
                <div className="border-border mt-4 border-t pt-4">
                  <p className="text-muted-foreground mb-2 text-xs">Dernière analyse</p>
                  <div className="flex flex-wrap gap-4">
                    {mainHormones.map((marker) => {
                      const lastValue = tests[0]?.results.find((r) => r.marker === marker)
                      if (!lastValue) return null

                      const status = getMarkerStatus(marker, lastValue.value)
                      const markerInfo = BLOOD_MARKERS[marker]
                      const range = REFERENCE_RANGES.find(
                        (r) => r.marker === marker && r.context === context
                      )

                      return (
                        <div key={marker} className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor: marker === 'estradiol' ? '#F5A9B8' : '#5BCEFA',
                            }}
                          />
                          <span className="text-sm">
                            {t('markers.' + marker)}:{' '}
                            <span
                              className={
                                status === 'normal'
                                  ? 'text-green-500'
                                  : status === 'low'
                                    ? 'text-yellow-500'
                                    : 'text-red-500'
                              }
                            >
                              {lastValue.value} {markerInfo.unit}
                            </span>
                          </span>
                          {range && (
                            <span className="text-muted-foreground text-xs">
                              (cible: {range.min}-{range.max})
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Secondary markers */}
          {tests.some((t) =>
            t.results.some((r) =>
              ['prolactin', 'hematocrit', 'alt', 'potassium'].includes(r.marker)
            )
          ) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Marqueurs de sécurité</CardTitle>
              </CardHeader>
              <CardContent>
                <HormoneChart
                  tests={tests}
                  markers={['prolactin', 'hematocrit'] as BloodMarker[]}
                  context={context}
                  height={200}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* List Tab */}
        <TabsContent value="list" className="space-y-3">
          {tests.map((test) => (
            <Card key={test.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-foreground font-medium">
                        {format(new Date(test.date), 'dd MMMM yyyy', { locale: fr })}
                      </span>
                      {test.lab && (
                        <Badge variant="secondary" className="text-xs">
                          {test.lab}
                        </Badge>
                      )}
                    </div>

                    {/* Key results */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {test.results.slice(0, 4).map((result) => {
                        const status = getMarkerStatus(result.marker, result.value)

                        return (
                          <span key={result.marker} className="text-sm">
                            <span className="text-muted-foreground">
                              {t('markers.' + result.marker)}:
                            </span>{' '}
                            <span
                              className={
                                status === 'normal'
                                  ? 'text-foreground'
                                  : status === 'low'
                                    ? 'text-yellow-500'
                                    : 'text-red-500'
                              }
                            >
                              {result.value}
                            </span>
                          </span>
                        )
                      })}
                      {test.results.length > 4 && (
                        <span className="text-muted-foreground text-sm">
                          +{test.results.length - 4} autres
                        </span>
                      )}
                    </div>

                    {test.notes && (
                      <p className="text-muted-foreground mt-2 line-clamp-1 text-sm">
                        {test.notes}
                      </p>
                    )}
                  </div>

                  <div className="ml-2 flex items-center gap-1">
                    <Link href={`/bloodtests/${test.id}/edit`}>
                      <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                      onClick={() => test.id && handleDelete(test.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Link href={`/bloodtests/${test.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
