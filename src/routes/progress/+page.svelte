<script lang="ts">
  import { onMount } from 'svelte'
  import { format, differenceInDays } from 'date-fns'
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import { getPhysicalProgress, getUserProfile } from '$lib/db'
  import type { PhysicalProgress } from '$lib/types'
  import ProgressChart from '$lib/components/progress/ProgressChart.svelte'
  import ExportButton from '$lib/components/ui/ExportButton.svelte'
  import {
    availableMeasurements,
    measurementDiff,
    MEASUREMENT_UNITS,
    MEASUREMENT_LABEL_KEY,
    MEASUREMENT_CHART_COLOR,
    BODY_MEASUREMENT_KEYS,
  } from '$lib/components/progress/progress-charts'
  import Plus from '@lucide/svelte/icons/plus'
  import ArrowLeftRight from '@lucide/svelte/icons/arrow-left-right'
  import TrendingUp from '@lucide/svelte/icons/trending-up'
  import ListIcon from '@lucide/svelte/icons/list'
  import ImageIcon from '@lucide/svelte/icons/image'
  import Ruler from '@lucide/svelte/icons/ruler'
  import Camera from '@lucide/svelte/icons/camera'
  import ChevronRight from '@lucide/svelte/icons/chevron-right'

  let entries = $state<PhysicalProgress[]>([])
  let loading = $state(true)
  let activeTab = $state<'timeline' | 'charts' | 'photos'>('timeline')
  let userName = $state<string | undefined>()
  let chartRef = $state<HTMLDivElement>()

  onMount(async () => {
    const [entriesData, profile] = await Promise.all([getPhysicalProgress(50), getUserProfile()])
    entries = entriesData
    if (profile?.firstName) {
      userName = profile.firstName
    }
    loading = false
  })

  let available = $derived(availableMeasurements(entries))
  let bodyMeasurements = $derived(
    available.filter((k) =>
      BODY_MEASUREMENT_KEYS.includes(k as (typeof BODY_MEASUREMENT_KEYS)[number])
    )
  )
  let entriesWithPhotos = $derived(entries.filter((e) => e.photos && e.photos.length > 0))
  let totalPhotos = $derived(entries.reduce((acc, e) => acc + (e.photos?.length ?? 0), 0))
  let firstEntry = $derived([...entries].reverse()[0])
  let lastEntry = $derived(entries[0])
  let daysTracked = $derived(
    firstEntry && lastEntry && firstEntry !== lastEntry
      ? differenceInDays(new Date(lastEntry.date), new Date(firstEntry.date))
      : 0
  )

  let bodyExportData = $derived(
    bodyMeasurements
      .map((key) => {
        const last = lastEntry?.measurements?.[key]
        if (last === undefined) return null
        return {
          marker: key,
          label: i18n.t(MEASUREMENT_LABEL_KEY[key]),
          value: last,
          unit: MEASUREMENT_UNITS[key],
        }
      })
      .filter((d): d is NonNullable<typeof d> => d !== null)
  )
</script>

<div class="header">
  <div>
    <h1>{i18n.t('progress.title')}</h1>
    <p class="subtitle">
      {entries.length}
      {entries.length > 1 ? i18n.t('progress.entries') : i18n.t('progress.entry')}
    </p>
  </div>
  <div class="header-actions">
    <a href="/progress/compare" class="icon-link" aria-label={i18n.t('progress.compare.title')}>
      <ArrowLeftRight size={18} />
    </a>
    <a href="/progress/new" class="btn-primary-sm">
      <Plus size={16} />
      {i18n.t('progress.add')}
    </a>
  </div>
</div>

