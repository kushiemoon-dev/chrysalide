'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getMedication, updateMedication, recordTreatmentChange } from '@/lib/db'
import type {
  MedicationType,
  AdministrationMethod,
  SchedulingMode,
  Medication,
  PillAdministrationRoute,
  InjectionAdministrationRoute,
} from '@/lib/types'
import { MedicationFormFields } from '@/components/medications/MedicationFormFields'

export default function EditMedicationPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('medications')
  const tc = useTranslations('common')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [medication, setMedication] = useState<Medication | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState<MedicationType>('estrogen')
  const [dosage, setDosage] = useState('')
  const [unit, setUnit] = useState('mg')
  const [frequency, setFrequency] = useState('1x/jour')
  const [method, setMethod] = useState<AdministrationMethod>('pill')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [stock, setStock] = useState('')
  const [stockUnit, setStockUnit] = useState('')
  const [stockAlert, setStockAlert] = useState('')
  const [notes, setNotes] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [schedulingMode, setSchedulingMode] = useState<SchedulingMode>('simple')
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(['09:00'])
  const [pillRoute, setPillRoute] = useState<PillAdministrationRoute | undefined>(undefined)
  const [injectionRoute, setInjectionRoute] = useState<InjectionAdministrationRoute | undefined>(
    undefined
  )

  useEffect(() => {
    async function loadData() {
      const id = parseInt(params.id as string)
      if (isNaN(id)) {
        router.push('/medications')
        return
      }

      const med = await getMedication(id)
      if (!med) {
        router.push('/medications')
        return
      }

      setMedication(med)
      setName(med.name)
      setType(med.type)
      setDosage(med.dosage.toString())
      setUnit(med.unit)
      setFrequency(med.frequency)
      setMethod(med.method)
      setStartDate(new Date(med.startDate).toISOString().split('T')[0])
      setEndDate(med.endDate ? new Date(med.endDate).toISOString().split('T')[0] : '')
      setStock(med.stock?.toString() || '')
      setStockUnit(med.stockUnit || '')
      setStockAlert(med.stockAlert?.toString() || '')
      setNotes(med.notes || '')
      setIsActive(med.isActive)
      setSchedulingMode(med.schedulingMode || 'simple')
      setScheduledTimes(med.scheduledTimes || ['09:00'])
      setPillRoute(med.pillRoute)
      setInjectionRoute(med.injectionRoute)
      setLoading(false)
    }
    loadData()
  }, [params.id, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name || !dosage || !medication?.id) {
      return
    }

    setSaving(true)

    try {
      const newDosage = parseFloat(dosage)

      // Auto-tracking: détecter les changements
      // Changement de dosage
      if (medication.dosage !== newDosage || medication.unit !== unit) {
        await recordTreatmentChange(
          medication,
          'dosage_change',
          `${medication.dosage}${medication.unit}`,
          `${newDosage}${unit}`
        )
      }

      // Changement de méthode d'administration
      if (medication.method !== method) {
        await recordTreatmentChange(
          medication,
          'method_change',
          t(`methods.${medication.method}`),
          t(`methods.${method}`)
        )
      }

      // Changement de fréquence
      if (medication.frequency !== frequency) {
        await recordTreatmentChange(medication, 'frequency_change', medication.frequency, frequency)
      }

      // Arrêt ou pause du médicament
      if (medication.isActive && !isActive) {
        await recordTreatmentChange(medication, 'stopped', 'Actif', 'Arrêté')
      }

      // Reprise du médicament
      if (!medication.isActive && isActive) {
        await recordTreatmentChange(medication, 'resumed', 'Arrêté', 'Actif')
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

      router.push(`/medications/${medication.id}`)
    } catch (error) {
      console.error('Error updating medication:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link href={`/medications/${medication?.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-foreground text-xl font-bold">{t('edit.title')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <MedicationFormFields
          name={name}
          onNameChange={setName}
          type={type}
          onTypeChange={setType}
          dosage={dosage}
          onDosageChange={setDosage}
          unit={unit}
          onUnitChange={setUnit}
          method={method}
          onMethodChange={setMethod}
          frequency={frequency}
          onFrequencyChange={setFrequency}
          startDate={startDate}
          onStartDateChange={setStartDate}
          pillRoute={pillRoute}
          onPillRouteChange={setPillRoute}
          injectionRoute={injectionRoute}
          onInjectionRouteChange={setInjectionRoute}
          schedulingMode={schedulingMode}
          onSchedulingModeChange={setSchedulingMode}
          scheduledTimes={scheduledTimes}
          onScheduledTimesChange={setScheduledTimes}
          stock={stock}
          onStockChange={setStock}
          stockUnit={stockUnit}
          onStockUnitChange={setStockUnit}
          stockAlert={stockAlert}
          onStockAlertChange={setStockAlert}
          saving={saving}
          backHref={`/medications/${medication?.id}`}
          cancelLabel={tc('cancel')}
          saveLabel={tc('save')}
          savingLabel={tc('saving')}
          endDate={endDate}
          onEndDateChange={setEndDate}
          isActive={isActive}
          onIsActiveChange={setIsActive}
          notes={notes}
          onNotesChange={setNotes}
        />
      </form>
    </div>
  )
}
