<script lang="ts">
  import { i18n } from '$lib/i18n.svelte'
  import {
    resources,
    getResourcesByCategory,
    searchResources,
    type Resource,
    type ResourceCategory,
  } from '$lib/resources-data'
  import Users from '@lucide/svelte/icons/users'
  import Stethoscope from '@lucide/svelte/icons/stethoscope'
  import Scale from '@lucide/svelte/icons/scale'
  import Heart from '@lucide/svelte/icons/heart'
  import BookOpen from '@lucide/svelte/icons/book-open'
  import ExternalLink from '@lucide/svelte/icons/external-link'
  import Search from '@lucide/svelte/icons/search'
  import HelpCircle from '@lucide/svelte/icons/help-circle'
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import Globe from '@lucide/svelte/icons/globe'

  const categories: ResourceCategory[] = ['community', 'medical', 'legal', 'support', 'information']

  const categoryConfig: Record<ResourceCategory, { icon: typeof Users; color: string }> = {
    community: { icon: Users, color: 'var(--blue-deep)' },
    medical: { icon: Stethoscope, color: 'var(--pink-deep)' },
    legal: { icon: Scale, color: 'var(--gold)' },
    support: { icon: Heart, color: 'var(--pink)' },
    information: { icon: BookOpen, color: 'var(--blue)' },
  }

  let searchQuery = $state('')
  let selectedCategory = $state<ResourceCategory | 'all'>('all')

  let filteredResources = $derived(
    searchQuery
      ? searchResources(searchQuery)
      : selectedCategory === 'all'
        ? resources
        : getResourcesByCategory(selectedCategory)
  )

  function selectCategory(cat: ResourceCategory | 'all') {
    selectedCategory = cat
    searchQuery = ''
  }
</script>

<div class="header">
  <h1>{i18n.t('resources.title')}</h1>
  <p class="subtitle">{i18n.t('resources.subtitle')}</p>
</div>

<div class="search-wrap">
  <Search size={16} class="search-icon" />
  <input
    type="search"
    placeholder={i18n.t('resources.searchPlaceholder')}
    bind:value={searchQuery}
  />
</div>

