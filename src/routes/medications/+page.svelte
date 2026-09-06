<script lang="ts">
  import { onMount } from 'svelte'
  import { format, subDays, addDays, set, startOfDay } from 'date-fns'
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import {
    getMedications,
    addMedicationLog,
    getTodayLogs,
    getLastMedicationLog,
    getYesterdayLogs,
    getGelApplicationHistory,
  } from '$lib/db'
  import {
    getMedicationReminderTimes,
    isPeriodicFrequency,
    getFrequencyIntervalDays,
    isAutoValidationEnabled,
    isScheduledTimePassed,
    shouldTakeMedicationToday,
    shouldTakeMedicationOnDate,
  } from '$lib/notifications'
  import { getNextApplicationZone } from '$lib/utils'
  import {
    MEDICATION_TYPES,
    GEL_APPLICATION_ZONES,
    PATCH_APPLICATION_ZONE_ORDER,
  } from '$lib/constants'
  import type { Medication, MedicationLog, ApplicationZone } from '$lib/types'
  import TreatmentGanttChart from '$lib/components/medications/TreatmentGanttChart.svelte'
  import Plus from '@lucide/svelte/icons/plus'
  import History from '@lucide/svelte/icons/history'
  import CalendarDays from '@lucide/svelte/icons/calendar-days'
  import MoreVertical from '@lucide/svelte/icons/more-vertical'
  import Check from '@lucide/svelte/icons/check'
  import Clock from '@lucide/svelte/icons/clock'
  import Droplet from '@lucide/svelte/icons/droplet'
  import BarChart3 from '@lucide/svelte/icons/bar-chart-3'
  import AlertTriangle from '@lucide/svelte/icons/alert-triangle'

  let activeMedications = $state<Medication[]>([])
  let inactiveMedications = $state<Medication[]>([])
  let todayLogs = $state<MedicationLog[]>([])
  let lastLogs = $state<Record<number, MedicationLog>>({})
  let loading = $state(true)

  let pastDoseModalOpen = $state(false)
  let pastDoseDialogEl: HTMLDialogElement | undefined = $state()
  let selectedMedId = $state<number | null>(null)
  let selectedMedName = $state('')
  let pastDate = $state('')
  let pastTime = $state('')
  let pastScheduledTime = $state<string | undefined>(undefined)
  let pastDoseIndex = $state<number | undefined>(undefined)
  let pastDoseNote = $state('')

  let zoneModalOpen = $state(false)
  let zoneDialogEl: HTMLDialogElement | undefined = $state()
  let zoneMedId = $state<number | null>(null)
  let zoneMedName = $state('')
  let zoneOrder = $state<ApplicationZone[]>([])
  let zoneLabels = $state<Record<string, string>>({})
  let selectedZone = $state<ApplicationZone | null>(null)
  let zoneScheduledTime = $state<string | undefined>(undefined)
  let zoneDoseIndex = $state<number | undefined>(undefined)
  let zoneNote = $state('')

  $effect(() => {
    if (!pastDoseDialogEl) return
    if (pastDoseModalOpen) pastDoseDialogEl.showModal()
    else pastDoseDialogEl.close()
  })

  $effect(() => {
    if (!zoneDialogEl) return
    if (zoneModalOpen) zoneDialogEl.showModal()
    else zoneDialogEl.close()
  })

  async function autoValidatePastDoses(medications: Medication[], existingLogs: MedicationLog[]) {
    if (!isAutoValidationEnabled()) return 0

    let autoCreatedCount = 0
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    for (const med of medications) {
      if (!med.id || !med.isActive) continue
      if (med.endDate && new Date(med.endDate) < todayStart) continue
      if (!shouldTakeMedicationToday(med)) continue

      const doseTimes = getMedicationReminderTimes(med)

      for (let i = 0; i < doseTimes.length; i++) {
        const time = doseTimes[i]!
        if (!isScheduledTimePassed(time)) continue

        const alreadyLogged = existingLogs.some(
          (log) => log.medicationId === med.id && log.scheduledTime === time
        )
        if (alreadyLogged) continue

        await addMedicationLog({
          medicationId: med.id,
          timestamp: new Date(),
          taken: true,
          scheduledTime: time,
          doseIndex: i,
          notes: i18n.t('medications.list.autoValidated'),
        })
        autoCreatedCount++
      }
    }

    return autoCreatedCount
  }

  async function autoValidateYesterdayDoses(medications: Medication[]) {
    if (!isAutoValidationEnabled()) return 0

    const yesterdayLogs = await getYesterdayLogs()
    let autoCreatedCount = 0

    const yesterday = subDays(new Date(), 1)
    const yesterdayStart = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    )

    for (const med of medications) {
      if (!med.id || !med.isActive) continue
      if (med.endDate && new Date(med.endDate) < yesterdayStart) continue
      if (!shouldTakeMedicationOnDate(med, yesterday)) continue

      const doseTimes = getMedicationReminderTimes(med)

      for (let i = 0; i < doseTimes.length; i++) {
        const time = doseTimes[i]!
        const alreadyLogged = yesterdayLogs.some(
          (log) => log.medicationId === med.id && log.scheduledTime === time
        )
        if (alreadyLogged) continue

        const [hours, minutes] = time.split(':').map(Number)
        const yesterdayTimestamp = set(yesterday, {
          hours: hours!,
          minutes: minutes!,
          seconds: 0,
          milliseconds: 0,
        })

        await addMedicationLog({
          medicationId: med.id,
          timestamp: yesterdayTimestamp,
          taken: true,
          scheduledTime: time,
          doseIndex: i,
          notes: i18n.t('medications.list.autoValidatedYesterday'),
        })
        autoCreatedCount++
      }
    }

    return autoCreatedCount
  }

  async function loadData() {
    const [allMeds, logs] = await Promise.all([getMedications(false), getTodayLogs()])

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const activeMeds = allMeds.filter((med) => {
      if (!med.isActive) return false
      if (med.endDate && new Date(med.endDate) < todayStart) return false
      return true
    })
    activeMedications = activeMeds
    inactiveMedications = allMeds.filter((med) => !activeMeds.includes(med))

    await autoValidateYesterdayDoses(activeMeds)
    const autoCreatedCount = await autoValidatePastDoses(activeMeds, logs)
    todayLogs = autoCreatedCount > 0 ? await getTodayLogs() : logs

    const periodicMeds = activeMeds.filter((med) => isPeriodicFrequency(med.frequency))
    const nextLastLogs: Record<number, MedicationLog> = {}
    await Promise.all(
      periodicMeds.map(async (med) => {
        if (med.id) {
          const lastLog = await getLastMedicationLog(med.id)
          if (lastLog) nextLastLogs[med.id] = lastLog
        }
      })
    )
    lastLogs = nextLastLogs
  }

  onMount(() => {
    loading = true
    loadData().finally(() => {
      loading = false
    })

    if (!isAutoValidationEnabled()) return

    const interval = setInterval(
      async () => {
        if (activeMedications.length === 0) return
        const logs = await getTodayLogs()
        const count = await autoValidatePastDoses(activeMedications, logs)
        if (count > 0) todayLogs = await getTodayLogs()
      },
      5 * 60 * 1000
    )
    return () => clearInterval(interval)
  })

  function openZoneModal(med: Medication, scheduledTime?: string, doseIndex?: number) {
    zoneMedId = med.id!
    zoneMedName = med.name
    zoneScheduledTime = scheduledTime
    zoneDoseIndex = doseIndex
    zoneNote = ''

    if (med.method === 'patch') {
      zoneOrder = PATCH_APPLICATION_ZONE_ORDER
      zoneLabels = Object.fromEntries(
        PATCH_APPLICATION_ZONE_ORDER.map((z) => [z, i18n.t(`medications.patchZones.${z}`)])
      )
    } else {
      zoneOrder = Object.keys(GEL_APPLICATION_ZONES) as ApplicationZone[]
      zoneLabels = Object.fromEntries(
        zoneOrder.map((z) => [z, i18n.t(`medications.gelZones.${z}`)])
      )
    }

    getGelApplicationHistory(zoneMedId, 1).then((history) => {
      const lastZone = history[0]?.applicationZone
      selectedZone = getNextApplicationZone(zoneOrder, lastZone)
    })

    zoneModalOpen = true
  }

  function closeZoneModal() {
    zoneModalOpen = false
    zoneMedId = null
    zoneMedName = ''
    selectedZone = null
    zoneScheduledTime = undefined
    zoneDoseIndex = undefined
    zoneNote = ''
  }

  async function handleSaveZoneDose() {
    if (!zoneMedId || !selectedZone) return

    await addMedicationLog({
      medicationId: zoneMedId,
      timestamp: new Date(),
      taken: true,
      scheduledTime: zoneScheduledTime,
      doseIndex: zoneDoseIndex,
      applicationZone: selectedZone,
      notes: zoneNote || undefined,
    })
    closeZoneModal()
    await loadData()
  }

  async function handleTakeMedication(medicationId: number, med: Medication) {
    const alreadyTaken = todayLogs.some((log) => log.medicationId === medicationId && log.taken)
    if (alreadyTaken) return

    if (med.method === 'gel' || med.method === 'patch') {
      openZoneModal(med)
      return
    }

    await addMedicationLog({ medicationId, timestamp: new Date(), taken: true })
    await loadData()
  }

  async function handleTakeDose(
    medicationId: number,
    scheduledTime: string,
    doseIndex: number,
    med: Medication
  ) {
    const alreadyTaken = todayLogs.some(
      (log) => log.medicationId === medicationId && log.scheduledTime === scheduledTime && log.taken
    )
    if (alreadyTaken) return

    if (med.method === 'gel' || med.method === 'patch') {
      openZoneModal(med, scheduledTime, doseIndex)
      return
    }

    await addMedicationLog({
      medicationId,
      timestamp: new Date(),
      taken: true,
      scheduledTime,
      doseIndex,
    })
    await loadData()
  }

  function isDoseTaken(medicationId: number, scheduledTime: string): boolean {
    return todayLogs.some(
      (log) => log.medicationId === medicationId && log.scheduledTime === scheduledTime && log.taken
    )
  }

  function getNextDoseDate(med: Medication): Date | null {
    if (!isPeriodicFrequency(med.frequency)) return null

    const interval = Math.round(getFrequencyIntervalDays(med.frequency))
    const today = new Date()
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    const lastLog = med.id ? lastLogs[med.id] : undefined
    const referenceDate = lastLog ? new Date(lastLog.timestamp) : new Date(med.startDate)
    const refDay = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate()
    )

    const nextDate = addDays(refDay, interval)

    if (nextDate <= todayDay) return todayDay
    return nextDate
  }

  function openPastDoseModal(med: Medication, scheduledTime?: string, doseIndex?: number) {
    selectedMedId = med.id!
    selectedMedName = med.name
    pastScheduledTime = scheduledTime
    pastDoseIndex = doseIndex
    const now = new Date()
    pastDate = now.toISOString().split('T')[0]!
    pastTime = format(now, 'HH:mm')
    pastDoseNote = ''
    pastDoseModalOpen = true
  }

  function closePastDoseModal() {
    pastDoseModalOpen = false
    selectedMedId = null
    selectedMedName = ''
    pastDate = ''
    pastTime = ''
    pastScheduledTime = undefined
    pastDoseIndex = undefined
    pastDoseNote = ''
  }

  async function handleSavePastDose() {
    if (!selectedMedId || !pastDate || !pastTime) return

    await addMedicationLog({
      medicationId: selectedMedId,
      timestamp: new Date(`${pastDate}T${pastTime}`),
      taken: true,
      scheduledTime: pastScheduledTime,
      doseIndex: pastDoseIndex,
      notes: pastDoseNote || undefined,
    })
    closePastDoseModal()
    await loadData()
  }
