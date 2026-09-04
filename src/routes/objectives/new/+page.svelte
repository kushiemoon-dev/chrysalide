<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { i18n } from '$lib/i18n.svelte'
  import { addObjective, addMilestone, getUserProfile } from '$lib/db'
  import type { ObjectiveCategory, ObjectiveStatus, ActCategory, UserProfile } from '$lib/types'
  import { categoryConfig } from '$lib/components/objectives/ObjectiveCard.svelte'
  import ObjectiveFormFields, {
    type MilestoneInput,
  } from '$lib/components/objectives/ObjectiveFormFields.svelte'
  import {
    getTemplatesForContext,
    ALL_OBJECTIVE_TEMPLATES,
    type ObjectiveTemplate,
  } from '$lib/objective-templates'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'
  import Sparkles from '@lucide/svelte/icons/sparkles'
  import FileText from '@lucide/svelte/icons/file-text'

  let activeTab = $state<'template' | 'custom'>('template')
  let userProfile = $state<UserProfile | null>(null)
  let saving = $state(false)

  let title = $state('')
  let description = $state('')
  let category = $state<ObjectiveCategory>('medical')
  let actCategory = $state<ActCategory | ''>('')
  let information = $state('')
  let status = $state<ObjectiveStatus>('not_started')
  let targetDate = $state('')
  let milestones = $state<MilestoneInput[]>([])
  let newMilestoneTitle = $state('')

  onMount(async () => {
    userProfile = await getUserProfile()
  })

  let templates = $derived(
    userProfile?.targetGender
      ? getTemplatesForContext(userProfile.targetGender)
      : ALL_OBJECTIVE_TEMPLATES
  )

  function applyTemplate(template: ObjectiveTemplate) {
    title = i18n.t(`objectives.templates.${template.id}.title`)
    description = i18n.t(`objectives.templates.${template.id}.description`)
    category = template.category
    status = 'not_started'
    milestones = (i18n.raw<string[]>(`objectives.templates.${template.id}.milestones`) ?? []).map(
      (m) => ({ title: m })
    )
    activeTab = 'custom'
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!title.trim()) return

    saving = true
    try {
      const objectiveId = await addObjective({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        status,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        progress: 0,
        actCategory: category === 'medical' && actCategory ? actCategory : undefined,
        information: category === 'medical' ? information.trim() || undefined : undefined,
        source: 'objective',
      })

      for (let i = 0; i < milestones.length; i++) {
        await addMilestone({
          objectiveId: objectiveId as number,
          title: milestones[i]!.title,
          achieved: false,
          order: i,
        })
      }

      await goto(`/objectives/${objectiveId}`)
    } catch {
      saving = false
    }
  }
</script>

<div class="header">
  <a href="/objectives" class="icon-link" aria-label={i18n.t('common.back')}
    ><ArrowLeft size={20} /></a
  >
  <div>
    <h1>{i18n.t('objectives.newObjective.title')}</h1>
    <p class="subtitle">{i18n.t('objectives.newObjective.subtitle')}</p>
  </div>
</div>

<div class="tabs">
  <button
    type="button"
    class="tab-btn"
    class:active={activeTab === 'template'}
    onclick={() => (activeTab = 'template')}
  >
    <Sparkles size={14} />
    {i18n.t('objectives.newObjective.tabTemplates')}
  </button>
  <button
    type="button"
    class="tab-btn"
    class:active={activeTab === 'custom'}
    onclick={() => (activeTab = 'custom')}
  >
    <FileText size={14} />
    {i18n.t('objectives.newObjective.tabCustom')}
  </button>
</div>

{#if activeTab === 'template'}
  <p class="hint">{i18n.t('objectives.newObjective.templateHint')}</p>

  {#if userProfile?.targetGender !== 'masculinizing'}
    {@render templateGroup(i18n.t('objectives.newObjective.feminizingPath'), 'feminizing')}
  {/if}
  {#if userProfile?.targetGender !== 'feminizing'}
    {@render templateGroup(i18n.t('objectives.newObjective.masculinizingPath'), 'masculinizing')}
  {/if}
  {@render templateGroup(i18n.t('objectives.newObjective.commonPath'), 'common')}
{:else}
  <form onsubmit={handleSubmit}>
    <ObjectiveFormFields
      bind:title
      bind:description
      bind:category
      bind:actCategory
      bind:information
      bind:status
      bind:targetDate
      bind:milestones
      bind:newMilestoneTitle
      variant="new"
      {saving}
      backHref="/objectives"
    />
  </form>
{/if}

{#snippet templateGroup(label: string, context: 'feminizing' | 'masculinizing' | 'common')}
  {@const group = templates.filter((t) => t.context === context)}
  {#if group.length > 0}
    <div class="template-group">
      <h3>{label}</h3>
      <div class="template-list">
        {#each group as template (template.id)}
          {@render templateCard(template)}
        {/each}
      </div>
    </div>
  {/if}
{/snippet}

{#snippet templateCard(template: ObjectiveTemplate)}
  {@const config = categoryConfig[template.category]}
  {@const templateMilestones =
    i18n.raw<string[]>(`objectives.templates.${template.id}.milestones`) ?? []}
  <button type="button" class="template-card" onclick={() => applyTemplate(template)}>
    <div class="tpl-icon" style:background={`color-mix(in srgb, ${config.color} 16%, transparent)`}>
      <config.icon size={16} color={config.color} />
    </div>
    <div class="tpl-body">
      <div class="tpl-head">
        <h4>{i18n.t(`objectives.templates.${template.id}.title`)}</h4>
        {#if template.estimatedDuration}
          <span class="tpl-duration">{i18n.t(`objectives.templates.${template.id}.duration`)}</span>
        {/if}
      </div>
      <p class="tpl-desc">{i18n.t(`objectives.templates.${template.id}.description`)}</p>
      <p class="tpl-steps">
        {i18n
          .t('objectives.newObjective.stepsCount')
          .replace('{count}', String(templateMilestones.length))}
      </p>
    </div>
  </button>
{/snippet}

<style>
  .header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }
  h1 {
    font-size: 19px;
    font-weight: 700;
    margin: 0;
  }
  .subtitle {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 2px 0 0;
  }
  .icon-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    color: var(--ink);
    text-decoration: none;
    flex-shrink: 0;
  }
  .tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 14px;
  }
  .tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 9px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--bg);
    color: var(--ink-soft);
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .tab-btn.active {
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    color: #fff;
    border-color: transparent;
  }
  .hint {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 0 0 14px;
  }
  .template-group {
    margin-bottom: 16px;
  }
  .template-group h3 {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--ink-soft);
    margin: 0 0 8px;
  }
  .template-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .template-card {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--bg);
    text-align: left;
    cursor: pointer;
    font-family: inherit;
  }
  .tpl-icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .tpl-body {
    flex: 1;
    min-width: 0;
  }
  .tpl-head {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .tpl-head h4 {
    font-size: 13.5px;
    font-weight: 600;
    margin: 0;
  }
  .tpl-duration {
    font-size: 10.5px;
    color: var(--ink-soft);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 1px 7px;
  }
  .tpl-desc {
    font-size: 12px;
    color: var(--ink-soft);
    margin: 3px 0 0;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .tpl-steps {
    font-size: 11px;
    color: var(--ink-soft);
    margin: 4px 0 0;
  }
</style>
