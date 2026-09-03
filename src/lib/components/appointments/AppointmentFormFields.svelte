<script lang="ts">
  import { i18n } from '$lib/i18n.svelte'
  import { APPOINTMENT_TYPES, REMINDER_TIMES } from '$lib/constants'
  import type { AppointmentType, Objective } from '$lib/types'

  const TYPES = Object.keys(APPOINTMENT_TYPES) as AppointmentType[]

  let {
    date = $bindable(),
    time = $bindable(),
    type = $bindable(),
    doctor = $bindable(),
    location = $bindable(),
    notes = $bindable(),
    cost = $bindable(),
    reminderMinutes = $bindable(),
    objectiveId = $bindable(),
    objectives,
    saving,
    backHref,
  }: {
    date: string
    time: string
    type: AppointmentType
    doctor: string
    location: string
    notes: string
    cost: string
    reminderMinutes: string
    objectiveId: string
    objectives: Objective[]
    saving: boolean
    backHref: string
  } = $props()
</script>

<div class="card">
  <p class="card-title">{i18n.t('appointments.form.dateAndTime')}</p>
  <div class="field-row">
    <div class="field">
      <label for="date">{i18n.t('appointments.form.dateLabel')}</label>
      <input id="date" type="date" bind:value={date} required />
    </div>
    <div class="field">
      <label for="time">{i18n.t('appointments.form.timeLabel')}</label>
      <input id="time" type="time" bind:value={time} />
    </div>
  </div>
  <div class="field">
    <label for="type">{i18n.t('appointments.form.typeLabel')}</label>
    <select id="type" bind:value={type}>
      {#each TYPES as t (t)}
        <option value={t}>{i18n.t('appointments.types.' + t)}</option>
      {/each}
    </select>
  </div>
</div>

<div class="card">
  <p class="card-title">{i18n.t('appointments.form.details')}</p>
  <div class="field">
    <label for="doctor">{i18n.t('appointments.form.practitionerLabel')}</label>
    <input id="doctor" type="text" bind:value={doctor} />
  </div>
  <div class="field">
    <label for="location">{i18n.t('appointments.form.locationLabel')}</label>
    <input
      id="location"
      type="text"
      bind:value={location}
      placeholder={i18n.t('appointments.form.locationPlaceholder')}
    />
  </div>
  <div class="field-row">
    <div class="field">
      <label for="cost">{i18n.t('appointments.form.costLabel')}</label>
      <input
        id="cost"
        type="number"
        step="0.01"
        min="0"
        bind:value={cost}
        placeholder={i18n.t('appointments.form.costPlaceholder')}
      />
    </div>
    <div class="field">
      <label for="reminder">{i18n.t('appointments.form.reminderTitle')}</label>
      <select id="reminder" bind:value={reminderMinutes}>
        <option value="">{i18n.t('appointments.form.noReminder')}</option>
        {#each REMINDER_TIMES as r (r.value)}
          <option value={String(r.value)}>{i18n.t('appointments.reminderTimes.' + r.value)}</option>
        {/each}
      </select>
    </div>
  </div>
  <div class="field">
    <label for="objective">{i18n.t('appointments.form.linkedObjective')}</label>
    <select id="objective" bind:value={objectiveId}>
      <option value="">{i18n.t('appointments.form.noLinkedObjective')}</option>
      {#each objectives as objective (objective.id)}
        <option value={String(objective.id)}>{objective.title}</option>
      {/each}
    </select>
  </div>
  <div class="field">
    <label for="notes">{i18n.t('appointments.form.notesLabel')}</label>
    <textarea
      id="notes"
      bind:value={notes}
      placeholder={i18n.t('appointments.form.notesPlaceholder')}
      rows="3"
    ></textarea>
  </div>
</div>

<div class="actions">
  <a href={backHref} class="btn-outline-sm">{i18n.t('common.cancel')}</a>
  <button type="submit" class="btn-primary-sm" disabled={saving}>
    {saving ? i18n.t('common.saving') : i18n.t('common.save')}
  </button>
</div>

<style>
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
  }
  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .field {
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
  }
  .field:last-child {
    margin-bottom: 0;
  }
  label {
    font-size: 12px;
    color: var(--ink-soft);
    margin-bottom: 5px;
  }
  input,
  select,
  textarea {
    width: 100%;
    padding: 9px 11px;
    border: 1px solid var(--line);
    border-radius: 9px;
    background: var(--page);
    color: var(--ink);
    font-family: inherit;
    font-size: 13.5px;
  }
  .actions {
    display: flex;
    gap: 10px;
  }
  .btn-outline-sm,
  .btn-primary-sm {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 13.5px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    text-decoration: none;
    border: 1px solid var(--line);
    background: var(--page);
    color: var(--ink);
  }
  .btn-primary-sm {
    border: none;
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    color: #fff;
  }
  .btn-primary-sm:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
