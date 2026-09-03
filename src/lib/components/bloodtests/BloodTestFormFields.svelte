<script module lang="ts">
  import { BLOOD_MARKERS as _BLOOD_MARKERS } from '$lib/constants'
  import type { BloodMarker as _BloodMarker } from '$lib/types'

  const _MARKERS = Object.keys(_BLOOD_MARKERS) as _BloodMarker[]

  export const EMPTY_MARKER_VALUES: Record<_BloodMarker, string> = Object.fromEntries(
    _MARKERS.map((m) => [m, ''])
  ) as Record<_BloodMarker, string>

  export const DEFAULT_MARKER_UNITS: Record<_BloodMarker, string> = Object.fromEntries(
    _MARKERS.map((m) => [m, _BLOOD_MARKERS[m].unit])
  ) as Record<_BloodMarker, string>
</script>

<script lang="ts">
  import { i18n } from '$lib/i18n.svelte'
  import { BLOOD_MARKERS, getMarkerUnitOptions, getReferenceRangeSource } from '$lib/constants'
  import type { BloodMarker } from '$lib/types'
  import FlaskConical from '@lucide/svelte/icons/flask-conical'
  import Heart from '@lucide/svelte/icons/heart'
  import Activity from '@lucide/svelte/icons/activity'

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

  let {
    date = $bindable(),
    lab = $bindable(),
    notes = $bindable(),
    markerValues = $bindable(),
    markerUnits = $bindable(),
    context,
    saving,
    backHref,
  }: {
    date: string
    lab: string
    notes: string
    markerValues: Record<BloodMarker, string>
    markerUnits: Record<BloodMarker, string>
    context: 'feminizing' | 'masculinizing'
    saving: boolean
    backHref: string
  } = $props()
</script>

<div class="card">
  <p class="card-title">{i18n.t('bloodtests.new.generalInfo')}</p>
  <div class="field-row">
    <div class="field">
      <label for="date">{i18n.t('bloodtests.new.dateLabel')}</label>
      <input id="date" type="date" bind:value={date} required />
    </div>
    <div class="field">
      <label for="lab">{i18n.t('bloodtests.new.labLabel')}</label>
      <input
        id="lab"
        type="text"
        bind:value={lab}
        placeholder={i18n.t('bloodtests.new.labOptional')}
      />
    </div>
  </div>
</div>

{#each MARKER_GROUPS as group (group.key)}
  {@const Icon = group.icon}
  <div class="card">
    <p class="card-title"><Icon size={14} /> {i18n.t('bloodtests.groups.' + group.key)}</p>
    <div class="marker-grid">
      {#each group.markers as marker (marker)}
        {@const unitOptions = getMarkerUnitOptions(marker)}
        {@const source = getReferenceRangeSource(marker, context)}
        <div class="field">
          <label for={marker}>
            {i18n.t('bloodtests.markers.' + marker)}
            {#if unitOptions.length === 1}
              <span class="unit-hint">({BLOOD_MARKERS[marker].unit})</span>
            {/if}
          </label>
          <div class="value-row">
            <input
              id={marker}
              type="number"
              step="0.01"
              value={markerValues[marker]}
              oninput={(e) => {
                markerValues = { ...markerValues, [marker]: e.currentTarget.value }
              }}
              placeholder="—"
            />
            {#if unitOptions.length > 1}
              <select
                value={markerUnits[marker]}
                onchange={(e) => {
                  markerUnits = { ...markerUnits, [marker]: e.currentTarget.value }
                }}
              >
                {#each unitOptions as unit (unit)}
                  <option value={unit}>{unit}</option>
                {/each}
              </select>
            {/if}
          </div>
          {#if source}
            <p class="source-hint">{i18n.t('bloodtests.new.sourcePrefix')} {source}</p>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/each}

<div class="card">
  <p class="card-title">{i18n.t('bloodtests.new.notesTitle')}</p>
  <textarea bind:value={notes} placeholder={i18n.t('bloodtests.new.notesPlaceholder')} rows="3"
  ></textarea>
</div>

<div class="actions">
  <a href={backHref} class="btn-outline-sm">{i18n.t('bloodtests.new.cancel')}</a>
  <button type="submit" class="btn-primary-sm" disabled={saving}>
    {saving ? i18n.t('bloodtests.new.saving') : i18n.t('bloodtests.new.save')}
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
    margin: 0 0 10px;
  }
  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .marker-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
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
  .unit-hint {
    color: var(--ink-faint);
  }
  .value-row {
    display: flex;
    gap: 6px;
  }
  .source-hint {
    font-size: 10.5px;
    color: var(--ink-faint);
    margin: 4px 0 0;
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
  .value-row select {
    width: auto;
    flex-shrink: 0;
    padding: 9px 6px;
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