{#if loading}
  <p class="loading">{i18n.t('common.loading')}</p>
{:else if entries.length === 0}
  <div class="empty-card">
    <TrendingUp size={28} />
    <h3>{i18n.t('progress.noEntries')}</h3>
    <p>{i18n.t('progress.noEntriesDesc')}</p>
    <a href="/progress/new" class="btn-primary-sm">
      <Plus size={16} />
      {i18n.t('progress.addEntry')}
    </a>
  </div>
{:else}
  <div class="tabs">
    <button
      type="button"
      class:active={activeTab === 'timeline'}
      onclick={() => (activeTab = 'timeline')}
    >
      <ListIcon size={15} />
      {i18n.t('progress.tabs.timeline')}
    </button>
    <button
      type="button"
      class:active={activeTab === 'charts'}
      onclick={() => (activeTab = 'charts')}
    >
      <TrendingUp size={15} />
      {i18n.t('progress.tabs.charts')}
    </button>
    <button
      type="button"
      class:active={activeTab === 'photos'}
      onclick={() => (activeTab = 'photos')}
    >
      <ImageIcon size={15} />
      {i18n.t('progress.tabs.photos')}
    </button>
  </div>

  {#if activeTab === 'timeline'}
    <div class="stats-row">
      <div class="stat-card">
        <p class="stat-value">{entries.length}</p>
        <p class="stat-label">{i18n.t('progress.stats.entries')}</p>
      </div>
      <div class="stat-card">
        <p class="stat-value">{totalPhotos}</p>
        <p class="stat-label">{i18n.t('progress.stats.photos')}</p>
      </div>
      <div class="stat-card">
        <p class="stat-value">{daysTracked}</p>
        <p class="stat-label">{i18n.t('progress.stats.days')}</p>
      </div>
    </div>

    <div class="entry-list">
      {#each entries as entry (entry.id)}
        <a href={`/progress/${entry.id}`} class="entry-card">
          <div class="entry-thumb">
            {#if entry.photos && entry.photos.length > 0}
              <img src={entry.photos[0]} alt="" />
            {:else}
              <Ruler size={22} />
            {/if}
          </div>
          <div class="entry-body">
            <p class="entry-date">
              {format(new Date(entry.date), 'd MMMM yyyy', { locale: getDateLocale(i18n.locale) })}
            </p>
            <div class="entry-badges">
              {#if entry.photos && entry.photos.length > 0}
                <span class="badge"><Camera size={11} /> {entry.photos.length}</span>
              {/if}
              {#if entry.measurements && Object.keys(entry.measurements).length > 0}
                <span class="badge"
                  ><Ruler size={11} /> {Object.keys(entry.measurements).length}</span
                >
              {/if}
              {#each (entry.tags ?? []).slice(0, 2) as tag (tag)}
                <span class="badge">{tag}</span>
              {/each}
            </div>
          </div>
          <ChevronRight size={18} class="chevron" />
        </a>
      {/each}
    </div>
  {:else if activeTab === 'charts'}
    {#if available.length === 0}
      <p class="empty-note">{i18n.t('progress.noMeasurements')}</p>
    {:else}
      {#if bodyMeasurements.length > 0}
        <div class="card">
          <div class="card-head">
            <p class="card-title">{i18n.t('progress.bodyMeasurements')}</p>
            <ExportButton
              {chartRef}
              title={i18n.t('progress.bodyEvolution')}
              subtitle={i18n.t('progress.measurementsLabel')}
              {userName}
              data={bodyExportData}
            />
          </div>
          <div bind:this={chartRef}>
            <ProgressChart
              {entries}
              series={bodyMeasurements.map((key) => ({
                key,
                label: i18n.t(MEASUREMENT_LABEL_KEY[key]),
                unit: MEASUREMENT_UNITS[key],
                color: MEASUREMENT_CHART_COLOR[key]!,
              }))}
            />
          </div>
        </div>
      {/if}

      {#if available.includes('weight')}
        <div class="card">
          <p class="card-title">{i18n.t('progress.weightLabel')}</p>
          <ProgressChart
            {entries}
            series={[
              {
                key: 'weight',
                label: i18n.t(MEASUREMENT_LABEL_KEY.weight),
                unit: MEASUREMENT_UNITS.weight,
                color: MEASUREMENT_CHART_COLOR.weight!,
              },
            ]}
          />
        </div>
      {/if}

      {#if firstEntry && lastEntry && firstEntry.id !== lastEntry.id}
        <div class="card">
          <p class="card-title">{i18n.t('progress.evolution')}</p>
          <div class="evolution-list">
            {#each available as key (key)}
              {@const diff = measurementDiff(
                firstEntry.measurements?.[key],
                lastEntry.measurements?.[key]
              )}
              {#if diff !== undefined}
                <div class="evolution-row">
                  <span class="evolution-label">{i18n.t(MEASUREMENT_LABEL_KEY[key])}</span>
                  <span class="evolution-value">
                    {firstEntry.measurements?.[key]} → {lastEntry.measurements?.[key]}
                    {MEASUREMENT_UNITS[key]}
                    <span class="evolution-diff" class:up={diff > 0} class:down={diff < 0}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                    </span>
                  </span>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  {:else if entriesWithPhotos.length === 0}
    <p class="empty-note">{i18n.t('progress.noPhotos')}</p>
  {:else}
    <div class="photo-grid">
      {#each entries as entry (entry.id)}
        {#each entry.photos ?? [] as photo, index (`${entry.id}-${index}`)}
          <a href={`/progress/${entry.id}`} class="photo-tile">
            <img src={photo} alt="" />
          </a>
        {/each}
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
    margin-bottom: 18px;
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
  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .icon-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid var(--line);
    color: var(--ink);
    text-decoration: none;
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
  .empty-note {
    color: var(--ink-soft);
    text-align: center;
    font-size: 13px;
    padding: 30px 0;
  }
  .tabs {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin-bottom: 14px;
  }
  .tabs button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 9px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--bg);
    color: var(--ink-soft);
    font-size: 12.5px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
  }
  .tabs button.active {
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    color: #fff;
    border-color: transparent;
  }
  .stats-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    margin-bottom: 14px;
  }
  .stat-card {
    text-align: center;
    padding: 12px 8px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--bg);
  }
  .stat-value {
    font-size: 20px;
    font-weight: 700;
    margin: 0;
  }
  .stat-label {
    font-size: 11px;
    color: var(--ink-soft);
    margin: 2px 0 0;
  }
  .entry-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .entry-card {
    display: flex;
    align-items: stretch;
    gap: 0;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--bg);
    text-decoration: none;
    color: var(--ink);
    overflow: hidden;
  }
  .entry-thumb {
    width: 72px;
    height: 72px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--page);
    color: var(--ink-soft);
  }
  .entry-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .entry-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    padding: 10px 12px;
  }
  .entry-date {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
  }
  .entry-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .badge {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 10.5px;
    color: var(--ink-soft);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 2px 8px;
  }
  :global(.entry-card .chevron) {
    align-self: center;
    margin-right: 12px;
    color: var(--ink-soft);
    flex-shrink: 0;
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
  .card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }
  .evolution-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .evolution-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
  }
  .evolution-label {
    color: var(--ink-soft);
  }
  .evolution-value {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .evolution-diff {
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 1px 8px;
    font-size: 11.5px;
  }
  .evolution-diff.up {
    border-color: var(--ok);
    color: var(--ok);
  }
  .evolution-diff.down {
    border-color: var(--alert);
    color: var(--alert);
  }
  .photo-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  .photo-tile {
    aspect-ratio: 1;
    border-radius: 10px;
    overflow: hidden;
    background: var(--page);
  }
  .photo-tile img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
