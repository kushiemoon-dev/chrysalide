<script lang="ts">
  import { i18n } from '$lib/i18n.svelte'
  import { MOOD_EMOJI, MOOD_COLOR } from './mood-config'
  import type { MoodLevel } from '$lib/types'

  let { mood, size = 'sm' }: { mood: MoodLevel; size?: 'sm' | 'md' | 'lg' } = $props()
</script>

<span
  class="mood-badge size-{size}"
  style:background={`color-mix(in srgb, ${MOOD_COLOR[mood]} 22%, transparent)`}
  title={i18n.t('journal.moods.' + mood)}
>
  {MOOD_EMOJI[mood]}
</span>

<style>
  .mood-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .size-sm {
    width: 28px;
    height: 28px;
    font-size: 15px;
  }
  .size-md {
    width: 40px;
    height: 40px;
    font-size: 19px;
  }
  .size-lg {
    width: 48px;
    height: 48px;
    font-size: 23px;
  }
</style>
