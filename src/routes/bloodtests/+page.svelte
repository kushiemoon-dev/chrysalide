<script lang="ts">
  import { onMount } from 'svelte'
  import { format } from 'date-fns'
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import { getBloodTests, deleteBloodTest, getUserProfile } from '$lib/db'
  import { getHematocritStatus, BLOOD_MARKERS, REFERENCE_RANGES } from '$lib/constants'
  import type { BloodTest, BloodMarker } from '$lib/types'
  import HormoneChart from '$lib/components/bloodtests/HormoneChart.svelte'
  import ExportButton from '$lib/components/ui/ExportButton.svelte'
  import Plus from '@lucide/svelte/icons/plus'
  import TrendingUp from '@lucide/svelte/icons/trending-up'
  import ListIcon from '@lucide/svelte/icons/list'
  import Pencil from '@lucide/svelte/icons/pencil'
  import Trash2 from '@lucide/svelte/icons/trash-2'
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import TestTube from '@lucide/svelte/icons/test-tube'

  let tests = $state<BloodTest[]>([])
  let loading = $state(true)
  let context = $state<'feminizing' | 'masculinizing'>('feminizing')
  let activeTab = $state<'charts' | 'list'>('charts')
  let userName = $state<string | undefined>()
  let chartRef = $state<HTMLDivElement>()

  onMount(async () => {
    const [testsData, profile] = await Promise.all([getBloodTests(50), getUserProfile()])
    tests = testsData
    if (profile?.targetGender) {
      context = profile.targetGender === 'masculinizing' ? 'masculinizing' : 'feminizing'
    }
    if (profile?.firstName) {
      userName = profile.firstName
    }
    loading = false
  })

  function getMarkerStatus(marker: BloodMarker, value: number): 'normal' | 'low' | 'high' {
    const range = REFERENCE_RANGES.find((r) => r.marker === marker && r.context === context)
    if (!range) return 'normal'
    if (value < range.min) return 'low'
    if (value > range.max) return 'high'
    return 'normal'
  }

  async function handleDelete(id: number) {
    if (!confirm(i18n.t('bloodtests.confirmDelete'))) return
    await deleteBloodTest(id)
    tests = tests.filter((t) => t.id !== id)
  }

  let mainHormones = $derived<BloodMarker[]>(
    context === 'feminizing' ? ['estradiol', 'testosterone'] : ['testosterone', 'estradiol']
  )

  let hasSafetyMarkers = $derived(
    tests.some((t) =>
      t.results.some((r) => ['prolactin', 'hematocrit', 'alt', 'potassium'].includes(r.marker))
    )
  )

  let hormoneExportData = $derived(
    mainHormones
      .map((marker) => {
        const lastValue = tests[0]?.results.find((r) => r.marker === marker)
        if (!lastValue) return null
        const range = REFERENCE_RANGES.find((r) => r.marker === marker && r.context === context)
        return {
          marker,
          label: i18n.t('bloodtests.markers.' + marker),
          value: lastValue.value,
          unit: BLOOD_MARKERS[marker].unit,
          targetMin: range?.min,
          targetMax: range?.max,
          status: getMarkerStatus(marker, lastValue.value),
        }
      })
      .filter((d): d is NonNullable<typeof d> => d !== null)
  )
</script>

<div class="header">
  <div>
    <h1>{i18n.t('bloodtests.title')}</h1>
    <p class="subtitle">
      {tests.length}
      {tests.length > 1
        ? i18n.t('bloodtests.list.recordedPlural')
        : i18n.t('bloodtests.list.recorded')}
    </p>
  </div>
  <a href="/bloodtests/new" class="btn-primary-sm">
    <Plus size={16} />
    {i18n.t('bloodtests.add')}
  </a>
</div>

