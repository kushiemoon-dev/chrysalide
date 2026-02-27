'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Target, Flag, Calendar } from 'lucide-react'
import type { Objective, Milestone } from '@/lib/types'
import { categoryConfig, statusConfig } from './objective-card'
import { cn } from '@/lib/utils'

interface TimelineEvent {
  type: 'start' | 'milestone' | 'target' | 'completed'
  date: Date
  title: string
  achieved?: boolean
  objectiveId?: number
  milestoneId?: number
}

interface TimelineViewProps {
  objective: Objective
  milestones: Milestone[]
  showObjectiveInfo?: boolean
}

export function TimelineView({
  objective,
  milestones,
  showObjectiveInfo = false,
}: TimelineViewProps) {
  // Build timeline events
  const events: TimelineEvent[] = []

  // Start event
  events.push({
    type: 'start',
    date: new Date(objective.createdAt),
    title: 'Objectif créé',
  })

  // Milestone events
  milestones.forEach((milestone) => {
    if (milestone.date || milestone.achievedDate) {
      events.push({
        type: 'milestone',
        date: new Date(milestone.achievedDate || milestone.date!),
        title: milestone.title,
        achieved: milestone.achieved,
        milestoneId: milestone.id,
      })
    }
  })

  // Target date event
  if (objective.targetDate && objective.status !== 'completed') {
    events.push({
      type: 'target',
      date: new Date(objective.targetDate),
      title: 'Date cible',
    })
  }

  // Completion event
  if (objective.completedDate) {
    events.push({
      type: 'completed',
      date: new Date(objective.completedDate),
      title: 'Objectif atteint !',
    })
  }

  // Sort by date
  events.sort((a, b) => a.date.getTime() - b.date.getTime())

  const getEventIcon = (event: TimelineEvent) => {
    switch (event.type) {
      case 'start':
        return <Flag className="h-4 w-4" />
      case 'milestone':
        return event.achieved ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Circle className="h-4 w-4" />
        )
      case 'target':
        return <Target className="h-4 w-4" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />
      default:
        return <Circle className="h-4 w-4" />
    }
  }

  const getEventColor = (event: TimelineEvent) => {
    switch (event.type) {
      case 'start':
        return 'bg-trans-blue text-white'
      case 'milestone':
        return event.achieved
          ? 'bg-green-500 text-white'
          : 'bg-muted border-2 border-muted-foreground/30'
      case 'target':
        return 'bg-trans-pink text-white'
      case 'completed':
        return 'bg-gradient-to-br from-trans-blue via-white to-trans-pink text-primary'
      default:
        return 'bg-muted'
    }
  }

  const getLineColor = (event: TimelineEvent, index: number) => {
    const nextEvent = events[index + 1]
    if (!nextEvent) return 'bg-transparent'

    // If both current and next are achieved/past
    if (
      event.type === 'start' ||
      event.type === 'completed' ||
      (event.type === 'milestone' && event.achieved)
    ) {
      return nextEvent.type === 'milestone' && !nextEvent.achieved
        ? 'bg-gradient-to-b from-green-500/50 to-muted-foreground/20'
        : 'bg-green-500/50'
    }

    return 'bg-muted-foreground/20'
  }

  const category = categoryConfig[objective.category]
  const status = statusConfig[objective.status]
  const CategoryIcon = category.icon

  return (
    <Card>
      {showObjectiveInfo && (
        <CardHeader className="pb-4">
          <div className="flex items-start gap-3">
            <div className={`rounded-lg p-2 ${category.bgColor}`}>
              <CategoryIcon className={`h-5 w-5 ${category.color}`} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{objective.title}</CardTitle>
              {objective.description && (
                <p className="text-muted-foreground mt-1 text-sm">{objective.description}</p>
              )}
              <Badge variant="outline" className={`mt-2 ${status.bgColor} border-0`}>
                <status.icon className={`mr-1 h-3 w-3 ${status.color}`} />
                <span className={status.color}>{status.label}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className={showObjectiveInfo ? 'pt-0' : ''}>
        <div className="space-y-0">
          {events.map((event, index) => (
            <div key={`${event.type}-${index}`} className="flex gap-3">
              {/* Timeline node and line */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    getEventColor(event)
                  )}
                >
                  {getEventIcon(event)}
                </div>
                {index < events.length - 1 && (
                  <div className={cn('min-h-12 w-0.5 flex-1', getLineColor(event, index))} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1 pb-8">
                <p
                  className={cn(
                    'font-medium',
                    event.type === 'completed' && 'text-green-500',
                    event.type === 'milestone' && event.achieved && 'text-green-500',
                    event.type === 'milestone' && !event.achieved && 'text-muted-foreground'
                  )}
                >
                  {event.title}
                </p>
                <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  {format(event.date, 'd MMMM yyyy', { locale: fr })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Compact timeline for objective list
export function CompactTimeline({
  milestones,
  maxItems = 4,
}: {
  milestones: Milestone[]
  maxItems?: number
}) {
  const sortedMilestones = [...milestones].sort((a, b) => a.order - b.order).slice(0, maxItems)

  return (
    <div className="flex items-center gap-1">
      {sortedMilestones.map((milestone, index) => (
        <div key={milestone.id} className="flex items-center">
          <div
            className={cn(
              'h-3 w-3 rounded-full',
              milestone.achieved ? 'bg-green-500' : 'bg-muted border-muted-foreground/30 border'
            )}
          />
          {index < sortedMilestones.length - 1 && (
            <div
              className={cn(
                'h-0.5 w-4',
                milestone.achieved ? 'bg-green-500/50' : 'bg-muted-foreground/20'
              )}
            />
          )}
        </div>
      ))}
      {milestones.length > maxItems && (
        <span className="text-muted-foreground ml-1 text-xs">+{milestones.length - maxItems}</span>
      )}
    </div>
  )
}
