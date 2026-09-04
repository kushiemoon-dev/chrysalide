<script lang="ts">
  import { i18n } from '$lib/i18n.svelte'
  import type { Measurements } from '$lib/types'
  import { MEASUREMENT_FIELD_KEY, MEASUREMENT_KEYS, MEASUREMENT_UNITS } from './progress-charts'
  import Camera from '@lucide/svelte/icons/camera'
  import ImageIcon from '@lucide/svelte/icons/image'
  import X from '@lucide/svelte/icons/x'
  import Plus from '@lucide/svelte/icons/plus'

  const SUGGESTED_TAG_KEYS = ['face', 'body', 'chest', 'hair', 'skin', 'energy', 'mood'] as const

  let {
    date = $bindable(),
    measurements = $bindable(),
    photos = $bindable(),
    notes = $bindable(),
    tags = $bindable(),
    saving,
    backHref,
  }: {
    date: string
    measurements: Partial<Measurements>
    photos: string[]
    notes: string
    tags: string[]
    saving: boolean
    backHref: string
  } = $props()

  let customTag = $state('')
  let fileInput: HTMLInputElement | undefined = $state()

  let suggestedTags = $derived(
    SUGGESTED_TAG_KEYS.map((key) => i18n.t(`progress.suggestedTags.${key}`))
  )
  let customTags = $derived(tags.filter((t) => !suggestedTags.includes(t)))
  let hasData = $derived(
    photos.length > 0 ||
      Object.values(measurements).some((v) => v !== undefined) ||
      notes.trim() !== ''
  )

  function setMeasurement(key: keyof Measurements, value: string) {
    const num = value === '' ? undefined : parseFloat(value)
    measurements = { ...measurements, [key]: num === undefined || isNaN(num) ? undefined : num }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handlePhotoUpload(e: Event) {
    const files = (e.target as HTMLInputElement).files
    if (!files) return
    const newPhotos: string[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      newPhotos.push(await fileToBase64(file))
    }
    photos = [...photos, ...newPhotos]
    if (fileInput) fileInput.value = ''
  }

  function removePhoto(index: number) {
    photos = photos.filter((_, i) => i !== index)
  }

  function toggleTag(tag: string) {
    tags = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]
  }

  function addCustomTag() {
    const trimmed = customTag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      tags = [...tags, trimmed]
      customTag = ''
    }
  }
</script>

<div class="card">
  <p class="card-title">{i18n.t('progress.new.date')}</p>
  <div class="field">
    <input id="date" type="date" bind:value={date} />
  </div>
</div>

<div class="card">
  <p class="card-title"><Camera size={14} /> {i18n.t('progress.new.photos')}</p>
  {#if photos.length > 0}
    <div class="photo-grid">
      {#each photos as photo, index (index)}
        <div class="photo-thumb">
          <img src={photo} alt="" />
          <button
            type="button"
            class="remove-photo"
            onclick={() => removePhoto(index)}
            aria-label="remove"
          >
            <X size={14} />
          </button>
        </div>
      {/each}
    </div>
  {/if}
  <input
    bind:this={fileInput}
    type="file"
    accept="image/*"
    multiple
    class="visually-hidden"
    onchange={handlePhotoUpload}
  />
  <button type="button" class="btn-outline-sm" onclick={() => fileInput?.click()}>
    <ImageIcon size={14} />
    {i18n.t('progress.new.addPhotos')}
  </button>
  <p class="hint">{i18n.t('progress.new.photosLocal')}</p>
</div>

<div class="card">
  <p class="card-title">{i18n.t('progress.new.measurements')}</p>
  <div class="measurements-grid">
    {#each MEASUREMENT_KEYS as key (key)}
      <div class="field">
        <label for={key}>{i18n.t(MEASUREMENT_FIELD_KEY[key])}</label>
        <div class="input-with-unit">
          <input
            id={key}
            type="number"
            step="0.1"
            value={measurements[key] ?? ''}
            oninput={(e) => setMeasurement(key, (e.target as HTMLInputElement).value)}
          />
          <span class="unit">{MEASUREMENT_UNITS[key]}</span>
        </div>
      </div>
    {/each}
  </div>
</div>

<div class="card">
  <p class="card-title">{i18n.t('progress.new.tags')}</p>
  <div class="tag-row">
    {#each suggestedTags as tag (tag)}
      <button
        type="button"
        class="tag-chip"
        class:selected={tags.includes(tag)}
        onclick={() => toggleTag(tag)}>{tag}</button
      >
    {/each}
  </div>
  {#if customTags.length > 0}
    <div class="tag-row">
      {#each customTags as tag (tag)}
        <button type="button" class="tag-chip selected" onclick={() => toggleTag(tag)}>
          {tag}
          <X size={11} />
        </button>
      {/each}
    </div>
  {/if}
  <div class="custom-tag-row">
    <input
      type="text"
      placeholder={i18n.t('progress.new.customTag')}
      bind:value={customTag}
      onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
    />
    <button
      type="button"
      class="btn-outline-sm add-tag-btn"
      onclick={addCustomTag}
      disabled={!customTag.trim()}
    >
      <Plus size={14} />
    </button>
  </div>
</div>

<div class="card">
  <p class="card-title">{i18n.t('progress.new.notes')}</p>
  <div class="field">
    <textarea placeholder={i18n.t('progress.new.notesPlaceholder')} bind:value={notes} rows="4"
    ></textarea>
  </div>
</div>

<div class="actions">
  <a href={backHref} class="btn-outline-sm">{i18n.t('common.cancel')}</a>
  <button type="submit" class="btn-primary-sm" disabled={saving || !hasData}>
    {saving ? i18n.t('progress.new.saving') : i18n.t('progress.new.save')}
  </button>
</div>

<style>
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
  .field {
    display: flex;
    flex-direction: column;
  }
  label {
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
  textarea {
    resize: none;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .hint {
    font-size: 11.5px;
    color: var(--ink-faint);
    text-align: center;
    margin: 10px 0 0;
  }
  .photo-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  }
  .photo-thumb {
    position: relative;
    aspect-ratio: 1;
    border-radius: 10px;
    overflow: hidden;
    background: var(--page);
  }
  .photo-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .remove-photo {
    position: absolute;
    top: 4px;
    right: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border: none;
    border-radius: 50%;
    background: rgb(0 0 0 / 55%);
    color: #fff;
    cursor: pointer;
  }
  .measurements-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .input-with-unit {
    position: relative;
  }
  .input-with-unit input {
    padding-right: 34px;
  }
  .unit {
    position: absolute;
    top: 50%;
    right: 11px;
    transform: translateY(-50%);
    font-size: 12.5px;
    color: var(--ink-soft);
  }
  .tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;
  }
  .tag-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: var(--page);
    color: var(--ink);
    font-family: inherit;
    font-size: 12.5px;
    cursor: pointer;
  }
  .tag-chip.selected {
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    border-color: transparent;
    color: #fff;
  }
  .custom-tag-row {
    display: flex;
    gap: 8px;
  }
  .custom-tag-row input {
    flex: 1;
  }
  .add-tag-btn {
    flex: none;
    width: 40px;
    padding: 0;
  }
  .actions {
    display: flex;
    gap: 10px;
  }
  .btn-outline-sm,
  .btn-primary-sm {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 13.5px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    text-decoration: none;
    border: 1px solid var(--line);
    background: var(--page);
    color: var(--ink);
  }
  .btn-primary-sm {
    border: none;
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    color: #fff;
  }
  .btn-primary-sm:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
