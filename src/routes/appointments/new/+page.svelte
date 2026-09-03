<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { i18n } from '$lib/i18n.svelte'
  import {
    addAppointment,
    getObjectives,
    findOrCreatePractitioner,
    incrementPractitionerUsage,
  } from '$lib/db'
  import type { AppointmentType, Objective } from '$lib/types'
  import AppointmentFormFields from '$lib/components/appointments/AppointmentFormFields.svelte'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'

  let loading = $state(false)
  let objectives = $state<Objective[]>([])

  let date = $state(new Date().toISOString().split('T')[0]!)
  let time = $state('')
  let type = $state<AppointmentType>('general')
  let doctor = $state('')
  let practitionerId = $state<number | undefined>(undefined)
  let location = $state('')
  let notes = $state('')
  let cost = $state('')
  let reminderMinutes = $state('')
  let objectiveId = $state('')

  onMount(async () => {
    objectives = await getObjectives()
  })

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!date) {
      alert(i18n.t('appointments.form.selectDateAlert'))
      return
    }

    loading = true
    try {
      let finalPractitionerId = practitionerId
      if (doctor && !practitionerId) {
        finalPractitionerId = await findOrCreatePractitioner(doctor, type)
      } else if (practitionerId) {
        await incrementPractitionerUsage(practitionerId)
      }

      await addAppointment({
        date: new Date(date),
        time: time || undefined,
        type,
        doctor: doctor || undefined,
        practitionerId: finalPractitionerId,
        location: location || undefined,
        notes: notes || undefined,
        cost: cost ? parseFloat(cost) : undefined,
        reminderMinutes: reminderMinutes ? parseInt(reminderMinutes) : undefined,
        objectiveId: objectiveId ? parseInt(objectiveId) : undefined,
      })
      await goto('/appointments')
    } catch {
      alert(i18n.t('appointments.form.saveError'))
    } finally {
      loading = false
    }
  }
</script>

<div class="header">
  <a href="/appointments" class="icon-link" aria-label={i18n.t('common.back')}
    ><ArrowLeft size={20} /></a
  >
  <div>
    <h1>{i18n.t('appointments.new.title')}</h1>
    <p class="subtitle">{i18n.t('appointments.new.subtitle')}</p>
  </div>
</div>

<form onsubmit={handleSubmit}>
  <AppointmentFormFields
    bind:date
    bind:time
    bind:type
    bind:doctor
    bind:practitionerId
    bind:location
    bind:notes
    bind:cost
    bind:reminderMinutes
    bind:objectiveId
    {objectives}
    saving={loading}
    backHref="/appointments"
  />
</form>

<style>
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
