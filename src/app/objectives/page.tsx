'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Target, Plus, Filter, CheckCircle2, Clock, Activity, Trophy } from 'lucide-react'
import { getObjectives, getMilestones } from '@/lib/db'
import type { Objective, Milestone, ObjectiveCategory, ObjectiveStatus } from '@/lib/types'
import {
  ObjectiveCard,
  ObjectiveCardSkeleton,
  categoryConfig,
} from '@/components/objectives/objective-card'
import { BlahajProgress } from '@/components/objectives/blahaj-progress'
import { getUserProfile } from '@/lib/db'
import type { UserProfile } from '@/lib/types'

type FilterStatus = 'all' | ObjectiveStatus
type FilterCategory = 'all' | ObjectiveCategory

interface ObjectiveWithMilestones extends Objective {
  milestones: Milestone[]
}

export default function ObjectivesPage() {
  const t = useTranslations('objectives')
  const [objectives, setObjectives] = useState<ObjectiveWithMilestones[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    loadObjectives()
    loadUserProfile()
  }, [])

  async function loadUserProfile() {
    const profile = await getUserProfile()
    setUserProfile(profile)
  }

  async function loadObjectives() {
    setLoading(true)
    try {
      const data = await getObjectives()

      // Load milestones for each objective
      const withMilestones = await Promise.all(
        data.map(async (obj) => {
          const milestones = obj.id ? await getMilestones(obj.id) : []
          return { ...obj, milestones }
        })
      )

      // Sort by: in_progress first, then by updatedAt
      withMilestones.sort((a, b) => {
        // Priority order: in_progress > not_started > paused > completed > cancelled
        const statusOrder: Record<ObjectiveStatus, number> = {
          in_progress: 0,
          not_started: 1,
          paused: 2,
          completed: 3,
          cancelled: 4,
        }
        const statusDiff = statusOrder[a.status] - statusOrder[b.status]
        if (statusDiff !== 0) return statusDiff

        // Then by updatedAt
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })

      setObjectives(withMilestones)
    } finally {
      setLoading(false)
    }
  }

  // Filter objectives
  const filteredObjectives = objectives.filter((obj) => {
    if (statusFilter !== 'all' && obj.status !== statusFilter) return false
    if (categoryFilter !== 'all' && obj.category !== categoryFilter) return false
    return true
  })

  // Stats
  const stats = {
    total: objectives.length,
    inProgress: objectives.filter((o) => o.status === 'in_progress').length,
    completed: objectives.filter((o) => o.status === 'completed').length,
    milestonesTotal: objectives.reduce((sum, o) => sum + o.milestones.length, 0),
    milestonesCompleted: objectives.reduce(
      (sum, o) => sum + o.milestones.filter((m) => m.achieved).length,
      0
    ),
  }

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold">
            <Target className="text-trans-pink h-6 w-6" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </div>
        <Link href="/objectives/new">
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            {t('new')}
          </Button>
        </Link>
      </div>

      {/* BLAHAJ Progress Global */}
      {stats.milestonesTotal > 0 && (
        <Card className="from-trans-pink/10 to-trans-blue/10 bg-gradient-to-br via-white/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                  {t('globalProgress')}
                </h3>
                <p className="text-foreground text-lg font-bold">
                  {stats.milestonesCompleted}/{stats.milestonesTotal} {t('steps')}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {stats.inProgress} {stats.inProgress > 1 ? t('objectives') : t('objective')}{' '}
                  {t('inProgress')}
                </p>
              </div>
              <BlahajProgress
                progress={Math.round((stats.milestonesCompleted / stats.milestonesTotal) * 100)}
                context={
                  userProfile?.targetGender === 'masculinizing' ? 'masculinizing' : 'feminizing'
                }
                size="lg"
                showPercentage={true}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-trans-blue/20 rounded-lg p-2">
                <Activity className="text-trans-blue h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-muted-foreground text-xs">En cours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/20 p-2">
                <Trophy className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-muted-foreground text-xs">Terminés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Status filter */}
            <div className="flex-1">
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as FilterStatus)}
              >
                <SelectTrigger className="w-full">
                  <Filter className="text-muted-foreground mr-2 h-4 w-4" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('list.allStatuses')}</SelectItem>
                  <SelectItem value="not_started">Pas commencé</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="paused">En pause</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category filter */}
            <div className="flex-1">
              <Select
                value={categoryFilter}
                onValueChange={(v) => setCategoryFilter(v as FilterCategory)}
              >
                <SelectTrigger className="w-full">
                  <Target className="text-muted-foreground mr-2 h-4 w-4" />
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('list.allCategories')}</SelectItem>
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Objectives list */}
      <div className="space-y-3">
        {loading ? (
          <>
            <ObjectiveCardSkeleton />
            <ObjectiveCardSkeleton />
            <ObjectiveCardSkeleton />
          </>
        ) : filteredObjectives.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              {objectives.length === 0 ? (
                <>
                  <Target className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                  <h3 className="text-foreground mb-2 font-semibold">{t('list.empty')}</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Commence par créer ton premier objectif de transition
                  </p>
                  <Link href="/objectives/new">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Créer un objectif
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Filter className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                  <h3 className="text-foreground mb-2 font-semibold">{t('list.noResults')}</h3>
                  <p className="text-muted-foreground text-sm">
                    Aucun objectif ne correspond à ces filtres
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredObjectives.map((objective) => (
            <ObjectiveCard
              key={objective.id}
              objective={objective}
              milestonesCount={objective.milestones.length}
              milestonesCompleted={objective.milestones.filter((m) => m.achieved).length}
            />
          ))
        )}
      </div>

      {/* Quick category shortcuts */}
      {!loading && objectives.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm">Par catégorie</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryConfig).map(([key, config]) => {
                const count = objectives.filter((o) => o.category === key).length
                if (count === 0) return null
                const Icon = config.icon
                return (
                  <Badge
                    key={key}
                    variant="outline"
                    className={`cursor-pointer ${config.bgColor} border-0`}
                    onClick={() =>
                      setCategoryFilter(categoryFilter === key ? 'all' : (key as FilterCategory))
                    }
                  >
                    <Icon className={`mr-1 h-3 w-3 ${config.color}`} />
                    <span className={config.color}>
                      {config.label} ({count})
                    </span>
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
