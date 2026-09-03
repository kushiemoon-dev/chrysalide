<script lang="ts">
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { format } from 'date-fns'
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import { getBloodTest, deleteBloodTest, getUserProfile } from '$lib/db'
  import {
    REFERENCE_RANGES,
    getHematocritStatus,
    getReferenceRangeSource,
    HEMATOCRIT_ALERT_THRESHOLD_SOURCE,
  } from '$lib/constants'
  import type { BloodTest, BloodMarker } from '$lib/types'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'
  import Trash2 from '@lucide/svelte/icons/trash-2'
  import Pencil from '@lucide/svelte/icons/pencil'
  import FlaskConical from '@lucide/svelte/icons/flask-conical'
  import Heart from '@lucide/svelte/icons/heart'
  import Activity from '@lucide/svelte/icons/activity'
  import FileText from '@lucide/svelte/icons/file-text'

  const MARKER_GROUPS: { key: string; icon: typeof FlaskConical; markers: BloodMarker[] }[] = [
    {
      key: 'hormones',
      icon: FlaskConical,
      markers: [
        'estradiol',
        'testosterone',
        'lh',
        'fsh',
        'prolactin',
        'shbg',
        'dheas',
        'progesterone',
      ],
    },
    { key: 'blood', icon: Heart, markers: ['hematocrit', 'hemoglobin'] },
    { key: 'organs', icon: Activity, markers: ['alt', 'ast', 'creatinine', 'potassium'] },
  ]

  let test = $state<BloodTest | null>(null)
  let loading = $state(true)
  let context = $state<'feminizing' | 'masculinizing'>('feminizing')

  async function loadData() {
    const id = parseInt(page.params.id!)
    if (isNaN(id)) {
      await goto('/bloodtests')
      return
    }

    const [testData, profile] = await Promise.all([getBloodTest(id), getUserProfile()])
    if (!testData) {
      await goto('/bloodtests')
      return
    }

    test = testData
    if (profile?.targetGender) {
      context = profile.targetGender === 'masculinizing' ? 'masculinizing' : 'feminizing'
    }
    loading = false
  }

  $effect(() => {
    void page.params.id
    loading = true
    loadData()
  })

  async function handleDelete() {
    if (!test?.id || !confirm(i18n.t('bloodtests.detail.deleteConfirm'))) return
    await deleteBloodTest(test.id)
    await goto('/bloodtests')
  }
</script>

{#if loading}
  <p class="loading">{i18n.t('bloodtests.detail.loading')}</p>
{:else if test}
  {@const resultsByMarker = new Map(test.results.map((r) => [r.marker, r]))}
  <div class="header">
    <div class="header-left">
      <a href="/bloodtests" class="icon-link" aria-label={i18n.t('common.back')}
        ><ArrowLeft size={20} /></a
      >
      <div>
        <h1>
          {format(new Date(test.date), 'd MMMM yyyy', { locale: getDateLocale(i18n.locale) })}
        </h1>
        {#if test.lab}
          <span class="lab-badge">{test.lab}</span>
        {/if}
      </div>
    </div>
    <div class="header-actions">
      <a href={`/bloodtests/${test.id}/edit`} class="icon-link" aria-label={i18n.t('common.edit')}
        ><Pencil size={18} /></a
      >
      <button
        type="button"
        class="icon-link danger"
        onclick={handleDelete}
        aria-label={i18n.t('common.delete')}
      >
        <Trash2 size={18} />
      </button>
    </div>
  </div>

  {#each MARKER_GROUPS as group (group.key)}
    {@const Icon = group.icon}
    {@const groupResults = group.markers
      .filter((m) => resultsByMarker.has(m))
      .map((m) => ({ marker: m, result: resultsByMarker.get(m)! }))}
    {#if groupResults.length > 0}
      <div class="card">
        <p class="card-title"><Icon size={14} /> {i18n.t('bloodtests.groups.' + group.key)}</p>
        <div class="result-list">
          {#each groupResults as { marker, result } (marker)}
            {@const status = marker === 'hematocrit' ? getHematocritStatus(result.value) : 'ok'}
            {@const source = getReferenceRangeSource(marker, context)}
            {@const range = REFERENCE_RANGES.find(
              (r) => r.marker === marker && r.context === context
            )}
            <div
              class="result-line"
              class:watch={status === 'watch'}
              class:alert={status === 'alert'}
            >
              <div>
                <p class="marker-name">{i18n.t('bloodtests.markers.' + marker)}</p>
                <p class="marker-desc">{i18n.t('bloodtests.descriptions.' + marker)}</p>
                {#if status !== 'ok'}
                  <p class="threshold-source">{HEMATOCRIT_ALERT_THRESHOLD_SOURCE}</p>
                {/if}
              </div>
              <div class="result-value">
                <span class="value">{result.value} <span class="unit">{result.unit}</span></span>
                {#if range}
                  <p class="target">
                    {i18n.t('bloodtests.detail.targetLabel')}: {range.min} - {range.max}
                    {#if source}({source}){/if}
                  </p>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/each}

  {#if test.notes}
    <div class="card">
      <p class="card-title"><FileText size={14} /> {i18n.t('bloodtests.detail.notesTitle')}</p>
      <p class="notes">{test.notes}</p>
    </div>
  {/if}

  <div class="card summary-card">
    <div class="summary-icon">
      <FlaskConical size={20} />
    </div>
    <div>
      <p class="summary-count">
        {test.results.length}
        {test.results.length > 1
          ? i18n.t('bloodtests.detail.markerPlural')
          : i18n.t('bloodtests.detail.markerSingular')}
      </p>
    </div>
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
  .lab-badge {
    display: inline-block;
    margin-top: 4px;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid var(--line);
    color: var(--ink-soft);
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
  .card {
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 14px;
  }
  .card-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    margin: 0 0 10px;
  }
  .result-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .result-line {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    padding: 10px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--ink) 3%, transparent);
  }
  .result-line.watch {
    background: color-mix(in srgb, var(--watch) 14%, transparent);
  }
  .result-line.alert {
    background: color-mix(in srgb, var(--alert) 14%, transparent);
  }
  .marker-name {
    font-size: 13.5px;
    font-weight: 600;
    margin: 0;
  }
  .marker-desc {
    font-size: 11px;
    color: var(--ink-soft);
    margin: 2px 0 0;
  }
  .threshold-source {
    font-size: 10px;
    color: var(--ink-faint);
    margin: 2px 0 0;
  }
  .result-value {
    text-align: right;
    flex-shrink: 0;
  }
  .value {
    font-size: 16px;
    font-weight: 600;
  }
  .unit {
    font-size: 12px;
    font-weight: 400;
    color: var(--ink-soft);
  }
  .target {
    font-size: 11px;
    color: var(--ink-soft);
    margin: 2px 0 0;
  }
  .notes {
    font-size: 13.5px;
    white-space: pre-wrap;
    margin: 0;
    color: var(--ink-soft);
  }
  .summary-card {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .summary-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--blue-deep) 18%, transparent);
    color: var(--blue-deep);
    flex-shrink: 0;
  }
  .summary-count {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
  }
</style>
