<script lang="ts">
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { format, differenceInDays } from 'date-fns'
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import {
    getMedication,
    deleteMedication,
    getMedicationLogs,
    deleteMedicationLog,
    updateMedicationLog,
    getGelApplicationHistory,
  } from '$lib/db'
  import { MEDICATION_TYPES } from '$lib/constants'
  import type { Medication, MedicationLog } from '$lib/types'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'
  import Trash2 from '@lucide/svelte/icons/trash-2'
  import Pencil from '@lucide/svelte/icons/pencil'
  import PillIcon from '@lucide/svelte/icons/pill'
  import Clock from '@lucide/svelte/icons/clock'
  import CalendarIcon from '@lucide/svelte/icons/calendar'
  import Package from '@lucide/svelte/icons/package'
  import AlertTriangle from '@lucide/svelte/icons/alert-triangle'
  import FileText from '@lucide/svelte/icons/file-text'
  import Syringe from '@lucide/svelte/icons/syringe'
  import X from '@lucide/svelte/icons/x'
  import Check from '@lucide/svelte/icons/check'
  import Droplet from '@lucide/svelte/icons/droplet'

  let medication = $state<Medication | null>(null)
  let recentLogs = $state<MedicationLog[]>([])
  let zoneHistory = $state<MedicationLog[]>([])
  let loading = $state(true)
  let deleting = $state(false)
  let editingLogId = $state<number | null>(null)
  let editingLogDate = $state('')
  let editingLogTime = $state('')

  async function loadData() {
    const id = parseInt(page.params.id!)
    if (isNaN(id)) {
      await goto('/medications')
      return
    }

    const med = await getMedication(id)
    if (!med) {
      await goto('/medications')
      return
    }

    medication = med
    recentLogs = await getMedicationLogs(id, 10)
    zoneHistory =
      med.method === 'gel' || med.method === 'patch' ? await getGelApplicationHistory(id, 10) : []
    loading = false
  }

  $effect(() => {
    void page.params.id
    loading = true
    loadData()
  })

  async function handleDelete() {
    if (!medication?.id || !confirm(i18n.t('medications.detail.deleteConfirm'))) return
    deleting = true
    await deleteMedication(medication.id)
    await goto('/medications')
  }

  function startEditLog(log: MedicationLog) {
    if (!log.id) return
    const date = new Date(log.timestamp)
    editingLogId = log.id
    editingLogDate = date.toISOString().split('T')[0]!
    editingLogTime = format(date, 'HH:mm')
  }

  function cancelEditLog() {
    editingLogId = null
    editingLogDate = ''
    editingLogTime = ''
  }

  async function saveEditLog() {
    if (!editingLogId || !editingLogDate || !editingLogTime) return
    await updateMedicationLog(editingLogId, {
      timestamp: new Date(`${editingLogDate}T${editingLogTime}`),
    })
    cancelEditLog()
    await loadData()
  }

  async function handleDeleteLog(logId: number) {
    if (!confirm(i18n.t('medications.detail.deleteLogConfirm'))) return
    await deleteMedicationLog(logId)
    await loadData()
  }

  function zoneLabel(zone: string) {
    return medication?.method === 'patch'
      ? i18n.t(`medications.patchZones.${zone}`)
      : i18n.t(`medications.gelZones.${zone}`)
  }
</script>

