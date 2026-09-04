<script lang="ts">
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { format } from 'date-fns'
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import {
    getObjective,
    getMilestones,
    updateObjective,
    deleteObjective,
    addMilestone,
    toggleMilestone,
    updateMilestone,
    deleteMilestone,
    recalculateObjectiveProgress,
    getAppointmentsByObjective,
    getPractitioner,
  } from '$lib/db'
  import type { Objective, Milestone, ObjectiveStatus, Appointment, Practitioner } from '$lib/types'
  import { categoryConfig, statusConfig } from '$lib/components/objectives/ObjectiveCard.svelte'
  import MilestoneRow from '$lib/components/objectives/MilestoneRow.svelte'
  import CelebrationModal, {
    fireConfetti,
  } from '$lib/components/objectives/CelebrationModal.svelte'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'
  import Pencil from '@lucide/svelte/icons/pencil'
  import Trash2 from '@lucide/svelte/icons/trash-2'
  import Plus from '@lucide/svelte/icons/plus'
  import CalendarIcon from '@lucide/svelte/icons/calendar'
  import Target from '@lucide/svelte/icons/target'
  import CheckCircle2 from '@lucide/svelte/icons/check-circle-2'

  let objective = $state<Objective | null>(null)
  let milestones = $state<Milestone[]>([])
  let linkedAppointments = $state<Appointment[]>([])
  let practitionerMap = $state<Record<number, Practitioner>>({})
  let loading = $state(true)
  let deleting = $state(false)
  let newMilestoneTitle = $state('')

  let celebrationOpen = $state(false)
  let celebrationTitle = $state('')

  async function loadData() {
    const id = parseInt(page.params.id!)
    if (isNaN(id)) {
      await goto('/objectives')
      return
    }

    const obj = await getObjective(id)
    if (!obj) {
      await goto('/objectives')
      return
    }

    objective = obj
    const [ms, apts] = await Promise.all([
      getMilestones(obj.id!),
      getAppointmentsByObjective(obj.id!),
    ])
    milestones = ms
    linkedAppointments = apts

    const ids = new Set<number>([
      ...(obj.envisagedPractitionerIds ?? []),
      ...(obj.chosenPractitionerIds ?? []),
      ...apts.flatMap((a) => (a.practitionerId ? [a.practitionerId] : [])),
    ])
    const entries = await Promise.all(
      [...ids].map(async (pid) => {
        const p = await getPractitioner(pid)
        return p ? ([pid, p] as [number, Practitioner]) : null
      })
    )
    practitionerMap = Object.fromEntries(
      entries.filter((e): e is [number, Practitioner] => e !== null)
    )

    loading = false
  }

  $effect(() => {
    void page.params.id
    loading = true
    loadData()
  })

  let progress = $derived(
    objective
      ? (objective.progress ??
          (milestones.length > 0
            ? Math.round((milestones.filter((m) => m.achieved).length / milestones.length) * 100)
            : 0))
      : 0
  )

  async function handleStatusChange(newStatus: ObjectiveStatus) {
    if (!objective?.id) return

    const updates: Partial<Objective> = { status: newStatus }
    if (newStatus === 'completed') {
      updates.completedDate = new Date()
      updates.progress = 100
    } else if (objective.status === 'completed') {
      updates.completedDate = undefined
    }

    await updateObjective(objective.id, updates)

    if (newStatus === 'completed') {
      celebrationTitle = i18n.t('objectives.detail.celebrationCompleted')
      celebrationOpen = true
    }

    await loadData()
  }

  async function handleToggleMilestone(id: number, achieved: boolean) {
    if (!objective?.id) return

    await toggleMilestone(id, achieved)
    const newProgress = await recalculateObjectiveProgress(objective.id)

    if (achieved && newProgress === 100 && objective.status !== 'completed') {
      celebrationTitle = i18n.t('objectives.detail.celebrationAllSteps')
      celebrationOpen = true
      await updateObjective(objective.id, {
        status: 'completed',
        completedDate: new Date(),
        progress: 100,
      })
    } else if (achieved) {
      fireConfetti()
    }

    await loadData()
  }

  async function handleAddMilestone() {
    if (!objective?.id || !newMilestoneTitle.trim()) return

    await addMilestone({
      objectiveId: objective.id,
      title: newMilestoneTitle.trim(),
      achieved: false,
      order: milestones.length,
    })
    await recalculateObjectiveProgress(objective.id)
    newMilestoneTitle = ''
    await loadData()
  }

  async function handleUpdateMilestone(id: number, updates: Partial<Milestone>) {
    await updateMilestone(id, updates)
    await loadData()
  }

  async function handleDeleteMilestone(id: number) {
    if (!objective?.id) return
    await deleteMilestone(id)
    await recalculateObjectiveProgress(objective.id)
    await loadData()
  }

  async function handleDelete() {
    if (!objective?.id) return
    if (
      !confirm(
        `${i18n.t('objectives.detail.deleteTitle')} ${i18n.t('objectives.detail.deleteDesc')}`
      )
    )
      return
    deleting = true
    try {
      await deleteObjective(objective.id)
      await goto('/objectives')
    } catch {
      deleting = false
    }
  }
