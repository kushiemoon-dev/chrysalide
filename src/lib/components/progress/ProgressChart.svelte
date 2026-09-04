<script lang="ts">
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import { format } from 'date-fns'
  import type { Measurements, PhysicalProgress } from '$lib/types'
  import { chronological } from './progress-charts'

  let {
    entries,
    series,
    height = 150,
  }: {
    entries: PhysicalProgress[]
    series: { key: keyof Measurements; label: string; unit: string; color: string }[]
    height?: number
  } = $props()

  const VIEW_W = 300

  let sortedEntries = $derived(chronological(entries))

  function seriesPoints(key: keyof Measurements) {
    return sortedEntries
      .map((entry, index) => ({ index, value: entry.measurements?.[key] }))
      .filter((p): p is { index: number; value: number } => p.value !== undefined)
  }

  function seriesDomain(values: number[]) {
    const domainMin = Math.min(...values)
    const domainMax = Math.max(...values)
    if (domainMin === domainMax) {
      const pad = domainMin === 0 ? 1 : Math.abs(domainMin) * 0.2
      return { min: domainMin - pad, max: domainMax + pad }
    }
    const pad = (domainMax - domainMin) * 0.15
    return { min: domainMin - pad, max: domainMax + pad }
  }

  function xFor(index: number) {
    const n = sortedEntries.length
    return n > 1 ? (index / (n - 1)) * VIEW_W : VIEW_W / 2
  }

  function yFor(value: number, domain: { min: number; max: number }) {
    const ratio = (value - domain.min) / (domain.max - domain.min)
    return height * 0.9 - ratio * height * 0.8
  }

  let chartSeries = $derived(
    series
      .map((s) => {
        const points = seriesPoints(s.key)
        if (points.length === 0) return null
        const domain = seriesDomain(points.map((p) => p.value))
        return {
          ...s,
          points: points.map((p) => ({ x: xFor(p.index), y: yFor(p.value, domain) })),
          latest: points[points.length - 1]!.value,
        }
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
  )
</script>

{#if chartSeries.length === 0}
  <p class="empty">{i18n.t('progress.noMeasurements')}</p>
{:else}
  <svg viewBox={`0 0 ${VIEW_W} ${height}`} class="chart">
    {#each chartSeries as s (s.key)}
      {#if s.points.length > 1}
        <polyline
          points={s.points.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={s.color}
          stroke-width="2"
        />
      {/if}
      {#each s.points as p, i (i)}
        <circle cx={p.x} cy={p.y} r="3" fill={s.color} />
      {/each}
    {/each}
  </svg>

  {#if sortedEntries.length > 1}
    <div class="x-labels">
      <span
        >{format(new Date(sortedEntries[0]!.date), 'd MMM yy', {
          locale: getDateLocale(i18n.locale),
        })}</span
      >
      <span
        >{format(new Date(sortedEntries[sortedEntries.length - 1]!.date), 'd MMM yy', {
          locale: getDateLocale(i18n.locale),
        })}</span
      >
    </div>
  {/if}

  <div class="legend">
    {#each chartSeries as s (s.key)}
      <div class="legend-item">
        <span class="dot" style:background={s.color}></span>
        <span class="label">{s.label}:</span>
        <span class="value">{s.latest} {s.unit}</span>
      </div>
    {/each}
  </div>
{/if}

<style>
  .empty {
    color: var(--ink-soft);
    font-size: 13px;
    text-align: center;
    padding: 24px 0;
  }
  .chart {
    width: 100%;
    display: block;
  }
  .x-labels {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--ink-faint);
    margin-top: 4px;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .label {
    color: var(--ink-soft);
  }
  .value {
    font-weight: 600;
  }
</style>
