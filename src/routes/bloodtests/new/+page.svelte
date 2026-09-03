<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { i18n } from '$lib/i18n.svelte'
  import { addBloodTest, getUserProfile } from '$lib/db'
  import { BLOOD_MARKERS, convertToCanonicalUnit } from '$lib/constants'
  import type { BloodMarker, BloodTestResult } from '$lib/types'
  import BloodTestFormFields, {
    EMPTY_MARKER_VALUES,
    DEFAULT_MARKER_UNITS,
  } from '$lib/components/bloodtests/BloodTestFormFields.svelte'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'

  let loading = $state(false)
  let context = $state<'feminizing' | 'masculinizing'>('feminizing')

  let date = $state(new Date().toISOString().split('T')[0]!)
  let lab = $state('')
  let notes = $state('')
  let markerValues = $state<Record<BloodMarker, string>>({ ...EMPTY_MARKER_VALUES })
  let markerUnits = $state<Record<BloodMarker, string>>({ ...DEFAULT_MARKER_UNITS })

  onMount(async () => {
    const profile = await getUserProfile()
    if (profile?.targetGender) {
      context = profile.targetGender === 'masculinizing' ? 'masculinizing' : 'feminizing'
    }
  })

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()

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

    loading = true
    try {
      await addBloodTest({
        date: new Date(date),
        lab: lab || undefined,
        results,
        notes: notes || undefined,
      })
      await goto('/bloodtests')
    } finally {
      loading = false
    }
  }
</script>

<div class="header">
  <a href="/bloodtests" class="icon-link" aria-label={i18n.t('common.back')}
    ><ArrowLeft size={20} /></a
  >
  <h1>{i18n.t('bloodtests.new.title')}</h1>
</div>

<form onsubmit={handleSubmit}>
  <BloodTestFormFields
    bind:date
    bind:lab
    bind:notes
    bind:markerValues
    bind:markerUnits
    {context}
    saving={loading}
    backHref="/bloodtests"
  />
</form>

<style>
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