{#if loading}
  <p class="loading">{i18n.t('medications.list.loading')}</p>
{:else if medication}
  {@const typeInfo = MEDICATION_TYPES[medication.type]}
  {@const startDate = new Date(medication.startDate)}
  {@const daysSinceStart = differenceInDays(new Date(), startDate)}
  {@const isLowStock =
    medication.stock !== undefined &&
    medication.stockAlert !== undefined &&
    medication.stock <= medication.stockAlert}
  {@const methodDescription = `${i18n.t(`medications.methods.${medication.method}`)}${
    medication.method === 'pill' && medication.pillRoute
      ? ` (${i18n.t(`medications.pillRoutes.${medication.pillRoute}`)})`
      : medication.method === 'injection' && medication.injectionRoute
        ? ` (${i18n.t(`medications.injectionRoutes.${medication.injectionRoute}`)})`
        : ''
  }`}

  <div class="header">
    <div class="header-left">
      <a href="/medications" class="icon-link" aria-label={i18n.t('common.back')}
        ><ArrowLeft size={20} /></a
      >
      <div>
        <h1>{medication.name}</h1>
        <p class="subtitle">{medication.dosage} {medication.unit} · {methodDescription}</p>
      </div>
    </div>
    <div class="header-actions">
      <a
        href={`/medications/${medication.id}/edit`}
        class="icon-link"
        aria-label={i18n.t('common.edit')}><Pencil size={18} /></a
      >
      <button
        type="button"
        class="icon-link danger"
        onclick={handleDelete}
        disabled={deleting}
        aria-label={i18n.t('common.delete')}
      >
        <Trash2 size={18} />
      </button>
    </div>
  </div>

  <div class="badges">
    <span class="badge" style:border-color={typeInfo.color} style:color={typeInfo.color}>
      {i18n.t(`medications.types.${medication.type}`)}
    </span>
    {#if medication.isActive}
      <span class="badge active">{i18n.t('medications.detail.activeBadge')}</span>
    {:else}
      <span class="badge muted">{i18n.t('medications.list.inactiveBadge')}</span>
    {/if}
    {#if isLowStock}
      <span class="badge alert"
        ><AlertTriangle size={12} /> {i18n.t('medications.detail.lowStockBadge')}</span
      >
    {/if}
  </div>

  <div class="card type-card">
    <div class="type-icon" style:background={`${typeInfo.color}20`}>
      <PillIcon size={26} color={typeInfo.color} />
    </div>
    <div>
      <p class="name">{medication.name}</p>
      <p class="meta">{medication.dosage} {medication.unit} · {methodDescription}</p>
    </div>
  </div>

  <div class="card">
    <p class="card-title"><Clock size={14} /> {i18n.t('medications.detail.frequencyTitle')}</p>
    <p class="value">{i18n.t(`medications.frequencies.${medication.frequency}`)}</p>
    {#if medication.schedulingMode === 'advanced' && medication.scheduledTimes?.length}
      <div class="times-block">
        <p class="label">{i18n.t('medications.detail.scheduledTimesLabel')}</p>
        <div class="chips">
          {#each medication.scheduledTimes as time (time)}
            <span class="chip">{time}</span>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <div class="card">
    <p class="card-title"><CalendarIcon size={14} /> {i18n.t('medications.detail.periodTitle')}</p>
    <div class="row-line">
      <span class="label">{i18n.t('medications.detail.startDate')}</span>
      <span>{format(startDate, 'd MMMM yyyy', { locale: getDateLocale(i18n.locale) })}</span>
    </div>
    <div class="row-line">
      <span class="label">{i18n.t('medications.detail.durationLabel')}</span>
      <span>{daysSinceStart} {i18n.t('medications.detail.daysSuffix')}</span>
    </div>
    {#if medication.endDate}
      <div class="row-line">
        <span class="label">{i18n.t('medications.detail.endDate')}</span>
        <span
          >{format(new Date(medication.endDate), 'd MMMM yyyy', {
            locale: getDateLocale(i18n.locale),
          })}</span
        >
      </div>
    {/if}
  </div>

  {#if medication.stock !== undefined || medication.stockAlert !== undefined}
    <div class="card" class:alert-border={isLowStock}>
      <p class="card-title"><Package size={14} /> {i18n.t('medications.detail.stockTitle')}</p>
      {#if medication.stock !== undefined}
        <div class="row-line">
          <span class="label">{i18n.t('medications.detail.currentStockLabel')}</span>
          <span class:alert-text={isLowStock}>
            {medication.stock}
            {medication.stockUnit || medication.unit}
          </span>
        </div>
      {/if}
      {#if medication.stockAlert !== undefined}
        <div class="row-line">
          <span class="label">{i18n.t('medications.detail.lowStockAlert')}</span>
          <span>{medication.stockAlert} {medication.stockUnit || medication.unit}</span>
        </div>
      {/if}
    </div>
  {/if}

  {#if medication.notes}
    <div class="card">
      <p class="card-title"><FileText size={14} /> {i18n.t('medications.detail.notesTitle')}</p>
      <p class="notes">{medication.notes}</p>
    </div>
  {/if}

  {#if (medication.method === 'gel' || medication.method === 'patch') && zoneHistory.length > 0}
    <div class="card">
      <p class="card-title">
        <Droplet size={14} />
        {i18n.t('medications.detail.gelZonesRecentTitle')}
      </p>
      <div class="log-list">
        {#each zoneHistory as log (log.id)}
          <div class="log-line">
            <span class="label"
              >{format(new Date(log.timestamp), 'EEEE d MMM', {
                locale: getDateLocale(i18n.locale),
              })}</span
            >
            <div class="log-right">
              <span class="chip">{log.applicationZone && zoneLabel(log.applicationZone)}</span>
              <span>{format(new Date(log.timestamp), 'HH:mm')}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if recentLogs.length > 0}
    <div class="card">
      <p class="card-title">
        <Syringe size={14} />
        {i18n.t('medications.detail.recentDosesTitle')}
      </p>
      <div class="log-list">
        {#each recentLogs as log (log.id)}
          <div class="log-line">
            {#if editingLogId === log.id}
              <div class="edit-row">
                <input type="date" bind:value={editingLogDate} />
                <input type="time" bind:value={editingLogTime} />
                <button type="button" class="icon-btn ok" onclick={saveEditLog}
                  ><Check size={14} /></button
                >
                <button type="button" class="icon-btn" onclick={cancelEditLog}
                  ><X size={14} /></button
                >
              </div>
            {:else}
              <div class="log-full">
                <div class="log-top">
                  <span class="label"
                    >{format(new Date(log.timestamp), 'EEEE d MMM', {
                      locale: getDateLocale(i18n.locale),
                    })}</span
                  >
                  <div class="log-right">
                    {#if log.scheduledTime}
                      <span class="chip">{log.scheduledTime}</span>
                    {/if}
                    <span>{format(new Date(log.timestamp), 'HH:mm')}</span>
                    <button type="button" class="icon-btn" onclick={() => startEditLog(log)}
                      ><Pencil size={12} /></button
                    >
                    <button
                      type="button"
                      class="icon-btn danger"
                      onclick={() => log.id && handleDeleteLog(log.id)}><Trash2 size={12} /></button
                    >
                  </div>
                </div>
                {#if log.notes}
                  <p class="log-note">{log.notes}</p>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
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
  .subtitle {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 2px 0 0;
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
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid var(--line);
  }
  .badge.active {
    background: color-mix(in srgb, var(--ok) 18%, transparent);
    color: var(--ok);
    border-color: transparent;
  }
  .badge.muted {
    color: var(--ink-soft);
  }
  .badge.alert {
    background: color-mix(in srgb, var(--alert) 18%, transparent);
    color: var(--alert);
    border-color: transparent;
  }
  .card {
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 14px;
  }
  .card.alert-border {
    border-color: var(--alert);
  }
  .type-card {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .type-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .name {
    font-size: 15px;
    font-weight: 600;
    margin: 0;
  }
  .meta {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 2px 0 0;
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
    font-weight: 600;
    margin: 0;
  }
  .times-block {
    border-top: 1px solid var(--line);
    margin-top: 10px;
    padding-top: 10px;
  }
  .label {
    font-size: 12.5px;
    color: var(--ink-soft);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }
  .chip {
    font-size: 12px;
    padding: 3px 9px;
    border-radius: 999px;
    border: 1px solid var(--line);
  }
  .row-line {
    display: flex;
    justify-content: space-between;
    font-size: 13.5px;
    padding: 5px 0;
  }
  .alert-text {
    color: var(--alert);
    font-weight: 600;
  }
  .notes {
    font-size: 13.5px;
    white-space: pre-wrap;
    margin: 0;
  }
  .log-list {
    display: flex;
    flex-direction: column;
  }
  .log-line {
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
    font-size: 13px;
  }
  .log-line:last-child {
    border-bottom: none;
  }
  .log-full {
    width: 100%;
  }
  .log-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .log-right {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .log-note {
    font-size: 11.5px;
    color: var(--ink-soft);
    font-style: italic;
    margin: 4px 0 0;
  }
  .edit-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .edit-row input {
    padding: 6px 8px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--page);
    color: var(--ink);
    font-family: inherit;
    font-size: 12.5px;
  }
  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: none;
    background: transparent;
    color: var(--ink-soft);
    cursor: pointer;
    border-radius: 7px;
  }
  .icon-btn.ok {
    color: var(--ok);
  }
  .icon-btn.danger {
    color: var(--alert);
  }
</style>
