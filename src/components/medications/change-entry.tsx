'use client'

import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  TrendingUp,
  Repeat,
  Clock,
  Pill,
  User,
  FileText,
} from 'lucide-react'
import type { TreatmentChange, TreatmentChangeType } from '@/lib/types'

// Configuration des types de changements (sans labels - utiliser les traductions)
export const changeTypeConfig: Record<
  TreatmentChangeType,
  {
    icon: typeof Play
    color: string
    bgColor: string
  }
> = {
  started: {
    icon: Play,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  stopped: {
    icon: Square,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  paused: {
    icon: Pause,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  resumed: {
    icon: RefreshCw,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  dosage_change: {
    icon: TrendingUp,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  method_change: {
    icon: Repeat,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  frequency_change: {
    icon: Clock,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
}

interface ChangeEntryProps {
  change: TreatmentChange
  showMedicationName?: boolean
}

export function ChangeEntry({ change, showMedicationName = true }: ChangeEntryProps) {
  const t = useTranslations('objectives')
  const config = changeTypeConfig[change.changeType]
  const Icon = config.icon
  const label = t(`changeTypes.${change.changeType}`)

  return (
    <div className="bg-card flex gap-3 rounded-lg border p-3">
      {/* Icon */}
      <div className={`shrink-0 rounded-lg p-2 ${config.bgColor}`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge variant="outline" className={`${config.bgColor} border-0`}>
              <span className={config.color}>{label}</span>
            </Badge>
            {showMedicationName && (
              <div className="mt-1 flex items-center gap-1 text-sm font-medium">
                <Pill className="text-muted-foreground h-3 w-3" />
                {change.medicationName}
              </div>
            )}
          </div>
          <time className="text-muted-foreground text-xs whitespace-nowrap">
            {format(new Date(change.date), 'd MMM yyyy', { locale: fr })}
          </time>
        </div>

        {/* Values change */}
        {(change.oldValue || change.newValue) && (
          <div className="text-sm">
            {change.oldValue && change.newValue ? (
              <span>
                <span className="text-muted-foreground line-through">{change.oldValue}</span>
                {' → '}
                <span className="text-foreground font-medium">{change.newValue}</span>
              </span>
            ) : change.newValue ? (
              <span className="font-medium">{change.newValue}</span>
            ) : null}
          </div>
        )}

        {/* Reason */}
        {change.reason && <p className="text-muted-foreground text-sm">{change.reason}</p>}

        {/* Prescriber */}
        {change.prescribedBy && (
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <User className="h-3 w-3" />
            <span>Prescrit par {change.prescribedBy}</span>
          </div>
        )}

        {/* Notes */}
        {change.notes && (
          <div className="text-muted-foreground bg-muted/50 mt-2 flex items-start gap-1 rounded p-2 text-xs">
            <FileText className="mt-0.5 h-3 w-3 shrink-0" />
            <span>{change.notes}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Version compacte pour timeline
export function ChangeEntryCompact({ change }: { change: TreatmentChange }) {
  const t = useTranslations('objectives')
  const config = changeTypeConfig[change.changeType]
  const Icon = config.icon
  const label = t(`changeTypes.${change.changeType}`)

  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className={`h-3.5 w-3.5 ${config.color}`} />
      <span className="font-medium">{change.medicationName}</span>
      <span className="text-muted-foreground">-</span>
      <span className={config.color}>{label}</span>
      {change.oldValue && change.newValue && (
        <span className="text-muted-foreground">
          ({change.oldValue} → {change.newValue})
        </span>
      )}
    </div>
  )
}

// Skeleton de chargement
export function ChangeEntrySkeleton() {
  return (
    <div className="bg-card flex animate-pulse gap-3 rounded-lg border p-3">
      <div className="bg-muted h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="bg-muted h-5 w-24 rounded" />
        <div className="bg-muted h-4 w-32 rounded" />
      </div>
    </div>
  )
}
