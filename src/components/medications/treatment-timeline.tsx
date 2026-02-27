'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History } from 'lucide-react'
import type { TreatmentChange } from '@/lib/types'
import { changeTypeConfig } from './change-entry'

interface TreatmentTimelineProps {
  changes: TreatmentChange[]
  showTitle?: boolean
  maxItems?: number
}

export function TreatmentTimeline({ changes, showTitle = true, maxItems }: TreatmentTimelineProps) {
  const displayedChanges = maxItems ? changes.slice(0, maxItems) : changes

  // Grouper par date
  const groupedByDate = displayedChanges.reduce(
    (acc, change) => {
      const dateKey = format(new Date(change.date), 'yyyy-MM-dd')
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(change)
      return acc
    },
    {} as Record<string, TreatmentChange[]>
  )

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  if (changes.length === 0) {
    return (
      <Card>
        {showTitle && (
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="text-primary h-4 w-4" />
              Historique des traitements
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Aucun changement enregistré pour le moment.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Les modifications de tes médicaments apparaîtront ici.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="text-primary h-4 w-4" />
            Historique des traitements
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="relative">
          {sortedDates.map((dateKey, dateIndex) => {
            const dayChanges = groupedByDate[dateKey]
            const date = new Date(dateKey)
            const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

            return (
              <div key={dateKey} className="relative">
                {/* Date header */}
                <div className="bg-card/95 sticky top-0 z-10 border-b px-4 py-2 backdrop-blur-sm">
                  <time className="text-muted-foreground text-sm font-medium">
                    {isToday ? "Aujourd'hui" : format(date, 'EEEE d MMMM yyyy', { locale: fr })}
                  </time>
                </div>

                {/* Changes for this date */}
                <div className="relative py-2 pr-4 pl-8">
                  {/* Vertical timeline line */}
                  <div className="bg-border absolute top-0 bottom-0 left-6 w-px" />

                  {dayChanges.map((change, changeIndex) => {
                    const config = changeTypeConfig[change.changeType]
                    const Icon = config.icon
                    const isLast =
                      dateIndex === sortedDates.length - 1 && changeIndex === dayChanges.length - 1

                    return (
                      <div
                        key={change.id}
                        className={`relative flex gap-3 ${
                          changeIndex < dayChanges.length - 1 ? 'pb-4' : 'pb-2'
                        }`}
                      >
                        {/* Timeline dot */}
                        <div
                          className={`absolute -left-2 h-4 w-4 rounded-full ${config.bgColor} border-card z-10 flex items-center justify-center border-2`}
                        >
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${config.color.replace('text-', 'bg-')}`}
                          />
                        </div>

                        {/* Content */}
                        <div className="ml-4 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`${config.bgColor} border-0`}>
                                  <Icon className={`mr-1 h-3 w-3 ${config.color}`} />
                                  <span className={config.color}>{config.label}</span>
                                </Badge>
                                <span className="text-sm font-medium">{change.medicationName}</span>
                              </div>

                              {/* Values */}
                              {(change.oldValue || change.newValue) && (
                                <p className="text-muted-foreground text-sm">
                                  {change.oldValue && change.newValue ? (
                                    <>
                                      <span className="line-through">{change.oldValue}</span>
                                      {' → '}
                                      <span className="text-foreground font-medium">
                                        {change.newValue}
                                      </span>
                                    </>
                                  ) : (
                                    change.newValue
                                  )}
                                </p>
                              )}

                              {/* Reason */}
                              {change.reason && (
                                <p className="text-muted-foreground text-sm">{change.reason}</p>
                              )}
                            </div>

                            <time className="text-muted-foreground text-xs whitespace-nowrap">
                              {format(new Date(change.date), 'HH:mm', {
                                locale: fr,
                              })}
                            </time>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Show more indicator */}
        {maxItems && changes.length > maxItems && (
          <div className="border-t px-4 py-3 text-center">
            <span className="text-muted-foreground text-sm">
              +{changes.length - maxItems} autres changements
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Version compacte pour le dashboard ou les détails médicament
export function TreatmentTimelineCompact({
  changes,
  maxItems = 3,
}: {
  changes: TreatmentChange[]
  maxItems?: number
}) {
  const displayedChanges = changes.slice(0, maxItems)

  if (changes.length === 0) {
    return <p className="text-muted-foreground py-4 text-center text-sm">Aucun historique</p>
  }

  return (
    <div className="space-y-2">
      {displayedChanges.map((change) => {
        const config = changeTypeConfig[change.changeType]
        const Icon = config.icon

        return (
          <div key={change.id} className="flex items-center gap-2 text-sm">
            <Icon className={`h-3.5 w-3.5 ${config.color}`} />
            <span className="truncate font-medium">{change.medicationName}</span>
            <span className="text-muted-foreground">-</span>
            <span className={`${config.color} shrink-0`}>{config.label}</span>
            <span className="text-muted-foreground ml-auto shrink-0 text-xs">
              {format(new Date(change.date), 'd MMM', { locale: fr })}
            </span>
          </div>
        )
      })}
      {changes.length > maxItems && (
        <p className="text-muted-foreground pt-1 text-center text-xs">
          +{changes.length - maxItems} autres
        </p>
      )}
    </div>
  )
}

// Skeleton
export function TreatmentTimelineSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="bg-muted h-5 w-48 animate-pulse rounded" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex animate-pulse gap-3">
            <div className="bg-muted h-4 w-4 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="bg-muted h-4 w-32 rounded" />
              <div className="bg-muted h-3 w-24 rounded" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
