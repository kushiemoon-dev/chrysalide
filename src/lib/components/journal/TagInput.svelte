<script lang="ts">
  import { i18n } from '$lib/i18n.svelte'
  import { PREDEFINED_TAGS, TAG_CATEGORY_KEY, isPredefinedTag } from './tag-data'
  import type { JournalTagCategory } from '$lib/types'
  import TagBadge from './TagBadge.svelte'
  import Plus from '@lucide/svelte/icons/plus'
  import X from '@lucide/svelte/icons/x'

  let {
    value = $bindable(),
    placeholder,
    maxTags = 10,
  }: {
    value: string[]
    placeholder?: string
    maxTags?: number
  } = $props()

  let inputValue = $state('')
  let showSuggestions = $state(false)
  let container = $state<HTMLDivElement | undefined>()

  let suggestions = $derived(
    PREDEFINED_TAGS.filter(
      (tag) =>
        !value.includes(tag.name) && tag.name.toLowerCase().includes(inputValue.toLowerCase())
    ).slice(0, 8)
  )

  let groupedSuggestions = $derived.by(() => {
    const groups: Partial<Record<JournalTagCategory, typeof suggestions>> = {}
    for (const tag of suggestions) {
      groups[tag.category] = [...(groups[tag.category] ?? []), tag]
    }
    return Object.entries(groups) as [JournalTagCategory, typeof suggestions][]
  })

  function addTag(tag: string) {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !value.includes(trimmed) && value.length < maxTags) {
      value = [...value, trimmed]
      inputValue = ''
      showSuggestions = false
    }
  }

  function removeTag(tag: string) {
    value = value.filter((t) => t !== tag)
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]!)
    }
  }

  $effect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (container && !container.contains(e.target as Node)) showSuggestions = false
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  })
</script>

<div class="tag-input" bind:this={container}>
  {#if value.length > 0}
    <div class="chips">
      {#each value as tag (tag)}
        <span class="chip">
          <TagBadge {tag} />
          <button type="button" class="remove" onclick={() => removeTag(tag)} aria-label={tag}>
            <X size={12} />
          </button>
        </span>
      {/each}
    </div>
  {/if}

  <div class="input-row">
    <input
      type="text"
      bind:value={inputValue}
      onfocus={() => (showSuggestions = true)}
      onkeydown={handleKeydown}
      placeholder={value.length >= maxTags
        ? i18n.t('journal.tagInput.maxReached')
        : (placeholder ?? i18n.t('journal.tagInput.addTag'))}
      disabled={value.length >= maxTags}
    />
    {#if inputValue && value.length < maxTags}
      <button type="button" class="add-btn" onclick={() => addTag(inputValue)} aria-label="add">
        <Plus size={16} />
      </button>
    {/if}

    {#if showSuggestions && (inputValue || suggestions.length > 0)}
      <div class="dropdown">
        {#if inputValue && !isPredefinedTag(inputValue.toLowerCase())}
          <button type="button" class="dropdown-item create" onclick={() => addTag(inputValue)}>
            <Plus size={14} />
            {i18n.t('journal.tagInput.createTag').replace('{tag}', inputValue)}
          </button>
        {/if}
        {#each groupedSuggestions as [category, tags] (category)}
          <div class="dropdown-group-label">
            {i18n.t('journal.tagCategories.' + TAG_CATEGORY_KEY[category])}
          </div>
          {#each tags as tag (tag.name)}
            <button type="button" class="dropdown-item" onclick={() => addTag(tag.name)}>
              {i18n.t('journal.tags.' + tag.name)}
            </button>
          {/each}
        {/each}
        {#if suggestions.length === 0 && !inputValue}
          <p class="dropdown-help">{i18n.t('journal.tagInput.helpText')}</p>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .tag-input {
    position: relative;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    margin-left: -6px;
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
    opacity: 0.7;
  }
  .input-row {
    position: relative;
  }
  input {
    width: 100%;
    padding: 9px 36px 9px 11px;
    border: 1px solid var(--line);
    border-radius: 9px;
    background: var(--page);
    color: var(--ink);
    font-family: inherit;
    font-size: 13.5px;
  }
  .add-btn {
    position: absolute;
    top: 50%;
    right: 4px;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: var(--ink-soft);
    cursor: pointer;
  }
  .dropdown {
    position: absolute;
    z-index: 20;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    max-height: 240px;
    overflow-y: auto;
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 10px;
    box-shadow: 0 4px 16px var(--shadow);
  }
  .dropdown-group-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--ink-soft);
    padding: 6px 12px 4px;
  }
  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: transparent;
    color: var(--ink);
    font-family: inherit;
    font-size: 13px;
    text-align: left;
    cursor: pointer;
  }
  .dropdown-item:hover {
    background: var(--page);
  }
  .dropdown-item.create {
    color: var(--blue-deep);
    font-weight: 600;
  }
  .dropdown-help {
    font-size: 12.5px;
    color: var(--ink-soft);
    padding: 10px 12px;
    margin: 0;
  }
</style>
