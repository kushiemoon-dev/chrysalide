<script lang="ts">
  import { goto } from '$app/navigation'
  import { i18n } from '$lib/i18n.svelte'
  import { addPhysicalProgress } from '$lib/db'
  import type { Measurements } from '$lib/types'
  import ProgressFormFields from '$lib/components/progress/ProgressFormFields.svelte'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'

  let date = $state(new Date().toISOString().split('T')[0]!)
  let measurements = $state<Partial<Measurements>>({})
  let photos = $state<string[]>([])
  let notes = $state('')
  let tags = $state<string[]>([])
  let saving = $state(false)

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    saving = true
    try {
      const cleanMeasurements = $state.snapshot(measurements)
      const hasMeasurements = Object.values(cleanMeasurements).some((v) => v !== undefined)

      const id = await addPhysicalProgress({
        date: new Date(date),
        measurements: hasMeasurements ? cleanMeasurements : undefined,
        photos: photos.length > 0 ? $state.snapshot(photos) : undefined,
        notes: notes.trim() || undefined,
        tags: tags.length > 0 ? $state.snapshot(tags) : undefined,
      })

      await goto(`/progress/${id}`)
    } catch {
      saving = false
    }
  }
</script>

<div class="header">
  <a href="/progress" class="icon-link" aria-label={i18n.t('common.back')}
    ><ArrowLeft size={20} /></a
  >
  <div>
    <h1>{i18n.t('progress.new.title')}</h1>
    <p class="subtitle">{i18n.t('progress.new.subtitle')}</p>
  </div>
</div>

<form onsubmit={handleSubmit}>
  <ProgressFormFields
    bind:date
    bind:measurements
    bind:photos
    bind:notes
    bind:tags
    {saving}
    backHref="/progress"
  />
</form>

<style>
  .header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
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
</style>
