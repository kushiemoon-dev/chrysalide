<script lang="ts">
  import { onMount } from 'svelte'
  import { format, subMonths, startOfMonth, endOfMonth, endOfDay } from 'date-fns'
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import { getTreatmentChanges } from '$lib/db'
  import type { TreatmentChange, TreatmentChangeType } from '$lib/types'
  import ChangeEntry, { changeTypeConfig } from '$lib/components/medications/ChangeEntry.svelte'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'
  import HistoryIcon from '@lucide/svelte/icons/history'
  import Filter from '@lucide/svelte/icons/filter'
  import CalendarIcon from '@lucide/svelte/icons/calendar'
  import PillIcon from '@lucide/svelte/icons/pill'
  import TrendingUp from '@lucide/svelte/icons/trending-up'

  type FilterType = 'all' | TreatmentChangeType
  type MedicationFilter = 'all' | number

  let changes = $state<TreatmentChange[]>([])
  let loading = $state(true)

  let typeFilter = $state<FilterType>('all')
  let medicationFilter = $state<MedicationFilter>('all')
  let rangeFrom = $state(subMonths(new Date(), 6).toISOString().split('T')[0]!)
  let rangeTo = $state(new Date().toISOString().split('T')[0]!)

  onMount(async () => {
    changes = await getTreatmentChanges(undefined, 500)
    loading = false
  })

  let dateLocale = $derived(getDateLocale(i18n.locale))

  let filteredChanges = $derived.by(() => {
    const from = new Date(rangeFrom)
    const to = endOfDay(new Date(rangeTo))
    return changes.filter((change) => {
      if (typeFilter !== 'all' && change.changeType !== typeFilter) return false
      if (medicationFilter !== 'all' && change.medicationId !== medicationFilter) return false
      const changeDate = new Date(change.date)
      if (changeDate < from || changeDate > to) return false
      return true
    })
  })

  let stats = $derived.by(() => {
    const now = new Date()
    const thisMonth = changes.filter((c) => {
      const d = new Date(c.date)
      return d >= startOfMonth(now) && d <= endOfMonth(now)
    })
    const byType = changes.reduce<Record<string, number>>((acc, c) => {
      acc[c.changeType] = (acc[c.changeType] || 0) + 1
      return acc
    }, {})
    const uniqueMeds = new Set(changes.map((c) => c.medicationId)).size
    const mostCommon = Object.entries(byType).sort((a, b) => b[1] - a[1])[0]
    return { total: changes.length, thisMonth: thisMonth.length, uniqueMeds, mostCommon }
  })

  let groupedByMonth = $derived.by(() => {
    const groups: Record<string, TreatmentChange[]> = {}
    for (const change of filteredChanges) {
      const monthKey = format(new Date(change.date), 'yyyy-MM')
      ;(groups[monthKey] ??= []).push(change)
    }
    return groups
  })

  let sortedMonths = $derived(Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a)))

  let uniqueMedicationNames = $derived.by(() => {
    const seen: Record<number, string> = {}
    for (const c of changes) {
      seen[c.medicationId] ??= c.medicationName
    }
    return Object.entries(seen).map(([id, name]) => [Number(id), name] as const)
  })

  function setRange(months: number) {
    rangeFrom = subMonths(new Date(), months).toISOString().split('T')[0]!
    rangeTo = new Date().toISOString().split('T')[0]!
  }
</script>

<div class="header">
  <a href="/medications" class="icon-link" aria-label={i18n.t('common.back')}
    ><ArrowLeft size={20} /></a
  >
  <div>
    <h1>{i18n.t('medications.history.title')}</h1>
    <p class="subtitle">{i18n.t('medications.history.subtitle')}</p>
  </div>
</div>

