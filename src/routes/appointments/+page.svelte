<script lang="ts">
  import { onMount } from 'svelte'
  import { format } from 'date-fns'
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import {
    getAppointments,
    getUpcomingAppointments,
    deleteAppointment,
    getTotalAppointmentsCost,
  } from '$lib/db'
  import { getRelativeDayLabel } from '$lib/appointment-labels'
  import type { Appointment } from '$lib/types'
  import Plus from '@lucide/svelte/icons/plus'
  import Pencil from '@lucide/svelte/icons/pencil'
  import Trash2 from '@lucide/svelte/icons/trash-2'
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import CalendarIcon from '@lucide/svelte/icons/calendar'
  import CalendarDays from '@lucide/svelte/icons/calendar-days'

  let allAppointments = $state<Appointment[]>([])
  let upcoming = $state<Appointment[]>([])
  let totalCost = $state(0)
  let loading = $state(true)
  let activeTab = $state<'upcoming' | 'past'>('upcoming')

  onMount(async () => {
    const [all, upcomingData, costData] = await Promise.all([
      getAppointments(500),
      getUpcomingAppointments(),
      getTotalAppointmentsCost(),
    ])
    allAppointments = all
    upcoming = upcomingData
    totalCost = costData.total
    loading = false
  })

  let upcomingIds = $derived(new Set(upcoming.map((a) => a.id)))
  let past = $derived(allAppointments.filter((a) => !upcomingIds.has(a.id)))
  let nextAppointment = $derived(upcoming[0] ?? null)

  async function handleDelete(id: number) {
    if (!confirm(i18n.t('appointments.detail.deleteConfirm'))) return
    await deleteAppointment(id)
    allAppointments = allAppointments.filter((a) => a.id !== id)
    upcoming = upcoming.filter((a) => a.id !== id)
  }

  function relativeLabel(date: Date) {
    const rel = getRelativeDayLabel(date, new Date())
    if (rel.key === 'inDays') {
      return i18n.t('appointments.list.inDays').replace('{days}', String(rel.days))
    }
    return i18n.t('appointments.list.' + rel.key)
  }
</script>

<div class="header">
  <div>
    <h1>{i18n.t('appointments.title')}</h1>
    <p class="subtitle">
      {i18n.t('appointments.list.countUpcoming').replace('{count}', String(upcoming.length))}
    </p>
  </div>
  <div class="header-actions">
    <a href="/appointments/calendar" class="icon-link" aria-label={i18n.t('appointments.calendar')}
      ><CalendarDays size={20} /></a
    >
    <a href="/appointments/new" class="btn-primary-sm">
      <Plus size={16} />
      {i18n.t('appointments.add')}
    </a>
  </div>
</div>

