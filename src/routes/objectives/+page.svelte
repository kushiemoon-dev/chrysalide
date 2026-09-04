<script lang="ts">
  import { onMount } from 'svelte'
  import { i18n } from '$lib/i18n.svelte'
  import { getObjectives, getMilestones, getUserProfile } from '$lib/db'
  import type {
    Objective,
    Milestone,
    ObjectiveCategory,
    ObjectiveStatus,
    UserProfile,
  } from '$lib/types'
  import ObjectiveCard, { categoryConfig } from '$lib/components/objectives/ObjectiveCard.svelte'
  import BlahajProgress from '$lib/components/objectives/BlahajProgress.svelte'
  import Plus from '@lucide/svelte/icons/plus'
  import Target from '@lucide/svelte/icons/target'
  import Activity from '@lucide/svelte/icons/activity'
  import Trophy from '@lucide/svelte/icons/trophy'
  import ListFilter from '@lucide/svelte/icons/list-filter'

  type ObjectiveWithMilestones = Objective & { milestones: Milestone[] }

  let objectives = $state<ObjectiveWithMilestones[]>([])
  let userProfile = $state<UserProfile | null>(null)
  let loading = $state(true)
  let statusFilter = $state<'all' | ObjectiveStatus>('all')
  let categoryFilter = $state<'all' | ObjectiveCategory>('all')

  const STATUS_ORDER: Record<ObjectiveStatus, number> = {
    in_progress: 0,
    not_started: 1,
    paused: 2,
    completed: 3,
    cancelled: 4,
  }

  onMount(async () => {
    const [data, profile] = await Promise.all([getObjectives(), getUserProfile()])
    const withMilestones = await Promise.all(
      data.map(async (obj) => ({ ...obj, milestones: obj.id ? await getMilestones(obj.id) : [] }))
    )
    withMilestones.sort((a, b) => {
      const diff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      if (diff !== 0) return diff
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
    objectives = withMilestones
    userProfile = profile
    loading = false
  })

  let filtered = $derived(
    objectives.filter((obj) => {
      if (statusFilter !== 'all' && obj.status !== statusFilter) return false
      if (categoryFilter !== 'all' && obj.category !== categoryFilter) return false
      return true
    })
  )

  let stats = $derived({
    inProgress: objectives.filter((o) => o.status === 'in_progress').length,
    completed: objectives.filter((o) => o.status === 'completed').length,
    milestonesTotal: objectives.reduce((sum, o) => sum + o.milestones.length, 0),
    milestonesCompleted: objectives.reduce(
      (sum, o) => sum + o.milestones.filter((m) => m.achieved).length,
      0
    ),
  })

  let categoryCounts = $derived.by(() => {
    const counts = {} as Record<ObjectiveCategory, number>
    for (const obj of objectives) counts[obj.category] = (counts[obj.category] ?? 0) + 1
    return counts
  })
</script>

<div class="header">
  <div>
    <h1>{i18n.t('objectives.title')}</h1>
    <p class="subtitle">{i18n.t('objectives.subtitle')}</p>
  </div>
  <a href="/objectives/new" class="btn-primary-sm">
    <Plus size={16} />
    {i18n.t('objectives.new')}
  </a>
</div>

{#if loading}
  <p class="loading">{i18n.t('common.loading')}</p>
{:else}
  {#if stats.milestonesTotal > 0}
    <div class="progress-hero">
      <div>
        <p class="hero-label">{i18n.t('objectives.globalProgress')}</p>
        <p class="hero-value">
          {stats.milestonesCompleted}/{stats.milestonesTotal}
          {i18n.t('objectives.steps')}
        </p>
        <p class="hero-sub">
          {stats.inProgress}
          {stats.inProgress > 1 ? i18n.t('objectives.objectives') : i18n.t('objectives.objective')}
          {i18n.t('objectives.inProgress')}
        </p>
      </div>
      <BlahajProgress
        progress={Math.round((stats.milestonesCompleted / stats.milestonesTotal) * 100)}
        context={userProfile?.targetGender === 'masculinizing' ? 'masculinizing' : 'feminizing'}
      />
    </div>
  {/if}

  <div class="stats-grid">
    <div class="card stat-card">
      <div class="stat-icon"><Activity size={16} /></div>
      <div>
        <p class="stat-value">{stats.inProgress}</p>
        <p class="stat-label">{i18n.t('objectives.detail.statuses.in_progress')}</p>
      </div>
    </div>
    <div class="card stat-card">
      <div class="stat-icon completed"><Trophy size={16} /></div>
      <div>
        <p class="stat-value">{stats.completed}</p>
        <p class="stat-label">{i18n.t('objectives.detail.statuses.completed')}</p>
      </div>
    </div>
  </div>

  <div class="card filters">
    <select bind:value={statusFilter}>
      <option value="all">{i18n.t('objectives.list.allStatuses')}</option>
      <option value="not_started">{i18n.t('objectives.detail.statuses.not_started')}</option>
      <option value="in_progress">{i18n.t('objectives.detail.statuses.in_progress')}</option>
      <option value="completed">{i18n.t('objectives.detail.statuses.completed')}</option>
      <option value="paused">{i18n.t('objectives.detail.statuses.paused')}</option>
      <option value="cancelled">{i18n.t('objectives.detail.statuses.cancelled')}</option>
    </select>
    <select bind:value={categoryFilter}>
      <option value="all">{i18n.t('objectives.list.allCategories')}</option>
      {#each Object.keys(categoryConfig) as key (key)}
        <option value={key}>{i18n.t('objectives.categories.' + key)}</option>
      {/each}
    </select>
  </div>

  {#if filtered.length === 0}
    <div class="empty-card">
      {#if objectives.length === 0}
        <Target size={28} />
        <h3>{i18n.t('objectives.list.empty')}</h3>
        <p>{i18n.t('objectives.list.emptyDescription')}</p>
        <a href="/objectives/new" class="btn-primary-sm">
          <Plus size={16} />
          {i18n.t('objectives.new')}
        </a>
      {:else}
        <ListFilter size={28} />
        <h3>{i18n.t('objectives.list.noResults')}</h3>
      {/if}
    </div>
  {:else}
    <div class="objective-list">
      {#each filtered as objective (objective.id)}
        <ObjectiveCard
          {objective}
          milestonesCount={objective.milestones.length}
          milestonesCompleted={objective.milestones.filter((m) => m.achieved).length}
        />
      {/each}
    </div>
  {/if}

  {#if objectives.length > 0}
    <div class="category-shortcuts">
      {#each Object.entries(categoryConfig) as [key, config] (key)}
        {@const count = categoryCounts[key as ObjectiveCategory] ?? 0}
        {#if count > 0}
          <button
            type="button"
            class="category-pill"
            class:active={categoryFilter === key}
            style:color={config.color}
            style:background={`color-mix(in srgb, ${config.color} 14%, transparent)`}
            onclick={() =>
              (categoryFilter = categoryFilter === key ? 'all' : (key as ObjectiveCategory))}
          >
            <config.icon size={12} />
            {i18n.t('objectives.categories.' + key)} ({count})
          </button>
        {/if}
      {/each}
    </div>
  {/if}
{/if}

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 14px;
  }
  h1 {
    font-size: 21px;
    font-weight: 700;
    margin: 0;
  }
  .subtitle {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 2px 0 0;
  }
  .btn-primary-sm {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 8px 14px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
  }
  .loading {
    color: var(--ink-soft);
    text-align: center;
    padding: 40px 0;
  }
  .progress-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--pink) 12%, transparent),
      color-mix(in srgb, var(--blue) 12%, transparent)
    );
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 18px;
    margin-bottom: 14px;
  }
  .hero-label {
    font-size: 12px;
    color: var(--ink-soft);
    margin: 0 0 4px;
  }
  .hero-value {
    font-size: 16px;
    font-weight: 700;
    margin: 0;
  }
  .hero-sub {
    font-size: 11.5px;
    color: var(--ink-soft);
    margin: 4px 0 0;
  }
  .card {
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 16px;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 14px;
  }
  .stat-card {
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--blue-deep) 14%, transparent);
    color: var(--blue-deep);
    flex-shrink: 0;
  }
  .stat-icon.completed {
    background: color-mix(in srgb, var(--ok) 16%, transparent);
    color: var(--ok);
  }
  .stat-value {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
  }
  .stat-label {
    font-size: 11px;
    color: var(--ink-soft);
    margin: 0;
  }
  .filters {
    display: flex;
    gap: 10px;
    padding: 12px;
    margin-bottom: 14px;
  }
  .filters select {
    flex: 1;
    padding: 9px 10px;
    border: 1px solid var(--line);
    border-radius: 9px;
    background: var(--page);
    color: var(--ink);
    font-family: inherit;
    font-size: 13px;
  }
  .empty-card {
    text-align: center;
    padding: 40px 16px;
    border: 1px solid var(--line);
    border-radius: 16px;
    color: var(--ink-soft);
  }
  .empty-card h3 {
    font-size: 15px;
    color: var(--ink);
    margin: 12px 0 6px;
  }
  .empty-card p {
    font-size: 13px;
    margin: 0 0 16px;
  }
  .empty-card .btn-primary-sm {
    display: inline-flex;
  }
  .objective-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .category-shortcuts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
  }
  .category-pill {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border-radius: 999px;
    border: none;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
  .category-pill.active {
    outline: 2px solid currentColor;
  }
</style>
