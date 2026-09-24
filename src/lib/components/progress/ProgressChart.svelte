<script lang="ts">
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import { format } from 'date-fns'
  import type { Measurements, PhysicalProgress } from '$lib/types'
  import { chronological } from './progress-charts'
  import ChartTooltip from '$lib/components/ui/ChartTooltip.svelte'

  let {
    entries,
    series,
    ariaLabel,
    height = 150,
  }: {
    entries: PhysicalProgress[]
    series: { key: keyof Measurements; label: string; unit: string; color: string }[]
    ariaLabel: string
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

  let activeIndex = $state<number | null>(null)
  let svgEl = $state<SVGSVGElement>()
  let chartWrapEl = $state<HTMLDivElement>()

  function hasAnyValue(index: number): boolean {
    const entry = sortedEntries[index]
    if (!entry) return false
    return series.some((s) => entry.measurements?.[s.key] !== undefined)
  }

  // The tap snaps to the nearest index by pixel ratio, but that index might
  // carry no value for any series drawn on this chart — walk outward until
  // an index with real data is found, so a tap near a point never silently
  // shows nothing.
  function nearestValidIndex(target: number): number {
    const n = sortedEntries.length
    for (let d = 0; d < n; d++) {
      if (target - d >= 0 && hasAnyValue(target - d)) return target - d
      if (target + d < n && hasAnyValue(target + d)) return target + d
    }
    return target
  }

  function handlePointer(e: PointerEvent) {
    if (!svgEl || sortedEntries.length === 0) return
    const rect = svgEl.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const n = sortedEntries.length
    const index = n > 1 ? Math.round(ratio * (n - 1)) : 0
    activeIndex = nearestValidIndex(Math.max(0, Math.min(index, n - 1)))
  }

  // A real tap fires pointerdown/pointerup then pointerleave in quick
  // succession for a pointer that can't hover (it never "left" a point it
  // was never hovering) — only a mouse leaving the chart should close it.
  function closeTooltip(e: PointerEvent) {
    if (e.pointerType === 'mouse') activeIndex = null
  }

  $effect(() => {
    function handleOutside(e: PointerEvent) {
      if (chartWrapEl && !chartWrapEl.contains(e.target as Node)) activeIndex = null
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  })

  let tooltipRows = $derived.by(() => {
    if (activeIndex === null) return []
    const entry = sortedEntries[activeIndex]
    if (!entry) return []
    return series
      .map((s) => {
        const value = entry.measurements?.[s.key]
        if (value === undefined) return null
        return { label: s.label, value: `${value} ${s.unit}`, color: s.color, alert: false }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
  })
</script>

{#if chartSeries.length === 0}
  <p class="empty">{i18n.t('progress.noMeasurements')}</p>
{:else}
  <div class="chart-wrap" bind:this={chartWrapEl}>
    <svg
      viewBox={`0 0 ${VIEW_W} ${height}`}
      class="chart"
      role="img"
      aria-label={ariaLabel}
      bind:this={svgEl}
      onpointerdown={handlePointer}
      onpointermove={handlePointer}
      onpointerleave={closeTooltip}
    >
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
    {#if activeIndex !== null && tooltipRows.length > 0}
      <ChartTooltip
        containerEl={chartWrapEl}
        x={chartWrapEl ? (xFor(activeIndex) / VIEW_W) * chartWrapEl.clientWidth : 0}
        date={format(sortedEntries[activeIndex]!.date, 'd MMMM yyyy', {
          locale: getDateLocale(i18n.locale),
        })}
        rows={tooltipRows}
      />
    {/if}
  </div>

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
  .chart-wrap {
    position: relative;
  }
  .chart {
    width: 100%;
    display: block;
    /* Blocks horizontal scroll-vs-scrub ambiguity while still letting a
       vertical swipe that starts on the chart scroll the page. */
    touch-action: pan-y;
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
