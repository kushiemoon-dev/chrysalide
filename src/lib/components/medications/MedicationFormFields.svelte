<script lang="ts">
  import { i18n } from '$lib/i18n.svelte'
  import {
    MEDICATION_TYPES,
    ADMINISTRATION_METHODS,
    DOSAGE_UNITS,
    STOCK_UNITS,
    PILL_ROUTES,
    INJECTION_ROUTES,
    getFrequenciesForMethod,
  } from '$lib/constants'
  import type {
    MedicationType,
    AdministrationMethod,
    SchedulingMode,
    PillAdministrationRoute,
    InjectionAdministrationRoute,
  } from '$lib/types'
  import Clock from '@lucide/svelte/icons/clock'
  import Plus from '@lucide/svelte/icons/plus'
  import Trash2 from '@lucide/svelte/icons/trash-2'

  let {
    name = $bindable(),
    type = $bindable(),
    dosage = $bindable(),
    unit = $bindable(),
    method = $bindable(),
    frequency = $bindable(),
    startDate = $bindable(),
    pillRoute = $bindable(),
    injectionRoute = $bindable(),
    schedulingMode = $bindable(),
    scheduledTimes = $bindable(),
    stock = $bindable(),
    stockUnit = $bindable(),
    stockAlert = $bindable(),
    saving,
    backHref,
    endDate = $bindable(undefined),
    isActive = $bindable(undefined),
    notes = $bindable(undefined),
  }: {
    name: string
    type: MedicationType
    dosage: string
    unit: string
    method: AdministrationMethod
    frequency: string
    startDate: string
    pillRoute: PillAdministrationRoute | undefined
    injectionRoute: InjectionAdministrationRoute | undefined
    schedulingMode: SchedulingMode
    scheduledTimes: string[]
    stock: string
    stockUnit: string
    stockAlert: string
    saving: boolean
    backHref: string
    endDate?: string
    isActive?: boolean
    notes?: string
  } = $props()

  function handleMethodChange(e: Event & { currentTarget: HTMLSelectElement }) {
    const newMethod = e.currentTarget.value as AdministrationMethod
    method = newMethod
    const valid = getFrequenciesForMethod(newMethod)
    if (!valid.includes(frequency)) frequency = valid[0]!
  }

  function handleAddTime() {
    scheduledTimes = [...scheduledTimes, '12:00']
  }

  function handleRemoveTime(index: number) {
    if (scheduledTimes.length > 1) {
      scheduledTimes = scheduledTimes.filter((_, i) => i !== index)
    }
  }
</script>

