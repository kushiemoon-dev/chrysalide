<script lang="ts">
  import { onMount } from 'svelte'
  import { format, isSameDay, isThisYear } from 'date-fns'
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import { getAppointments, getUpcomingAppointments } from '$lib/db'
  import type { Appointment } from '$lib/types'
  import YearCalendar from '$lib/components/appointments/YearCalendar.svelte'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'
  import Plus from '@lucide/svelte/icons/plus'

  let allAppointments = $state<Appointment[]>([])
  let upcomingCount = $state(0)
  let selectedDate = $state(new Date())
  let loading = $state(true)

  let dateLocale = $derived(getDateLocale(i18n.locale))

  onMount(async () => {
    const [all, upcoming] = await Promise.all([getAppointments(500), getUpcomingAppointments()])
    allAppointments = all
    upcomingCount = upcoming.length
    loading = false
  })

  let thisYearCount = $derived(allAppointments.filter((a) => isThisYear(new Date(a.date))).length)

  let selectedDayAppointments = $derived(
    allAppointments
      .filter((a) => isSameDay(new Date(a.date), selectedDate))
      .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
  )
</script>

{#if loading}
  <p class="loading">{i18n.t('common.loading')}</p>
{:else}
  <div class="header">
    <a href="/appointments" class="icon-link" aria-label={i18n.t('common.back')}
      ><ArrowLeft size={20} /></a
    >
    <div>
      <h1>{i18n.t('appointments.calendarPage.title')}</h1>
      <p class="subtitle">{i18n.t('appointments.calendarPage.subtitle')}</p>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat">
      <p class="stat-num">{allAppointments.length}</p>
      <p class="stat-label">{i18n.t('appointments.calendarPage.total')}</p>
    </div>
    <div class="stat">
      <p class="stat-num">{upcomingCount}</p>
      <p class="stat-label">{i18n.t('appointments.calendarPage.upcoming')}</p>
    </div>
    <div class="stat">
      <p class="stat-num">{thisYearCount}</p>
      <p class="stat-label">{i18n.t('appointments.calendarPage.thisYear')}</p>
    </div>
  </div>

  <div class="card">
    <YearCalendar
      appointments={allAppointments}
      {selectedDate}
      {dateLocale}
      onSelectDate={(d) => (selectedDate = d)}
    />
  </div>

  <div class="card">
    <div class="day-header">
      <span>{format(selectedDate, 'EEEE d MMMM yyyy', { locale: dateLocale })}</span>
      <a
        href="/appointments/new"
        class="icon-link small"
        aria-label={i18n.t('appointments.calendarPage.addRdv')}><Plus size={16} /></a
      >
    </div>

    {#if selectedDayAppointments.length === 0}
      <p class="empty">{i18n.t('appointments.calendarPage.noneThisDay')}</p>
    {:else}
      <div class="apt-list">
        {#each selectedDayAppointments as apt (apt.id)}
          <a href={`/appointments/${apt.id}`} class="apt-line">
            <span class="apt-type">{i18n.t('appointments.types.' + apt.type)}</span>
            {#if apt.time}<span class="apt-time">{apt.time}</span>{/if}
          </a>
        {/each}
      </div>
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
  .icon-link.small {
    width: 30px;
    height: 30px;
    border: 1px solid var(--line);
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 14px;
  }
  .stat {
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 10px;
    text-align: center;
  }
  .stat-num {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
  }
  .stat-label {
    font-size: 10.5px;
    color: var(--ink-soft);
    margin: 2px 0 0;
  }
  .card {
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 14px;
    margin-bottom: 14px;
  }
  .day-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    text-transform: capitalize;
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
    gap: 6px;
  }
  .apt-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 9px 10px;
    border-radius: 10px;
    background: var(--page);
    text-decoration: none;
  }
  .apt-type {
    font-size: 13.5px;
    font-weight: 600;
  }
  .apt-time {
    font-size: 12px;
    color: var(--ink-soft);
  }
</style>