<div class="filter-row">
  <button
    type="button"
    class="filter-btn"
    class:active={selectedCategory === 'all'}
    onclick={() => selectCategory('all')}
  >
    {i18n.t('resources.all')}
  </button>
  {#each categories as cat (cat)}
    {@const config = categoryConfig[cat]}
    <button
      type="button"
      class="filter-btn"
      class:active={selectedCategory === cat}
      onclick={() => selectCategory(cat)}
    >
      <config.icon size={14} />
      {i18n.t(`resources.categories.${cat}`)}
    </button>
  {/each}
</div>

<a href="/resources/faq" class="card faq-link">
  <div class="faq-icon"><HelpCircle size={18} /></div>
  <div class="faq-body">
    <p class="row-title">{i18n.t('resources.faqCard')}</p>
    <p class="row-desc">{i18n.t('resources.faqCardDesc')}</p>
  </div>
  <ChevronRight size={18} class="chevron" />
</a>

{#if searchQuery || selectedCategory !== 'all'}
  <p class="results-count">
    {i18n
      .t(filteredResources.length !== 1 ? 'resources.resultsCount' : 'resources.resultCount')
      .replace('{count}', String(filteredResources.length))}
    {#if searchQuery}
      {i18n.t('resources.for')} "{searchQuery}"
    {/if}
  </p>
  <div class="list">
    {#each filteredResources as resource (resource.id)}
      {@render resourceCard(resource)}
    {/each}
  </div>
  {#if filteredResources.length === 0}
    <div class="empty-card">
      <Search size={28} />
      <p>{i18n.t('resources.noResults')}</p>
    </div>
  {/if}
{:else}
  {#each categories as category (category)}
    {@const categoryResources = getResourcesByCategory(category)}
    {#if categoryResources.length > 0}
      {@const config = categoryConfig[category]}
      <section class="category-section">
        <div class="category-head">
          <div
            class="category-icon"
            style:background={`color-mix(in srgb, ${config.color} 16%, transparent)`}
          >
            <config.icon size={16} color={config.color} />
          </div>
          <h2>{i18n.t(`resources.categories.${category}`)}</h2>
          <span class="count-badge">{categoryResources.length}</span>
        </div>
        <div class="list">
          {#each categoryResources as resource (resource.id)}
            {@render resourceCard(resource)}
          {/each}
        </div>
      </section>
    {/if}
  {/each}
{/if}

<p class="disclaimer">{i18n.t('resources.disclaimer')}</p>

{#snippet resourceCard(resource: Resource)}
  <a href={resource.url} target="_blank" rel="noopener noreferrer" class="card resource-card">
    <div class="resource-head">
      <h3>{i18n.t(`resources.items.${resource.id}.name`)}</h3>
      {#if resource.language !== 'fr'}
        <span class="lang-badge"><Globe size={11} />{resource.language.toUpperCase()}</span>
      {/if}
    </div>
    <p class="row-desc">{i18n.t(`resources.items.${resource.id}.description`)}</p>
    <div class="tag-row">
      {#each resource.tags.slice(0, 3) as tag (tag)}
        <span class="tag">{tag}</span>
      {/each}
    </div>
    <ExternalLink size={14} class="external-icon" />
  </a>
{/snippet}

<style>
  .header {
    margin-bottom: 16px;
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
  .search-wrap {
    position: relative;
    margin-bottom: 12px;
  }
  .search-wrap :global(.search-icon) {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--ink-soft);
  }
  .search-wrap input {
    width: 100%;
    padding: 10px 12px 10px 36px;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: var(--bg);
    color: var(--ink);
    font-family: inherit;
    font-size: 13.5px;
  }
  .filter-row {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    margin-bottom: 14px;
  }
  .filter-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
    padding: 7px 12px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: var(--bg);
    color: var(--ink-soft);
    font-family: inherit;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
  }
  .filter-btn.active {
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    color: #fff;
    border-color: transparent;
  }
  .card {
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 14px;
  }
  .faq-link {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: inherit;
    margin-bottom: 18px;
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--blue-deep) 8%, transparent),
      color-mix(in srgb, var(--pink-deep) 8%, transparent)
    );
  }
  .faq-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--blue-deep) 16%, transparent);
    color: var(--blue-deep);
    flex-shrink: 0;
  }
  .faq-body {
    flex: 1;
    min-width: 0;
  }
  .row-title {
    font-size: 13.5px;
    font-weight: 600;
    margin: 0;
  }
  .row-desc {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 2px 0 0;
  }
  .faq-link :global(.chevron) {
    color: var(--ink-soft);
    flex-shrink: 0;
  }
  .category-section {
    margin-bottom: 22px;
  }
  .category-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  .category-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 9px;
  }
  .category-head h2 {
    font-size: 14px;
    font-weight: 700;
    margin: 0;
  }
  .count-badge {
    margin-left: auto;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 9px;
    border-radius: 999px;
    border: 1px solid var(--line);
    color: var(--ink-soft);
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .resource-card {
    position: relative;
    display: block;
    text-decoration: none;
    color: inherit;
    padding-right: 34px;
  }
  .resource-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 2px;
  }
  .resource-head h3 {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
  }
  .lang-badge {
    display: flex;
    align-items: center;
    gap: 3px;
    flex-shrink: 0;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 999px;
    border: 1px solid var(--line);
    color: var(--ink-soft);
  }
  .tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 8px;
  }
  .tag {
    font-size: 10.5px;
    padding: 3px 8px;
    border-radius: 999px;
    background: var(--page);
    color: var(--ink-soft);
  }
  .resource-card :global(.external-icon) {
    position: absolute;
    top: 14px;
    right: 14px;
    color: var(--ink-soft);
  }
  .results-count {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 0 0 10px;
  }
  .empty-card {
    text-align: center;
    padding: 40px 16px;
    border: 1px solid var(--line);
    border-radius: 16px;
    color: var(--ink-soft);
  }
  .empty-card p {
    font-size: 13px;
    margin: 12px 0 0;
  }
  .disclaimer {
    font-size: 11px;
    color: var(--ink-soft);
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 12px 14px;
    margin-top: 18px;
  }
</style>
