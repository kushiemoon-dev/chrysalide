<script lang="ts">
  import { onMount } from 'svelte'
  import { format, differenceInDays, subDays } from 'date-fns'
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import { getPhysicalProgress } from '$lib/db'
  import type { PhysicalProgress } from '$lib/types'
  import {
    MEASUREMENT_KEYS,
    MEASUREMENT_LABEL_KEY,
    MEASUREMENT_UNITS,
    measurementDiff,
    closestEntryIndex,
  } from '$lib/components/progress/progress-charts'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'
  import ArrowRight from '@lucide/svelte/icons/arrow-right'
  import ArrowLeftRight from '@lucide/svelte/icons/arrow-left-right'
  import CalendarIcon from '@lucide/svelte/icons/calendar'

  let entries = $state<PhysicalProgress[]>([])
  let loading = $state(true)
  let leftIndex = $state(0)
  let rightIndex = $state(0)

  onMount(async () => {
    const data = await getPhysicalProgress(100)
    entries = data.filter((e) => e.photos && e.photos.length > 0)
    if (entries.length > 1) {
      leftIndex = entries.length - 1
      rightIndex = 0
    }
    loading = false
  })

  let leftEntry = $derived(entries[leftIndex])
  let rightEntry = $derived(entries[rightIndex])

  let daysBetween = $derived(
    leftEntry && rightEntry
      ? Math.abs(differenceInDays(new Date(rightEntry.date), new Date(leftEntry.date)))
      : 0
  )

  let commonMeasurements = $derived(
    leftEntry?.measurements && rightEntry?.measurements
      ? MEASUREMENT_KEYS.filter(
          (key) =>
            leftEntry!.measurements?.[key] !== undefined &&
            rightEntry!.measurements?.[key] !== undefined
        )
      : []
  )

  function jumpToDaysAgo(days: number) {
    const target = subDays(new Date(), days)
    const closestToNow = closestEntryIndex(entries, new Date())
    const closestToTarget = closestEntryIndex(entries, target)
    if (closestToTarget > closestToNow) {
      leftIndex = closestToTarget
      rightIndex = closestToNow
    }
  }
</script>

