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
  let hasMedications = $state(false)
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
    hasMedications = meds.length > 0
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

<div class="dashboard-grid">
  <div class="hero-col">
    <div class="top-row">
      <p class="greet">
        {#if firstName}
          {i18n.t('dashboard.greeting')}, <span class="name">{firstName}</span>
        {:else}
          {i18n.t('dashboard.greeting')}
        {/if}
      </p>
      <span class="date"
        >{format(new Date(), 'EEEE d MMMM', { locale: getDateLocale(i18n.locale) })}</span
      >
    </div>

    <div class="theme-row">
      <ThemeSwitch />
    </div>

    {#if loaded && primaryHormone}
      <div class="gauge-zone">
        <div class="bloom" aria-hidden="true"></div>
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

    {#if loaded && hematocrit}
      {@const status = getHematocritStatus(hematocrit.value)}
      <div class="hematocrit-mobile">
        <Pill status={status === 'ok' ? 'neutral' : status}>
          {BLOOD_MARKERS.hematocrit.label} <b>{hematocrit.value} {hematocrit.unit}</b>
        </Pill>
      </div>
      <div
        class="status-line hematocrit-desktop"
        class:d-watch={status === 'watch'}
        class:d-alert={status === 'alert'}
      >
        <span class="d"></span>
        {BLOOD_MARKERS.hematocrit.label} <b>{hematocrit.value} {hematocrit.unit}</b>
      </div>
    {/if}
  </div>

  {#if loaded}
    <div class="timeline-col">
      <div class="timeline-mobile">
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
        {:else if !hasMedications}
          <SectionTitle text={i18n.t('dashboard.nextDose')} />
          <p class="empty-hint">{i18n.t('dashboard.noMeds')}</p>
          <a class="empty-cta" href="/medications/new">{i18n.t('dashboard.addMed')}</a>
        {/if}

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
        {:else}
          <p class="empty-hint">{i18n.t('dashboard.noAppts')}</p>
          <a class="empty-cta" href="/appointments/new">{i18n.t('dashboard.addAppt')}</a>
        {/if}
        {#if nextDoseMed && nextDoseMed.stock !== undefined && stockDaysRemaining !== null}
          <Row href={`/medications/${nextDoseMed.id}`}>
            <p class="title">{nextDoseMed.name}</p>
            <p class="meta">{nextDoseMed.stock} {nextDoseMed.stockUnit ?? ''}</p>
            <StockBar
              fraction={stockDaysRemaining / 30}
              label={i18n
                .t('dashboard.stockEstimate')
                .replace('{days}', String(stockDaysRemaining))}
            />
          </Row>
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
      </div>
      <div class="timeline-desktop">
        <div class="spine" aria-hidden="true"></div>
        {#if nextDoseMed}
          <div class="entry now">
            <p class="when">{nextDoseTime}</p>
            <p class="title">{nextDoseMed.name}</p>
            {#if zoneOrder.length > 0}
              <p class="meta">{i18n.t('medications.siteRotation')}</p>
              <div class="zones">
                {#each zoneOrder as zone (zone)}
                  <span class="zone-tag" class:next={zone === nextZone}>{zoneLabels[zone]}</span>
                {/each}
              </div>
            {/if}
          </div>
        {:else if !hasMedications}
          <div class="entry">
            <p class="title">{i18n.t('dashboard.nextDose')}</p>
            <p class="meta empty-hint">{i18n.t('dashboard.noMeds')}</p>
            <a class="empty-cta" href="/medications/new">{i18n.t('dashboard.addMed')}</a>
          </div>
        {/if}
        {#if appointment}
          <div class="entry">
            <p class="when">
              {formatDistanceToNow(new Date(appointment.date), {
                addSuffix: true,
                locale: getDateLocale(i18n.locale),
              })}
            </p>
            <p class="title">
              {appointment.doctor || i18n.t('appointments.types.' + appointment.type)}
            </p>
          </div>
        {:else}
          <div class="entry">
            <p class="meta empty-hint">{i18n.t('dashboard.noAppts')}</p>
            <a class="empty-cta" href="/appointments/new">{i18n.t('dashboard.addAppt')}</a>
          </div>
        {/if}
        {#if nextDoseMed && nextDoseMed.stock !== undefined && stockDaysRemaining !== null}
          <div class="entry">
            <p class="title">{nextDoseMed.name}</p>
            <p class="meta">{nextDoseMed.stock} {nextDoseMed.stockUnit ?? ''}</p>
            <div class="stockbar-track">
              <div
                class="stockbar-fill"
                style:width={`${Math.max(0, Math.min(1, stockDaysRemaining / 30)) * 100}%`}
              ></div>
            </div>
            <p class="meta">
              {i18n.t('dashboard.stockEstimate').replace('{days}', String(stockDaysRemaining))}
            </p>
          </div>
        {/if}
        {#if journalEntry}
          <div class="entry">
            <p class="title">{i18n.t('nav.journal')}</p>
            <p class="meta">"{journalEntry.content}"</p>
            {#if journalEntry.mood}
              <p class="meta">
                {i18n.t('dashboard.mood')}
                {i18n.t('journal.moods.' + journalEntry.mood)}
              </p>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

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
  .dashboard-grid {
    display: block;
  }
  .gauge-zone {
    display: flex;
    justify-content: center;
    margin-bottom: 22px;
    position: relative;
  }
  :global(.top-row) + .theme-row + .gauge-zone {
    margin-top: 0;
  }
  .bloom {
    display: none;
  }
  .hematocrit-desktop {
    display: none;
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
  .empty-hint {
    font-size: 13px;
    color: var(--ink-soft);
    margin: 0 0 8px;
  }
  .empty-cta {
    font-size: 13px;
    font-weight: 600;
    color: var(--blue);
  }

  @media (min-width: 1024px) {
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 420px;
      gap: 90px;
      align-items: start;
    }
    .hero-col {
      position: relative;
    }
    .top-row {
      display: block;
    }
    .greet {
      font-size: clamp(44px, 5.2vw, 68px);
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1.02;
    }
    .greet .name {
      background: linear-gradient(120deg, var(--blue-deep), var(--pink-deep));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .date {
      display: block;
      margin-top: 10px;
    }
    .theme-row {
      justify-content: flex-start;
    }
    .gauge-zone {
      justify-content: flex-start;
      margin: 46px 0 20px;
    }
    .bloom {
      display: block;
      position: absolute;
      left: 200px;
      top: 46%;
      width: 720px;
      height: 720px;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: radial-gradient(
        circle,
        var(--pink-deep) 0%,
        var(--blue-deep) 42%,
        transparent 68%
      );
      filter: blur(110px);
      opacity: 0.16;
      z-index: 0;
      animation: breathe 5.5s ease-in-out infinite alternate;
    }
    .hematocrit-mobile {
      display: none;
    }
    .hematocrit-desktop {
      display: flex;
      align-items: center;
      gap: 9px;
      font-size: 14.5px;
      color: var(--ink-soft);
      margin-top: 6px;
    }
    .hematocrit-desktop .d {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--ok);
      flex-shrink: 0;
    }
    .hematocrit-desktop.d-watch .d {
      background: var(--watch);
    }
    .hematocrit-desktop.d-alert .d {
      background: var(--alert);
    }
    .hematocrit-desktop b {
      color: var(--ink);
      font-weight: 700;
    }
    .timeline-mobile {
      display: none;
    }
    .timeline-desktop {
      display: block;
      position: relative;
      padding-left: 28px;
      margin-top: 10px;
    }
    .spine {
      position: absolute;
      left: 4px;
      top: 8px;
      bottom: 8px;
      width: 1.5px;
      background: linear-gradient(var(--blue-deep), var(--pink-deep));
    }
    .entry {
      position: relative;
      padding: 16px 18px 16px 0;
    }
    .entry::before {
      content: '';
      position: absolute;
      left: -28px;
      top: 20px;
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--ink-faint);
      border: 2px solid var(--page);
    }
    .entry .when {
      font-size: 12px;
      color: var(--ink-faint);
      margin: 0 0 6px;
    }
    .entry .title {
      font-size: 17px;
      font-weight: 600;
      margin: 0 0 4px;
    }
    .entry .meta {
      font-size: 13.5px;
      color: var(--ink-soft);
      margin: 0;
      line-height: 1.55;
    }
    .entry.now {
      background: linear-gradient(
        120deg,
        color-mix(in srgb, var(--blue-deep) 12%, transparent),
        color-mix(in srgb, var(--pink-deep) 12%, transparent)
      );
      border-radius: 16px;
      padding: 18px 20px;
    }
    .entry.now::before {
      background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
      width: 11px;
      height: 11px;
      left: -29px;
      top: 22px;
    }
    .entry.now .title {
      font-size: 19px;
    }
    .zones {
      display: flex;
      gap: 6px;
      margin-top: 12px;
      flex-wrap: wrap;
    }
    .zone-tag {
      font-size: 11px;
      color: var(--ink-faint);
    }
    .zone-tag.next {
      color: var(--pink-deep);
      font-weight: 700;
    }
    .zone-tag:not(:last-child)::after {
      content: '  \00b7  ';
      color: var(--ink-faint);
      font-weight: 400;
    }
    .stockbar-track {
      height: 3px;
      border-radius: 999px;
      background: var(--line);
      margin-top: 10px;
      max-width: 220px;
      overflow: hidden;
    }
    .stockbar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--blue-deep), var(--pink-deep));
      transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
    }
  }

  @keyframes breathe {
    from {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0.16;
    }
    to {
      transform: translate(-50%, -50%) scale(1.06);
      opacity: 0.24;
    }
  }
</style>
