<script lang="ts">
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { format } from 'date-fns'
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import { db } from '$lib/db'
  import type { PhysicalProgress, Measurements } from '$lib/types'
  import {
    MEASUREMENT_FIELD_KEY,
    MEASUREMENT_UNITS,
  } from '$lib/components/progress/progress-charts'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'
  import Trash2 from '@lucide/svelte/icons/trash-2'
  import CalendarIcon from '@lucide/svelte/icons/calendar'
  import Ruler from '@lucide/svelte/icons/ruler'
  import Camera from '@lucide/svelte/icons/camera'
  import ChevronLeft from '@lucide/svelte/icons/chevron-left'
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import X from '@lucide/svelte/icons/x'

  let entry = $state<PhysicalProgress | null>(null)
  let loading = $state(true)
  let deleting = $state(false)
  let lightboxOpen = $state(false)
  let lightboxIndex = $state(0)
  let lightboxEl: HTMLDialogElement | undefined = $state()

  $effect(() => {
    if (!lightboxEl) return
    if (lightboxOpen) lightboxEl.showModal()
    else lightboxEl.close()
  })

  async function loadEntry() {
    const id = parseInt(page.params.id!)
    if (isNaN(id)) {
      await goto('/progress')
      return
    }
    const data = await db.physicalProgress.get(id)
    if (!data) {
      await goto('/progress')
      return
    }
    entry = data
    loading = false
  }

  $effect(() => {
    void page.params.id
    loading = true
    loadEntry()
  })

  async function handleDelete() {
    if (!entry?.id || !confirm(i18n.t('progress.detail.deleteConfirm'))) return
    deleting = true
    await db.physicalProgress.delete(entry.id)
    await goto('/progress')
  }

  function openLightbox(index: number) {
    lightboxIndex = index
    lightboxOpen = true
  }

  function navigateLightbox(direction: -1 | 1) {
    const count = entry?.photos?.length ?? 0
    if (count === 0) return
    lightboxIndex = (lightboxIndex + direction + count) % count
  }

  let measurementEntries = $derived(
    entry?.measurements
      ? (Object.entries(entry.measurements) as [keyof Measurements, number | undefined][]).filter(
          ([, value]) => value !== undefined
        )
      : []
  )
</script>

