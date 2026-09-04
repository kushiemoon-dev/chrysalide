<script lang="ts">
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { i18n } from '$lib/i18n.svelte'
  import { getObjective, updateObjective } from '$lib/db'
  import type { Objective, ObjectiveCategory, ObjectiveStatus, ActCategory } from '$lib/types'
  import ObjectiveFormFields from '$lib/components/objectives/ObjectiveFormFields.svelte'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'

  let loading = $state(true)
  let saving = $state(false)
  let objectiveId = $state<number | null>(null)

  let title = $state('')
  let description = $state('')
  let category = $state<ObjectiveCategory>('medical')
  let actCategory = $state<ActCategory | ''>('')
  let information = $state('')
  let status = $state<ObjectiveStatus>('not_started')
  let targetDate = $state('')
  let notes = $state('')

  async function loadData() {
    const id = parseInt(page.params.id!)
    if (isNaN(id)) {
      await goto('/objectives')
      return
    }

    const data = await getObjective(id)
    if (!data) {
      await goto('/objectives')
      return
    }

    objectiveId = id
    title = data.title
    description = data.description ?? ''
    category = data.category
    actCategory = data.actCategory ?? ''
    information = data.information ?? ''
    status = data.status
    targetDate = data.targetDate ? new Date(data.targetDate).toISOString().split('T')[0]! : ''
    notes = data.notes ?? ''

    loading = false
  }

  $effect(() => {
    void page.params.id
    loading = true
    loadData()
  })

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!title.trim() || !objectiveId) return

    saving = true
    try {
      const previous = await getObjective(objectiveId)
      const updates: Partial<Objective> = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        status,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        notes: notes.trim() || undefined,
        actCategory: category === 'medical' && actCategory ? actCategory : undefined,
        information: category === 'medical' ? information.trim() || undefined : undefined,
      }

      if (status === 'completed' && previous?.status !== 'completed') {
        updates.completedDate = new Date()
        updates.progress = 100
      } else if (status !== 'completed' && previous?.status === 'completed') {
        updates.completedDate = undefined
      }

      await updateObjective(objectiveId, updates)
      await goto(`/objectives/${objectiveId}`)
    } catch {
      saving = false
    }
  }
</script>

{#if loading}
  <p class="loading">{i18n.t('common.loading')}</p>
{:else}
  <div class="header">
    <a href={`/objectives/${objectiveId}`} class="icon-link" aria-label={i18n.t('common.back')}
      ><ArrowLeft size={20} /></a
    >
    <div>
      <h1>{i18n.t('objectives.edit.title')}</h1>
      <p class="subtitle">{i18n.t('objectives.edit.subtitle')}</p>
    </div>
  </div>

  <form onsubmit={handleSubmit}>
    <ObjectiveFormFields
      bind:title
      bind:description
      bind:category
      bind:actCategory
      bind:information
      bind:status
      bind:targetDate
      bind:notes
      variant="edit"
      {saving}
      backHref={`/objectives/${objectiveId}`}
    />
  </form>
{/if}

<style>
  .loading {
    color: var(--ink-soft);
    text-align: center;
    padding: 40px 0;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
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
</style>
