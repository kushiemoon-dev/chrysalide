'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Save,
  Calendar as CalendarIcon,
  Target,
  Plus,
  X,
  FileText,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { addObjective, addMilestone, getUserProfile } from '@/lib/db'
import type { ObjectiveCategory, ObjectiveStatus, UserProfile } from '@/lib/types'
import { categoryConfig } from '@/components/objectives/objective-card'
import { cn } from '@/lib/utils'
import {
  getTemplatesForContext,
  ALL_OBJECTIVE_TEMPLATES,
  type ObjectiveTemplate,
} from '@/lib/constants'

interface MilestoneInput {
  title: string
  date?: Date
}

export default function NewObjectivePage() {
  const router = useRouter()
  const t = useTranslations('objectives')
  const [saving, setSaving] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState<'template' | 'custom'>('template')

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ObjectiveCategory>('medical')
  const [status, setStatus] = useState<ObjectiveStatus>('not_started')
  const [targetDate, setTargetDate] = useState<Date | undefined>()
  const [milestones, setMilestones] = useState<MilestoneInput[]>([])
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('')

  // Load user profile for context-aware templates
  useEffect(() => {
    async function loadProfile() {
      const profile = await getUserProfile()
      setUserProfile(profile)
    }
    loadProfile()
  }, [])

  // Get templates based on user context
  const templates = userProfile?.targetGender
    ? getTemplatesForContext(userProfile.targetGender)
    : ALL_OBJECTIVE_TEMPLATES

  // Apply template
  const applyTemplate = (template: ObjectiveTemplate) => {
    setTitle(template.title)
    setDescription(template.description)
    setCategory(template.category)
    setStatus('not_started')
    setMilestones(template.milestones.map((m) => ({ title: m })))
    setActiveTab('custom') // Switch to form to customize
  }

  const handleAddMilestone = () => {
    if (!newMilestoneTitle.trim()) return
    setMilestones([...milestones, { title: newMilestoneTitle.trim() }])
    setNewMilestoneTitle('')
  }

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSaving(true)
    try {
      // Create objective
      const objectiveId = await addObjective({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        status,
        targetDate,
        progress: 0,
      })

      // Create milestones
      for (let i = 0; i < milestones.length; i++) {
        await addMilestone({
          objectiveId: objectiveId as number,
          title: milestones[i].title,
          date: milestones[i].date,
          achieved: false,
          order: i,
        })
      }

      router.push(`/objectives/${objectiveId}`)
    } catch (error) {
      console.error('Failed to create objective:', error)
      setSaving(false)
    }
  }

  const isValid = title.trim().length > 0

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link href="/objectives">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t('newObjective.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('newObjective.subtitle')}</p>
        </div>
      </div>

      {/* Tabs: Template or Custom */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'template' | 'custom')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="template" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Modèles
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-2">
            <FileText className="h-4 w-4" />
            Personnalisé
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="template" className="mt-4 space-y-4">
          <p className="text-muted-foreground text-sm">
            Choisis un modèle pré-configuré pour démarrer rapidement
          </p>

          {/* Group templates by context */}
          {userProfile?.targetGender !== 'masculinizing' && (
            <div className="space-y-2">
              <h3 className="text-trans-pink flex items-center gap-2 text-sm font-medium">
                Parcours féminisant
              </h3>
              <div className="grid gap-2">
                {templates
                  .filter((t) => t.context === 'feminizing')
                  .map((template) => (
                    <TemplateCard key={template.id} template={template} onSelect={applyTemplate} />
                  ))}
              </div>
            </div>
          )}

          {userProfile?.targetGender !== 'feminizing' && (
            <div className="space-y-2">
              <h3 className="text-trans-blue flex items-center gap-2 text-sm font-medium">
                Parcours masculinisant
              </h3>
              <div className="grid gap-2">
                {templates
                  .filter((t) => t.context === 'masculinizing')
                  .map((template) => (
                    <TemplateCard key={template.id} template={template} onSelect={applyTemplate} />
                  ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              Parcours commun
            </h3>
            <div className="grid gap-2">
              {templates
                .filter((t) => t.context === 'common')
                .map((template) => (
                  <TemplateCard key={template.id} template={template} onSelect={applyTemplate} />
                ))}
            </div>
          </div>
        </TabsContent>

        {/* Custom Tab - Original Form */}
        <TabsContent value="custom" className="mt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Main info */}
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Commencer le THS"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Détails sur cet objectif..."
                    className="min-h-[100px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Category & Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="text-primary h-4 w-4" />
                  Catégorie & Statut
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select
                    value={category}
                    onValueChange={(v) => setCategory(v as ObjectiveCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([key, config]) => {
                        const Icon = config.icon
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${config.color}`} />
                              {config.label}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Statut initial</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as ObjectiveStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Pas commencé</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date cible (optionnel)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !targetDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {targetDate
                          ? format(targetDate, 'd MMMM yyyy', { locale: fr })
                          : 'Sélectionner une date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={targetDate}
                        onSelect={setTargetDate}
                        locale={fr}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Étapes (optionnel)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Décompose ton objectif en étapes pour suivre ta progression
                </p>

                {/* Existing milestones */}
                {milestones.length > 0 && (
                  <div className="space-y-2">
                    {milestones.map((milestone, index) => (
                      <div
                        key={index}
                        className="bg-muted/50 flex items-center gap-2 rounded-lg p-2"
                      >
                        <span className="bg-primary/20 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs">
                          {index + 1}
                        </span>
                        <span className="flex-1 text-sm">{milestone.title}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRemoveMilestone(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add milestone input */}
                <div className="flex gap-2">
                  <Input
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    placeholder="Nouvelle étape..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddMilestone()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddMilestone}
                    disabled={!newMilestoneTitle.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-3">
              <Link href="/objectives" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Annuler
                </Button>
              </Link>
              <Button type="submit" className="flex-1 gap-2" disabled={!isValid || saving}>
                <Save className="h-4 w-4" />
                {saving ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Template Card Component
function TemplateCard({
  template,
  onSelect,
}: {
  template: ObjectiveTemplate
  onSelect: (t: ObjectiveTemplate) => void
}) {
  const categoryInfo = categoryConfig[template.category]
  const CategoryIcon = categoryInfo.icon

  return (
    <Card
      className="hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => onSelect(template)}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className={`rounded-lg p-2 ${categoryInfo.bgColor} shrink-0`}>
            <CategoryIcon className={`h-4 w-4 ${categoryInfo.color}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-foreground text-sm font-medium">{template.title}</h4>
              {template.estimatedDuration && (
                <Badge variant="outline" className="text-xs">
                  {template.estimatedDuration}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
              {template.description}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {template.milestones.length} étapes prédéfinies
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