{#if loading}
  <p class="loading">{i18n.t('appointments.list.loading')}</p>
{:else if allAppointments.length === 0}
  <div class="empty-card">
    <CalendarIcon size={28} />
    <h3>{i18n.t('appointments.list.empty')}</h3>
    <p>{i18n.t('appointments.list.emptyDesc')}</p>
    <a href="/appointments/new" class="btn-primary-sm">
      <Plus size={16} />
      {i18n.t('appointments.list.emptyCta')}
    </a>
  </div>
{:else}
  {#if nextAppointment}
    <a href={`/appointments/${nextAppointment.id}`} class="card next-card">
      <p class="card-title">{i18n.t('appointments.list.nextTitle')}</p>
      <div class="next-row">
        <div>
          <p class="next-type">
            {i18n.t('appointments.types.' + nextAppointment.type)}
          </p>
          <p class="next-date">
            {format(new Date(nextAppointment.date), 'd MMMM yyyy', {
              locale: getDateLocale(i18n.locale),
            })}
            {#if nextAppointment.time}
              · {nextAppointment.time}
            {/if}
          </p>
        </div>
        <span class="chip">{relativeLabel(nextAppointment.date)}</span>
      </div>
    </a>
  {/if}

  {#if totalCost > 0}
    <div class="card blahaj-card">
      <p class="blahaj-label">{i18n.t('appointments.list.blahajLabel')}</p>
      <p class="blahaj-amount">
        {i18n.t('appointments.list.blahajBeforeAmount')}
        <span class="amount">{totalCost} €</span>
        {i18n.t('appointments.list.blahajAfterAmount')}
      </p>
    </div>
  {/if}

  <div class="tabs">
    <button
      type="button"
      class:active={activeTab === 'upcoming'}
      onclick={() => (activeTab = 'upcoming')}
    >
      {i18n.t('appointments.list.tabUpcoming').replace('{count}', String(upcoming.length))}
    </button>
    <button type="button" class:active={activeTab === 'past'} onclick={() => (activeTab = 'past')}>
      {i18n.t('appointments.list.tabPast').replace('{count}', String(past.length))}
    </button>
  </div>

  {#if activeTab === 'upcoming'}
    {#if upcoming.length === 0}
      <p class="empty">{i18n.t('appointments.list.noneUpcoming')}</p>
    {:else}
      <div class="apt-list">
        {#each upcoming as apt (apt.id)}
          {@render aptCard(apt)}
        {/each}
      </div>
    {/if}
  {:else if past.length === 0}
    <p class="empty">{i18n.t('appointments.list.nonePast')}</p>
  {:else}
    <div class="apt-list">
      {#each past as apt (apt.id)}
        {@render aptCard(apt)}
      {/each}
    </div>
  {/if}
{/if}

{#snippet aptCard(apt: Appointment)}
  <div class="apt-card">
    <div class="apt-head">
      <div>
        <span class="apt-type">{i18n.t('appointments.types.' + apt.type)}</span>
        <span class="apt-date"
          >{format(new Date(apt.date), 'd MMM yyyy', { locale: getDateLocale(i18n.locale) })}
          {#if apt.time}· {apt.time}{/if}</span
        >
      </div>
      <div class="apt-actions">
        <a
          href={`/appointments/${apt.id}/edit`}
          class="icon-link"
          aria-label={i18n.t('common.edit')}><Pencil size={16} /></a
        >
        <button
          type="button"
          class="icon-link danger"
          onclick={() => apt.id && handleDelete(apt.id)}
          aria-label={i18n.t('common.delete')}
        >
          <Trash2 size={16} />
        </button>
        <a
          href={`/appointments/${apt.id}`}
          class="icon-link"
          aria-label={i18n.t('appointments.list.detailsLabel')}><ChevronRight size={16} /></a
        >
      </div>
    </div>
    {#if apt.doctor || apt.location}
      <p class="apt-sub">{[apt.doctor, apt.location].filter(Boolean).join(' · ')}</p>
    {/if}
  </div>
{/snippet}

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
  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
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
    border: 1px solid var(--line);
    background: var(--bg);
    flex-shrink: 0;
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
    color: var(--ink-soft);
  }
  .next-card {
    display: block;
    text-decoration: none;
    color: inherit;
  }
  .next-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .next-type {
    font-size: 15px;
    font-weight: 700;
    margin: 0;
  }
  .next-date {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 3px 0 0;
    text-transform: capitalize;
  }
  .chip {
    font-size: 11.5px;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--blue-deep) 18%, transparent);
    color: var(--blue-deep);
    flex-shrink: 0;
  }
  .blahaj-card {
    text-align: center;
  }
  .blahaj-label {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--ink-soft);
    margin: 0 0 6px;
  }
  .blahaj-amount {
    font-size: 13.5px;
    margin: 0;
  }
  .blahaj-amount .amount {
    font-weight: 700;
    color: var(--blue-deep);
  }
  .tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 14px;
  }
  .tabs button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 9px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--bg);
    color: var(--ink-soft);
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
  }
  .tabs button.active {
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    color: #fff;
    border-color: transparent;
  }
  .empty {
    font-size: 13px;
    color: var(--ink-soft);
    text-align: center;
    padding: 16px 0;
    margin: 0;
  }
  .apt-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .apt-card {
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 14px;
    background: var(--bg);
  }
  .apt-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .apt-type {
    display: block;
    font-size: 14.5px;
    font-weight: 700;
  }
  .apt-date {
    display: block;
    font-size: 12px;
    color: var(--ink-soft);
    margin-top: 2px;
    text-transform: capitalize;
  }
  .apt-actions {
    display: flex;
    gap: 2px;
  }
  .apt-actions .icon-link {
    border: none;
    background: transparent;
    cursor: pointer;
  }
  .apt-actions .icon-link.danger:hover {
    color: var(--alert);
  }
  .apt-sub {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 8px 0 0;
  }
</style>
