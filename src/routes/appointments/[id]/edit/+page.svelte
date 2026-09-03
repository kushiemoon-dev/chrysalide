<script lang="ts">
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { i18n } from '$lib/i18n.svelte'
  import { getAppointment, updateAppointment, getObjectives } from '$lib/db'
  import type { AppointmentType, Objective } from '$lib/types'
  import AppointmentFormFields from '$lib/components/appointments/AppointmentFormFields.svelte'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'

  let loading = $state(true)
  let saving = $state(false)
  let appointmentId = $state<number | null>(null)
  let objectives = $state<Objective[]>([])

  let date = $state('')
  let time = $state('')
  let type = $state<AppointmentType>('general')
  let doctor = $state('')
  let location = $state('')
  let notes = $state('')
  let cost = $state('')
  let reminderMinutes = $state('')
  let objectiveId = $state('')

  async function loadData() {
    const id = parseInt(page.params.id!)
    if (isNaN(id)) {
      await goto('/appointments')
      return
    }

    const [appointment, objectivesData] = await Promise.all([getAppointment(id), getObjectives()])
    if (!appointment) {
      await goto('/appointments')
      return
    }

    appointmentId = id
    objectives = objectivesData

    date = new Date(appointment.date).toISOString().split('T')[0]!
    time = appointment.time ?? ''
    type = appointment.type
    doctor = appointment.doctor ?? ''
    location = appointment.location ?? ''
    notes = appointment.notes ?? ''
    cost = appointment.cost !== undefined ? String(appointment.cost) : ''
    reminderMinutes =
      appointment.reminderMinutes !== undefined ? String(appointment.reminderMinutes) : ''
    objectiveId = appointment.objectiveId !== undefined ? String(appointment.objectiveId) : ''

    loading = false
  }

  $effect(() => {
    void page.params.id
    loading = true
    loadData()
  })

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!appointmentId) return
    if (!date) {
      alert(i18n.t('appointments.form.selectDateAlert'))
      return
    }

    saving = true
    try {
      await updateAppointment(appointmentId, {
        date: new Date(date),
        time: time || undefined,
        type,
        doctor: doctor || undefined,
        location: location || undefined,
        notes: notes || undefined,
        cost: cost ? parseFloat(cost) : undefined,
        reminderMinutes: reminderMinutes ? parseInt(reminderMinutes) : undefined,
        objectiveId: objectiveId ? parseInt(objectiveId) : undefined,
      })
      await goto(`/appointments/${appointmentId}`)
    } catch {
      alert(i18n.t('appointments.form.saveError'))
    } finally {
      saving = false
    }
  }
</script>

{#if loading}
  <p class="loading">{i18n.t('appointments.detail.loading')}</p>
{:else}
  <div class="header">
    <a href={`/appointments/${appointmentId}`} class="icon-link" aria-label={i18n.t('common.back')}
      ><ArrowLeft size={20} /></a
    >
    <div>
      <h1>{i18n.t('appointments.edit.title')}</h1>
      <p class="subtitle">{i18n.t('appointments.edit.subtitle')}</p>
    </div>
  </div>

  <form onsubmit={handleSubmit}>
    <AppointmentFormFields
      bind:date
      bind:time
      bind:type
      bind:doctor
      bind:location
      bind:notes
      bind:cost
      bind:reminderMinutes
      bind:objectiveId
      {objectives}
      {saving}
      backHref={`/appointments/${appointmentId}`}
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
