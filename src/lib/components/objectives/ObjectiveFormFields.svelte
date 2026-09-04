<script lang="ts">
  import { i18n } from '$lib/i18n.svelte'
  import { ACT_CATEGORIES } from '$lib/constants'
  import type { ObjectiveCategory, ObjectiveStatus, ActCategory } from '$lib/types'
  import { categoryConfig } from './ObjectiveCard.svelte'
  import Plus from '@lucide/svelte/icons/plus'
  import X from '@lucide/svelte/icons/x'

  const CATEGORIES = Object.keys(categoryConfig) as ObjectiveCategory[]
  const ACT_CATEGORY_KEYS = Object.keys(ACT_CATEGORIES) as ActCategory[]

  export interface MilestoneInput {
    title: string
  }

  let {
    title = $bindable(),
    description = $bindable(),
    category = $bindable(),
    actCategory = $bindable(),
    information = $bindable(),
    status = $bindable(),
    targetDate = $bindable(),
    notes = $bindable(undefined),
    milestones = $bindable(undefined),
    newMilestoneTitle = $bindable(''),
    variant = 'new',
    saving,
    backHref,
  }: {
    title: string
    description: string
    category: ObjectiveCategory
    actCategory: ActCategory | ''
    information: string
    status: ObjectiveStatus
    targetDate: string
    notes?: string
    milestones?: MilestoneInput[]
    newMilestoneTitle?: string
    variant?: 'new' | 'edit'
    saving: boolean
    backHref: string
  } = $props()

  function addMilestone() {
    if (!newMilestoneTitle?.trim() || milestones === undefined) return
    milestones = [...milestones, { title: newMilestoneTitle.trim() }]
    newMilestoneTitle = ''
  }

  function removeMilestone(index: number) {
    if (milestones === undefined) return
    milestones = milestones.filter((_, i) => i !== index)
  }
</script>

<div class="card">
  <div class="field">
    <label for="title">{i18n.t('objectives.edit.titleLabel')}</label>
    <input
      id="title"
      type="text"
      bind:value={title}
      placeholder={i18n.t('objectives.edit.titlePlaceholder')}
      required
    />
  </div>
  <div class="field">
    <label for="description">{i18n.t('objectives.edit.description')}</label>
    <textarea
      id="description"
      bind:value={description}
      placeholder={i18n.t('objectives.edit.descriptionPlaceholder')}
      rows="3"
    ></textarea>
  </div>
</div>

<div class="card">
  <p class="card-title">{i18n.t('objectives.edit.categoryAndStatus')}</p>
  <div class="field">
    <label for="category">{i18n.t('objectives.edit.category')}</label>
    <select id="category" bind:value={category}>
      {#each CATEGORIES as key (key)}
        <option value={key}>{i18n.t('objectives.categories.' + key)}</option>
      {/each}
    </select>
  </div>

  {#if category === 'medical'}
    <div class="field">
      <label for="actCategory">{i18n.t('objectives.act.categoryLabel')}</label>
      <select id="actCategory" bind:value={actCategory}>
        <option value="">—</option>
        {#each ACT_CATEGORY_KEYS as key (key)}
          <option value={key}>{i18n.t('objectives.actCategories.' + key)}</option>
        {/each}
      </select>
    </div>
    <div class="field">
      <label for="information">{i18n.t('objectives.act.informationLabel')}</label>
      <textarea
        id="information"
        bind:value={information}
        placeholder={i18n.t('objectives.act.informationPlaceholder')}
        rows="3"
      ></textarea>
    </div>
  {/if}

  <div class="field">
    <label for="status">{i18n.t('objectives.detail.status')}</label>
    <select id="status" bind:value={status}>
      <option value="not_started">{i18n.t('objectives.detail.statuses.not_started')}</option>
      <option value="in_progress">{i18n.t('objectives.detail.statuses.in_progress')}</option>
      {#if variant === 'edit'}
        <option value="completed">{i18n.t('objectives.detail.statuses.completed')}</option>
        <option value="paused">{i18n.t('objectives.detail.statuses.paused')}</option>
        <option value="cancelled">{i18n.t('objectives.detail.statuses.cancelled')}</option>
      {/if}
    </select>
  </div>

  <div class="field">
    <label for="targetDate">{i18n.t('objectives.edit.targetDate')}</label>
    <input id="targetDate" type="date" bind:value={targetDate} />
    {#if variant === 'edit' && targetDate}
      <button type="button" class="link-btn" onclick={() => (targetDate = '')}>
        {i18n.t('objectives.edit.removeDate')}
      </button>
    {/if}
  </div>
</div>

{#if milestones !== undefined}
  <div class="card">
    <p class="card-title">{i18n.t('objectives.detail.milestonesTitle')}</p>
    {#if milestones.length > 0}
      <div class="milestone-list">
        {#each milestones as milestone, index (index)}
          <div class="milestone-chip">
            <span class="num">{index + 1}</span>
            <span class="txt">{milestone.title}</span>
            <button type="button" class="icon-btn" onclick={() => removeMilestone(index)}>
              <X size={14} />
            </button>
          </div>
        {/each}
      </div>
    {/if}
    <div class="add-row">
      <input
        type="text"
        bind:value={newMilestoneTitle}
        placeholder={i18n.t('objectives.detail.addMilestone')}
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            addMilestone()
          }
        }}
      />
      <button
        type="button"
        class="icon-btn add"
        onclick={addMilestone}
        disabled={!newMilestoneTitle?.trim()}
      >
        <Plus size={16} />
      </button>
    </div>
  </div>
{/if}

{#if notes !== undefined}
  <div class="card">
    <p class="card-title">{i18n.t('objectives.edit.notes')}</p>
    <textarea bind:value={notes} placeholder={i18n.t('objectives.edit.notesPlaceholder')} rows="3"
    ></textarea>
  </div>
{/if}

<div class="actions">
  <a href={backHref} class="btn-outline-sm">{i18n.t('common.cancel')}</a>
  <button type="submit" class="btn-primary-sm" disabled={!title.trim() || saving}>
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
    font-size: 13px;
    font-weight: 600;
    margin: 0 0 10px;
  }
  .field {
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
  }
  .field:last-child {
    margin-bottom: 0;
  }
  label {
    font-size: 12px;
    color: var(--ink-soft);
    margin-bottom: 5px;
  }
  input,
  select,
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
  .link-btn {
    align-self: flex-start;
    margin-top: 6px;
    border: none;
    background: transparent;
    color: var(--ink-soft);
    font-family: inherit;
    font-size: 12px;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
  }
  .milestone-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 10px;
  }
  .milestone-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--page);
    border-radius: 10px;
    padding: 8px 10px;
  }
  .num {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--blue-deep) 18%, transparent);
    color: var(--blue-deep);
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .txt {
    flex: 1;
    font-size: 13px;
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
    flex-shrink: 0;
  }
  .icon-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .icon-btn.add {
    background: var(--page);
    border: 1px solid var(--line);
  }
  .add-row {
    display: flex;
    gap: 8px;
  }
  .add-row input {
    flex: 1;
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
