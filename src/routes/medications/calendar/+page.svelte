<script lang="ts">
  import { onMount } from 'svelte'
  import {
    format,
    startOfMonth,
    endOfMonth,
    isSameDay,
    eachDayOfInterval,
    differenceInDays,
  } from 'date-fns'
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import { db, getMedications } from '$lib/db'
  import { getMedicationReminderTimes, shouldTakeMedicationOnDate } from '$lib/notifications'
  import type { Medication, MedicationLog } from '$lib/types'
  import MonthCalendar from '$lib/components/ui/MonthCalendar.svelte'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'
  import CalendarIcon from '@lucide/svelte/icons/calendar'
  import Loader2 from '@lucide/svelte/icons/loader-2'

  let medications = $state<Medication[]>([])
  let logs = $state<MedicationLog[]>([])
  let totalDaysWithLogs = $state(0)
  let selectedDate = $state(new Date())
  let currentMonth = $state(new Date())
  let loading = $state(true)
  let validating = $state(false)
  let togglingDose = $state<string | null>(null)

  let dateLocale = $derived(getDateLocale(i18n.locale))

  async function reloadMonthLogs() {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    logs = await db.medicationLogs.where('timestamp').between(start, end).toArray()
  }

  onMount(async () => {
    medications = await getMedications(false)

    const allLogs = await db.medicationLogs.filter((log) => log.taken === true).toArray()
    if (allLogs.length > 0) {
      const firstDose = allLogs.reduce((earliest, log) => {
        const logDate = new Date(log.timestamp)
        return logDate < earliest ? logDate : earliest
      }, new Date(allLogs[0]!.timestamp))
      totalDaysWithLogs = differenceInDays(new Date(), firstDose) + 1
    }

    await reloadMonthLogs()
    loading = false
  })

  function getLogsForDay(date: Date) {
    return logs.filter((log) => isSameDay(new Date(log.timestamp), date))
  }

  let daysWithLogs = $derived.by(() => {
    const uniqueDays: Record<string, Date> = {}
    for (const log of logs) {
      if (!log.taken) continue
      const day = new Date(log.timestamp)
      uniqueDays[format(day, 'yyyy-MM-dd')] = day
    }
    return Object.values(uniqueDays)
  })

  async function toggleDose(med: Medication, time: string, doseIndex: number) {
    const toggleKey = `${med.id}-${time}`
    togglingDose = toggleKey

    const existingLog = logs.find(
      (l) =>
        l.medicationId === med.id &&
        isSameDay(new Date(l.timestamp), selectedDate) &&
        l.scheduledTime === time
    )

    if (existingLog) {
      await db.medicationLogs.update(existingLog.id!, { taken: !existingLog.taken })
    } else {
      await db.medicationLogs.add({
        medicationId: med.id!,
        timestamp: selectedDate,
        taken: true,
        scheduledTime: time,
        doseIndex,
      })
    }

    await reloadMonthLogs()
    togglingDose = null
  }

  async function validateMonth() {
    if (
      !confirm(
        i18n
          .t('medications.calendar.validateConfirm')
          .replace('{month}', format(currentMonth, 'MMMM yyyy', { locale: dateLocale }))
      )
    ) {
      return
    }

    validating = true
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start, end })

    let totalAdded = 0

    for (const day of days) {
      for (const med of medications) {
        if (!shouldTakeMedicationOnDate(med, day)) continue

        const doseTimes = getMedicationReminderTimes(med)

        for (const time of doseTimes) {
          const existingLog = logs.find(
            (l) =>
              l.medicationId === med.id &&
              isSameDay(new Date(l.timestamp), day) &&
              l.scheduledTime === time
          )

          if (!existingLog) {
            await db.medicationLogs.add({
              medicationId: med.id!,
              timestamp: day,
              taken: true,
              scheduledTime: time,
              doseIndex: doseTimes.indexOf(time),
            })
            totalAdded++
          } else if (!existingLog.taken) {
            await db.medicationLogs.update(existingLog.id!, { taken: true })
            totalAdded++
          }
        }
      }
    }

    await reloadMonthLogs()
    alert(i18n.t('medications.calendar.validateSuccess').replace('{count}', String(totalAdded)))
    validating = false
  }

  let selectedDayLogs = $derived(getLogsForDay(selectedDate))
  let takenCount = $derived(selectedDayLogs.filter((l) => l.taken).length)
  let medicationsForSelectedDay = $derived(
    medications.filter((med) => shouldTakeMedicationOnDate(med, selectedDate))
  )
  let totalDoses = $derived(
    medicationsForSelectedDay.reduce((sum, med) => sum + getMedicationReminderTimes(med).length, 0)
  )
</script>

