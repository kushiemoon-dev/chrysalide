<script lang="ts">
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { format, set as setDateFields } from 'date-fns'
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import { getAppointment, deleteAppointment, getObjective } from '$lib/db'
  import type { Appointment, Objective } from '$lib/types'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'
  import Trash2 from '@lucide/svelte/icons/trash-2'
  import Pencil from '@lucide/svelte/icons/pencil'
  import Calendar from '@lucide/svelte/icons/calendar'
  import User from '@lucide/svelte/icons/user'
  import MapPin from '@lucide/svelte/icons/map-pin'
  import Bell from '@lucide/svelte/icons/bell'
  import Euro from '@lucide/svelte/icons/euro'
  import FileText from '@lucide/svelte/icons/file-text'
  import Target from '@lucide/svelte/icons/target'

  let appointment = $state<Appointment | null>(null)
  let objective = $state<Objective | null>(null)
  let loading = $state(true)

  async function loadData() {
    const id = parseInt(page.params.id!)
    if (isNaN(id)) {
      await goto('/appointments')
      return
    }

    const data = await getAppointment(id)
    if (!data) {
      await goto('/appointments')
      return
    }

    appointment = data
    objective = data.objectiveId ? ((await getObjective(data.objectiveId)) ?? null) : null
    loading = false
  }

  $effect(() => {
    void page.params.id
    loading = true
    loadData()
  })

  async function handleDelete() {
    if (!appointment?.id || !confirm(i18n.t('appointments.detail.deleteConfirm'))) return
    await deleteAppointment(appointment.id)
    await goto('/appointments')
  }

  let isPast = $derived.by(() => {
    if (!appointment) return false
    const aptDate = appointment.time
      ? setDateFields(new Date(appointment.date), {
          hours: Number(appointment.time.split(':')[0]),
          minutes: Number(appointment.time.split(':')[1]),
          seconds: 0,
          milliseconds: 0,
        })
      : setDateFields(new Date(appointment.date), {
          hours: 23,
          minutes: 59,
          seconds: 59,
          milliseconds: 999,
        })
    return aptDate < new Date()
  })
</script>

{#if loading}
  <p class="loading">{i18n.t('appointments.detail.loading')}</p>
{:else if appointment}
  <div class="header">
    <div class="header-left">
      <a href="/appointments" class="icon-link" aria-label={i18n.t('common.back')}
        ><ArrowLeft size={20} /></a
      >
      <div>
        <h1>
          {i18n.t('appointments.types.' + appointment.type)}
        </h1>
        {#if isPast}
          <span class="past-badge">{i18n.t('appointments.detail.pastBadge')}</span>
        {/if}
      </div>
    </div>
    <div class="header-actions">
      <a
        href={`/appointments/${appointment.id}/edit`}
        class="icon-link"
        aria-label={i18n.t('common.edit')}><Pencil size={18} /></a
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

  <div class="card">
    <p class="card-title"><Calendar size={14} /> {i18n.t('appointments.detail.dateAndTime')}</p>
    <p class="value">
      {format(new Date(appointment.date), 'EEEE d MMMM yyyy', {
        locale: getDateLocale(i18n.locale),
      })}
      {#if appointment.time}
        · {appointment.time}
      {/if}
    </p>
  </div>

  {#if appointment.doctor || appointment.location}
    <div class="card">
      <p class="card-title"><User size={14} /> {i18n.t('appointments.detail.information')}</p>
      {#if appointment.doctor}
        <div class="info-line">
          <span class="info-label">{i18n.t('appointments.detail.practitionerLabel')}</span>
          <span>{appointment.doctor}</span>
        </div>
      {/if}
      {#if appointment.location}
        <div class="info-line">
          <span class="info-label"
            ><MapPin size={12} /> {i18n.t('appointments.detail.locationLabel')}</span
          >
          <span>{appointment.location}</span>
        </div>
      {/if}
    </div>
  {/if}

  {#if appointment.reminderMinutes}
    <div class="card">
      <p class="card-title"><Bell size={14} /> {i18n.t('appointments.detail.reminderTitle')}</p>
      <p class="value">{i18n.t('appointments.reminderTimes.' + appointment.reminderMinutes)}</p>
    </div>
  {/if}

  {#if appointment.cost !== undefined && appointment.cost > 0}
    <div class="card">
      <p class="card-title"><Euro size={14} /> {i18n.t('appointments.detail.costTitle')}</p>
      <p class="value">{appointment.cost} €</p>
    </div>
  {/if}

  {#if objective}
    <div class="card">
      <p class="card-title"><Target size={14} /> {i18n.t('appointments.form.linkedObjective')}</p>
      <p class="value">{objective.title}</p>
    </div>
  {/if}

  {#if appointment.notes}
    <div class="card">
      <p class="card-title"><FileText size={14} /> {i18n.t('appointments.detail.notesTitle')}</p>
      <p class="notes">{appointment.notes}</p>
    </div>
  {/if}
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
  h1 {
    font-size: 19px;
    font-weight: 700;
    margin: 0;
  }
  .past-badge {
    display: inline-block;
    margin-top: 4px;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid var(--line);
    color: var(--ink-soft);
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
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    margin: 0 0 10px;
  }
  .value {
    font-size: 14px;
    margin: 0;
    text-transform: capitalize;
  }
  .info-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13.5px;
    padding: 6px 0;
  }
  .info-line:not(:last-child) {
    border-bottom: 1px solid var(--line);
  }
  .info-label {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-soft);
  }
  .notes {
    font-size: 13.5px;
    white-space: pre-wrap;
    margin: 0;
    color: var(--ink-soft);
  }
</style>
