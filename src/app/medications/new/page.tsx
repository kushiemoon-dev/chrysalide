'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { addMedication, getMedication, recordTreatmentChange } from '@/lib/db'
import type {
  MedicationType,
  AdministrationMethod,
  SchedulingMode,
  PillAdministrationRoute,
  InjectionAdministrationRoute,
} from '@/lib/types'
import { COMMON_MEDICATIONS } from '@/lib/constants'
import { MedicationFormFields } from '@/components/medications/MedicationFormFields'

export default function NewMedicationPage() {
  const router = useRouter()
  const t = useTranslations('medications')
  const tc = useTranslations('common')
  const [loading, setLoading] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState<MedicationType>('estrogen')
  const [dosage, setDosage] = useState('')
  const [unit, setUnit] = useState('mg')
  const [frequency, setFrequency] = useState('1x/jour')
  const [method, setMethod] = useState<AdministrationMethod>('pill')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [stock, setStock] = useState('')
  const [stockUnit, setStockUnit] = useState('')
  const [stockAlert, setStockAlert] = useState('')

  // Mode avancé: doses multiples avec horaires précis
  const [schedulingMode, setSchedulingMode] = useState<SchedulingMode>('simple')
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(['09:00'])

  // Routes d'administration spécifiques
  const [pillRoute, setPillRoute] = useState<PillAdministrationRoute | undefined>(undefined)
  const [injectionRoute, setInjectionRoute] = useState<InjectionAdministrationRoute | undefined>(
    undefined
  )

  function handleSelectCommonMedication(medName: string) {
    const med = COMMON_MEDICATIONS.find((m) => m.name === medName)
    if (med) {
      setName(med.name)
      setType(med.type)
      setDosage(med.defaultDosage.toString())
      setUnit(med.defaultUnit)
      setMethod(med.method)
      setFrequency(med.frequency)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name || !dosage) {
      return
    }

    setLoading(true)

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

      // Auto-track: enregistrer le début du traitement
      const newMed = await getMedication(medicationId as number)
      if (newMed) {
        await recordTreatmentChange(newMed, 'started', undefined, `${dosage}${unit} ${frequency}`)
      }

      router.push('/medications')
    } catch (error) {
      console.error('Error adding medication:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link href="/medications">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-foreground text-xl font-bold">{t('new.title')}</h1>
      </div>

      {/* Quick Select */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="text-primary h-4 w-4" />
            {t('new.commonTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={handleSelectCommonMedication}>
            <SelectTrigger>
              <SelectValue placeholder={t('new.commonPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {COMMON_MEDICATIONS.map((med) => (
                <SelectItem key={med.name} value={med.name}>
                  {med.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

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
          saving={loading}
          backHref="/medications"
          cancelLabel={tc('cancel')}
          saveLabel={tc('save')}
          savingLabel={tc('saving')}
        />
      </form>
    </div>
  )
}