{#if loading}
  <p class="loading">{i18n.t('common.loading')}</p>
{:else}
  <div class="header">
    <a href="/medications" class="icon-link" aria-label={i18n.t('common.back')}
      ><ArrowLeft size={20} /></a
    >
    <div>
      <h1>{i18n.t('medications.calendar.title')}</h1>
      <p class="subtitle">{i18n.t('medications.calendar.subtitle')}</p>
    </div>
  </div>

  <div class="card">
    <MonthCalendar
      {currentMonth}
      {selectedDate}
      highlighted={daysWithLogs}
      {dateLocale}
      onSelectDate={(d) => (selectedDate = d)}
      onMonthChange={async (d) => {
        currentMonth = d
        await reloadMonthLogs()
      }}
    />
  </div>

  <div class="card">
    <div class="day-header">
      <span>{format(selectedDate, 'EEEE d MMMM yyyy', { locale: dateLocale })}</span>
      {#if takenCount > 0}
        <span class="chip">{takenCount}/{totalDoses} {i18n.t('medications.calendar.taken')}</span>
      {/if}
    </div>

    {#if medications.length === 0}
      <p class="empty">{i18n.t('medications.calendar.noMeds')}</p>
    {:else if medicationsForSelectedDay.length === 0}
      <p class="empty">{i18n.t('medications.calendar.noDoses')}</p>
    {:else}
      <div class="dose-list">
        {#each medicationsForSelectedDay as med (med.id)}
          {@const medLogs = selectedDayLogs.filter((l) => l.medicationId === med.id)}
          {@const doseTimes = getMedicationReminderTimes(med)}
          {#if doseTimes.length > 1}
            <p class="med-label">{med.name} ({med.dosage} {med.unit})</p>
            {#each doseTimes as time, idx (time)}
              {@const doseLog = medLogs.find((l) => l.scheduledTime === time)}
              {@const taken = doseLog?.taken ?? false}
              {@const toggleKey = `${med.id}-${time}`}
              {@const isToggling = togglingDose === toggleKey}
              <div class="dose-line" class:taken>
                <div class="dose-left">
                  {#if isToggling}
                    <Loader2 size={16} />
                  {:else}
                    <input
                      type="checkbox"
                      checked={taken}
                      onchange={() => toggleDose(med, time, idx)}
                    />
                  {/if}
                  <span>{time}</span>
                </div>
                {#if taken && doseLog}
                  <span class="dose-time">{format(new Date(doseLog.timestamp), 'HH:mm')}</span>
                {/if}
              </div>
            {/each}
          {:else}
            {@const taken = medLogs.some((l) => l.taken)}
            {@const takenAt = medLogs.find((l) => l.taken)}
            {@const time = doseTimes[0] || '00:00'}
            {@const toggleKey = `${med.id}-${time}`}
            {@const isToggling = togglingDose === toggleKey}
            <div class="dose-line" class:taken>
              <div class="dose-left">
                {#if isToggling}
                  <Loader2 size={16} />
                {:else}
                  <input
                    type="checkbox"
                    checked={taken}
                    onchange={() => toggleDose(med, time, 0)}
                  />
                {/if}
                <div>
                  <p class="med-name">{med.name}</p>
                  <p class="med-dosage">{med.dosage} {med.unit}</p>
                </div>
              </div>
              {#if taken && takenAt}
                <span class="dose-time">{format(new Date(takenAt.timestamp), 'HH:mm')}</span>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>

  <div class="card">
    <p class="card-title">
      {i18n.t('medications.calendar.stats')} · {format(currentMonth, 'MMMM yyyy', {
        locale: dateLocale,
      })}
    </p>
    <div class="stats-grid">
      <div class="stat">
        <p class="stat-num">{daysWithLogs.length}</p>
        <p class="stat-label">{i18n.t('medications.calendar.daysWithDoses')}</p>
      </div>
      <div class="stat">
        <p class="stat-num">{logs.filter((l) => l.taken).length}</p>
        <p class="stat-label">{i18n.t('medications.calendar.totalDoses')}</p>
      </div>
    </div>

    {#if totalDaysWithLogs > 0}
      <div class="stat-wide">
        <p class="stat-num">{totalDaysWithLogs}</p>
        <p class="stat-label">{i18n.t('medications.calendar.daysSinceStart')}</p>
      </div>
    {/if}

    <button
      type="button"
      class="btn-outline-block"
      disabled={validating || medications.length === 0}
      onclick={validateMonth}
    >
      <CalendarIcon size={16} />
      {validating
        ? i18n.t('medications.calendar.validating')
        : i18n.t('medications.calendar.validateMonth')}
    </button>
    <p class="help">{i18n.t('medications.calendar.validateHelp')}</p>
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
  .chip {
    font-size: 11.5px;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--blue-deep) 18%, transparent);
    color: var(--blue-deep);
  }
  .empty {
    font-size: 13px;
    color: var(--ink-soft);
    text-align: center;
    padding: 16px 0;
    margin: 0;
  }
  .dose-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .med-label {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--ink-soft);
    margin: 6px 0 0;
  }
  .dose-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border-radius: 10px;
    background: var(--page);
  }
  .dose-line.taken {
    background: color-mix(in srgb, var(--blue-deep) 12%, transparent);
  }
  .dose-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .med-name {
    font-size: 13.5px;
    font-weight: 600;
    margin: 0;
  }
  .med-dosage {
    font-size: 11.5px;
    color: var(--ink-soft);
    margin: 0;
  }
  .dose-time {
    font-size: 11.5px;
    color: var(--ink-soft);
  }
  .card-title {
    font-size: 13px;
    font-weight: 600;
    margin: 0 0 12px;
    text-transform: capitalize;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 10px;
  }
  .stat,
  .stat-wide {
    background: var(--page);
    border-radius: 10px;
    padding: 10px;
    text-align: center;
  }
  .stat-wide {
    margin-bottom: 12px;
  }
  .stat-num {
    font-size: 20px;
    font-weight: 700;
    margin: 0;
  }
  .stat-label {
    font-size: 11px;
    color: var(--ink-soft);
    margin: 2px 0 0;
  }
  .btn-outline-block {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 11px;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: transparent;
    color: var(--ink);
    font-family: inherit;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-outline-block:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .help {
    font-size: 11px;
    color: var(--ink-faint);
    text-align: center;
    margin: 8px 0 0;
  }
</style>
