<script lang="ts">
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import { MEDICATION_TYPES } from '$lib/constants'
  import type { Medication } from '$lib/types'
  import { format, differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns'

  let { medications }: { medications: Medication[] } = $props()

  let dateLocale = $derived(getDateLocale(i18n.locale))

  let timelineStart = $derived.by(() => {
    if (medications.length === 0) return startOfMonth(new Date())
    const starts = medications.map((m) => new Date(m.startDate))
    return startOfMonth(new Date(Math.min(...starts.map((d) => d.getTime()))))
  })

  let months = $derived.by(() => {
    if (medications.length === 0) return [startOfMonth(new Date())]
    const ends = medications.map((m) => (m.endDate ? new Date(m.endDate) : new Date()))
    const latest = endOfMonth(new Date(Math.max(...ends.map((d) => d.getTime()), Date.now())))
    return eachMonthOfInterval({ start: timelineStart, end: latest })
  })

  const dayWidth = 3
  const barHeight = 28
  const barGap = 8
  const labelWidth = 150

  let chartWidth = $derived.by(() => {
    if (medications.length === 0) return 300
    const ends = medications.map((m) => (m.endDate ? new Date(m.endDate) : new Date()))
    const latest = new Date(Math.max(...ends.map((d) => d.getTime()), Date.now()))
    return Math.max(differenceInDays(latest, timelineStart) * dayWidth, 300)
  })

  function getBarLeft(date: Date): number {
    return Math.max(differenceInDays(date, timelineStart) * dayWidth, 0)
  }

  function getBarWidth(start: Date, end: Date): number {
    return Math.max(differenceInDays(end, start) * dayWidth, dayWidth)
  }

  let todayStart = $derived.by(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  })
</script>

{#if medications.length === 0}
  <p class="empty">{i18n.t('medications.history.noTreatments')}</p>
{:else}
  <div class="gantt">
    <div class="labels" style:width={`${labelWidth}px`}>
      <div class="header-spacer"></div>
      {#each medications as med (med.id)}
        {@const typeInfo = MEDICATION_TYPES[med.type]}
        {@const isEnded = med.endDate !== undefined && new Date(med.endDate) < todayStart}
        <div class="label-row" style:height={`${barHeight + barGap}px`}>
          <span class="dot" style:background={typeInfo.color} style:opacity={isEnded ? 0.5 : 1}
          ></span>
          <span class="name" style:opacity={isEnded ? 0.5 : 1} title={med.name}>{med.name}</span>
        </div>
      {/each}
    </div>

    <div class="chart">
      <div style:width={`${chartWidth}px`} style:min-width="100%">
        <div class="months">
          {#each months as month (month.toISOString())}
            {@const left = getBarLeft(month)}
            {@const width = getBarWidth(month, endOfMonth(month))}
            <div class="month-label" style:left={`${left}px`} style:width={`${width}px`}>
              {format(month, 'MMM yy', { locale: dateLocale })}
            </div>
          {/each}
        </div>

        {#each medications as med (med.id)}
          {@const typeInfo = MEDICATION_TYPES[med.type]}
          {@const start = new Date(med.startDate)}
          {@const end = med.endDate ? new Date(med.endDate) : new Date()}
          {@const isEnded = med.endDate !== undefined && new Date(med.endDate) < todayStart}
          {@const left = getBarLeft(start)}
          {@const width = getBarWidth(start, end)}
          <div class="bar-row" style:height={`${barHeight + barGap}px`}>
            <div
              class="bar"
              class:ended={isEnded}
              style:left={`${left}px`}
              style:width={`${width}px`}
              style:height={`${barHeight}px`}
              style:background={typeInfo.color}
              style:border-color={typeInfo.color}
            ></div>
            {#if !isEnded}
              <div
                class="bar-edge"
                style:left={`${left + width - 3}px`}
                style:height={`${barHeight}px`}
                style:background={typeInfo.color}
              ></div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .empty {
    font-size: 13px;
    color: var(--ink-soft);
    text-align: center;
    padding: 16px 0;
  }
  .gantt {
    display: flex;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 14px;
  }
  .labels {
    flex-shrink: 0;
    background: var(--bg);
    border-right: 1px solid var(--line);
  }
  .header-spacer {
    height: 32px;
    border-bottom: 1px solid var(--line);
  }
  .label-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 8px;
    border-bottom: 1px solid var(--line);
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .name {
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .chart {
    flex: 1;
    overflow-x: auto;
  }
  .months {
    position: relative;
    height: 32px;
    border-bottom: 1px solid var(--line);
  }
  .month-label {
    position: absolute;
    border-left: 1px solid var(--line);
    padding: 0 4px;
    font-size: 10px;
    line-height: 32px;
    color: var(--ink-soft);
    text-transform: capitalize;
  }
  .bar-row {
    position: relative;
    border-bottom: 1px solid var(--line);
  }
  .bar {
    position: absolute;
    top: 4px;
    border-radius: 4px;
    border-width: 1px;
    border-style: solid;
    opacity: 0.7;
  }
  .bar.ended {
    opacity: 0.35;
    border-style: dashed;
  }
  .bar-edge {
    position: absolute;
    top: 4px;
    width: 3px;
    border-radius: 0 4px 4px 0;
  }
</style>
