<script lang="ts">
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { set as setDateFields } from 'date-fns'
  import { i18n } from '$lib/i18n.svelte'
  import { getJournalEntry, updateJournalEntry } from '$lib/db'
  import type { MoodLevel } from '$lib/types'
  import JournalFormFields from '$lib/components/journal/JournalFormFields.svelte'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'

  let loading = $state(true)
  let saving = $state(false)
  let entryId = $state<number | null>(null)
  let originalDate = $state(new Date())

  let date = $state('')
  let content = $state('')
  let mood = $state<MoodLevel | undefined>(undefined)
  let energyLevel = $state<MoodLevel | undefined>(undefined)
  let sleepQuality = $state<MoodLevel | undefined>(undefined)
  let tags = $state<string[]>([])
  let isPrivate = $state(false)

  async function loadData() {
    const id = parseInt(page.params.id!)
    if (isNaN(id)) {
      await goto('/journal')
      return
    }

    const entry = await getJournalEntry(id)
    if (!entry) {
      await goto('/journal')
      return
    }

    entryId = id
    originalDate = new Date(entry.date)
    date = originalDate.toISOString().split('T')[0]!
    content = entry.content
    mood = entry.mood
    energyLevel = entry.energyLevel
    sleepQuality = entry.sleepQuality
    tags = entry.tags
    isPrivate = entry.isPrivate ?? false

    loading = false
  }

  $effect(() => {
    void page.params.id
    loading = true
    loadData()
  })

  function withTimeOfDay(dateStr: string, source: Date): Date {
    const [year, month, day] = dateStr.split('-').map(Number)
    return setDateFields(source, { year, month: (month ?? 1) - 1, date: day, seconds: 0 })
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!entryId || !content.trim()) return

    saving = true
    try {
      await updateJournalEntry(entryId, {
        date: withTimeOfDay(date, originalDate),
        content: content.trim(),
        mood,
        tags: $state.snapshot(tags),
        energyLevel,
        sleepQuality,
        isPrivate,
      })
      await goto(`/journal/${entryId}`)
    } catch {
      saving = false
    }
  }
</script>

{#if loading}
  <p class="loading">{i18n.t('journal.title')}...</p>
{:else}
  <div class="header">
    <a href={`/journal/${entryId}`} class="icon-link" aria-label={i18n.t('common.back')}
      ><ArrowLeft size={20} /></a
    >
    <div>
      <h1>{i18n.t('journal.edit.title')}</h1>
      <p class="subtitle">{i18n.t('journal.edit.subtitle')}</p>
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
      variant="edit"
      {saving}
      backHref={`/journal/${entryId}`}
    />
  </form>
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
