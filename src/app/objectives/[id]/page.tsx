'use client'

import { useState, useEffect, use } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getDateLocale } from '@/i18n/date-locale'
import type { Locale } from '@/i18n/config'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Edit, Trash2, Plus, Calendar, CheckCircle2, Target } from 'lucide-react'
import {
  getObjective,
  getMilestones,
  updateObjective,
  deleteObjective,
  addMilestone,
  toggleMilestone,
  deleteMilestone,
  updateMilestone,
  recalculateObjectiveProgress,
} from '@/lib/db'
import type { Objective, Milestone, ObjectiveStatus } from '@/lib/types'
import { categoryConfig, statusConfig } from '@/components/objectives/objective-card'
import { MilestoneItem } from '@/components/objectives/milestone-item'
import { TimelineView } from '@/components/objectives/timeline-view'
import { CelebrationModal, useConfetti } from '@/components/objectives/celebration-modal'

export default function ObjectiveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const t = useTranslations('objectives')
  const locale = useLocale()
  const dateLocale = getDateLocale(locale as Locale)
  const { fire: fireConfetti } = useConfetti()

  const [objective, setObjective] = useState<Objective | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  // Celebration modal
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationTitle, setCelebrationTitle] = useState('')

  // Add milestone
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('')
  const [addingMilestone, setAddingMilestone] = useState(false)

  useEffect(() => {
    loadData()
  }, [resolvedParams.id])

  async function loadData() {
    setLoading(true)
    try {
      const obj = await getObjective(Number(resolvedParams.id))
      if (obj) {
        setObjective(obj)
        const ms = await getMilestones(obj.id!)
        setMilestones(ms)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: ObjectiveStatus) => {
    if (!objective?.id) return

    const updates: Partial<Objective> = { status: newStatus }

    if (newStatus === 'completed') {
      updates.completedDate = new Date()
      updates.progress = 100
    } else if (objective.status === 'completed') {
      // Was completed, now changing to another status - clear completedDate
      updates.completedDate = undefined
    }

    await updateObjective(objective.id, updates)

    // Trigger celebration if completed
    if (newStatus === 'completed') {
      setCelebrationTitle('Objectif atteint !')
      setShowCelebration(true)
    }

    loadData()
  }

  const handleToggleMilestone = async (id: number, achieved: boolean) => {
    if (!objective?.id) return

    await toggleMilestone(id, achieved)
    const newProgress = await recalculateObjectiveProgress(objective.id)

    // If all milestones completed, suggest completing objective
    if (achieved && newProgress === 100 && objective.status !== 'completed') {
      fireConfetti()
      setCelebrationTitle('Toutes les étapes terminées !')
      setShowCelebration(true)

      // Auto-complete objective
      await updateObjective(objective.id, {
        status: 'completed',
        completedDate: new Date(),
        progress: 100,
      })
    } else if (achieved) {
      fireConfetti()
    }

    loadData()
  }

  const handleAddMilestone = async () => {
    if (!objective?.id || !newMilestoneTitle.trim()) return

    setAddingMilestone(true)
    try {
      await addMilestone({
        objectiveId: objective.id,
        title: newMilestoneTitle.trim(),
        achieved: false,
        order: milestones.length,
      })
      await recalculateObjectiveProgress(objective.id)
      setNewMilestoneTitle('')
      loadData()
    } finally {
      setAddingMilestone(false)
    }
  }

  const handleUpdateMilestone = async (id: number, updates: Partial<Milestone>) => {
    await updateMilestone(id, updates)
    loadData()
  }

  const handleDeleteMilestone = async (id: number) => {
    if (!objective?.id) return
    await deleteMilestone(id)
    await recalculateObjectiveProgress(objective.id)
    loadData()
  }

  const handleDelete = async () => {
    if (!objective?.id) return
    setDeleting(true)
    try {
      await deleteObjective(objective.id)
      router.push('/objectives')
    } catch (error) {
      console.error('Failed to delete objective:', error)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 pb-24">
        <div className="flex items-center gap-3 pt-2">
          <div className="bg-muted h-10 w-10 animate-pulse rounded" />
          <div className="flex-1 space-y-2">
            <div className="bg-muted h-6 w-48 animate-pulse rounded" />
            <div className="bg-muted h-4 w-32 animate-pulse rounded" />
          </div>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="bg-muted h-32 animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!objective) {
    return (
      <div className="space-y-6 p-4 pb-24">
        <div className="flex items-center gap-3 pt-2">
          <Link href="/objectives">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Objectif introuvable</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Cet objectif n&apos;existe pas ou a été supprimé.
            </p>
            <Link href="/objectives">
              <Button className="mt-4">Retour aux objectifs</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const category = categoryConfig[objective.category]
  const status = statusConfig[objective.status]
  const CategoryIcon = category.icon
  const StatusIcon = status.icon

  const progress =
    objective.progress ??
    (milestones.length > 0
      ? Math.round((milestones.filter((m) => m.achieved).length / milestones.length) * 100)
      : 0)

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Celebration Modal */}
      <CelebrationModal
        open={showCelebration}
        onOpenChange={setShowCelebration}
        title={celebrationTitle}
        description="Tu progresses vers tes objectifs, bravo !"
      />

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Link href="/objectives">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className={`rounded-lg p-2 ${category.bgColor}`}>
            <CategoryIcon className={`h-5 w-5 ${category.color}`} />
          </div>
          <div>
            <h1 className="text-foreground text-xl font-bold">{objective.title}</h1>
            <Badge variant="outline" className={`${status.bgColor} mt-1 border-0`}>
              <StatusIcon className={`mr-1 h-3 w-3 ${status.color}`} />
              <span className={status.color}>{status.label}</span>
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/objectives/${objective.id}/edit`}>
            <Button variant="outline" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer cet objectif ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action supprimera l&apos;objectif et toutes ses étapes. Cette action est
                  irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? 'Suppression...' : 'Supprimer'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Description & Progress */}
      <Card>
        <CardContent className="space-y-4 p-4">
          {objective.description && (
            <p className="text-muted-foreground">{objective.description}</p>
          )}

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Status selector */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Statut</span>
            <Select
              value={objective.status}
              onValueChange={(v) => handleStatusChange(v as ObjectiveStatus)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Pas commencé</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="paused">En pause</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
            {objective.targetDate && objective.status !== 'completed' && (
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>
                  Cible:{' '}
                  {format(new Date(objective.targetDate), 'd MMM yyyy', {
                    locale: dateLocale,
                  })}
                </span>
              </div>
            )}
            {objective.completedDate && (
              <div className="flex items-center gap-1 text-green-500">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  Terminé le{' '}
                  {format(new Date(objective.completedDate), 'd MMM yyyy', {
                    locale: dateLocale,
                  })}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                Créé le{' '}
                {format(new Date(objective.createdAt), 'd MMM yyyy', {
                  locale: dateLocale,
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Étapes ({milestones.filter((m) => m.achieved).length}/{milestones.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {milestones.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              {t('detail.noMilestones')}
            </p>
          ) : (
            <div className="space-y-2">
              {milestones.map((milestone) => (
                <MilestoneItem
                  key={milestone.id}
                  milestone={milestone}
                  onToggle={handleToggleMilestone}
                  onUpdate={handleUpdateMilestone}
                  onDelete={handleDeleteMilestone}
                />
              ))}
            </div>
          )}

          {/* Add milestone */}
          <div className="flex gap-2 border-t pt-2">
            <Input
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              placeholder="Ajouter une étape..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddMilestone()
                }
              }}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddMilestone}
              disabled={!newMilestoneTitle.trim() || addingMilestone}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline view */}
      {milestones.length > 0 && <TimelineView objective={objective} milestones={milestones} />}
    </div>
  )
}