{#if loading}
  <p class="loading">{i18n.t('bloodtests.loading')}</p>
{:else if tests.length === 0}
  <div class="empty-card">
    <TestTube size={28} />
    <h3>{i18n.t('bloodtests.list.empty')}</h3>
    <p>{i18n.t('bloodtests.list.emptyDesc')}</p>
    <a href="/bloodtests/new" class="btn-primary-sm">
      <Plus size={16} />
      {i18n.t('bloodtests.list.addOne')}
    </a>
  </div>
{:else}
  <div class="tabs">
    <button
      type="button"
      class:active={activeTab === 'charts'}
      onclick={() => (activeTab = 'charts')}
    >
      <TrendingUp size={15} />
      {i18n.t('bloodtests.list.chartsTab')}
    </button>
    <button type="button" class:active={activeTab === 'list'} onclick={() => (activeTab = 'list')}>
      <ListIcon size={15} />
      {i18n.t('bloodtests.list.historyTab')}
    </button>
  </div>

  {#if activeTab === 'charts'}
    <div class="card">
      <div class="card-head">
        <p class="card-title">
          {context === 'feminizing'
            ? i18n.t('bloodtests.hormonesFem')
            : i18n.t('bloodtests.hormonesMas')}
        </p>
        {#if tests.length > 0}
          <ExportButton
            {chartRef}
            title={i18n.t('bloodtests.hormoneTracking')}
            subtitle={context === 'feminizing'
              ? i18n.t('bloodtests.thsFem')
              : i18n.t('bloodtests.thsMas')}
            {userName}
            data={hormoneExportData}
          />
        {/if}
      </div>
      <div bind:this={chartRef}>
        <HormoneChart
          {tests}
          series={mainHormones.map((marker) => ({
            marker,
            color: marker === 'estradiol' ? 'var(--pink-deep)' : 'var(--blue-deep)',
          }))}
          {context}
        />
      </div>
    </div>

    {#if hasSafetyMarkers}
      <div class="card">
        <p class="card-title">{i18n.t('bloodtests.list.safetyMarkers')}</p>
        <HormoneChart
          {tests}
          series={[
            { marker: 'prolactin', color: 'var(--gold)' },
            { marker: 'hematocrit', color: 'var(--blue-deep)' },
          ]}
          {context}
        />
      </div>
    {/if}
  {:else}
    <div class="test-list">
      {#each tests as test (test.id)}
        <div class="test-card">
          <div class="test-head">
            <div>
              <span class="date"
                >{format(new Date(test.date), 'd MMMM yyyy', {
                  locale: getDateLocale(i18n.locale),
                })}</span
              >
              {#if test.lab}
                <span class="lab-badge">{test.lab}</span>
              {/if}
            </div>
            <div class="test-actions">
              <a
                href={`/bloodtests/${test.id}/edit`}
                class="icon-link"
                aria-label={i18n.t('common.edit')}><Pencil size={16} /></a
              >
              <button
                type="button"
                class="icon-link danger"
                onclick={() => test.id && handleDelete(test.id)}
                aria-label={i18n.t('common.delete')}
              >
                <Trash2 size={16} />
              </button>
              <a
                href={`/bloodtests/${test.id}`}
                class="icon-link"
                aria-label={i18n.t('bloodtests.list.detailsLabel')}><ChevronRight size={16} /></a
              >
            </div>
          </div>
          <div class="results-row">
            {#each test.results.slice(0, 4) as result (result.marker)}
              {@const status =
                result.marker === 'hematocrit' ? getHematocritStatus(result.value) : 'ok'}
              <span class="result">
                <span class="result-label">{i18n.t('bloodtests.markers.' + result.marker)}:</span>
                <span class:watch={status === 'watch'} class:alert={status === 'alert'}
                  >{result.value}</span
                >
              </span>
            {/each}
            {#if test.results.length > 4}
              <span class="result-more"
                >+{test.results.length - 4} {i18n.t('bloodtests.othersSuffix')}</span
              >
            {/if}
          </div>
          {#if test.notes}
            <p class="notes-preview">{test.notes}</p>
          {/if}
        </div>
      {/each}
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
  .empty-card {
    text-align: center;
    padding: 40px 16px;
    border: 1px solid var(--line);
    border-radius: 16px;
    color: var(--ink-soft);
  }
  .empty-card h3 {
    font-size: 15px;
    color: var(--ink);
    margin: 12px 0 6px;
  }
  .empty-card p {
    font-size: 13px;
    margin: 0 0 16px;
  }
  .empty-card .btn-primary-sm {
    display: inline-flex;
  }
  .tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 14px;
  }
  .tabs button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 9px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--bg);
    color: var(--ink-soft);
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
  }
  .tabs button.active {
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    color: #fff;
    border-color: transparent;
  }
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
  .card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }
  .test-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .test-card {
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 14px;
    background: var(--bg);
  }
  .test-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .date {
    font-size: 14.5px;
    font-weight: 600;
  }
  .lab-badge {
    margin-left: 8px;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid var(--line);
    color: var(--ink-soft);
  }
  .test-actions {
    display: flex;
    gap: 2px;
  }
  .icon-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    color: var(--ink-soft);
    text-decoration: none;
    border: none;
    background: transparent;
    cursor: pointer;
  }
  .icon-link.danger:hover {
    color: var(--alert);
  }
  .results-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin-top: 10px;
    font-size: 13px;
  }
  .result-label {
    color: var(--ink-soft);
  }
  .result .watch {
    color: var(--watch);
    font-weight: 600;
  }
  .result .alert {
    color: var(--alert);
    font-weight: 600;
  }
  .result-more {
    font-size: 13px;
    color: var(--ink-soft);
  }
  .notes-preview {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 8px 0 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