{#if loading}
  <p class="loading">{i18n.t('common.loading')}</p>
{:else if entry}
  <div class="header">
    <div class="header-left">
      <a href="/progress" class="icon-link" aria-label={i18n.t('common.back')}
        ><ArrowLeft size={20} /></a
      >
      <div>
        <h1>
          {format(new Date(entry.date), 'd MMMM yyyy', { locale: getDateLocale(i18n.locale) })}
        </h1>
        <p class="subtitle">
          <CalendarIcon size={12} />
          {format(new Date(entry.date), 'EEEE', { locale: getDateLocale(i18n.locale) })}
        </p>
      </div>
    </div>
    <button
      type="button"
      class="icon-link danger"
      onclick={handleDelete}
      disabled={deleting}
      aria-label={i18n.t('common.delete')}
    >
      <Trash2 size={20} />
    </button>
  </div>

  {#if entry.photos && entry.photos.length > 0}
    <div class="card">
      <p class="card-title">
        <Camera size={14} />
        {i18n.t('progress.detail.photos')} ({entry.photos.length})
      </p>
      <div class="photo-grid">
        {#each entry.photos as photo, index (index)}
          <button type="button" class="photo-btn" onclick={() => openLightbox(index)}>
            <img src={photo} alt="" />
          </button>
        {/each}
      </div>
    </div>
  {/if}

  {#if measurementEntries.length > 0}
    <div class="card">
      <p class="card-title"><Ruler size={14} /> {i18n.t('progress.detail.measurements')}</p>
      <div class="measurements-grid">
        {#each measurementEntries as [key, value] (key)}
          <div class="measurement-row">
            <span class="measurement-label">{i18n.t(MEASUREMENT_FIELD_KEY[key])}</span>
            <span class="measurement-value"
              >{value} <span class="unit">{MEASUREMENT_UNITS[key]}</span></span
            >
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if entry.tags && entry.tags.length > 0}
    <div class="card">
      <p class="card-title">{i18n.t('progress.detail.tags')}</p>
      <div class="tag-row">
        {#each entry.tags as tag (tag)}
          <span class="tag-chip">{tag}</span>
        {/each}
      </div>
    </div>
  {/if}

  {#if entry.notes}
    <div class="card">
      <p class="card-title">{i18n.t('progress.detail.notes')}</p>
      <p class="notes">{entry.notes}</p>
    </div>
  {/if}

  <dialog
    bind:this={lightboxEl}
    class="lightbox"
    onclose={() => {
      lightboxOpen = false
    }}
  >
    <button
      type="button"
      class="lightbox-close"
      onclick={() => (lightboxOpen = false)}
      aria-label={i18n.t('common.close')}
    >
      <X size={22} />
    </button>
    {#if entry.photos && entry.photos.length > 1}
      <button
        type="button"
        class="lightbox-nav prev"
        onclick={() => navigateLightbox(-1)}
        aria-label="previous"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        type="button"
        class="lightbox-nav next"
        onclick={() => navigateLightbox(1)}
        aria-label="next"
      >
        <ChevronRight size={24} />
      </button>
    {/if}
    {#if entry.photos}
      <img src={entry.photos[lightboxIndex]} alt="" class="lightbox-img" />
    {/if}
    {#if entry.photos && entry.photos.length > 1}
      <div class="lightbox-counter">{lightboxIndex + 1} / {entry.photos.length}</div>
    {/if}
  </dialog>
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
    align-items: center;
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
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 2px 0 0;
    text-transform: capitalize;
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
    margin: 0 0 12px;
  }
  .photo-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .photo-btn {
    aspect-ratio: 1;
    border-radius: 10px;
    overflow: hidden;
    background: var(--page);
    border: none;
    padding: 0;
    cursor: pointer;
  }
  .photo-btn img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .measurements-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .measurement-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--page);
    border-radius: 10px;
    padding: 10px 12px;
  }
  .measurement-label {
    font-size: 12.5px;
    color: var(--ink-soft);
  }
  .measurement-value {
    font-weight: 600;
  }
  .unit {
    color: var(--ink-soft);
    font-weight: 400;
  }
  .tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .tag-chip {
    font-size: 12.5px;
    padding: 5px 12px;
    border-radius: 999px;
    background: var(--page);
    border: 1px solid var(--line);
  }
  .notes {
    white-space: pre-wrap;
    margin: 0;
    font-size: 13.5px;
  }
  dialog.lightbox {
    border: none;
    border-radius: 0;
    padding: 0;
    background: transparent;
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    margin: 0;
    inset: 0;
  }
  dialog.lightbox[open] {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  dialog.lightbox::backdrop {
    background: rgb(0 0 0 / 90%);
  }
  .lightbox-img {
    max-width: 92vw;
    max-height: 92vh;
    object-fit: contain;
  }
  .lightbox-close,
  .lightbox-nav {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 999px;
    background: rgb(0 0 0 / 50%);
    color: #fff;
    cursor: pointer;
    z-index: 1;
  }
  .lightbox-close {
    top: 16px;
    right: 16px;
    width: 40px;
    height: 40px;
  }
  .lightbox-nav {
    top: 50%;
    transform: translateY(-50%);
    width: 44px;
    height: 44px;
  }
  .lightbox-nav.prev {
    left: 16px;
  }
  .lightbox-nav.next {
    right: 16px;
  }
  .lightbox-counter {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: rgb(0 0 0 / 50%);
    color: #fff;
    font-size: 12.5px;
    border-radius: 999px;
    padding: 4px 12px;
  }
</style>