<div class="card">
  <p class="card-title">{i18n.t('medications.new.generalInfo')}</p>

  <div class="field">
    <label for="name">{i18n.t('medications.form.medicationName')}</label>
    <input
      id="name"
      bind:value={name}
      placeholder={i18n.t('medications.new.namePlaceholder')}
      required
    />
  </div>

  <div class="field">
    <label for="type">{i18n.t('medications.form.type')}</label>
    <select id="type" bind:value={type}>
      {#each Object.keys(MEDICATION_TYPES) as key (key)}
        <option value={key}>{i18n.t(`medications.types.${key}`)}</option>
      {/each}
    </select>
  </div>

  <div class="field-row">
    <div class="field">
      <label for="dosage">{i18n.t('medications.form.dosage')}</label>
      <input id="dosage" type="number" step="0.1" bind:value={dosage} placeholder="2" required />
    </div>
    <div class="field">
      <label for="unit">{i18n.t('medications.form.unit')}</label>
      <select id="unit" bind:value={unit}>
        {#each DOSAGE_UNITS as u (u)}
          <option value={u}>{u}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="field">
    <label for="method">{i18n.t('medications.form.method')}</label>
    <select id="method" value={method} onchange={handleMethodChange}>
      {#each Object.keys(ADMINISTRATION_METHODS) as key (key)}
        <option value={key}>{i18n.t(`medications.methods.${key}`)}</option>
      {/each}
    </select>
  </div>

  {#if method === 'pill'}
    <div class="field">
      <label for="pillRoute">{i18n.t('medications.form.pillRoute')}</label>
      <select
        id="pillRoute"
        value={pillRoute ?? ''}
        onchange={(e) =>
          (pillRoute = (e.currentTarget.value as PillAdministrationRoute) || undefined)}
      >
        <option value="">{i18n.t('medications.form.selectPlaceholder')}</option>
        {#each Object.keys(PILL_ROUTES) as key (key)}
          <option value={key}>{i18n.t(`medications.pillRoutes.${key}`)}</option>
        {/each}
      </select>
    </div>
  {/if}

  {#if method === 'injection'}
    <div class="field">
      <label for="injectionRoute">{i18n.t('medications.form.injectionRoute')}</label>
      <select
        id="injectionRoute"
        value={injectionRoute ?? ''}
        onchange={(e) =>
          (injectionRoute = (e.currentTarget.value as InjectionAdministrationRoute) || undefined)}
      >
        <option value="">{i18n.t('medications.form.selectPlaceholder')}</option>
        {#each Object.keys(INJECTION_ROUTES) as key (key)}
          <option value={key}>{i18n.t(`medications.injectionRoutes.${key}`)}</option>
        {/each}
      </select>
    </div>
  {/if}

  <div class="field">
    <label for="frequency">{i18n.t('medications.form.frequency')}</label>
    <select id="frequency" bind:value={frequency}>
      {#each getFrequenciesForMethod(method) as f (f)}
        <option value={f}>{i18n.t(`medications.frequencies.${f}`)}</option>
      {/each}
    </select>
  </div>

  {#if endDate !== undefined}
    <div class="field-row">
      <div class="field">
        <label for="startDate">{i18n.t('medications.form.startDate')}</label>
        <input id="startDate" type="date" bind:value={startDate} required />
      </div>
      <div class="field">
        <label for="endDate">{i18n.t('medications.form.endDate')}</label>
        <input id="endDate" type="date" bind:value={endDate} />
      </div>
    </div>
  {:else}
    <div class="field">
      <label for="startDate">{i18n.t('medications.form.startDate')}</label>
      <input id="startDate" type="date" bind:value={startDate} required />
    </div>
  {/if}

  {#if isActive !== undefined}
    <div class="switch-row">
      <div>
        <p class="switch-label">{i18n.t('medications.form.activeLabel')}</p>
        <p class="switch-desc">{i18n.t('medications.form.activeDescription')}</p>
      </div>
      <label class="switch">
        <input type="checkbox" bind:checked={isActive} />
        <span class="track"></span>
        <span class="thumb"></span>
      </label>
    </div>
  {/if}
</div>

<div class="card">
  <p class="card-title"><Clock size={14} /> {i18n.t('medications.new.schedulingTitle')}</p>

  <div class="switch-row">
    <div>
      <p class="switch-label">{i18n.t('medications.new.advancedMode')}</p>
      <p class="switch-desc">{i18n.t('medications.new.advancedModeDescription')}</p>
    </div>
    <label class="switch">
      <input
        type="checkbox"
        checked={schedulingMode === 'advanced'}
        onchange={(e) => (schedulingMode = e.currentTarget.checked ? 'advanced' : 'simple')}
      />
      <span class="track"></span>
      <span class="thumb"></span>
    </label>
  </div>

  {#if schedulingMode === 'advanced'}
    <div class="times">
      <p class="times-hint">{i18n.t('medications.new.advancedModeHint')}</p>
      {#each scheduledTimes as time, index (index)}
        <div class="time-row">
          <input
            type="time"
            value={time}
            onchange={(e) => {
              const next = [...scheduledTimes]
              next[index] = e.currentTarget.value
              scheduledTimes = next
            }}
          />
          {#if scheduledTimes.length > 1}
            <button type="button" class="icon-btn" onclick={() => handleRemoveTime(index)}>
              <Trash2 size={16} />
            </button>
          {/if}
        </div>
      {/each}
      <button type="button" class="btn btn-outline btn-block" onclick={handleAddTime}>
        <Plus size={16} />
        {i18n.t('medications.new.addTime')}
      </button>
    </div>
  {/if}
</div>

<div class="card">
  <p class="card-title">{i18n.t('medications.new.stockTitle')}</p>

  <div class="field-row">
    <div class="field">
      <label for="stock">{i18n.t('medications.form.stock')}</label>
      <input id="stock" type="number" step="0.1" bind:value={stock} placeholder="30" />
    </div>
    <div class="field">
      <label for="stockUnit">{i18n.t('medications.form.stockUnit')}</label>
      <select id="stockUnit" bind:value={stockUnit}>
        <option value="">{i18n.t('medications.form.selectPlaceholder')}</option>
        {#each STOCK_UNITS as u (u)}
          <option value={u}>{i18n.t(`medications.stockUnits.${u}`)}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="field">
    <label for="stockAlert">{i18n.t('medications.form.lowStockAlert')}</label>
    <input id="stockAlert" type="number" step="0.1" bind:value={stockAlert} placeholder="7" />
  </div>
</div>

{#if notes !== undefined}
  <div class="card">
    <p class="card-title">{i18n.t('medications.form.notesTitle')}</p>
    <textarea bind:value={notes} placeholder={i18n.t('medications.form.notesPlaceholder')} rows="3"
    ></textarea>
  </div>
{/if}

<div class="actions">
  <a href={backHref} class="btn btn-outline btn-block">{i18n.t('common.cancel')}</a>
  <button type="submit" class="btn btn-primary btn-block" disabled={saving}>
    {saving ? i18n.t('common.saving') : i18n.t('common.save')}
  </button>
</div>

<style>
  .card {
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 16px;
  }
  .card-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    margin: 0 0 14px;
  }
  .field {
    margin-bottom: 14px;
  }
  .field:last-child {
    margin-bottom: 0;
  }
  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 14px;
  }
  .field-row:last-child {
    margin-bottom: 0;
  }
  label {
    display: block;
    font-size: 12.5px;
    color: var(--ink-soft);
    margin-bottom: 6px;
  }
  input,
  select,
  textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--page);
    color: var(--ink);
    font-family: inherit;
    font-size: 14px;
  }
  textarea {
    resize: vertical;
  }
  .switch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 4px 0;
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
  .times {
    border-top: 1px solid var(--line);
    margin-top: 12px;
    padding-top: 12px;
  }
  .times-hint {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 0 0 10px;
  }
  .time-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .time-row input {
    flex: 1;
  }
  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    border: 1px solid var(--line);
    background: var(--page);
    color: var(--alert);
    border-radius: 10px;
    cursor: pointer;
  }
  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px 18px;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: var(--bg);
    color: var(--ink);
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .btn-block {
    width: 100%;
  }
  .btn-outline {
    background: transparent;
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    color: #fff;
    border: none;
  }
  .actions {
    display: flex;
    gap: 12px;
  }
  .actions .btn {
    flex: 1;
  }
</style>
