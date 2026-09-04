<script module lang="ts">
  import type { ObjectiveCategory, ObjectiveStatus } from '$lib/types'
  import Stethoscope from '@lucide/svelte/icons/stethoscope'
  import FileText from '@lucide/svelte/icons/file-text'
  import Users from '@lucide/svelte/icons/users'
  import Activity from '@lucide/svelte/icons/activity'
  import Heart from '@lucide/svelte/icons/heart'
  import Clock from '@lucide/svelte/icons/clock'
  import CheckCircle2 from '@lucide/svelte/icons/check-circle-2'
  import Pause from '@lucide/svelte/icons/pause'
  import XCircle from '@lucide/svelte/icons/x-circle'

  export const categoryConfig: Record<
    ObjectiveCategory,
    { icon: typeof Stethoscope; color: string }
  > = {
    medical: { icon: Stethoscope, color: 'var(--pink-deep)' },
    administrative: { icon: FileText, color: 'var(--blue-deep)' },
    social: { icon: Users, color: 'var(--blue)' },
    physical: { icon: Activity, color: 'var(--pink)' },
    mental: { icon: Heart, color: 'var(--gold)' },
  }

  export const statusConfig: Record<ObjectiveStatus, { icon: typeof Clock; color: string }> = {
    not_started: { icon: Clock, color: 'var(--ink-soft)' },
    in_progress: { icon: Activity, color: 'var(--blue-deep)' },
    completed: { icon: CheckCircle2, color: 'var(--ok)' },
    paused: { icon: Pause, color: 'var(--watch)' },
    cancelled: { icon: XCircle, color: 'var(--alert)' },
  }
</script>

<script lang="ts">
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import { format } from 'date-fns'
  import type { Objective } from '$lib/types'
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import CalendarIcon from '@lucide/svelte/icons/calendar'

  let {
    objective,
    milestonesCount = 0,
    milestonesCompleted = 0,
  }: {
    objective: Objective
    milestonesCount?: number
    milestonesCompleted?: number
  } = $props()

  let category = $derived(categoryConfig[objective.category])
  let status = $derived(statusConfig[objective.status])
  let progress = $derived(
    objective.progress ??
      (milestonesCount > 0 ? Math.round((milestonesCompleted / milestonesCount) * 100) : 0)
  )
</script>

<a href={`/objectives/${objective.id}`} class="card">
  <div
    class="icon-wrap"
    style:background={`color-mix(in srgb, ${category.color} 16%, transparent)`}
  >
    <category.icon size={18} color={category.color} />
  </div>
  <div class="content">
    <div class="title-row">
      <h3>{objective.title}</h3>
      <ChevronRight size={16} class="chevron" />
    </div>
    {#if objective.description}
      <p class="description">{objective.description}</p>
    {/if}
    <div class="badges">
      <span class="badge" style:color={status.color}>
        <status.icon size={12} />
        {i18n.t(`objectives.detail.statuses.${objective.status}`)}
      </span>
      <span class="badge muted">{i18n.t(`objectives.categories.${objective.category}`)}</span>
    </div>
    {#if objective.status === 'in_progress' || objective.status === 'completed'}
      <div class="progress-row">
        <div class="progress-track">
          <div class="progress-fill" style:width={`${progress}%`}></div>
        </div>
        <span class="progress-txt"
          >{progress}%{#if milestonesCount > 0}
            &middot; {milestonesCompleted}/{milestonesCount} {i18n.t('objectives.steps')}{/if}</span
        >
      </div>
    {/if}
    {#if objective.targetDate && objective.status !== 'completed'}
      <div class="date-line">
        <CalendarIcon size={12} />
        {i18n.t('objectives.detail.target')}: {format(
          new Date(objective.targetDate),
          'd MMM yyyy',
          {
            locale: getDateLocale(i18n.locale),
          }
        )}
      </div>
    {/if}
    {#if objective.completedDate && objective.status === 'completed'}
      <div class="date-line done">
        <CheckCircle2 size={12} />
        {i18n.t('objectives.detail.completedOn')}
        {format(new Date(objective.completedDate), 'd MMM yyyy', {
          locale: getDateLocale(i18n.locale),
        })}
      </div>
    {/if}
  </div>
</a>

<style>
  .card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 14px;
    background: var(--bg);
    text-decoration: none;
    color: inherit;
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
  .content {
    flex: 1;
    min-width: 0;
  }
  .title-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  h3 {
    flex: 1;
    min-width: 0;
    font-size: 14.5px;
    font-weight: 600;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .card :global(.chevron) {
    color: var(--ink-soft);
    flex-shrink: 0;
  }
  .description {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 4px 0 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
  }
  .badge.muted {
    color: var(--ink-soft);
  }
  .progress-row {
    margin-top: 8px;
  }
  .progress-track {
    height: 5px;
    background: var(--line);
    border-radius: 3px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--blue-deep), var(--pink-deep));
    transition: width 0.4s ease;
  }
  .progress-txt {
    display: block;
    font-size: 11px;
    color: var(--ink-soft);
    margin-top: 4px;
  }
  .date-line {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    color: var(--ink-soft);
    margin-top: 8px;
  }
  .date-line.done {
    color: var(--ok);
  }
</style>
