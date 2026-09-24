<script lang="ts">
  let {
    containerEl,
    x,
    date,
    rows,
  }: {
    containerEl: HTMLElement | undefined
    x: number
    date: string
    rows: { label: string; value: string; color: string; alert?: boolean }[]
  } = $props()

  let tooltipEl = $state<HTMLDivElement>()

  let left = $derived.by(() => {
    if (!containerEl || !tooltipEl) return x
    const wrapWidth = containerEl.clientWidth
    const ttWidth = tooltipEl.clientWidth
    return Math.max(6, Math.min(x - ttWidth / 2, wrapWidth - ttWidth - 6))
  })
</script>

<div class="chart-tooltip" bind:this={tooltipEl} style:left={`${left}px`}>
  <p class="tt-date">{date}</p>
  {#each rows as row (row.label)}
    <div class="tt-row">
      <span class="tt-dot" style:background={row.color}></span>
      <span class="tt-label">{row.label}:</span>
      <span class="tt-value" class:alert={row.alert}>{row.value}</span>
    </div>
  {/each}
</div>

<style>
  .chart-tooltip {
    position: absolute;
    top: 6px;
    z-index: 5;
    min-width: 140px;
    max-width: calc(100% - 12px);
    padding: 8px 10px;
    border-radius: 10px;
    background: var(--bg);
    border: 1px solid var(--line);
    box-shadow: 0 4px 16px var(--shadow);
    pointer-events: none;
  }
  .tt-date {
    font-size: 11px;
    font-weight: 600;
    color: var(--ink-soft);
    margin: 0 0 6px;
    text-transform: capitalize;
  }
  .tt-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    padding: 2px 0;
  }
  .tt-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .tt-label {
    color: var(--ink-soft);
  }
  .tt-value {
    font-weight: 600;
    margin-left: auto;
  }
  .tt-value.alert {
    color: var(--alert);
  }
</style>
