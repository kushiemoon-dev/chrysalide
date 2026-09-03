<script lang="ts">
  import { onMount } from 'svelte'
  import { formatDistanceToNow, format } from 'date-fns'
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import GaugeMeter from '$lib/components/ui/GaugeMeter.svelte'
  import Pill from '$lib/components/ui/Pill.svelte'
  import SectionTitle from '$lib/components/ui/SectionTitle.svelte'
  import Row from '$lib/components/ui/Row.svelte'
  import StockBar from '$lib/components/ui/StockBar.svelte'
  import ThemeSwitch from '$lib/components/ui/ThemeSwitch.svelte'
  import {
    getUserProfile,
    getMedications,
    getTodayLogs,
    getBloodTests,
    getUpcomingAppointments,
    getJournalEntries,
    getGelApplicationHistory,
  } from '$lib/db'
  import { shouldTakeMedicationToday, getMedicationReminderTimes } from '$lib/notifications'
  import { estimateStockDaysRemaining } from '$lib/notifications'
  import { getNextApplicationZone } from '$lib/utils'
  import {
    REFERENCE_RANGES,
    BLOOD_MARKERS,
    getHematocritStatus,
    GEL_APPLICATION_ZONES,
    PATCH_APPLICATION_ZONES,
    PATCH_APPLICATION_ZONE_ORDER,
  } from '$lib/constants'
  import type {
    Medication,
    MedicationLog,
    Appointment,
    JournalEntry,
    BloodTestResult,
    ApplicationZone,
  } from '$lib/types'

  let firstName = $state<string | undefined>(undefined)
  let primaryHormone = $state<BloodTestResult | undefined>(undefined)
  let primaryHormoneRange = $state<{ min: number; max: number; unit: string } | undefined>(
    undefined
  )
  let isVerifiedMasculinizingTestosterone = $state(false)
  let hematocrit = $state<BloodTestResult | undefined>(undefined)
  let nextDoseMed = $state<Medication | undefined>(undefined)
  let nextDoseTime = $state<string | undefined>(undefined)
  let zoneLabels = $state<Record<string, string>>({})
  let zoneOrder = $state<string[]>([])
  let nextZone = $state<string | undefined>(undefined)
  let stockDaysRemaining = $state<number | null>(null)
  let appointment = $state<Appointment | undefined>(undefined)
  let journalEntry = $state<JournalEntry | undefined>(undefined)
  let loaded = $state(false)

  onMount(async () => {
    const [profile, meds, todayLogs, bloodTests, appointments, journalEntries] = await Promise.all([
      getUserProfile(),
      getMedications(true),
      getTodayLogs(),
      getBloodTests(1),
      getUpcomingAppointments(),
      getJournalEntries(1),
    ])

    firstName = profile?.firstName
    const targetGender = profile?.targetGender ?? 'feminizing'

    const latestBloodTest = bloodTests[0]
    if (latestBloodTest) {
      const primaryMarker = targetGender === 'feminizing' ? 'estradiol' : 'testosterone'
      primaryHormone = latestBloodTest.results.find((r) => r.marker === primaryMarker)
      if (primaryHormone) {
        const range =
          REFERENCE_RANGES.find((r) => r.marker === primaryMarker && r.context === targetGender) ??
          REFERENCE_RANGES.find((r) => r.marker === primaryMarker && r.context === 'masculinizing')
        if (range) {
          primaryHormoneRange = { min: range.min, max: range.max, unit: range.unit }
          // The only citation verified against a source during chantier 0 research: HAS
          // (France, 2025) declines a fixed masculinizing testosterone target, Callen-Lorde's
          // range is the one actually used here. Other marker/context combinations aren't
          // sourced, so they get no citation rather than a fabricated one.
          isVerifiedMasculinizingTestosterone =
            primaryMarker === 'testosterone' && range.context === 'masculinizing'
        }
      }
      hematocrit = latestBloodTest.results.find((r) => r.marker === 'hematocrit')
    }

    const dueToday = meds
      .filter(shouldTakeMedicationToday)
      .filter((med) => {
        const times = getMedicationReminderTimes(med)
        const takenCount = todayLogs.filter(
          (l: MedicationLog) => l.medicationId === med.id && l.taken
        ).length
        return takenCount < times.length
      })
      .sort((a, b) =>
        (getMedicationReminderTimes(a)[0] ?? '').localeCompare(
          getMedicationReminderTimes(b)[0] ?? ''
        )
      )

    nextDoseMed = dueToday[0]
    if (nextDoseMed) {
      nextDoseTime = getMedicationReminderTimes(nextDoseMed)[0]

      if (nextDoseMed.method === 'patch') {
        zoneOrder = PATCH_APPLICATION_ZONE_ORDER
        zoneLabels = PATCH_APPLICATION_ZONES
      } else if (nextDoseMed.method === 'gel') {
        zoneOrder = Object.keys(GEL_APPLICATION_ZONES)
        zoneLabels = GEL_APPLICATION_ZONES
      }

      if (zoneOrder.length > 0 && nextDoseMed.id !== undefined) {
        const history = await getGelApplicationHistory(nextDoseMed.id, 1)
        const lastZone = history[0]?.applicationZone as ApplicationZone | undefined
        nextZone = getNextApplicationZone(zoneOrder, lastZone)
      }

      if (nextDoseMed.stock !== undefined) {
        stockDaysRemaining = estimateStockDaysRemaining(nextDoseMed)
      }
    }

    appointment = appointments[0]
    journalEntry = journalEntries[0]

    loaded = true
  })
