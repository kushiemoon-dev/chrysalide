<script lang="ts">
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { format } from 'date-fns'
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import { getJournalEntry, deleteJournalEntry } from '$lib/db'
  import type { JournalEntry } from '$lib/types'
  import MoodBadge from '$lib/components/journal/MoodBadge.svelte'
  import TagBadge from '$lib/components/journal/TagBadge.svelte'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'
  import Pencil from '@lucide/svelte/icons/pencil'
  import Trash2 from '@lucide/svelte/icons/trash-2'
  import Lock from '@lucide/svelte/icons/lock'
  import Zap from '@lucide/svelte/icons/zap'
  import Moon from '@lucide/svelte/icons/moon'
  import CalendarIcon from '@lucide/svelte/icons/calendar'

  let entry = $state<JournalEntry | null>(null)
  let loading = $state(true)

  async function loadData() {
    const id = parseInt(page.params.id!)
    if (isNaN(id)) {
      await goto('/journal')
      return
    }

    const data = await getJournalEntry(id)
    if (!data) {
      await goto('/journal')
      return
    }

    entry = data
    loading = false
  }

  $effect(() => {
    void page.params.id
    loading = true
    loadData()
  })

  async function handleDelete() {
    if (!entry?.id || !confirm(i18n.t('journal.detail.confirmDelete'))) return
    await deleteJournalEntry(entry.id)
    await goto('/journal')
  }
</script>

{#if loading}
  <p class="loading">{i18n.t('journal.title')}...</p>
{:else if entry}
  <div class="header">
    <div class="header-left">
      <a href="/journal" class="icon-link" aria-label={i18n.t('common.back')}
        ><ArrowLeft size={20} /></a
      >
      <div>
        <div class="title-row">
          <h1>
            {format(new Date(entry.date), 'EEEE d MMMM', { locale: getDateLocale(i18n.locale) })}
          </h1>
          {#if entry.isPrivate}<Lock size={14} />{/if}
        </div>
        <p class="subtitle">
          {format(new Date(entry.date), 'HH:mm', { locale: getDateLocale(i18n.locale) })}
        </p>
      </div>
    </div>
    <div class="header-actions">
      <a href={`/journal/${entry.id}/edit`} class="icon-link" aria-label={i18n.t('common.edit')}
        ><Pencil size={18} /></a
      >
      <button
        type="button"
        class="icon-link danger"
        onclick={handleDelete}
        aria-label={i18n.t('common.delete')}
      >
        <Trash2 size={18} />
      </button>
    </div>
  </div>

  {#if entry.mood || entry.energyLevel || entry.sleepQuality}
    <div class="metrics-row">
      {#if entry.mood}
        <div class="card metric-card">
          <MoodBadge mood={entry.mood} size="lg" />
          <div>
            <p class="metric-label">{i18n.t('journal.detail.mood')}</p>
            <p class="metric-value">{i18n.t('journal.moods.' + entry.mood)}</p>
          </div>
        </div>
      {/if}
      {#if entry.energyLevel}
        <div class="card metric-card">
          <div
            class="metric-icon"
            style:background="color-mix(in srgb, var(--gold) 20%, transparent)"
          >
            <Zap size={18} color="var(--gold)" />
          </div>
          <div>
            <p class="metric-label">{i18n.t('journal.detail.energy')}</p>
            <p class="metric-value">{i18n.t('journal.moods.' + entry.energyLevel)}</p>
          </div>
        </div>
      {/if}
      {#if entry.sleepQuality}
        <div class="card metric-card">
          <div
            class="metric-icon"
            style:background="color-mix(in srgb, var(--blue-deep) 20%, transparent)"
          >
            <Moon size={18} color="var(--blue-deep)" />
          </div>
          <div>
            <p class="metric-label">{i18n.t('journal.detail.sleep')}</p>
            <p class="metric-value">{i18n.t('journal.moods.' + entry.sleepQuality)}</p>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <div class="card">
    <p class="content">{entry.content}</p>
  </div>

  {#if entry.tags.length > 0}
    <div class="card">
      <p class="card-title">{i18n.t('journal.detail.tags')}</p>
      <div class="tag-list">
        {#each entry.tags as tag (tag)}
          <TagBadge {tag} />
        {/each}
      </div>
    </div>
  {/if}

  <div class="card meta-card">
    <p class="meta-line">
      <CalendarIcon size={14} />
      {i18n.t('journal.detail.createdAt')}
      {format(new Date(entry.createdAt), 'dd/MM/yyyy HH:mm', {
        locale: getDateLocale(i18n.locale),
      })}
    </p>
    {#if entry.updatedAt && new Date(entry.updatedAt).getTime() !== new Date(entry.createdAt).getTime()}
      <p class="meta-line">
        <Pencil size={14} />
        {i18n.t('journal.detail.modifiedAt')}
        {format(new Date(entry.updatedAt), 'dd/MM/yyyy HH:mm', {
          locale: getDateLocale(i18n.locale),
        })}
      </p>
    {/if}
  </div>
{/if}

<style>
  .loading {
    color: var(--ink-soft);
    text-align: center;
    padding: 40px 0;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .title-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  h1 {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
    text-transform: capitalize;
  }
  .subtitle {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 2px 0 0;
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
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
    border: none;
    background: transparent;
    cursor: pointer;
    flex-shrink: 0;
  }
  .icon-link.danger {
    color: var(--alert);
  }
  .card {
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 14px;
  }
  .card-title {
    font-size: 13px;
    font-weight: 600;
    margin: 0 0 10px;
  }
  .metrics-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 14px;
  }
  .metric-card {
    flex: 1;
    min-width: 140px;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 0;
  }
  .metric-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .metric-label {
    font-size: 11px;
    color: var(--ink-soft);
    margin: 0;
  }
  .metric-value {
    font-size: 14px;
    font-weight: 600;
    margin: 2px 0 0;
  }
  .content {
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
    margin: 0;
  }
  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .meta-card {
    background: var(--page);
  }
  .meta-line {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 0;
  }
  .meta-line:not(:last-child) {
    margin-bottom: 4px;
  }
</style>
