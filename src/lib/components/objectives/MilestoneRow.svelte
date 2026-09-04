<script lang="ts">
  import { format } from 'date-fns'
  import { i18n, getDateLocale } from '$lib/i18n.svelte'
  import type { Milestone } from '$lib/types'
  import CalendarIcon from '@lucide/svelte/icons/calendar'
  import CheckCircle2 from '@lucide/svelte/icons/check-circle-2'
  import Pencil from '@lucide/svelte/icons/pencil'
  import Trash2 from '@lucide/svelte/icons/trash-2'
  import Check from '@lucide/svelte/icons/check'
  import X from '@lucide/svelte/icons/x'

  let {
    milestone,
    onToggle,
    onUpdate,
    onDelete,
  }: {
    milestone: Milestone
    onToggle: (id: number, achieved: boolean) => void
    onUpdate: (id: number, updates: Partial<Milestone>) => void
    onDelete: (id: number) => void
  } = $props()

  let isEditing = $state(false)
  let editTitle = $state('')
  let editDate = $state('')

  function startEdit() {
    editTitle = milestone.title
    editDate = milestone.date ? new Date(milestone.date).toISOString().split('T')[0]! : ''
    isEditing = true
  }

  function save() {
    if (!editTitle.trim() || !milestone.id) return
    onUpdate(milestone.id, {
      title: editTitle.trim(),
      date: editDate ? new Date(editDate) : undefined,
    })
    isEditing = false
  }
</script>

{#if isEditing}
  <div class="row editing">
    <input type="text" bind:value={editTitle} class="edit-title" />
    <input type="date" bind:value={editDate} class="edit-date" />
    <div class="edit-actions">
      <button
        type="button"
        class="icon-btn"
        onclick={() => (isEditing = false)}
        aria-label={i18n.t('common.cancel')}
      >
        <X size={14} />
      </button>
      <button
        type="button"
        class="icon-btn"
        onclick={save}
        disabled={!editTitle.trim()}
        aria-label={i18n.t('common.save')}
      >
        <Check size={14} />
      </button>
    </div>
  </div>
{:else}
  <div class="row" class:achieved={milestone.achieved}>
    <input
      type="checkbox"
      checked={milestone.achieved}
      onchange={(e) => onToggle(milestone.id!, e.currentTarget.checked)}
    />
    <div class="body">
      <p class="title">{milestone.title}</p>
      {#if milestone.date && !milestone.achieved}
        <span class="meta">
          <CalendarIcon size={11} />
          {format(new Date(milestone.date), 'd MMM yyyy', { locale: getDateLocale(i18n.locale) })}
        </span>
      {/if}
      {#if milestone.achieved && milestone.achievedDate}
        <span class="meta done">
          <CheckCircle2 size={11} />
          {i18n.t('objectives.timeline.doneOn')}
          {format(new Date(milestone.achievedDate), 'd MMM yyyy', {
            locale: getDateLocale(i18n.locale),
          })}
        </span>
      {/if}
    </div>
    <div class="actions">
      <button type="button" class="icon-btn" onclick={startEdit} aria-label={i18n.t('common.edit')}>
        <Pencil size={14} />
      </button>
      <button
        type="button"
        class="icon-btn danger"
        onclick={() => onDelete(milestone.id!)}
        aria-label={i18n.t('common.delete')}
      >
        <Trash2 size={14} />
      </button>
    </div>
  </div>
{/if}

<style>
  .row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px;
    border-radius: 12px;
    background: var(--page);
  }
  .row.achieved {
    background: color-mix(in srgb, var(--ok) 10%, transparent);
  }
  .row input[type='checkbox'] {
    margin-top: 3px;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
  .body {
    flex: 1;
    min-width: 0;
  }
  .title {
    font-size: 13.5px;
    font-weight: 500;
    margin: 0;
  }
  .row.achieved .title {
    color: var(--ink-soft);
    text-decoration: line-through;
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--ink-soft);
    margin-top: 4px;
  }
  .meta.done {
    color: var(--ok);
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }
  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--ink-soft);
    cursor: pointer;
  }
  .icon-btn.danger {
    color: var(--alert);
  }
  .icon-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .row.editing {
    flex-wrap: wrap;
  }
  .edit-title,
  .edit-date {
    padding: 7px 9px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--bg);
    color: var(--ink);
    font-family: inherit;
    font-size: 13px;
  }
  .edit-title {
    flex: 1;
    min-width: 120px;
  }
  .edit-actions {
    display: flex;
    gap: 2px;
  }
</style>
