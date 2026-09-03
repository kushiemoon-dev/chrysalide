<script lang="ts">
  import { i18n } from '$lib/i18n.svelte'
  import { APPOINTMENT_TYPES } from '$lib/constants'
  import type { AppointmentType } from '$lib/types'

  const TYPES = Object.keys(APPOINTMENT_TYPES) as AppointmentType[]

  let {
    name = $bindable(),
    specialty = $bindable(),
    location = $bindable(),
    phone = $bindable(),
    email = $bindable(),
    website = $bindable(),
    notes = $bindable(),
    isTransFriendly = $bindable(),
    saving,
    backHref,
  }: {
    name: string
    specialty: AppointmentType
    location: string
    phone: string
    email: string
    website: string
    notes: string
    isTransFriendly: boolean
    saving: boolean
    backHref: string
  } = $props()
</script>

<div class="card">
  <p class="card-title">{i18n.t('practitioners.new.basicInfo')}</p>
  <div class="field">
    <label for="name">{i18n.t('practitioners.new.fullName')}</label>
    <input
      id="name"
      type="text"
      bind:value={name}
      placeholder={i18n.t('practitioners.new.namePlaceholder')}
      required
    />
  </div>
  <div class="field">
    <label for="specialty">{i18n.t('practitioners.new.specialty')}</label>
    <select id="specialty" bind:value={specialty}>
      {#each TYPES as t (t)}
        <option value={t}>{i18n.t('appointments.types.' + t)}</option>
      {/each}
    </select>
  </div>
  <div class="switch-row">
    <div>
      <p class="switch-label">{i18n.t('practitioners.new.transFriendly')}</p>
      <p class="switch-desc">{i18n.t('practitioners.new.transFriendlyDesc')}</p>
    </div>
    <label class="switch">
      <input type="checkbox" bind:checked={isTransFriendly} />
      <span class="track"></span>
      <span class="thumb"></span>
    </label>
  </div>
</div>

<div class="card">
  <p class="card-title">{i18n.t('practitioners.new.contact')}</p>
  <div class="field">
    <label for="location">{i18n.t('practitioners.new.address')}</label>
    <input
      id="location"
      type="text"
      bind:value={location}
      placeholder={i18n.t('practitioners.new.addressPlaceholder')}
    />
  </div>
  <div class="field">
    <label for="phone">{i18n.t('practitioners.new.phone')}</label>
    <input
      id="phone"
      type="tel"
      bind:value={phone}
      placeholder={i18n.t('practitioners.new.phonePlaceholder')}
    />
  </div>
  <div class="field">
    <label for="email">{i18n.t('practitioners.new.email')}</label>
    <input
      id="email"
      type="email"
      bind:value={email}
      placeholder={i18n.t('practitioners.new.emailPlaceholder')}
    />
  </div>
  <div class="field">
    <label for="website">{i18n.t('practitioners.new.website')}</label>
    <input
      id="website"
      type="text"
      bind:value={website}
      placeholder={i18n.t('practitioners.new.websitePlaceholder')}
    />
  </div>
</div>

<div class="card">
  <p class="card-title">{i18n.t('practitioners.new.notes')}</p>
  <textarea bind:value={notes} placeholder={i18n.t('practitioners.new.notesPlaceholder')} rows="3"
  ></textarea>
</div>

<div class="actions">
  <a href={backHref} class="btn-outline-sm">{i18n.t('common.cancel')}</a>
  <button type="submit" class="btn-primary-sm" disabled={!name.trim() || saving}>
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
  .switch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0 0;
    border-top: 1px solid var(--line);
    margin-top: 12px;
  }
  .switch-label {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
  }
  .switch-desc {
    font-size: 12px;
    color: var(--ink-soft);
    margin: 2px 0 0;
  }
  .switch {
    position: relative;
    width: 44px;
    height: 26px;
    flex-shrink: 0;
  }
  .switch input {
    opacity: 0;
    width: 100%;
    height: 100%;
    position: absolute;
    margin: 0;
    cursor: pointer;
    z-index: 1;
  }
  .switch .track {
    position: absolute;
    inset: 0;
    background: var(--line);
    border-radius: 999px;
    transition: background 0.2s ease;
  }
  .switch input:checked + .track {
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
  }
  .switch .thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s ease;
    box-shadow: 0 1px 3px var(--shadow);
  }
  .switch input:checked ~ .thumb {
    transform: translateX(18px);
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
