<script module lang="ts">
  import type { TreatmentChangeType } from '$lib/types'
  import Play from '@lucide/svelte/icons/play'
  import Square from '@lucide/svelte/icons/square'
  import Pause from '@lucide/svelte/icons/pause'
  import RefreshCw from '@lucide/svelte/icons/refresh-cw'
  import TrendingUp from '@lucide/svelte/icons/trending-up'
  import Repeat from '@lucide/svelte/icons/repeat'
  import Clock from '@lucide/svelte/icons/clock'

  export const changeTypeConfig: Record<TreatmentChangeType, { icon: typeof Play; color: string }> =
    {
      started: { icon: Play, color: 'var(--ok)' },
      stopped: { icon: Square, color: 'var(--alert)' },
      paused: { icon: Pause, color: 'var(--watch)' },
      resumed: { icon: RefreshCw, color: 'var(--blue-deep)' },
      dosage_change: { icon: TrendingUp, color: 'var(--pink-deep)' },
      method_change: { icon: Repeat, color: 'var(--blue)' },
      frequency_change: { icon: Clock, color: 'var(--gold)' },
    }
</script>

<script lang="ts">
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import { format } from 'date-fns'
  import type { TreatmentChange } from '$lib/types'
  import Pill from '@lucide/svelte/icons/pill'
  import User from '@lucide/svelte/icons/user'
  import FileText from '@lucide/svelte/icons/file-text'

  let {
    change,
    showMedicationName = true,
  }: {
    change: TreatmentChange
    showMedicationName?: boolean
  } = $props()

  let config = $derived(changeTypeConfig[change.changeType])
</script>

<div class="entry">
  <div class="icon-wrap" style:background={`color-mix(in srgb, ${config.color} 16%, transparent)`}>
    <config.icon size={16} color={config.color} />
  </div>
  <div class="content">
    <div class="entry-head">
      <div>
        <span class="badge" style:color={config.color}>
          {i18n.t(`objectives.changeTypes.${change.changeType}`)}
        </span>
        {#if showMedicationName}
          <div class="med-name">
            <Pill size={12} />
            {change.medicationName}
          </div>
        {/if}
      </div>
      <time
        >{format(new Date(change.date), 'd MMM yyyy', { locale: getDateLocale(i18n.locale) })}</time
      >
    </div>

    {#if change.oldValue || change.newValue}
      <div class="values">
        {#if change.oldValue && change.newValue}
          <span class="old">{change.oldValue}</span> → <span class="new">{change.newValue}</span>
        {:else if change.newValue}
          <span class="new">{change.newValue}</span>
        {/if}
      </div>
    {/if}

    {#if change.reason}
      <p class="reason">{change.reason}</p>
    {/if}

    {#if change.prescribedBy}
      <div class="prescriber">
        <User size={12} />
        <span>{i18n.t('objectives.prescribedByPrefix')} {change.prescribedBy}</span>
      </div>
    {/if}

    {#if change.notes}
      <div class="notes">
        <FileText size={12} />
        <span>{change.notes}</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .entry {
    display: flex;
    gap: 10px;
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 12px;
  }
  .icon-wrap {
    flex-shrink: 0;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .content {
    flex: 1;
    min-width: 0;
  }
  .entry-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }
  .badge {
    display: inline-block;
    font-size: 11.5px;
    font-weight: 600;
  }
  .med-name {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink-soft);
    margin-top: 3px;
  }
  time {
    font-size: 11px;
    color: var(--ink-faint);
    white-space: nowrap;
  }
  .values {
    font-size: 13.5px;
    margin-top: 6px;
  }
  .old {
    color: var(--ink-faint);
    text-decoration: line-through;
  }
  .new {
    font-weight: 600;
  }
  .reason {
    font-size: 13px;
    color: var(--ink-soft);
    margin: 6px 0 0;
  }
  .prescriber {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    color: var(--ink-faint);
    margin-top: 6px;
  }
  .notes {
    display: flex;
    align-items: flex-start;
    gap: 5px;
    font-size: 11.5px;
    color: var(--ink-soft);
    background: var(--page);
    border-radius: 8px;
    padding: 7px 8px;
    margin-top: 8px;
  }
</style>
