'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Stethoscope,
  FileText,
  Users,
  Activity,
  Heart,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  Pause,
  XCircle,
} from 'lucide-react'
import type { Objective, ObjectiveCategory, ObjectiveStatus } from '@/lib/types'

// Category configuration
export const categoryConfig: Record<
  ObjectiveCategory,
  { label: string; icon: typeof Stethoscope; color: string; bgColor: string }
> = {
  medical: {
    label: 'Médical',
    icon: Stethoscope,
    color: 'text-trans-pink',
    bgColor: 'bg-trans-pink/20',
  },
  administrative: {
    label: 'Administratif',
    icon: FileText,
    color: 'text-trans-blue',
    bgColor: 'bg-trans-blue/20',
  },
  social: {
    label: 'Social',
    icon: Users,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/20',
  },
  physical: {
    label: 'Physique',
    icon: Activity,
    color: 'text-pink-400',
    bgColor: 'bg-pink-400/20',
  },
  mental: {
    label: 'Mental',
    icon: Heart,
    color: 'text-rose-300',
    bgColor: 'bg-rose-300/20',
  },
}

// Status configuration
export const statusConfig: Record<
  ObjectiveStatus,
  { label: string; icon: typeof Clock; color: string; bgColor: string }
> = {
  not_started: {
    label: 'Pas commencé',
    icon: Clock,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  in_progress: {
    label: 'En cours',
    icon: Activity,
    color: 'text-trans-blue',
    bgColor: 'bg-trans-blue/20',
  },
  completed: {
    label: 'Terminé',
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
  },
  paused: {
    label: 'En pause',
    icon: Pause,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
  },
  cancelled: {
    label: 'Annulé',
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
  },
}

interface ObjectiveCardProps {
  objective: Objective
  milestonesCount?: number
  milestonesCompleted?: number
}

export function ObjectiveCard({
  objective,
  milestonesCount = 0,
  milestonesCompleted = 0,
}: ObjectiveCardProps) {
  const category = categoryConfig[objective.category]
  const status = statusConfig[objective.status]
  const CategoryIcon = category.icon
  const StatusIcon = status.icon

  const progress =
    objective.progress ??
    (milestonesCount > 0 ? Math.round((milestonesCompleted / milestonesCount) * 100) : 0)

  return (
    <Link href={`/objectives/${objective.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Category icon */}
            <div className={`rounded-lg p-2 ${category.bgColor} shrink-0`}>
              <CategoryIcon className={`h-5 w-5 ${category.color}`} />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-foreground truncate font-semibold">{objective.title}</h3>
                <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
              </div>

              {objective.description && (
                <p className="text-muted-foreground mb-2 line-clamp-2 text-sm">
                  {objective.description}
                </p>
              )}

              {/* Badges */}
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="outline" className={`${status.bgColor} border-0`}>
                  <StatusIcon className={`mr-1 h-3 w-3 ${status.color}`} />
                  <span className={status.color}>{status.label}</span>
                </Badge>

                <Badge variant="outline" className="text-muted-foreground">
                  {category.label}
                </Badge>
              </div>

              {/* Progress bar */}
              {(objective.status === 'in_progress' || objective.status === 'completed') && (
                <div className="space-y-1">
                  <div className="text-muted-foreground flex justify-between text-xs">
                    <span>{progress}%</span>
                    {milestonesCount > 0 && (
                      <span>
                        {milestonesCompleted}/{milestonesCount} étapes
                      </span>
                    )}
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Target date */}
              {objective.targetDate && objective.status !== 'completed' && (
                <div className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Objectif: {format(new Date(objective.targetDate), 'd MMM yyyy', { locale: fr })}
                  </span>
                </div>
              )}

              {/* Completed date */}
              {objective.completedDate && objective.status === 'completed' && (
                <div className="mt-2 flex items-center gap-1 text-xs text-green-500">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>
                    Terminé le{' '}
                    {format(new Date(objective.completedDate), 'd MMM yyyy', { locale: fr })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// Skeleton for loading state
export function ObjectiveCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-muted h-9 w-9 animate-pulse rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="bg-muted h-5 w-3/4 animate-pulse rounded" />
            <div className="bg-muted h-4 w-full animate-pulse rounded" />
            <div className="flex gap-2">
              <div className="bg-muted h-5 w-20 animate-pulse rounded" />
              <div className="bg-muted h-5 w-16 animate-pulse rounded" />
            </div>
            <div className="bg-muted h-2 w-full animate-pulse rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
