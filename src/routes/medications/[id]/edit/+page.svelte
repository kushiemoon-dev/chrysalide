<script lang="ts">
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { i18n } from '$lib/i18n.svelte'
  import { getMedication, updateMedication, recordTreatmentChange } from '$lib/db'
  import type {
    MedicationType,
    AdministrationMethod,
    SchedulingMode,
    Medication,
    PillAdministrationRoute,
    InjectionAdministrationRoute,
  } from '$lib/types'
  import MedicationFormFields from '$lib/components/medications/MedicationFormFields.svelte'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'

  let loading = $state(true)
  let saving = $state(false)
  let medication = $state<Medication | null>(null)

  let name = $state('')
  let type = $state<MedicationType>('estrogen')
  let dosage = $state('')
  let unit = $state('mg')
  let frequency = $state('1x/jour')
  let method = $state<AdministrationMethod>('pill')
  let startDate = $state('')
  let endDate = $state('')
  let stock = $state('')
  let stockUnit = $state('')
  let stockAlert = $state('')
  let notes = $state('')
  let isActive = $state(true)
  let schedulingMode = $state<SchedulingMode>('simple')
  let scheduledTimes = $state<string[]>(['09:00'])
  let pillRoute = $state<PillAdministrationRoute | undefined>(undefined)
  let injectionRoute = $state<InjectionAdministrationRoute | undefined>(undefined)

  async function loadData() {
    const id = parseInt(page.params.id!)
    if (isNaN(id)) {
      await goto('/medications')
      return
    }

    const med = await getMedication(id)
    if (!med) {
      await goto('/medications')
      return
    }

    medication = med
    name = med.name
    type = med.type
    dosage = med.dosage.toString()
    unit = med.unit
    frequency = med.frequency
    method = med.method
    startDate = new Date(med.startDate).toISOString().split('T')[0]!
    endDate = med.endDate ? new Date(med.endDate).toISOString().split('T')[0]! : ''
    stock = med.stock?.toString() || ''
    stockUnit = med.stockUnit || ''
    stockAlert = med.stockAlert?.toString() || ''
    notes = med.notes || ''
    isActive = med.isActive
    schedulingMode = med.schedulingMode || 'simple'
    scheduledTimes = med.scheduledTimes || ['09:00']
    pillRoute = med.pillRoute
    injectionRoute = med.injectionRoute
    loading = false
  }

  $effect(() => {
    void page.params.id
    loading = true
    loadData()
  })

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!name || !dosage || !medication?.id) return

    saving = true
    try {
      const newDosage = parseFloat(dosage)

      if (medication.dosage !== newDosage || medication.unit !== unit) {
        await recordTreatmentChange(
          medication,
          'dosage_change',
          `${medication.dosage}${medication.unit}`,
          `${newDosage}${unit}`
        )
      }

      if (medication.method !== method) {
        await recordTreatmentChange(
          medication,
          'method_change',
          i18n.t(`medications.methods.${medication.method}`),
          i18n.t(`medications.methods.${method}`)
        )
      }

      if (medication.frequency !== frequency) {
        await recordTreatmentChange(medication, 'frequency_change', medication.frequency, frequency)
      }

      if (medication.isActive && !isActive) {
        await recordTreatmentChange(
          medication,
          'stopped',
          i18n.t('medications.edit.statusActive'),
          i18n.t('medications.edit.statusStopped')
        )
      }

      if (!medication.isActive && isActive) {
        await recordTreatmentChange(
          medication,
          'resumed',
          i18n.t('medications.edit.statusStopped'),
          i18n.t('medications.edit.statusActive')
        )
      }

      await updateMedication(medication.id, {
        name,
        type,
        dosage: newDosage,
        unit,
        frequency,
        method,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        stock: stock ? parseFloat(stock) : undefined,
        stockUnit: stockUnit || undefined,
        stockAlert: stockAlert ? parseFloat(stockAlert) : undefined,
        notes: notes || undefined,
        isActive,
        schedulingMode,
        scheduledTimes: schedulingMode === 'advanced' ? scheduledTimes : undefined,
        pillRoute: method === 'pill' ? pillRoute : undefined,
        injectionRoute: method === 'injection' ? injectionRoute : undefined,
      })

      await goto(`/medications/${medication.id}`)
    } finally {
      saving = false
    }
  }
</script>

<div class="header">
  <a
    href={medication ? `/medications/${medication.id}` : '/medications'}
    class="icon-link"
    aria-label={i18n.t('common.back')}><ArrowLeft size={20} /></a
  >
  <h1>{i18n.t('medications.edit.title')}</h1>
</div>

{#if loading}
  <p class="loading">{i18n.t('common.loading')}</p>
{:else}
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
      bind:endDate
      bind:isActive
      bind:notes
      {saving}
      backHref={medication ? `/medications/${medication.id}` : '/medications'}
    />
  </form>
{/if}

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
  .loading {
    color: var(--ink-soft);
    text-align: center;
    padding: 40px 0;
  }
</style>
