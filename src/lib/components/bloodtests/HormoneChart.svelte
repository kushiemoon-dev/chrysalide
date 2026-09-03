<script lang="ts">
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import { format } from 'date-fns'
  import { BLOOD_MARKERS, REFERENCE_RANGES, getHematocritStatus } from '$lib/constants'
  import type { BloodTest, BloodMarker } from '$lib/types'

  let {
    tests,
    series,
    context,
    height = 150,
  }: {
    tests: BloodTest[]
    series: { marker: BloodMarker; color: string }[]
    context: 'feminizing' | 'masculinizing'
    height?: number
  } = $props()

  const VIEW_W = 300

  let sortedTests = $derived(
    [...tests].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  )

  function referenceRange(marker: BloodMarker) {
    return REFERENCE_RANGES.find((r) => r.marker === marker && r.context === context)
  }

  function seriesPoints(marker: BloodMarker) {
    return sortedTests
      .map((test, index) => ({
        index,
        value: test.results.find((r) => r.marker === marker)?.value,
      }))
      .filter((p): p is { index: number; value: number } => p.value !== undefined)
  }

  function seriesDomain(marker: BloodMarker, values: number[]) {
    const range = referenceRange(marker)
    const all = range ? [...values, range.min, range.max] : values
    const domainMin = Math.min(...all)
    const domainMax = Math.max(...all)
    if (domainMin === domainMax) {
      const pad = domainMin === 0 ? 1 : Math.abs(domainMin) * 0.2
      return { min: domainMin - pad, max: domainMax + pad }
    }
    const pad = (domainMax - domainMin) * 0.15
    return { min: domainMin - pad, max: domainMax + pad }
  }

  function xFor(index: number) {
    const n = sortedTests.length
    return n > 1 ? (index / (n - 1)) * VIEW_W : VIEW_W / 2
  }

  function yFor(value: number, domain: { min: number; max: number }) {
    const ratio = (value - domain.min) / (domain.max - domain.min)
    return height * 0.9 - ratio * height * 0.8
  }

  let chartSeries = $derived(
    series
      .map(({ marker, color }) => {
        const points = seriesPoints(marker)
        if (points.length === 0) return null
        const domain = seriesDomain(
          marker,
          points.map((p) => p.value)
        )
        const range = referenceRange(marker)
        return {
          marker,
          color,
          points: points.map((p) => ({ x: xFor(p.index), y: yFor(p.value, domain) })),
          bandY: range ? yFor(range.max, domain) : undefined,
          bandHeight: range ? yFor(range.min, domain) - yFor(range.max, domain) : undefined,
          latest: points[points.length - 1]!.value,
        }
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
  )
</script>

{#if chartSeries.length === 0}
  <p class="empty">{i18n.t('bloodtests.notEnoughForChart')}</p>
{:else}
  <svg viewBox={`0 0 ${VIEW_W} ${height}`} class="chart">
    {#each chartSeries as s (s.marker)}
      {#if s.bandY !== undefined && s.bandHeight !== undefined}
        <rect
          x="0"
          y={s.bandY}
          width={VIEW_W}
          height={s.bandHeight}
          fill={s.color}
          opacity="0.12"
        />
      {/if}
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

  {#if sortedTests.length > 1}
    <div class="x-labels">
      <span
        >{format(new Date(sortedTests[0]!.date), 'd MMM yy', {
          locale: getDateLocale(i18n.locale),
        })}</span
      >
      <span
        >{format(new Date(sortedTests[sortedTests.length - 1]!.date), 'd MMM yy', {
          locale: getDateLocale(i18n.locale),
        })}</span
      >
    </div>
  {/if}

  <div class="legend">
    {#each chartSeries as s (s.marker)}
      {@const status = s.marker === 'hematocrit' ? getHematocritStatus(s.latest) : 'ok'}
      <div class="legend-item">
        <span class="dot" style:background={s.color}></span>
        <span class="label">{i18n.t('bloodtests.markers.' + s.marker)}:</span>
        <span class="value" class:watch={status === 'watch'} class:alert={status === 'alert'}>
          {s.latest}
          {BLOOD_MARKERS[s.marker].unit}
        </span>
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
  .value.watch {
    color: var(--watch);
  }
  .value.alert {
    color: var(--alert);
  }
</style>
