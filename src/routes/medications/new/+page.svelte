<script lang="ts">
  import { goto } from '$app/navigation'
  import { i18n } from '$lib/i18n.svelte'
  import { addMedication, getMedication, recordTreatmentChange } from '$lib/db'
  import { COMMON_MEDICATIONS } from '$lib/constants'
  import type {
    MedicationType,
    AdministrationMethod,
    SchedulingMode,
    PillAdministrationRoute,
    InjectionAdministrationRoute,
  } from '$lib/types'
  import MedicationFormFields from '$lib/components/medications/MedicationFormFields.svelte'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'
  import Sparkles from '@lucide/svelte/icons/sparkles'

  let loading = $state(false)

  let name = $state('')
  let type = $state<MedicationType>('estrogen')
  let dosage = $state('')
  let unit = $state('mg')
  let frequency = $state('1x/jour')
  let method = $state<AdministrationMethod>('pill')
  let startDate = $state(new Date().toISOString().split('T')[0]!)
  let stock = $state('')
  let stockUnit = $state('')
  let stockAlert = $state('')
  let schedulingMode = $state<SchedulingMode>('simple')
  let scheduledTimes = $state<string[]>(['09:00'])
  let pillRoute = $state<PillAdministrationRoute | undefined>(undefined)
  let injectionRoute = $state<InjectionAdministrationRoute | undefined>(undefined)

  function handleSelectCommonMedication(e: Event & { currentTarget: HTMLSelectElement }) {
    const med = COMMON_MEDICATIONS.find((m) => m.name === e.currentTarget.value)
    if (!med) return
    name = med.name
    type = med.type
    dosage = med.defaultDosage.toString()
    unit = med.defaultUnit
    method = med.method
    frequency = med.frequency
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!name || !dosage) return

    loading = true
    try {
      const medicationId = await addMedication({
        name,
        type,
        dosage: parseFloat(dosage),
        unit,
        frequency,
        method,
        startDate: new Date(startDate),
        stock: stock ? parseFloat(stock) : undefined,
        stockUnit: stockUnit || undefined,
        stockAlert: stockAlert ? parseFloat(stockAlert) : undefined,
        isActive: true,
        schedulingMode,
        scheduledTimes: schedulingMode === 'advanced' ? scheduledTimes : undefined,
        pillRoute: method === 'pill' ? pillRoute : undefined,
        injectionRoute: method === 'injection' ? injectionRoute : undefined,
      })

      const newMed = await getMedication(medicationId as number)
      if (newMed) {
        await recordTreatmentChange(newMed, 'started', undefined, `${dosage}${unit} ${frequency}`)
      }

      await goto('/medications')
    } finally {
      loading = false
    }
  }
</script>

<div class="header">
  <a href="/medications" class="icon-link" aria-label={i18n.t('common.back')}
    ><ArrowLeft size={20} /></a
  >
  <h1>{i18n.t('medications.new.title')}</h1>
</div>

<div class="card">
  <p class="card-title"><Sparkles size={14} /> {i18n.t('medications.new.commonTitle')}</p>
  <select onchange={handleSelectCommonMedication}>
    <option value="">{i18n.t('medications.new.commonPlaceholder')}</option>
    {#each COMMON_MEDICATIONS as med (med.name)}
      <option value={med.name}>{med.name}</option>
    {/each}
  </select>
</div>

<form onsubmit={handleSubmit}>
  <MedicationFormFields
    bind:name
    bind:type
    bind:dosage
    bind:unit
    bind:method
    bind:frequency
    bind:startDate
    bind:pillRoute
    bind:injectionRoute
    bind:schedulingMode
    bind:scheduledTimes
    bind:stock
    bind:stockUnit
    bind:stockAlert
    saving={loading}
    backHref="/medications"
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
  .card {
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 16px;
  }
  .card-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    margin: 0 0 12px;
  }
  select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--page);
    color: var(--ink);
    font-family: inherit;
    font-size: 14px;
  }
</style>
