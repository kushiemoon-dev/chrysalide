<script lang="ts">
  import { i18n } from '$lib/i18n.svelte'
  import { getPractitioners, searchPractitioners } from '$lib/db'
  import type { AppointmentType, Practitioner } from '$lib/types'
  import User from '@lucide/svelte/icons/user'
  import Plus from '@lucide/svelte/icons/plus'
  import MapPin from '@lucide/svelte/icons/map-pin'
  import Star from '@lucide/svelte/icons/star'

  let {
    value = $bindable(),
    practitionerId = $bindable(),
    specialty,
    placeholder = '',
    id,
    onSelect,
  }: {
    value: string
    practitionerId: number | undefined
    specialty?: AppointmentType
    placeholder?: string
    id?: string
    onSelect?: (practitioner: Practitioner) => void
  } = $props()

  let containerEl: HTMLDivElement | undefined = $state()
  let showSuggestions = $state(false)
  let suggestions = $state<Practitioner[]>([])
  let recentPractitioners = $state<Practitioner[]>([])
  let loading = $state(false)

  $effect(() => {
    const currentSpecialty = specialty
    getPractitioners(currentSpecialty).then((list) => {
      recentPractitioners = list.slice(0, 5)
    })
  })

  $effect(() => {
    const query = value
    if (query.length < 2) {
      suggestions = []
      return
    }
    loading = true
    const timer = setTimeout(() => {
      searchPractitioners(query, specialty)
        .then((results) => (suggestions = results))
        .finally(() => (loading = false))
    }, 200)
    return () => clearTimeout(timer)
  })

  function handleInput() {
    practitionerId = undefined
    showSuggestions = true
  }

  function selectPractitioner(practitioner: Practitioner) {
    value = practitioner.name
    practitionerId = practitioner.id
    onSelect?.(practitioner)
    showSuggestions = false
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') showSuggestions = false
  }

  function handleClickOutside(e: MouseEvent) {
    if (containerEl && !containerEl.contains(e.target as Node)) {
      showSuggestions = false
    }
  }

  $effect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  })

  let linked = $derived(practitionerId !== undefined)
  let displaySuggestions = $derived(value.length >= 2 ? suggestions : recentPractitioners)
  let showRecent = $derived(value.length < 2 && recentPractitioners.length > 0)
  let showCreateOption = $derived(
    value.length >= 2 && !suggestions.some((p) => p.name.toLowerCase() === value.toLowerCase())
  )
</script>

<div class="wrap" bind:this={containerEl}>
  <div class="input-row">
    <User size={16} class="input-icon" />
    <input
      {id}
      type="text"
      class:linked
      bind:value
      oninput={handleInput}
      onfocus={() => (showSuggestions = true)}
      onkeydown={handleKeydown}
      {placeholder}
    />
  </div>

  {#if showSuggestions && (displaySuggestions.length > 0 || showCreateOption || showRecent)}
    <div class="dropdown">
      {#if showRecent}
        <div class="dropdown-header">{i18n.t('practitioners.input.recentHeader')}</div>
      {/if}

      {#if value.length >= 2 && suggestions.length > 0}
        <div class="dropdown-header">
          {loading
            ? i18n.t('practitioners.input.searching')
            : i18n
                .t('practitioners.input.resultsCount')
                .replace('{count}', String(suggestions.length))}
        </div>
      {/if}

      {#if showCreateOption}
        <button type="button" class="option create" onclick={() => (showSuggestions = false)}>
          <Plus size={16} />
          <span>{i18n.t('practitioners.input.addOption').replace('{value}', value)}</span>
        </button>
      {/if}

      {#each displaySuggestions as practitioner (practitioner.id)}
        <button type="button" class="option" onclick={() => selectPractitioner(practitioner)}>
          <div class="option-icon"><User size={16} /></div>
          <div class="option-body">
            <div class="option-name">
              <span>{practitioner.name}</span>
              {#if practitioner.isTransFriendly}
                <Star size={12} class="star" />
              {/if}
            </div>
            <div class="option-meta">
              <span>{i18n.t('appointments.types.' + practitioner.specialty)}</span>
              {#if practitioner.location}
                <span class="dot">•</span>
                <span class="location"><MapPin size={12} />{practitioner.location}</span>
              {/if}
            </div>
          </div>
        </button>
      {/each}

      {#if value.length >= 2 && suggestions.length === 0 && !loading}
        <div class="empty">{i18n.t('practitioners.input.emptyResults')}</div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .wrap {
    position: relative;
  }
  .input-row {
    position: relative;
  }
  .input-row :global(.input-icon) {
    position: absolute;
    top: 50%;
    left: 11px;
    transform: translateY(-50%);
    color: var(--ink-soft);
  }
  input {
    width: 100%;
    padding: 9px 11px 9px 34px;
    border: 1px solid var(--line);
    border-radius: 9px;
    background: var(--page);
    color: var(--ink);
    font-family: inherit;
    font-size: 13.5px;
  }
  input.linked {
    border-color: var(--blue-deep);
  }
  .dropdown {
    position: absolute;
    z-index: 50;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    max-height: 260px;
    overflow-y: auto;
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 12px;
    box-shadow: 0 20px 50px -18px var(--shadow);
  }
  .dropdown-header {
    padding: 7px 12px;
    font-size: 11px;
    font-weight: 600;
    color: var(--ink-soft);
    background: color-mix(in srgb, var(--line) 40%, transparent);
    border-bottom: 1px solid var(--line);
  }
  .option {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    border: none;
    border-bottom: 1px solid var(--line);
    background: transparent;
    color: inherit;
    font-family: inherit;
    text-align: left;
    cursor: pointer;
  }
  .option:last-child {
    border-bottom: none;
  }
  .option:hover {
    background: color-mix(in srgb, var(--line) 40%, transparent);
  }
  .option.create {
    align-items: center;
    color: var(--blue-deep);
  }
  .option-icon {
    flex-shrink: 0;
    background: var(--line);
    border-radius: 8px;
    padding: 6px;
    color: var(--ink-soft);
  }
  .option-body {
    min-width: 0;
    flex: 1;
  }
  .option-name {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13.5px;
    font-weight: 600;
  }
  .option-name :global(.star) {
    color: var(--gold);
    fill: var(--gold);
    flex-shrink: 0;
  }
  .option-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    color: var(--ink-soft);
    margin-top: 2px;
  }
  .option-meta .dot {
    color: var(--ink-faint);
  }
  .option-meta .location {
    display: flex;
    align-items: center;
    gap: 3px;
  }
  .empty {
    padding: 16px 12px;
    text-align: center;
    font-size: 12.5px;
    color: var(--ink-soft);
  }
</style>
