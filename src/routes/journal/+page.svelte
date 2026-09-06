<script lang="ts">
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import { format } from 'date-fns'
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import { getJournalEntries, searchJournalEntries, getJournalStats } from '$lib/db'
  import type { JournalEntry } from '$lib/types'
  import MoodBadge from '$lib/components/journal/MoodBadge.svelte'
  import TagBadge from '$lib/components/journal/TagBadge.svelte'
  import Plus from '@lucide/svelte/icons/plus'
  import Search from '@lucide/svelte/icons/search'
  import BookOpen from '@lucide/svelte/icons/book-open'
  import TrendingUp from '@lucide/svelte/icons/trending-up'
  import CalendarIcon from '@lucide/svelte/icons/calendar'
  import Tag from '@lucide/svelte/icons/tag'
  import Lock from '@lucide/svelte/icons/lock'
  import ChevronRight from '@lucide/svelte/icons/chevron-right'

  type JournalStats = Awaited<ReturnType<typeof getJournalStats>>

  let entries = $state<JournalEntry[]>([])
  let stats = $state<JournalStats | null>(null)
  let loading = $state(true)
  let searchQuery = $state('')
  let selectedTag = $state<string | null>(null)

  onMount(async () => {
    const [entriesData, statsData] = await Promise.all([getJournalEntries(50), getJournalStats(30)])
    entries = entriesData
    stats = statsData
    loading = false
  })

  async function handleSearchInput() {
    selectedTag = null
    entries = searchQuery ? await searchJournalEntries(searchQuery) : await getJournalEntries(50)
  }

  let filteredEntries = $derived.by(() => {
    const tag = selectedTag
    return tag ? entries.filter((e) => e.tags.includes(tag)) : entries
  })
  let topTags = $derived.by(() =>
    stats
      ? Object.entries(stats.tagFrequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
      : []
  )

  function preview(content: string) {
    return content.length > 150 ? content.slice(0, 150) + '...' : content
  }
</script>

<div class="header">
  <div>
    <h1>{i18n.t('journal.title')}</h1>
    <p class="subtitle">{i18n.t('journal.subtitle')}</p>
  </div>
  <a href="/journal/new" class="btn-primary-sm">
    <Plus size={16} />
    {i18n.t('journal.newEntry')}
  </a>
</div>

<div class="search-wrap">
  <Search size={16} class="search-icon" />
  <input
    type="text"
    bind:value={searchQuery}
    oninput={handleSearchInput}
    placeholder={i18n.t('journal.searchPlaceholder')}
  />
</div>

{#if loading}
  <p class="loading">{i18n.t('journal.title')}...</p>
{:else}
  {#if stats && !searchQuery && !selectedTag}
    <div class="stats-grid">
      <div class="card stat-card">
        <div class="stat-icon"><BookOpen size={16} /></div>
        <div>
          <p class="stat-value">{stats.totalEntries}</p>
          <p class="stat-label">{i18n.t('journal.entries30d')}</p>
        </div>
      </div>
      <div class="card stat-card">
        {#if stats.averageMood}
          <MoodBadge mood={Math.round(stats.averageMood) as 1 | 2 | 3 | 4 | 5} size="md" />
        {:else}
          <div class="stat-icon"><TrendingUp size={16} /></div>
        {/if}
        <div>
          <p class="stat-value">{stats.averageMood ? stats.averageMood.toFixed(1) : '-'}</p>
          <p class="stat-label">{i18n.t('journal.avgMood')}</p>
        </div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon"><CalendarIcon size={16} /></div>
        <div>
          <p class="stat-value">{stats.entriesPerWeek.toFixed(1)}</p>
          <p class="stat-label">{i18n.t('journal.perWeek')}</p>
        </div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon"><Tag size={16} /></div>
        <div>
          <p class="stat-value">{Object.keys(stats.tagFrequency).length}</p>
          <p class="stat-label">{i18n.t('journal.tagsUsed')}</p>
        </div>
      </div>
    </div>
  {/if}

  {#if topTags.length > 0 && !searchQuery}
    <div class="tag-filter-row">
      <button
        type="button"
        class="tag-filter-btn"
        class:active={selectedTag === null}
        onclick={() => (selectedTag = null)}
      >
        {i18n.t('journal.all')}
      </button>
      {#each topTags as [tag, count] (tag)}
        <button
          type="button"
          class="tag-filter-btn"
          class:active={selectedTag === tag}
          onclick={() => (selectedTag = selectedTag === tag ? null : tag)}
        >
          {tag}
          <span class="count">{count}</span>
        </button>
      {/each}
    </div>
  {/if}

  {#if filteredEntries.length === 0}
    <div class="empty-card">
      <BookOpen size={28} />
      <h3>
        {searchQuery || selectedTag ? i18n.t('journal.noResults') : i18n.t('journal.noEntries')}
      </h3>
      <p>
        {#if searchQuery}
          {i18n.t('journal.tryOtherSearch')}
        {:else if selectedTag}
          {i18n.t('journal.noEntriesWithTag')}
        {:else}
          {i18n.t('journal.startWriting')}
        {/if}
      </p>
      {#if !searchQuery && !selectedTag}
        <a href="/journal/new" class="btn-primary-sm">
          <Plus size={16} />
          {i18n.t('journal.newEntry')}
        </a>
      {/if}
    </div>
  {:else}
    <div class="entry-list">
      {#each filteredEntries as entry (entry.id)}
        {@render entryCard(entry)}
      {/each}
    </div>
  {/if}

  {#if (searchQuery || selectedTag) && filteredEntries.length > 0}
    <p class="results-count">
      {filteredEntries.length}
      {filteredEntries.length > 1 ? i18n.t('journal.results') : i18n.t('journal.result')}
      {#if searchQuery}
        pour "{searchQuery}"
      {/if}
      {#if selectedTag}
        avec #{selectedTag}
      {/if}
    </p>
  {/if}
{/if}

{#snippet entryCard(entry: JournalEntry)}
  <a href={`/journal/${entry.id}`} class="entry-card" out:fade={{ duration: 200 }}>
    {#if entry.mood}
      <MoodBadge mood={entry.mood} size="md" />
    {/if}
    <div class="entry-body">
      <div class="entry-head">
        <time
          >{format(new Date(entry.date), 'EEEE d MMMM yyyy', {
            locale: getDateLocale(i18n.locale),
          })}</time
        >
        {#if entry.isPrivate}<Lock size={12} />{/if}
      </div>
      <p class="entry-preview">{preview(entry.content)}</p>
      {#if entry.tags.length > 0}
        <div class="entry-tags">
          {#each entry.tags.slice(0, 4) as tag (tag)}
            <TagBadge {tag} />
          {/each}
          {#if entry.tags.length > 4}
            <span class="tag-more">+{entry.tags.length - 4}</span>
          {/if}
        </div>
      {/if}
    </div>
    <ChevronRight size={18} class="chevron" />
  </a>
{/snippet}

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 14px;
  }
  h1 {
    font-size: 21px;
    font-weight: 700;
    margin: 0;
  }
  .subtitle {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 2px 0 0;
  }
  .btn-primary-sm {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 8px 14px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
  }
  .search-wrap {
    position: relative;
    margin-bottom: 16px;
  }
  .search-wrap :global(.search-icon) {
    position: absolute;
    top: 50%;
    left: 12px;
    transform: translateY(-50%);
    color: var(--ink-soft);
    pointer-events: none;
  }
  .search-wrap input {
    width: 100%;
    padding: 10px 12px 10px 36px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--bg);
    color: var(--ink);
    font-family: inherit;
    font-size: 13.5px;
  }
  .loading {
    color: var(--ink-soft);
    text-align: center;
    padding: 40px 0;
  }
  .card {
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 16px;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 14px;
  }
  .stat-card {
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--blue-deep) 14%, transparent);
    color: var(--blue-deep);
    flex-shrink: 0;
  }
  .stat-value {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
  }
  .stat-label {
    font-size: 11px;
    color: var(--ink-soft);
    margin: 0;
  }
  .tag-filter-row {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    margin-bottom: 14px;
    padding-bottom: 2px;
  }
  .tag-filter-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    padding: 7px 13px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: var(--bg);
    color: var(--ink-soft);
    font-family: inherit;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
  }
  .tag-filter-btn.active {
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    color: #fff;
    border-color: transparent;
  }
  .tag-filter-btn .count {
    font-size: 11px;
    opacity: 0.8;
  }
  .empty-card {
    text-align: center;
    padding: 40px 16px;
    border: 1px solid var(--line);
    border-radius: 16px;
    color: var(--ink-soft);
  }
  .empty-card h3 {
    font-size: 15px;
    color: var(--ink);
    margin: 12px 0 6px;
  }
  .empty-card p {
    font-size: 13px;
    margin: 0 0 16px;
  }
  .empty-card .btn-primary-sm {
    display: inline-flex;
  }
  .entry-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .entry-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 14px;
    background: var(--bg);
    text-decoration: none;
    color: inherit;
  }
  .entry-body {
    flex: 1;
    min-width: 0;
  }
  .entry-head {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .entry-head time {
    font-size: 13.5px;
    font-weight: 600;
    text-transform: capitalize;
  }
  .entry-preview {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 4px 0 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .entry-tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
    margin-top: 8px;
  }
  .tag-more {
    font-size: 11px;
    color: var(--ink-soft);
  }
  .entry-card :global(.chevron) {
    color: var(--ink-soft);
    flex-shrink: 0;
    margin-top: 2px;
  }
  .results-count {
    font-size: 13px;
    color: var(--ink-soft);
    text-align: center;
    padding: 16px 0 0;
    margin: 0;
  }
</style>
