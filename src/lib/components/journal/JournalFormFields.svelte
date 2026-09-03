<script lang="ts">
  import { i18n } from '$lib/i18n.svelte'
  import type { MoodLevel } from '$lib/types'
  import MoodPicker from './MoodPicker.svelte'
  import TagInput from './TagInput.svelte'
  import Sparkles from '@lucide/svelte/icons/sparkles'

  let {
    date = $bindable(),
    content = $bindable(),
    mood = $bindable(),
    energyLevel = $bindable(),
    sleepQuality = $bindable(),
    tags = $bindable(),
    isPrivate = $bindable(),
    variant = 'new',
    saving,
    backHref,
  }: {
    date: string
    content: string
    mood: MoodLevel | undefined
    energyLevel: MoodLevel | undefined
    sleepQuality: MoodLevel | undefined
    tags: string[]
    isPrivate: boolean
    variant?: 'new' | 'edit'
    saving: boolean
    backHref?: string
  } = $props()

  let today = new Date().toISOString().split('T')[0]!
  let contentLabel = $derived(
    i18n.t(variant === 'edit' ? 'journal.edit.content' : 'journal.new.contentLabel')
  )
  let contentPlaceholder = $derived(
    i18n.t(variant === 'edit' ? 'journal.edit.placeholder' : 'journal.new.contentPlaceholder')
  )
</script>

<div class="card">
  <div class="field">
    <label for="date">{i18n.t('journal.new.dateLabel')}</label>
    <input id="date" type="date" bind:value={date} max={today} required />
  </div>
</div>

<div class="card">
  <div class="field">
    <label for="content">{contentLabel}</label>
    <textarea id="content" bind:value={content} placeholder={contentPlaceholder} rows="7" required
    ></textarea>
  </div>
</div>

<div class="card">
  <p class="card-title"><Sparkles size={14} /> {i18n.t('journal.new.howFeeling')}</p>
  <MoodPicker bind:value={mood} label={i18n.t('journal.new.generalMood')} size="lg" />
  <MoodPicker bind:value={energyLevel} label={i18n.t('journal.new.energyLevel')} size="md" />
  <MoodPicker bind:value={sleepQuality} label={i18n.t('journal.new.sleepQuality')} size="md" />
</div>

<div class="card">
  <p class="card-title">{i18n.t('journal.new.tags')}</p>
  <TagInput bind:value={tags} placeholder={i18n.t('journal.new.addTags')} />
</div>

<div class="card">
  <div class="switch-row">
    <div>
      <p class="switch-label">{i18n.t('journal.new.privateEntry')}</p>
      <p class="switch-desc">{i18n.t('journal.new.excludeExport')}</p>
    </div>
    <label class="switch">
      <input type="checkbox" bind:checked={isPrivate} />
      <span class="track"></span>
      <span class="thumb"></span>
    </label>
  </div>
</div>

<div class="actions">
  {#if backHref}
    <a href={backHref} class="btn-outline-sm">{i18n.t('common.cancel')}</a>
  {/if}
  <button type="submit" class="btn-primary-sm" disabled={!content.trim() || saving}>
    {saving ? i18n.t('common.saving') : i18n.t('common.save')}
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
  .switch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .switch-label {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
  }
  .switch-desc {
    font-size: 12px;
    color: var(--ink-soft);
    margin: 2px 0 0;
  }
  .switch {
    position: relative;
    width: 44px;
    height: 26px;
    flex-shrink: 0;
  }
  .switch input {
    opacity: 0;
    width: 100%;
    height: 100%;
    position: absolute;
    margin: 0;
    cursor: pointer;
    z-index: 1;
  }
  .switch .track {
    position: absolute;
    inset: 0;
    background: var(--line);
    border-radius: 999px;
    transition: background 0.2s ease;
  }
  .switch input:checked + .track {
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
  }
  .switch .thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s ease;
    box-shadow: 0 1px 3px var(--shadow);
  }
  .switch input:checked ~ .thumb {
    transform: translateX(18px);
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
