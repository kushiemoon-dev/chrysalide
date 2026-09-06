<script lang="ts">
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import { SvelteMap } from 'svelte/reactivity'
  import { i18n } from '$lib/i18n.svelte'
  import {
    getPractitioners,
    deletePractitioner,
    countAppointmentsForAllPractitioners,
  } from '$lib/db'
  import { APPOINTMENT_TYPES } from '$lib/constants'
  import type { Practitioner, AppointmentType } from '$lib/types'
  import Plus from '@lucide/svelte/icons/plus'
  import Pencil from '@lucide/svelte/icons/pencil'
  import Trash2 from '@lucide/svelte/icons/trash-2'
  import Users from '@lucide/svelte/icons/users'
  import MapPin from '@lucide/svelte/icons/map-pin'
  import Phone from '@lucide/svelte/icons/phone'
  import Mail from '@lucide/svelte/icons/mail'
  import Globe from '@lucide/svelte/icons/globe'
  import Star from '@lucide/svelte/icons/star'

  type FilterType = 'all' | AppointmentType

  let practitioners = $state<Practitioner[]>([])
  let appointmentCounts = new SvelteMap<number, number>()
  let loading = $state(true)
  let filter = $state<FilterType>('all')

  onMount(async () => {
    const [data, counts] = await Promise.all([
      getPractitioners(),
      countAppointmentsForAllPractitioners(),
    ])
    practitioners = data
    for (const [id, count] of counts) appointmentCounts.set(id, count)
    loading = false
  })

  async function handleDelete(practitioner: Practitioner) {
    if (
      !practitioner.id ||
      !confirm(
        i18n.t('practitioners.deleteDialog.description').replace('{name}', practitioner.name)
      )
    )
      return
    await deletePractitioner(practitioner.id)
    practitioners = practitioners.filter((p) => p.id !== practitioner.id)
  }

  let filtered = $derived(practitioners.filter((p) => filter === 'all' || p.specialty === filter))
  let grouped = $derived.by(() => {
    const acc: Partial<Record<AppointmentType, Practitioner[]>> = {}
    for (const p of filtered) {
      acc[p.specialty] = [...(acc[p.specialty] ?? []), p]
    }
    return Object.entries(acc) as [AppointmentType, Practitioner[]][]
  })
</script>

<div class="header">
  <div>
    <h1>{i18n.t('practitioners.title')}</h1>
    <p class="subtitle">
      {practitioners.length}
      {i18n.t(
        practitioners.length > 1 ? 'practitioners.registeredPlural' : 'practitioners.registered'
      )}
    </p>
  </div>
  <a href="/practitioners/new" class="btn-primary-sm">
    <Plus size={16} />
    {i18n.t('practitioners.add')}
  </a>
</div>

<div class="card">
  <select bind:value={filter}>
    <option value="all">{i18n.t('practitioners.list.allTypes')}</option>
    {#each Object.keys(APPOINTMENT_TYPES) as t (t)}
      <option value={t}>{i18n.t('appointments.types.' + t)}</option>
    {/each}
  </select>
</div>

{#if loading}
  <p class="loading">{i18n.t('appointments.list.loading')}</p>
{:else if practitioners.length === 0}
  <div class="empty-card">
    <Users size={28} />
    <h3>{i18n.t('practitioners.list.empty')}</h3>
    <p>{i18n.t('practitioners.list.emptyDesc')}</p>
    <a href="/practitioners/new" class="btn-primary-sm">
      <Plus size={16} />
      {i18n.t('practitioners.addPractitioner')}
    </a>
  </div>
{:else if filtered.length === 0}
  <p class="empty">{i18n.t('practitioners.list.emptyOfType')}</p>
{:else if filter === 'all'}
  {#each grouped as [specialty, list] (specialty)}
    <p class="group-title">{i18n.t('appointments.types.' + specialty)}</p>
    <div class="list">
      {#each list as practitioner (practitioner.id)}
        {@render card(practitioner)}
      {/each}
    </div>
  {/each}
{:else}
  <div class="list">
    {#each filtered as practitioner (practitioner.id)}
      {@render card(practitioner)}
    {/each}
  </div>
{/if}

{#snippet card(practitioner: Practitioner)}
  <div class="p-card" out:fade={{ duration: 200 }}>
    <div class="p-head">
      <div class="p-name">
        <span>{practitioner.name}</span>
        {#if practitioner.isTransFriendly}
          <Star size={14} class="star" />
        {/if}
      </div>
      <div class="p-actions">
        <a
          href={`/practitioners/${practitioner.id}/edit`}
          class="icon-link"
          aria-label={i18n.t('common.edit')}><Pencil size={16} /></a
        >
        <button
          type="button"
          class="icon-link danger"
          onclick={() => handleDelete(practitioner)}
          aria-label={i18n.t('common.delete')}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
    <div class="p-meta">
      {#if practitioner.location}
        <span><MapPin size={12} />{practitioner.location}</span>
      {/if}
      {#if practitioner.phone}
        <a href={`tel:${practitioner.phone}`}><Phone size={12} />{practitioner.phone}</a>
      {/if}
      {#if practitioner.email}
        <a href={`mailto:${practitioner.email}`}
          ><Mail size={12} />{i18n.t('practitioners.email')}</a
        >
      {/if}
      {#if practitioner.website}
        <a href={practitioner.website} target="_blank" rel="noopener noreferrer"
          ><Globe size={12} />{i18n.t('practitioners.siteWeb')}</a
        >
      {/if}
    </div>
    {#if practitioner.notes}
      <p class="p-notes">{practitioner.notes}</p>
    {/if}
    <span class="chip"
      >{i18n
        .t('practitioners.countRDV')
        .replace('{count}', String(appointmentCounts.get(practitioner.id!) ?? 0))}</span
    >
  </div>
{/snippet}

<style>
  .loading,
  .empty {
    color: var(--ink-soft);
    text-align: center;
    padding: 24px 0;
    font-size: 13px;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 18px;
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
  .card {
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 10px 16px;
    margin-bottom: 14px;
  }
  .card select {
    width: 100%;
    padding: 7px 4px;
    border: none;
    background: transparent;
    color: var(--ink);
    font-family: inherit;
    font-size: 13.5px;
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
  .group-title {
    font-size: 13px;
    color: var(--ink-soft);
    margin: 20px 0 8px;
    font-weight: 500;
  }
  .group-title:first-child {
    margin-top: 0;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .p-card {
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 14px;
    background: var(--bg);
  }
  .p-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .p-name {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14.5px;
    font-weight: 700;
  }
  .p-name :global(.star) {
    color: var(--gold);
    fill: var(--gold);
  }
  .p-actions {
    display: flex;
    gap: 2px;
  }
  .icon-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    color: var(--ink);
    text-decoration: none;
    border: none;
    background: transparent;
    cursor: pointer;
    flex-shrink: 0;
  }
  .icon-link.danger:hover {
    color: var(--alert);
  }
  .p-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    font-size: 12px;
    color: var(--ink-soft);
    margin-top: 6px;
  }
  .p-meta span,
  .p-meta a {
    display: flex;
    align-items: center;
    gap: 4px;
    color: inherit;
    text-decoration: none;
  }
  .p-notes {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 8px 0 0;
  }
  .chip {
    display: inline-block;
    margin-top: 10px;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: 999px;
    border: 1px solid var(--line);
    color: var(--ink-soft);
  }
</style>
