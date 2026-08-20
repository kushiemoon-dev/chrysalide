'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { getDateLocale } from '@/i18n/date-locale'
import type { Locale } from '@/i18n/config'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, FileText, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { addObjective, addMilestone, getUserProfile } from '@/lib/db'
import type { ObjectiveCategory, ObjectiveStatus, UserProfile, ActCategory } from '@/lib/types'
import { categoryConfig } from '@/components/objectives/objective-card'
import {
  getTemplatesForContext,
  ALL_OBJECTIVE_TEMPLATES,
  type ObjectiveTemplate,
} from '@/lib/objective-templates'
import { ObjectiveFormCore, type MilestoneInput } from '@/components/objectives/ObjectiveFormCore'

export default function NewObjectivePage() {
  const router = useRouter()
  const t = useTranslations('objectives')
  const locale = useLocale()
  const dateLocale = getDateLocale(locale as Locale)
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
  const [actCategory, setActCategory] = useState<ActCategory | undefined>(undefined)
  const [information, setInformation] = useState('')

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
    setTitle(t(`templates.${template.id}.title`))
    setDescription(t(`templates.${template.id}.description`))
    setCategory(template.category)
    setStatus('not_started')
    setMilestones(
      (t.raw(`templates.${template.id}.milestones`) as string[]).map((m) => ({ title: m }))
    )
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
        actCategory: category === 'medical' ? actCategory : undefined,
        information: category === 'medical' ? information.trim() || undefined : undefined,
        source: 'objective',
      })

      // Create milestones
      for (let i = 0; i < milestones.length; i++) {
        await addMilestone({
          objectiveId: objectiveId as number,
          title: milestones[i]!.title,
          date: milestones[i]!.date,
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
            {t('newObjective.tabTemplates')}
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-2">
            <FileText className="h-4 w-4" />
            {t('newObjective.tabCustom')}
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="template" className="mt-4 space-y-4">
          <p className="text-muted-foreground text-sm">{t('newObjective.templateHint')}</p>

          {/* Group templates by context */}
          {userProfile?.targetGender !== 'masculinizing' && (
            <div className="space-y-2">
              <h3 className="text-trans-pink flex items-center gap-2 text-sm font-medium">
                {t('newObjective.feminizingPath')}
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
                {t('newObjective.masculinizingPath')}
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
              {t('newObjective.commonPath')}
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

        {/* Custom Tab */}
        <TabsContent value="custom" className="mt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <ObjectiveFormCore
              title={title}
              onTitleChange={setTitle}
              description={description}
              onDescriptionChange={setDescription}
              category={category}
              onCategoryChange={setCategory}
              actCategory={actCategory}
              onActCategoryChange={setActCategory}
              information={information}
              onInformationChange={setInformation}
              status={status}
              onStatusChange={setStatus}
              targetDate={targetDate}
              onTargetDateChange={setTargetDate}
              disablePastDates
              dateLocale={dateLocale}
              saving={saving}
              isValid={isValid}
              backHref="/objectives"
              cancelLabel="Annuler"
              saveLabel="Créer"
              savingLabel="Création..."
              milestones={milestones}
              newMilestoneTitle={newMilestoneTitle}
              onNewMilestoneTitleChange={setNewMilestoneTitle}
              onAddMilestone={handleAddMilestone}
              onRemoveMilestone={handleRemoveMilestone}
            />
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
  const t = useTranslations('objectives')
  const categoryInfo = categoryConfig[template.category]
  const CategoryIcon = categoryInfo.icon
  const milestones = t.raw(`templates.${template.id}.milestones`) as string[]

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
              <h4 className="text-foreground text-sm font-medium">
                {t(`templates.${template.id}.title`)}
              </h4>
              {template.estimatedDuration && (
                <Badge variant="outline" className="text-xs">
                  {t(`templates.${template.id}.duration`)}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
              {t(`templates.${template.id}.description`)}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {t('newObjective.stepsCount', { count: milestones.length })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
