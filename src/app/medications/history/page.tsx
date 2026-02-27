'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  ArrowLeft,
  History,
  Filter,
  Calendar as CalendarIcon,
  Pill,
  TrendingUp,
  Play,
  Square,
  RefreshCw,
} from 'lucide-react'
import { getTreatmentChanges, getMedications } from '@/lib/db'
import type { TreatmentChange, TreatmentChangeType, Medication } from '@/lib/types'
import {
  ChangeEntry,
  ChangeEntrySkeleton,
  changeTypeConfig,
} from '@/components/medications/change-entry'
import { cn } from '@/lib/utils'

type FilterType = 'all' | TreatmentChangeType
type MedicationFilter = 'all' | number

export default function TreatmentHistoryPage() {
  const [changes, setChanges] = useState<TreatmentChange[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [medicationFilter, setMedicationFilter] = useState<MedicationFilter>('all')
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subMonths(new Date(), 6),
    to: new Date(),
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [changesData, medsData] = await Promise.all([
        getTreatmentChanges(undefined, 500),
        getMedications(),
      ])
      setChanges(changesData)
      setMedications(medsData)
    } finally {
      setLoading(false)
    }
  }

  // Filtered changes
  const filteredChanges = useMemo(() => {
    return changes.filter((change) => {
      // Type filter
      if (typeFilter !== 'all' && change.changeType !== typeFilter) {
        return false
      }
      // Medication filter
      if (medicationFilter !== 'all' && change.medicationId !== medicationFilter) {
        return false
      }
      // Date range filter
      const changeDate = new Date(change.date)
      if (changeDate < dateRange.from || changeDate > dateRange.to) {
        return false
      }
      return true
    })
  }, [changes, typeFilter, medicationFilter, dateRange])

  // Stats
  const stats = useMemo(() => {
    const now = new Date()
    const thisMonth = changes.filter((c) => {
      const d = new Date(c.date)
      return d >= startOfMonth(now) && d <= endOfMonth(now)
    })

    const byType = changes.reduce(
      (acc, c) => {
        acc[c.changeType] = (acc[c.changeType] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const uniqueMeds = new Set(changes.map((c) => c.medicationId)).size

    return {
      total: changes.length,
      thisMonth: thisMonth.length,
      uniqueMeds,
      mostCommon: Object.entries(byType).sort((a, b) => b[1] - a[1])[0],
    }
  }, [changes])

  // Group by month for display
  const groupedByMonth = useMemo(() => {
    return filteredChanges.reduce(
      (acc, change) => {
        const monthKey = format(new Date(change.date), 'yyyy-MM')
        if (!acc[monthKey]) {
          acc[monthKey] = []
        }
        acc[monthKey].push(change)
        return acc
      },
      {} as Record<string, TreatmentChange[]>
    )
  }, [filteredChanges])

  const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a))

  // Unique medication names for filter
  const uniqueMedicationNames = useMemo(() => {
    const seen = new Map<number, string>()
    changes.forEach((c) => {
      if (!seen.has(c.medicationId)) {
        seen.set(c.medicationId, c.medicationName)
      }
    })
    return Array.from(seen.entries())
  }, [changes])

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link href="/medications">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-2xl font-bold">Historique des traitements</h1>
          <p className="text-muted-foreground text-sm">Tous les changements de tes médicaments</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 rounded-lg p-2">
                <History className="text-primary h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-muted-foreground text-xs">Total changements</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="bg-trans-blue/10 rounded-lg p-2">
                <CalendarIcon className="text-trans-blue h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.thisMonth}</p>
                <p className="text-muted-foreground text-xs">Ce mois-ci</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="bg-trans-pink/10 rounded-lg p-2">
                <Pill className="text-trans-pink h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.uniqueMeds}</p>
                <p className="text-muted-foreground text-xs">Médicaments suivis</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-purple-500/10 p-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <p className="truncate text-sm font-bold">
                  {stats.mostCommon
                    ? changeTypeConfig[stats.mostCommon[0] as TreatmentChangeType]?.label
                    : '-'}
                </p>
                <p className="text-muted-foreground text-xs">Type le plus fréquent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Type filter */}
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as FilterType)}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.entries(changeTypeConfig).map(([key, config]) => {
                  const Icon = config.icon
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-3 w-3 ${config.color}`} />
                        {config.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>

            {/* Medication filter */}
            <Select
              value={String(medicationFilter)}
              onValueChange={(v) => setMedicationFilter(v === 'all' ? 'all' : Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Médicament" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les médicaments</SelectItem>
                {uniqueMedicationNames.map(([id, name]) => (
                  <SelectItem key={id} value={String(id)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'flex-1 justify-start text-left font-normal',
                    !dateRange.from && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, 'd MMM yyyy', { locale: fr }) : 'Début'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => date && setDateRange((prev) => ({ ...prev, from: date }))}
                  locale={fr}
                  disabled={(date) => date > dateRange.to}
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground self-center">→</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'flex-1 justify-start text-left font-normal',
                    !dateRange.to && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, 'd MMM yyyy', { locale: fr }) : 'Fin'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => date && setDateRange((prev) => ({ ...prev, to: date }))}
                  locale={fr}
                  disabled={(date) => date < dateRange.from}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Quick filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDateRange({
                  from: subMonths(new Date(), 1),
                  to: new Date(),
                })
              }
            >
              Dernier mois
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDateRange({
                  from: subMonths(new Date(), 3),
                  to: new Date(),
                })
              }
            >
              3 mois
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDateRange({
                  from: subMonths(new Date(), 6),
                  to: new Date(),
                })
              }
            >
              6 mois
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDateRange({
                  from: subMonths(new Date(), 12),
                  to: new Date(),
                })
              }
            >
              1 an
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <ChangeEntrySkeleton key={i} />
          ))}
        </div>
      ) : filteredChanges.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="text-muted-foreground/50 mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-medium">Aucun changement trouvé</h3>
            <p className="text-muted-foreground mx-auto max-w-xs text-sm">
              {changes.length === 0
                ? "L'historique de tes traitements apparaîtra ici quand tu modifieras tes médicaments."
                : 'Essaie de modifier les filtres pour voir plus de résultats.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <p className="text-muted-foreground text-sm">
            {filteredChanges.length} changement
            {filteredChanges.length > 1 ? 's' : ''} trouvé
            {filteredChanges.length > 1 ? 's' : ''}
          </p>

          {sortedMonths.map((monthKey) => {
            const monthChanges = groupedByMonth[monthKey]
            const monthDate = new Date(monthKey + '-01')

            return (
              <div key={monthKey} className="space-y-3">
                <h3 className="text-muted-foreground bg-background/95 sticky top-0 -mx-4 px-4 py-2 text-sm font-medium capitalize backdrop-blur-sm">
                  {format(monthDate, 'MMMM yyyy', { locale: fr })}
                  <Badge variant="outline" className="ml-2">
                    {monthChanges.length}
                  </Badge>
                </h3>
                <div className="space-y-2">
                  {monthChanges.map((change) => (
                    <ChangeEntry key={change.id} change={change} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