</script>

{#if loading}
  <p class="loading">{i18n.t('medications.list.loading')}</p>
{:else}
  <div class="header">
    <div>
      <h1>{i18n.t('medications.list.title')}</h1>
      <p class="subtitle">
        {activeMedications.length}
        {activeMedications.length > 1
          ? `${i18n.t('medications.list.medicationWordPlural')} ${i18n.t('medications.list.activePlural')}`
          : `${i18n.t('medications.list.medicationWord')} ${i18n.t('medications.list.active')}`}
      </p>
    </div>
    <div class="header-actions">
      <a
        href="/medications/history"
        class="icon-link"
        aria-label={i18n.t('medications.history.title')}><History size={18} /></a
      >
      <a
        href="/medications/calendar"
        class="icon-link"
        aria-label={i18n.t('medications.calendar.title')}><CalendarDays size={18} /></a
      >
      <a href="/medications/new" class="btn-primary-sm">
        <Plus size={16} />
        {i18n.t('medications.list.add')}
      </a>
    </div>
  </div>

  {#if activeMedications.length > 0 || inactiveMedications.length > 0}
    <details class="gantt-details">
      <summary>
        <BarChart3 size={16} />
        {i18n.t('medications.list.ganttTitle')}
      </summary>
      <div class="gantt-body">
        <TreatmentGanttChart medications={[...activeMedications, ...inactiveMedications]} />
      </div>
    </details>
  {/if}

  {#if activeMedications.length === 0 && inactiveMedications.length === 0}
    <div class="empty-card">
      <h3>{i18n.t('medications.list.noMedications')}</h3>
      <p>{i18n.t('medications.list.emptyDesc')}</p>
      <a href="/medications/new" class="btn-primary-sm">
        <Plus size={16} />
        {i18n.t('medications.list.emptyCta')}
      </a>
    </div>
  {:else}
    <div class="med-list">
      {#each activeMedications as med (med.id)}
        {@const typeInfo = MEDICATION_TYPES[med.type]}
        {@const isGelOrPatch = med.method === 'gel' || med.method === 'patch'}
        {@const taken = todayLogs.some((log) => log.medicationId === med.id && log.taken)}
        {@const isPeriodic = isPeriodicFrequency(med.frequency)}
        {@const doseTimes = getMedicationReminderTimes(med)}
        {@const isLowStock =
          med.stock !== undefined && med.stockAlert !== undefined && med.stock <= med.stockAlert}
        <div class="med-card">
          <div class="strip" style:background={typeInfo.color}></div>
          <div class="med-body">
            <div class="med-head">
              <div>
                <div class="name-row">
                  <h3>{med.name}</h3>
                  <span
                    class="type-badge"
                    style:border-color={typeInfo.color}
                    style:color={typeInfo.color}
                  >
                    {i18n.t(`medications.types.${med.type}`)}
                  </span>
                </div>
                <p class="meta">
                  {med.dosage}
                  {med.unit} · {i18n.t(`medications.methods.${med.method}`)}
                </p>
                <p class="meta-sm">
                  {i18n.t(`medications.frequencies.${med.frequency}`)} · {i18n.t(
                    'medications.list.sincePrefix'
                  )}
                  {format(new Date(med.startDate), 'd MMM yyyy', {
                    locale: getDateLocale(i18n.locale),
                  })}
                </p>
              </div>
              <a
                href={`/medications/${med.id}`}
                class="icon-link"
                aria-label={i18n.t('medications.list.detailsLabel')}><MoreVertical size={18} /></a
              >
            </div>

            <div class="dose-row">
              {#if isPeriodic && getNextDoseDate(med) && getNextDoseDate(med)! > startOfDay(new Date())}
                <span class="next-dose">
                  {i18n.t('medications.list.nextDose')}
                  {format(getNextDoseDate(med)!, 'd MMM', { locale: getDateLocale(i18n.locale) })}
                </span>
                <button type="button" class="btn-outline-sm" onclick={() => openPastDoseModal(med)}>
                  <Clock size={14} />
                  {i18n.t('medications.list.catchUp')}
                </button>
              {:else if doseTimes.length > 1}
                {#each doseTimes as time, index (time)}
                  {@const doseTaken = isDoseTaken(med.id!, time)}
                  <button
                    type="button"
                    class="btn-outline-sm"
                    class:taken={doseTaken}
                    disabled={doseTaken}
                    onclick={() => handleTakeDose(med.id!, time, index, med)}
                  >
                    {#if doseTaken}<Check size={13} />{:else if isGelOrPatch}<Droplet
                        size={13}
                      />{/if}
                    {time}
                  </button>
                {/each}
                <button type="button" class="btn-outline-sm" onclick={() => openPastDoseModal(med)}>
                  <Clock size={14} />
                  {i18n.t('medications.list.catchUp')}
                </button>
              {:else}
                <button
                  type="button"
                  class="btn-outline-sm"
                  class:taken
                  disabled={taken}
                  onclick={() => handleTakeMedication(med.id!, med)}
                >
                  {#if taken}<Check size={13} />{:else if isGelOrPatch}<Droplet size={13} />{/if}
                  {taken
                    ? i18n.t('medications.list.taken')
                    : isGelOrPatch
                      ? i18n.t('medications.list.apply')
                      : i18n.t('medications.list.take')}
                </button>
                <button
                  type="button"
                  class="btn-outline-sm"
                  onclick={() => openPastDoseModal(med)}
                  title={i18n.t('medications.list.addPastDoseButton')}
                >
                  <Clock size={13} />+
                </button>
              {/if}
            </div>

            {#if med.stock !== undefined && med.stockAlert !== undefined}
              <div class="stock-row">
                <span>{i18n.t('medications.list.stockLabel')}</span>
                <span class:low={isLowStock}>
                  {med.stock}
                  {med.stockUnit || med.unit}
                  {#if isLowStock}
                    <AlertTriangle size={12} />
                    {i18n.t('medications.list.stockLow')}
                  {/if}
                </span>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if inactiveMedications.length > 0}
    <details class="inactive-details">
      <summary>
        {inactiveMedications.length}
        {inactiveMedications.length > 1
          ? `${i18n.t('medications.list.medicationWordPlural')} ${i18n.t('medications.list.inactivePlural')}`
          : `${i18n.t('medications.list.medicationWord')} ${i18n.t('medications.list.inactive')}`}
      </summary>
      <div class="med-list">
        {#each inactiveMedications as med (med.id)}
          {@const typeInfo = MEDICATION_TYPES[med.type]}
          <div class="med-card inactive">
            <div class="strip" style:background={typeInfo.color}></div>
            <div class="med-body">
              <div class="med-head">
                <div>
                  <div class="name-row">
                    <h3>{med.name}</h3>
                    <span class="type-badge muted">{i18n.t('medications.list.inactiveBadge')}</span>
                  </div>
                  <p class="meta">
                    {med.dosage}
                    {med.unit} · {i18n.t(`medications.methods.${med.method}`)}
                  </p>
                </div>
                <a
                  href={`/medications/${med.id}`}
                  class="icon-link"
                  aria-label={i18n.t('medications.list.detailsLabel')}><MoreVertical size={18} /></a
                >
              </div>
            </div>
          </div>
        {/each}
      </div>
    </details>
  {/if}
{/if}

<dialog
  bind:this={zoneDialogEl}
  onclose={() => {
    zoneModalOpen = false
  }}
>
  <p class="dialog-title"><Droplet size={18} /> {i18n.t('medications.list.gelZoneDialogTitle')}</p>
  <p class="dialog-desc">
    {i18n.t('medications.list.gelZoneDialogDesc')} <b>{zoneMedName}</b>
  </p>
  <div class="zone-grid">
    {#each zoneOrder as zone (zone)}
      <button
        type="button"
        class="zone-btn"
        class:selected={selectedZone === zone}
        onclick={() => (selectedZone = zone)}
      >
        {zoneLabels[zone]}
      </button>
    {/each}
  </div>
  <div class="field">
    <label for="zoneNote">{i18n.t('medications.list.noteLabel')}</label>
    <textarea
      id="zoneNote"
      bind:value={zoneNote}
      placeholder={i18n.t('medications.list.notePlaceholder')}
      rows="2"
    ></textarea>
  </div>
  <div class="dialog-actions">
    <button type="button" class="btn-outline-sm" onclick={closeZoneModal}
      >{i18n.t('medications.list.cancel')}</button
    >
    <button
      type="button"
      class="btn-primary-sm"
      disabled={!selectedZone}
      onclick={handleSaveZoneDose}>{i18n.t('medications.list.save')}</button
    >
  </div>
</dialog>

<dialog
  bind:this={pastDoseDialogEl}
  onclose={() => {
    pastDoseModalOpen = false
  }}
>
  <p class="dialog-title">{i18n.t('medications.list.addPastDoseTitle')}</p>
  <p class="dialog-desc">
    {i18n.t('medications.list.pastDoseDesc')} <b>{selectedMedName}</b>
  </p>
  <div class="field-row">
    <div class="field">
      <label for="pastDate">{i18n.t('medications.list.dateLabel')}</label>
      <input id="pastDate" type="date" bind:value={pastDate} />
    </div>
    <div class="field">
      <label for="pastTime">{i18n.t('medications.list.timeLabel')}</label>
      <input id="pastTime" type="time" bind:value={pastTime} />
    </div>
  </div>
  <div class="field">
    <label for="pastDoseNote">{i18n.t('medications.list.noteLabel')}</label>
    <textarea
      id="pastDoseNote"
      bind:value={pastDoseNote}
      placeholder={i18n.t('medications.list.notePlaceholder')}
      rows="2"
    ></textarea>
  </div>
  <div class="dialog-actions">
    <button type="button" class="btn-outline-sm" onclick={closePastDoseModal}
      >{i18n.t('medications.list.cancel')}</button
    >
    <button type="button" class="btn-primary-sm" onclick={handleSavePastDose}
      >{i18n.t('medications.list.save')}</button
    >
  </div>
</dialog>

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
    gap: 6px;
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
  .btn-primary-sm:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .gantt-details,
  .inactive-details {
    margin-bottom: 16px;
  }
  .gantt-details summary,
  .inactive-details summary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 14px;
    border: 1px solid var(--line);
    border-radius: 12px;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    color: var(--ink-soft);
    list-style: none;
  }
  .gantt-details summary::-webkit-details-marker,
  .inactive-details summary::-webkit-details-marker {
    display: none;
  }
  .gantt-body {
    margin-top: 10px;
  }
  .empty-card {
    text-align: center;
    padding: 40px 16px;
    border: 1px solid var(--line);
    border-radius: 16px;
  }
  .empty-card h3 {
    font-size: 15px;
    margin: 0 0 6px;
  }
  .empty-card p {
    font-size: 13px;
    color: var(--ink-soft);
    margin: 0 0 16px;
  }
  .empty-card .btn-primary-sm {
    display: inline-flex;
  }
  .med-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .med-card {
    display: flex;
    border: 1px solid var(--line);
    border-radius: 16px;
    overflow: hidden;
    background: var(--bg);
  }
  .med-card.inactive {
    opacity: 0.6;
    border-style: dashed;
  }
  .strip {
    width: 5px;
    flex-shrink: 0;
  }
  .med-body {
    flex: 1;
    padding: 14px;
    min-width: 0;
  }
  .med-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }
  .name-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  h3 {
    font-size: 14.5px;
    font-weight: 600;
    margin: 0;
  }
  .type-badge {
    font-size: 10.5px;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid var(--line);
  }
  .type-badge.muted {
    color: var(--ink-soft);
  }
  .meta {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 3px 0 0;
  }
  .meta-sm {
    font-size: 11px;
    color: var(--ink-faint);
    margin: 2px 0 0;
  }
  .dose-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .btn-outline-sm {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 7px 12px;
    border-radius: 9px;
    border: 1px solid var(--line);
    background: var(--page);
    color: var(--ink);
    font-size: 12.5px;
    font-family: inherit;
    cursor: pointer;
    transition:
      background 0.25s ease,
      color 0.25s ease,
      border-color 0.25s ease,
      transform 0.15s ease;
  }
  .btn-outline-sm:active {
    transform: scale(0.94);
  }
  .btn-outline-sm.taken {
    background: color-mix(in srgb, var(--blue-deep) 18%, transparent);
    color: var(--blue-deep);
    border-color: transparent;
    animation: confirm-pop 0.4s ease;
  }
  .btn-outline-sm.taken :global(svg) {
    animation: icon-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .btn-outline-sm:disabled {
    cursor: default;
  }
  .next-dose {
    font-size: 12.5px;
    color: var(--ink-soft);
    align-self: center;
  }
  .stock-row {
    display: flex;
    justify-content: space-between;
    font-size: 11.5px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
    color: var(--ink-soft);
  }
  .stock-row .low {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--alert);
    font-weight: 600;
  }

  dialog {
    border: none;
    border-radius: 18px;
    padding: 18px;
    width: min(400px, calc(100vw - 48px));
    background: var(--bg);
    color: var(--ink);
  }
  dialog::backdrop {
    background: rgb(0 0 0 / 45%);
  }
  .dialog-title {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 15px;
    font-weight: 700;
    margin: 0 0 8px;
  }
  .dialog-desc {
    font-size: 13px;
    color: var(--ink-soft);
    margin: 0 0 14px;
  }
  .zone-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 14px;
  }
  .zone-btn {
    padding: 10px 12px;
    text-align: left;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--page);
    color: var(--ink);
    font-family: inherit;
    font-size: 13.5px;
    cursor: pointer;
  }
  .zone-btn.selected {
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    color: #fff;
    border-color: transparent;
  }
  .field {
    margin-bottom: 12px;
  }
  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 12px;
  }
  label {
    display: block;
    font-size: 12px;
    color: var(--ink-soft);
    margin-bottom: 5px;
  }
  input,
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
  .dialog-actions {
    display: flex;
    gap: 10px;
    margin-top: 4px;
  }
  .dialog-actions .btn-outline-sm,
  .dialog-actions .btn-primary-sm {
    flex: 1;
    justify-content: center;
  }
</style>