</script>

<CelebrationModal bind:open={celebrationOpen} title={celebrationTitle} />

{#if loading}
  <p class="loading">{i18n.t('common.loading')}</p>
{:else if objective}
  {@const category = categoryConfig[objective.category]}
  {@const status = statusConfig[objective.status]}

  <div class="header">
    <div class="header-left">
      <a href="/objectives" class="icon-link" aria-label={i18n.t('common.back')}
        ><ArrowLeft size={20} /></a
      >
      <div
        class="icon-wrap"
        style:background={`color-mix(in srgb, ${category.color} 16%, transparent)`}
      >
        <category.icon size={18} color={category.color} />
      </div>
      <div>
        <h1>{objective.title}</h1>
        <span class="status-badge" style:color={status.color}>
          <status.icon size={12} />
          {i18n.t(`objectives.detail.statuses.${objective.status}`)}
        </span>
      </div>
    </div>
    <div class="header-actions">
      <a
        href={`/objectives/${objective.id}/edit`}
        class="icon-link"
        aria-label={i18n.t('common.edit')}><Pencil size={18} /></a
      >
      <button
        type="button"
        class="icon-link danger"
        onclick={handleDelete}
        disabled={deleting}
        aria-label={i18n.t('common.delete')}
      >
        <Trash2 size={18} />
      </button>
    </div>
  </div>

  <div class="card">
    {#if objective.description}
      <p class="description">{objective.description}</p>
    {/if}

    <div class="progress-block">
      <div class="progress-head">
        <span>{i18n.t('objectives.detail.progression')}</span>
        <span class="progress-pct">{progress}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style:width={`${progress}%`}></div>
      </div>
    </div>

    <div class="status-row">
      <span class="label">{i18n.t('objectives.detail.status')}</span>
      <select
        value={objective.status}
        onchange={(e) => handleStatusChange(e.currentTarget.value as ObjectiveStatus)}
      >
        <option value="not_started">{i18n.t('objectives.detail.statuses.not_started')}</option>
        <option value="in_progress">{i18n.t('objectives.detail.statuses.in_progress')}</option>
        <option value="completed">{i18n.t('objectives.detail.statuses.completed')}</option>
        <option value="paused">{i18n.t('objectives.detail.statuses.paused')}</option>
        <option value="cancelled">{i18n.t('objectives.detail.statuses.cancelled')}</option>
      </select>
    </div>

    <div class="meta-lines">
      {#if objective.targetDate && objective.status !== 'completed'}
        <span class="meta-line">
          <Target size={13} />
          {i18n.t('objectives.detail.target')}:
          {format(new Date(objective.targetDate), 'd MMM yyyy', {
            locale: getDateLocale(i18n.locale),
          })}
        </span>
      {/if}
      {#if objective.completedDate}
        <span class="meta-line done">
          <CheckCircle2 size={13} />
          {i18n.t('objectives.detail.completedOn')}
          {format(new Date(objective.completedDate), 'd MMM yyyy', {
            locale: getDateLocale(i18n.locale),
          })}
        </span>
      {/if}
      <span class="meta-line">
        <CalendarIcon size={13} />
        {i18n.t('objectives.detail.createdOn')}
        {format(new Date(objective.createdAt), 'd MMM yyyy', {
          locale: getDateLocale(i18n.locale),
        })}
      </span>
    </div>
  </div>

  <div class="card">
    <p class="card-title">
      {i18n.t('objectives.detail.milestonesTitle')} ({milestones.filter((m) => m.achieved)
        .length}/{milestones.length})
    </p>

    {#if milestones.length === 0}
      <p class="empty-hint">{i18n.t('objectives.detail.noMilestones')}</p>
    {:else}
      <div class="milestone-list">
        {#each milestones as milestone (milestone.id)}
          <MilestoneRow
            {milestone}
            onToggle={handleToggleMilestone}
            onUpdate={handleUpdateMilestone}
            onDelete={handleDeleteMilestone}
          />
        {/each}
      </div>
    {/if}

    <div class="add-row">
      <input
        type="text"
        bind:value={newMilestoneTitle}
        placeholder={i18n.t('objectives.detail.addMilestone')}
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleAddMilestone()
          }
        }}
      />
      <button
        type="button"
        class="icon-btn add"
        onclick={handleAddMilestone}
        disabled={!newMilestoneTitle.trim()}
      >
        <Plus size={16} />
      </button>
    </div>
  </div>

  {#if objective.information}
    <div class="card">
      <p class="card-title">{i18n.t('objectives.act.informationLabel')}</p>
      <p class="information">{objective.information}</p>
    </div>
  {/if}

  {#if (objective.envisagedPractitionerIds?.length ?? 0) > 0 || (objective.chosenPractitionerIds?.length ?? 0) > 0}
    <div class="card">
      <p class="card-title">{i18n.t('practitioners.title')}</p>
      {#if (objective.envisagedPractitionerIds?.length ?? 0) > 0}
        <p class="sub-label">{i18n.t('objectives.act.envisagedPractitioners')}</p>
        {#each objective.envisagedPractitionerIds ?? [] as pid (pid)}
          <p class="practitioner-name">{practitionerMap[pid]?.name ?? `#${pid}`}</p>
        {/each}
      {/if}
      {#if (objective.chosenPractitionerIds?.length ?? 0) > 0}
        <p class="sub-label">{i18n.t('objectives.act.chosenPractitioners')}</p>
        {#each objective.chosenPractitionerIds ?? [] as pid (pid)}
          <p class="practitioner-name">{practitionerMap[pid]?.name ?? `#${pid}`}</p>
        {/each}
      {/if}
    </div>
  {/if}

  {#if linkedAppointments.length > 0}
    <div class="card">
      <p class="card-title">{i18n.t('appointments.title')}</p>
      {#each linkedAppointments as apt (apt.id)}
        {@const practitioner = apt.practitionerId ? practitionerMap[apt.practitionerId] : null}
        <div class="appointment-line">
          <span>
            <CalendarIcon size={13} />
            {format(new Date(apt.date), 'd MMM yyyy', { locale: getDateLocale(i18n.locale) })}
            {#if apt.time}&middot; {apt.time}{/if}
          </span>
          <span class="appointment-who">{practitioner?.name ?? apt.doctor ?? apt.type}</span>
        </div>
      {/each}
    </div>
  {/if}
{/if}

<style>
  .loading {
    color: var(--ink-soft);
    text-align: center;
    padding: 40px 0;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .icon-wrap {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  h1 {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
  }
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    font-weight: 600;
    margin-top: 3px;
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
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
    border: none;
    background: transparent;
    cursor: pointer;
    flex-shrink: 0;
  }
  .icon-link.danger {
    color: var(--alert);
  }
  .icon-link:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .card {
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 14px;
  }
  .card-title {
    font-size: 13px;
    font-weight: 600;
    margin: 0 0 10px;
  }
  .description {
    font-size: 13.5px;
    color: var(--ink-soft);
    margin: 0 0 14px;
  }
  .progress-block {
    margin-bottom: 14px;
  }
  .progress-head {
    display: flex;
    justify-content: space-between;
    font-size: 12.5px;
    color: var(--ink-soft);
    margin-bottom: 6px;
  }
  .progress-pct {
    font-weight: 600;
    color: var(--ink);
  }
  .progress-track {
    height: 8px;
    background: var(--line);
    border-radius: 4px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--blue-deep), var(--pink-deep));
    transition: width 0.4s ease;
  }
  .status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 12px;
  }
  .status-row .label {
    font-size: 12.5px;
    color: var(--ink-soft);
  }
  .status-row select {
    padding: 7px 10px;
    border: 1px solid var(--line);
    border-radius: 9px;
    background: var(--page);
    color: var(--ink);
    font-family: inherit;
    font-size: 12.5px;
  }
  .meta-lines {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .meta-line {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--ink-soft);
  }
  .meta-line.done {
    color: var(--ok);
  }
  .empty-hint {
    font-size: 13px;
    color: var(--ink-soft);
    text-align: center;
    padding: 12px 0;
  }
  .milestone-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }
  .add-row {
    display: flex;
    gap: 8px;
    border-top: 1px solid var(--line);
    padding-top: 12px;
  }
  .add-row input {
    flex: 1;
    padding: 9px 11px;
    border: 1px solid var(--line);
    border-radius: 9px;
    background: var(--page);
    color: var(--ink);
    font-family: inherit;
    font-size: 13.5px;
  }
  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--line);
    border-radius: 9px;
    background: var(--page);
    color: var(--ink-soft);
    cursor: pointer;
    flex-shrink: 0;
  }
  .icon-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .information {
    font-size: 13px;
    color: var(--ink-soft);
    white-space: pre-wrap;
    margin: 0;
  }
  .sub-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: var(--ink-soft);
    margin: 10px 0 4px;
  }
  .sub-label:first-child {
    margin-top: 0;
  }
  .practitioner-name {
    font-size: 13px;
    margin: 0 0 2px;
  }
  .appointment-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 12.5px;
    padding: 6px 0;
  }
  .appointment-line span:first-child {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--ink-soft);
  }
  .appointment-who {
    color: var(--ink);
    font-weight: 500;
  }
</style>
