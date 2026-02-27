'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  Plus,
  Camera,
  Ruler,
  ChevronRight,
  ImageIcon,
  ArrowLeftRight,
} from 'lucide-react'
import Link from 'next/link'
import { getPhysicalProgress, getUserProfile } from '@/lib/db'
import type { PhysicalProgress, Measurements } from '@/lib/types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ExportButton } from '@/components/ui/export-button'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

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

export default function ProgressPage() {
  const [entries, setEntries] = useState<PhysicalProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string | undefined>()
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadData() {
      const [data, profile] = await Promise.all([getPhysicalProgress(50), getUserProfile()])
      setEntries(data)
      if (profile?.firstName) {
        setUserName(profile.firstName)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  // Prepare chart data (reverse for chronological order)
  const chartData = [...entries].reverse().map((entry) => ({
    date: format(new Date(entry.date), 'd MMM', { locale: fr }),
    fullDate: format(new Date(entry.date), 'd MMMM yyyy', { locale: fr }),
    ...entry.measurements,
  }))

  // Get available measurements (ones that have at least one data point)
  const availableMeasurements = Object.keys(MEASUREMENT_LABELS).filter((key) =>
    entries.some((e) => e.measurements?.[key as keyof Measurements] !== undefined)
  ) as (keyof Measurements)[]

  // Stats
  const entriesWithPhotos = entries.filter((e) => e.photos && e.photos.length > 0).length
  const totalPhotos = entries.reduce((acc, e) => acc + (e.photos?.length || 0), 0)

  // Get first and last measurements for comparison
  const firstEntry = [...entries].reverse()[0]
  const lastEntry = entries[0]

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Évolution</h1>
          <p className="text-muted-foreground text-sm">
            {entries.length} entrée{entries.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/progress/compare">
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/progress/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </Link>
        </div>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="bg-muted/50 mx-auto mb-4 w-fit rounded-full p-4">
              <TrendingUp className="text-muted-foreground h-8 w-8" />
            </div>
            <h3 className="text-foreground mb-2 font-medium">Aucune entrée</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Documentez votre évolution physique avec photos et mensurations
            </p>
            <Link href="/progress/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter une entrée
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="graphs">Graphiques</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
          </TabsList>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-primary text-2xl font-bold">{entries.length}</p>
                  <p className="text-muted-foreground text-xs">Entrées</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-foreground text-2xl font-bold">{totalPhotos}</p>
                  <p className="text-muted-foreground text-xs">Photos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-foreground text-2xl font-bold">
                    {firstEntry && lastEntry && firstEntry !== lastEntry
                      ? Math.floor(
                          (new Date(lastEntry.date).getTime() -
                            new Date(firstEntry.date).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      : 0}
                  </p>
                  <p className="text-muted-foreground text-xs">Jours</p>
                </CardContent>
              </Card>
            </div>

            {/* Entries List */}
            <div className="space-y-3">
              {entries.map((entry) => (
                <Link key={entry.id} href={`/progress/${entry.id}`}>
                  <Card className="hover:bg-muted/30 overflow-hidden transition-colors">
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        {/* Thumbnail */}
                        {entry.photos && entry.photos.length > 0 ? (
                          <div className="h-20 w-20 flex-shrink-0">
                            <img
                              src={entry.photos[0]}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="bg-muted flex h-20 w-20 flex-shrink-0 items-center justify-center">
                            <Ruler className="text-muted-foreground h-6 w-6" />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex flex-1 items-center justify-between p-3">
                          <div className="space-y-1">
                            <p className="text-foreground font-medium">
                              {format(new Date(entry.date), 'd MMMM yyyy', { locale: fr })}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {entry.photos && entry.photos.length > 0 && (
                                <Badge variant="outline" className="gap-1 text-xs">
                                  <Camera className="h-3 w-3" />
                                  {entry.photos.length}
                                </Badge>
                              )}
                              {entry.measurements && Object.keys(entry.measurements).length > 0 && (
                                <Badge variant="outline" className="gap-1 text-xs">
                                  <Ruler className="h-3 w-3" />
                                  {Object.keys(entry.measurements).length}
                                </Badge>
                              )}
                              {entry.tags?.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <ChevronRight className="text-muted-foreground h-5 w-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          {/* Graphs Tab */}
          <TabsContent value="graphs" className="space-y-4">
            {availableMeasurements.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Aucune mensuration enregistrée</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Body Measurements Chart */}
                {availableMeasurements.filter((m) =>
                  ['chest', 'underbust', 'waist', 'hips'].includes(m)
                ).length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Mensurations corporelles</CardTitle>
                        <ExportButton
                          chartRef={chartRef}
                          title="Évolution corporelle"
                          subtitle="Mensurations"
                          userName={userName}
                          data={availableMeasurements
                            .filter((m) => ['chest', 'underbust', 'waist', 'hips'].includes(m))
                            .map((key) => {
                              const last = lastEntry?.measurements?.[key]
                              if (last === undefined) return null
                              return {
                                marker: key,
                                label: MEASUREMENT_LABELS[key],
                                value: last,
                                unit: MEASUREMENT_UNITS[key],
                              }
                            })
                            .filter((d): d is NonNullable<typeof d> => d !== null)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div ref={chartRef} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis
                              dataKey="date"
                              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                              tickLine={{ stroke: 'var(--border)' }}
                            />
                            <YAxis
                              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                              tickLine={{ stroke: 'var(--border)' }}
                              domain={['auto', 'auto']}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'var(--card)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                              }}
                            />
                            <Legend />
                            {availableMeasurements.includes('chest') && (
                              <Line
                                type="monotone"
                                dataKey="chest"
                                name="Poitrine"
                                stroke="#F5A9B8"
                                strokeWidth={2}
                                dot={{ fill: '#F5A9B8' }}
                              />
                            )}
                            {availableMeasurements.includes('underbust') && (
                              <Line
                                type="monotone"
                                dataKey="underbust"
                                name="Sous-poitrine"
                                stroke="#D4849A"
                                strokeWidth={2}
                                dot={{ fill: '#D4849A' }}
                              />
                            )}
                            {availableMeasurements.includes('waist') && (
                              <Line
                                type="monotone"
                                dataKey="waist"
                                name="Taille"
                                stroke="#5BCEFA"
                                strokeWidth={2}
                                dot={{ fill: '#5BCEFA' }}
                              />
                            )}
                            {availableMeasurements.includes('hips') && (
                              <Line
                                type="monotone"
                                dataKey="hips"
                                name="Hanches"
                                stroke="#3BA8D4"
                                strokeWidth={2}
                                dot={{ fill: '#3BA8D4' }}
                              />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Weight Chart */}
                {availableMeasurements.includes('weight') && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Poids</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis
                              dataKey="date"
                              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                            />
                            <YAxis
                              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                              domain={['auto', 'auto']}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'var(--card)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                              }}
                              formatter={(value) => [`${value} kg`, 'Poids']}
                            />
                            <Line
                              type="monotone"
                              dataKey="weight"
                              stroke="#9333EA"
                              strokeWidth={2}
                              dot={{ fill: '#9333EA' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Comparison Card */}
                {firstEntry && lastEntry && firstEntry.id !== lastEntry.id && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Évolution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {availableMeasurements.map((key) => {
                          const first = firstEntry.measurements?.[key]
                          const last = lastEntry.measurements?.[key]
                          if (first === undefined || last === undefined) return null

                          const diff = last - first
                          const sign = diff > 0 ? '+' : ''

                          return (
                            <div key={key} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {MEASUREMENT_LABELS[key]}
                              </span>
                              <div className="flex items-center gap-2">
                                <span>
                                  {first} → {last} {MEASUREMENT_UNITS[key]}
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
              </>
            )}
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-4">
            {entriesWithPhotos === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="bg-muted/50 mx-auto mb-4 w-fit rounded-full p-4">
                    <ImageIcon className="text-muted-foreground h-8 w-8" />
                  </div>
                  <p className="text-muted-foreground">Aucune photo enregistrée</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {entries.flatMap((entry) =>
                  (entry.photos || []).map((photo, idx) => (
                    <Link
                      key={`${entry.id}-${idx}`}
                      href={`/progress/${entry.id}`}
                      className="bg-muted aspect-square overflow-hidden rounded-lg"
                    >
                      <img
                        src={photo}
                        alt=""
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </Link>
                  ))
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
