<script lang="ts">
  import { i18n } from '$lib/i18n.svelte'
  import { MOOD_LEVELS, MOOD_EMOJI, MOOD_COLOR } from './mood-config'
  import type { MoodLevel } from '$lib/types'

  let {
    value = $bindable(),
    label,
    size = 'md',
  }: {
    value: MoodLevel | undefined
    label: string
    size?: 'md' | 'lg'
  } = $props()
</script>

<div class="mood-picker">
  <p class="mood-label">{label}</p>
  <div class="mood-row">
    {#each MOOD_LEVELS as level (level)}
      {@const moodLabel = i18n.t('journal.moods.' + level)}
      <button
        type="button"
        class="mood-btn size-{size}"
        class:selected={value === level}
        style:background={value === level
          ? `color-mix(in srgb, ${MOOD_COLOR[level]} 30%, transparent)`
          : undefined}
        style:border-color={value === level ? MOOD_COLOR[level] : undefined}
        onclick={() => (value = level)}
        title={moodLabel}
        aria-label={moodLabel}
      >
        {MOOD_EMOJI[level]}
      </button>
    {/each}
  </div>
  {#if value}
    <p class="mood-value">{i18n.t('journal.moods.' + value)}</p>
  {/if}
</div>

<style>
  .mood-picker {
    margin-bottom: 4px;
  }
  .mood-label {
    font-size: 12px;
    color: var(--ink-soft);
    margin: 0 0 8px;
  }
  .mood-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .mood-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 2px solid var(--line);
    background: var(--page);
    cursor: pointer;
    opacity: 0.6;
    transition:
      opacity 0.15s ease,
      background 0.15s ease,
      border-color 0.15s ease;
  }
  .mood-btn.selected {
    opacity: 1;
  }
  .size-md {
    width: 38px;
    height: 38px;
    font-size: 18px;
  }
  .size-lg {
    width: 46px;
    height: 46px;
    font-size: 22px;
  }
  .mood-value {
    font-size: 12px;
    color: var(--ink-soft);
    margin: 6px 0 0;
  }
</style>