<div class="header">
  <a href="/progress" class="icon-link" aria-label={i18n.t('common.back')}
    ><ArrowLeft size={20} /></a
  >
  <div>
    <h1>{i18n.t('progress.compare.title')}</h1>
    {#if !loading && entries.length >= 2}
      <p class="subtitle">
        <CalendarIcon size={12} />
        {daysBetween}
        {daysBetween > 1 ? i18n.t('progress.compare.days') : i18n.t('progress.compare.day')}
        {i18n.t('progress.compare.daysDiff')}
      </p>
    {:else}
      <p class="subtitle">{i18n.t('progress.compare.beforeAfter')}</p>
    {/if}
  </div>
</div>

{#if loading}
  <p class="loading">{i18n.t('common.loading')}</p>
{:else if entries.length < 2}
  <div class="empty-card">
    <ArrowLeftRight size={28} />
    <h3>{i18n.t('progress.compare.notEnough')}</h3>
    <p>{i18n.t('progress.compare.notEnoughDesc')}</p>
    <a href="/progress/new" class="btn-primary-sm">{i18n.t('progress.compare.addEntry')}</a>
  </div>
{:else}
  <div class="photo-compare">
    <div class="photo-col">
      <div class="photo-frame">
        {#if leftEntry?.photos?.[0]}
          <img src={leftEntry.photos[0]} alt={i18n.t('progress.compare.before')} />
        {/if}
      </div>
      <div class="photo-nav">
        <button
          type="button"
          class="icon-link"
          onclick={() => (leftIndex = Math.min(leftIndex + 1, entries.length - 1))}
          disabled={leftIndex >= entries.length - 1}
          aria-label="older"
        >
          <ArrowLeft size={16} />
        </button>
        <div class="photo-nav-label">
          <p class="date">
            {leftEntry &&
              format(new Date(leftEntry.date), 'd MMM yyyy', {
                locale: getDateLocale(i18n.locale),
              })}
          </p>
          <p class="tag">{i18n.t('progress.compare.before')}</p>
        </div>
        <button
          type="button"
          class="icon-link"
          onclick={() => (leftIndex = Math.max(leftIndex - 1, 0))}
          disabled={leftIndex <= 0 || leftIndex <= rightIndex}
          aria-label="newer"
        >
          <ArrowRight size={16} />
        </button>
      </div>
    </div>

    <div class="photo-col">
      <div class="photo-frame">
        {#if rightEntry?.photos?.[0]}
          <img src={rightEntry.photos[0]} alt={i18n.t('progress.compare.after')} />
        {/if}
      </div>
      <div class="photo-nav">
        <button
          type="button"
          class="icon-link"
          onclick={() => (rightIndex = Math.min(rightIndex + 1, entries.length - 1))}
          disabled={rightIndex >= entries.length - 1 || rightIndex >= leftIndex}
          aria-label="older"
        >
          <ArrowLeft size={16} />
        </button>
        <div class="photo-nav-label">
          <p class="date">
            {rightEntry &&
              format(new Date(rightEntry.date), 'd MMM yyyy', {
                locale: getDateLocale(i18n.locale),
              })}
          </p>
          <p class="tag">{i18n.t('progress.compare.after')}</p>
        </div>
        <button
          type="button"
          class="icon-link"
          onclick={() => (rightIndex = Math.max(rightIndex - 1, 0))}
          disabled={rightIndex <= 0}
          aria-label="newer"
        >
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  </div>

  <div class="card quick-nav">
    <button
      type="button"
      class="btn-outline-sm"
      onclick={() => {
        leftIndex = entries.length - 1
        rightIndex = 0
      }}>{i18n.t('progress.compare.firstToLast')}</button
    >
    <button type="button" class="btn-outline-sm" onclick={() => jumpToDaysAgo(30)}
      >{i18n.t('progress.compare.oneMonth')}</button
    >
    <button type="button" class="btn-outline-sm" onclick={() => jumpToDaysAgo(90)}
      >{i18n.t('progress.compare.threeMonths')}</button
    >
  </div>

  {#if commonMeasurements.length > 0}
    <div class="card">
      <p class="card-title">{i18n.t('progress.compare.measurementEvolution')}</p>
      <div class="evolution-list">
        {#each commonMeasurements as key (key)}
          {@const left = leftEntry!.measurements![key]!}
          {@const right = rightEntry!.measurements![key]!}
          {@const diff = measurementDiff(left, right)!}
          <div class="evolution-row">
            <span class="evolution-label">{i18n.t(MEASUREMENT_LABEL_KEY[key])}</span>
            <div class="evolution-value">
              <span class="muted">{left}</span>
              <ArrowRight size={12} class="muted" />
              <span class="value">{right}</span>
              <span class="muted unit">{MEASUREMENT_UNITS[key]}</span>
              <span class="diff" class:up={diff > 0} class:down={diff < 0}>
                {diff > 0 ? '+' : ''}{diff.toFixed(1)}
              </span>
            </div>
          </div>
        {/each}
      </div>
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
    display: flex;
    align-items: center;
    gap: 4px;
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
    border: none;
    background: transparent;
    cursor: pointer;
    flex-shrink: 0;
  }
  .icon-link:disabled {
    opacity: 0.35;
    cursor: default;
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
  .btn-primary-sm {
    display: inline-flex;
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
  .photo-compare {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 14px;
  }
  .photo-frame {
    aspect-ratio: 3/4;
    border-radius: 14px;
    overflow: hidden;
    background: var(--page);
  }
  .photo-frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .photo-nav {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
  }
  .photo-nav-label {
    flex: 1;
    text-align: center;
  }
  .photo-nav-label .date {
    font-size: 12px;
    font-weight: 600;
    margin: 0;
  }
  .photo-nav-label .tag {
    font-size: 11px;
    color: var(--ink-soft);
    margin: 0;
  }
  .card {
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 14px;
  }
  .quick-nav {
    display: flex;
    gap: 8px;
    padding: 12px;
  }
  .btn-outline-sm {
    flex: 1;
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--page);
    color: var(--ink);
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
  .card-title {
    font-size: 13px;
    font-weight: 600;
    margin: 0 0 10px;
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
    gap: 6px;
  }
  .muted {
    color: var(--ink-soft);
  }
  .unit {
    font-size: 11.5px;
  }
  .diff {
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 1px 8px;
    font-size: 11.5px;
  }
  .diff.up {
    border-color: var(--ok);
    color: var(--ok);
  }
  .diff.down {
    border-color: var(--alert);
    color: var(--alert);
  }
</style>