</script>

<div class="top-row">
  <p class="greet">
    {firstName ? `${i18n.t('dashboard.greeting')}, ${firstName}` : i18n.t('dashboard.greeting')}
  </p>
  <span class="date"
    >{format(new Date(), 'EEEE d MMMM', { locale: getDateLocale(i18n.locale) })}</span
  >
</div>

<div class="theme-row">
  <ThemeSwitch />
</div>

{#if loaded}
  {#if primaryHormone}
    <div class="lens-wrap">
      <GaugeMeter
        value={primaryHormone.value}
        unit={primaryHormone.unit}
        min={primaryHormoneRange?.min ?? primaryHormone.value}
        max={primaryHormoneRange?.max ?? primaryHormone.value}
        label={i18n.t('bloodtests.markers.' + primaryHormone.marker)}
        note={primaryHormoneRange
          ? `${i18n.t('dashboard.targetRange')} ${primaryHormoneRange.min}–${primaryHormoneRange.max} ${primaryHormoneRange.unit}` +
            (isVerifiedMasculinizingTestosterone
              ? `, ${i18n.t('dashboard.targetRangeSourceMasculinizing')}.`
              : '.')
          : ''}
      />
    </div>
  {/if}

  {#if hematocrit}
    {@const status = getHematocritStatus(hematocrit.value)}
    <Pill status={status === 'ok' ? 'neutral' : status}>
      {BLOOD_MARKERS.hematocrit.label} <b>{hematocrit.value} {hematocrit.unit}</b>
    </Pill>
  {/if}

  {#if nextDoseMed}
    <SectionTitle text={i18n.t('dashboard.nextDose')} />
    <Row href={`/medications/${nextDoseMed.id}`}>
      <div class="row-head">
        <div>
          <p class="title">{nextDoseMed.name}</p>
          <p class="meta">
            {zoneOrder.length > 0 ? i18n.t('medications.siteRotation') : nextDoseTime}
          </p>
        </div>
        {#if zoneOrder.length > 0}
          <div class="when">{nextDoseTime}</div>
        {/if}
      </div>
      {#if zoneOrder.length > 0}
        <div class="site-row">
          {#each zoneOrder as zone (zone)}
            <span class="site-chip" class:next={zone === nextZone}>{zoneLabels[zone]}</span>
          {/each}
        </div>
      {/if}
    </Row>
  {/if}

  {#if appointment || (nextDoseMed?.stock !== undefined && stockDaysRemaining !== null)}
    <SectionTitle text={i18n.t('dashboard.thisWeek')} />
    {#if appointment}
      <Row href={`/appointments/${appointment.id}`}>
        <div class="row-head">
          <div>
            <p class="title">
              {appointment.doctor || i18n.t('appointments.types.' + appointment.type)}
            </p>
          </div>
          <div class="when">
            {formatDistanceToNow(new Date(appointment.date), {
              addSuffix: true,
              locale: getDateLocale(i18n.locale),
            })}
          </div>
        </div>
      </Row>
    {/if}
    {#if nextDoseMed && nextDoseMed.stock !== undefined && stockDaysRemaining !== null}
      <Row href={`/medications/${nextDoseMed.id}`}>
        <p class="title">{nextDoseMed.name}</p>
        <p class="meta">{nextDoseMed.stock} {nextDoseMed.stockUnit ?? ''}</p>
        <StockBar
          fraction={stockDaysRemaining / 30}
          label={i18n.t('dashboard.stockEstimate').replace('{days}', String(stockDaysRemaining))}
        />
      </Row>
    {/if}
  {/if}

  {#if journalEntry}
    <SectionTitle text={i18n.t('nav.journal')} />
    <Row href={`/journal/${journalEntry.id}`}>
      <p class="journal-quote">"{journalEntry.content}"</p>
      {#if journalEntry.mood}
        <p class="meta">
          {i18n.t('dashboard.mood')}
          {i18n.t('journal.moods.' + journalEntry.mood)}
        </p>
      {/if}
    </Row>
  {/if}
{/if}

<style>
  .top-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 12px;
  }
  .greet {
    font-size: 19px;
    font-weight: 600;
    margin: 0;
  }
  .date {
    font-size: 12.5px;
    color: var(--ink-faint);
  }
  .theme-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 22px;
  }
  .lens-wrap {
    display: flex;
    justify-content: center;
    margin-bottom: 22px;
  }
  :global(.top-row) + .theme-row + .lens-wrap {
    margin-top: 0;
  }
  .row-head {
    display: flex;
    justify-content: space-between;
  }
  .title {
    font-size: 15px;
    font-weight: 600;
    margin: 0;
  }
  .meta {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 2px 0 0;
  }
  .when {
    font-size: 12.5px;
    color: var(--ink-soft);
    text-align: right;
  }
  .site-row {
    display: flex;
    gap: 5px;
    margin-top: 10px;
    flex-wrap: wrap;
  }
  .site-chip {
    font-size: 10.5px;
    padding: 4px 9px;
    border-radius: 999px;
    background: var(--line);
    color: var(--ink-faint);
  }
  .site-chip.next {
    background: linear-gradient(135deg, var(--blue), var(--pink));
    color: #fff;
    font-weight: 600;
  }
  .journal-quote {
    font-size: 14.5px;
    font-style: italic;
    line-height: 1.5;
    margin: 0 0 6px;
  }
</style>
