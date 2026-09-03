<script lang="ts">
  import { goto } from '$app/navigation'
  import { set as setDateFields } from 'date-fns'
  import { i18n } from '$lib/i18n.svelte'
  import { addJournalEntry } from '$lib/db'
  import type { MoodLevel } from '$lib/types'
  import JournalFormFields from '$lib/components/journal/JournalFormFields.svelte'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'

  let saving = $state(false)

  let date = $state(new Date().toISOString().split('T')[0]!)
  let content = $state('')
  let mood = $state<MoodLevel | undefined>(undefined)
  let energyLevel = $state<MoodLevel | undefined>(undefined)
  let sleepQuality = $state<MoodLevel | undefined>(undefined)
  let tags = $state<string[]>([])
  let isPrivate = $state(false)

  function withTimeOfDay(dateStr: string, source: Date): Date {
    const [year, month, day] = dateStr.split('-').map(Number)
    return setDateFields(source, { year, month: (month ?? 1) - 1, date: day, seconds: 0 })
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!content.trim()) return

    saving = true
    try {
      await addJournalEntry({
        date: withTimeOfDay(date, new Date()),
        content: content.trim(),
        mood,
        tags: $state.snapshot(tags),
        energyLevel,
        sleepQuality,
        isPrivate,
      })
      await goto('/journal')
    } catch {
      saving = false
    }
  }
</script>

<div class="header">
  <a href="/journal" class="icon-link" aria-label={i18n.t('common.back')}><ArrowLeft size={20} /></a
  >
  <div>
    <h1>{i18n.t('journal.new.title')}</h1>
    <p class="subtitle">{i18n.t('journal.new.subtitle')}</p>
  </div>
</div>

<form onsubmit={handleSubmit}>
  <JournalFormFields
    bind:date
    bind:content
    bind:mood
    bind:energyLevel
    bind:sleepQuality
    bind:tags
    bind:isPrivate
    variant="new"
    {saving}
  />
</form>

<style>
  .header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
  }
  h1 {
    font-size: 19px;
    font-weight: 700;
    margin: 0;
  }
  .subtitle {
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
    flex-shrink: 0;
  }
</style>
