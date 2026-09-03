<script lang="ts">
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { i18n } from '$lib/i18n.svelte'
  import { getBloodTest, updateBloodTest, getUserProfile } from '$lib/db'
  import { BLOOD_MARKERS, convertToCanonicalUnit } from '$lib/constants'
  import type { BloodMarker, BloodTestResult } from '$lib/types'
  import BloodTestFormFields, {
    EMPTY_MARKER_VALUES,
    DEFAULT_MARKER_UNITS,
  } from '$lib/components/bloodtests/BloodTestFormFields.svelte'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'

  let loading = $state(true)
  let saving = $state(false)
  let context = $state<'feminizing' | 'masculinizing'>('feminizing')
  let testId = $state<number | null>(null)

  let date = $state('')
  let lab = $state('')
  let notes = $state('')
  let markerValues = $state<Record<BloodMarker, string>>({ ...EMPTY_MARKER_VALUES })
  let markerUnits = $state<Record<BloodMarker, string>>({ ...DEFAULT_MARKER_UNITS })

  async function loadData() {
    const id = parseInt(page.params.id!)
    if (isNaN(id)) {
      await goto('/bloodtests')
      return
    }

    const [test, profile] = await Promise.all([getBloodTest(id), getUserProfile()])
    if (!test) {
      await goto('/bloodtests')
      return
    }

    testId = id
    if (profile?.targetGender) {
      context = profile.targetGender === 'masculinizing' ? 'masculinizing' : 'feminizing'
    }

    date = new Date(test.date).toISOString().split('T')[0]!
    lab = test.lab ?? ''
    notes = test.notes ?? ''

    const values = { ...EMPTY_MARKER_VALUES }
    for (const result of test.results) {
      values[result.marker] = result.value.toString()
    }
    markerValues = values

    loading = false
  }

  $effect(() => {
    void page.params.id
    loading = true
    loadData()
  })

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!testId) return

    const results: BloodTestResult[] = []
    for (const [marker, raw] of Object.entries(markerValues) as [BloodMarker, string][]) {
      if (raw && raw.trim() !== '') {
        results.push({
          marker,
          value: convertToCanonicalUnit(marker, parseFloat(raw), markerUnits[marker]),
          unit: BLOOD_MARKERS[marker].unit,
        })
      }
    }

    if (results.length === 0) {
      alert(i18n.t('bloodtests.new.noResultAlert'))
      return
    }

    saving = true
    try {
      await updateBloodTest(testId, {
        date: new Date(date),
        lab: lab || undefined,
        results,
        notes: notes || undefined,
      })
      await goto(`/bloodtests/${testId}`)
    } finally {
      saving = false
    }
  }
</script>

{#if loading}
  <p class="loading">{i18n.t('bloodtests.detail.loading')}</p>
{:else}
  <div class="header">
    <a href={`/bloodtests/${testId}`} class="icon-link" aria-label={i18n.t('common.back')}
      ><ArrowLeft size={20} /></a
    >
    <h1>{i18n.t('bloodtests.edit.title')}</h1>
  </div>

  <form onsubmit={handleSubmit}>
    <BloodTestFormFields
      bind:date
      bind:lab
      bind:notes
      bind:markerValues
      bind:markerUnits
      {context}
      {saving}
      backHref={`/bloodtests/${testId}`}
    />
  </form>
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
</style>