{#if loading}
  <p class="loading">{i18n.t('common.loading')}</p>
{:else}
  <div class="stats-grid">
    <div class="stat">
      <div class="stat-icon"><HistoryIcon size={16} /></div>
      <div>
        <p class="stat-num">{stats.total}</p>
        <p class="stat-label">{i18n.t('medications.history.totalChanges')}</p>
      </div>
    </div>
    <div class="stat">
      <div class="stat-icon"><CalendarIcon size={16} /></div>
      <div>
        <p class="stat-num">{stats.thisMonth}</p>
        <p class="stat-label">{i18n.t('medications.history.thisMonth')}</p>
      </div>
    </div>
    <div class="stat">
      <div class="stat-icon"><PillIcon size={16} /></div>
      <div>
        <p class="stat-num">{stats.uniqueMeds}</p>
        <p class="stat-label">{i18n.t('medications.history.trackedMeds')}</p>
      </div>
    </div>
    <div class="stat">
      <div class="stat-icon"><TrendingUp size={16} /></div>
      <div>
        <p class="stat-num truncate">
          {stats.mostCommon ? i18n.t(`objectives.changeTypes.${stats.mostCommon[0]}`) : '-'}
        </p>
        <p class="stat-label">{i18n.t('medications.history.mostCommon')}</p>
      </div>
    </div>
  </div>

  <div class="card">
    <p class="card-title"><Filter size={14} /> {i18n.t('medications.history.filters')}</p>

    <div class="filter-row">
      <select bind:value={typeFilter}>
        <option value="all">{i18n.t('medications.history.allTypes')}</option>
        {#each Object.keys(changeTypeConfig) as key (key)}
          <option value={key}>{i18n.t(`objectives.changeTypes.${key}`)}</option>
        {/each}
      </select>

      <select
        value={String(medicationFilter)}
        onchange={(e) =>
          (medicationFilter =
            e.currentTarget.value === 'all' ? 'all' : Number(e.currentTarget.value))}
      >
        <option value="all">{i18n.t('medications.history.allMeds')}</option>
        {#each uniqueMedicationNames as [id, name] (id)}
          <option value={String(id)}>{name}</option>
        {/each}
      </select>
    </div>

    <div class="filter-row">
      <div class="field">
        <label for="rangeFrom">{i18n.t('medications.history.start')}</label>
        <input id="rangeFrom" type="date" bind:value={rangeFrom} max={rangeTo} />
      </div>
      <div class="field">
        <label for="rangeTo">{i18n.t('medications.history.end')}</label>
        <input id="rangeTo" type="date" bind:value={rangeTo} min={rangeFrom} />
      </div>
    </div>

    <div class="quick-filters">
      <button type="button" class="chip-btn" onclick={() => setRange(1)}
        >{i18n.t('medications.history.lastMonth')}</button
      >
      <button type="button" class="chip-btn" onclick={() => setRange(3)}
        >{i18n.t('medications.history.threeMonths')}</button
      >
      <button type="button" class="chip-btn" onclick={() => setRange(6)}
        >{i18n.t('medications.history.sixMonths')}</button
      >
      <button type="button" class="chip-btn" onclick={() => setRange(12)}
        >{i18n.t('medications.history.oneYear')}</button
      >
    </div>
  </div>

  {#if filteredChanges.length === 0}
    <div class="empty-card">
      <HistoryIcon size={40} />
      <h3>{i18n.t('medications.history.noChanges')}</h3>
      <p>
        {changes.length === 0
          ? i18n.t('medications.history.noChangesEmpty')
          : i18n.t('medications.history.noChangesFiltered')}
      </p>
    </div>
  {:else}
    <p class="result-count">
      {filteredChanges.length}
      {filteredChanges.length > 1
        ? i18n.t('medications.history.changes')
        : i18n.t('medications.history.change')}
      {filteredChanges.length > 1
        ? i18n.t('medications.history.foundPlural')
        : i18n.t('medications.history.found')}
    </p>

    {#each sortedMonths as monthKey (monthKey)}
      {@const monthChanges = groupedByMonth[monthKey]!}
      {@const monthDate = new Date(monthKey + '-01')}
      <div class="month-group">
        <h3 class="month-title">
          {format(monthDate, 'MMMM yyyy', { locale: dateLocale })}
          <span class="month-count">{monthChanges.length}</span>
        </h3>
        <div class="entries">
          {#each monthChanges as change (change.id)}
            <ChangeEntry {change} />
          {/each}
        </div>
      </div>
    {/each}
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
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 14px;
  }
  .stat {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 10px;
  }
  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: var(--page);
    flex-shrink: 0;
  }
  .stat-num {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
  }
  .stat-num.truncate {
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100px;
  }
  .stat-label {
    font-size: 10.5px;
    color: var(--ink-soft);
    margin: 1px 0 0;
  }
  .card {
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 14px;
    margin-bottom: 14px;
  }
  .card-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    margin: 0 0 12px;
  }
  .filter-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 10px;
  }
  select,
  input {
    width: 100%;
    padding: 9px 10px;
    border: 1px solid var(--line);
    border-radius: 9px;
    background: var(--page);
    color: var(--ink);
    font-family: inherit;
    font-size: 13px;
  }
  label {
    display: block;
    font-size: 11.5px;
    color: var(--ink-soft);
    margin-bottom: 4px;
  }
  .quick-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip-btn {
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: var(--page);
    color: var(--ink);
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;
  }
  .empty-card {
    text-align: center;
    padding: 40px 16px;
    border: 1px solid var(--line);
    border-radius: 16px;
    color: var(--ink-faint);
  }
  .empty-card h3 {
    font-size: 15px;
    color: var(--ink);
    margin: 12px 0 6px;
  }
  .empty-card p {
    font-size: 13px;
    color: var(--ink-soft);
    margin: 0;
  }
  .result-count {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 0 0 12px;
  }
  .month-group {
    margin-bottom: 18px;
  }
  .month-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink-soft);
    text-transform: capitalize;
    margin: 0 0 10px;
  }
  .month-count {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid var(--line);
    color: var(--ink-soft);
  }
  .entries {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
</style>
