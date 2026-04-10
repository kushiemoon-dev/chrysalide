'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Sparkles, Clock, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { addMedication, getMedication, recordTreatmentChange } from '@/lib/db'
import { Switch } from '@/components/ui/switch'
import type {
  MedicationType,
  AdministrationMethod,
  SchedulingMode,
  PillAdministrationRoute,
  InjectionAdministrationRoute,
} from '@/lib/types'
import {
  MEDICATION_TYPES,
  ADMINISTRATION_METHODS,
  COMMON_MEDICATIONS,
  DOSAGE_UNITS,
  STOCK_UNITS,
  PILL_ROUTES,
  INJECTION_ROUTES,
  getFrequenciesForMethod,
} from '@/lib/constants'

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

  function handleAddTime() {
    setScheduledTimes([...scheduledTimes, '12:00'])
  }

  function handleRemoveTime(index: number) {
    if (scheduledTimes.length > 1) {
      setScheduledTimes(scheduledTimes.filter((_, i) => i !== index))
    }
  }

  function handleTimeChange(index: number, value: string) {
    const newTimes = [...scheduledTimes]
    newTimes[index] = value
    setScheduledTimes(newTimes)
  }

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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('new.generalInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('form.medicationName')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('new.namePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">{t('form.type')}</Label>
              <Select value={type} onValueChange={(v) => setType(v as MedicationType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(MEDICATION_TYPES).map((key) => (
                    <SelectItem key={key} value={key}>
                      {t(`types.${key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dosage">{t('form.dosage')}</Label>
                <Input
                  id="dosage"
                  type="number"
                  step="0.1"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="2"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">{t('form.unit')}</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOSAGE_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">{t('form.method')}</Label>
              <Select
                value={method}
                onValueChange={(v) => {
                  const newMethod = v as AdministrationMethod
                  setMethod(newMethod)
                  // Reset fréquence à la première valeur valide pour cette méthode
                  const validFrequencies = getFrequenciesForMethod(newMethod)
                  if (!validFrequencies.includes(frequency)) {
                    setFrequency(validFrequencies[0])
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(ADMINISTRATION_METHODS).map((key) => (
                    <SelectItem key={key} value={key}>
                      {t(`methods.${key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Route d'administration pour comprimés */}
            {method === 'pill' && (
              <div className="space-y-2">
                <Label htmlFor="pillRoute">{t('form.pillRoute')}</Label>
                <Select
                  value={pillRoute || ''}
                  onValueChange={(v) => setPillRoute((v as PillAdministrationRoute) || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.selectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(PILL_ROUTES).map((key) => (
                      <SelectItem key={key} value={key}>
                        {t(`pillRoutes.${key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Route d'administration pour injections */}
            {method === 'injection' && (
              <div className="space-y-2">
                <Label htmlFor="injectionRoute">{t('form.injectionRoute')}</Label>
                <Select
                  value={injectionRoute || ''}
                  onValueChange={(v) =>
                    setInjectionRoute((v as InjectionAdministrationRoute) || undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.selectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(INJECTION_ROUTES).map((key) => (
                      <SelectItem key={key} value={key}>
                        {t(`injectionRoutes.${key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="frequency">{t('form.frequency')}</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getFrequenciesForMethod(method).map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">{t('form.startDate')}</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Mode avancé: horaires précis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="text-primary h-4 w-4" />
              {t('new.schedulingTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">{t('new.advancedMode')}</p>
                <p className="text-muted-foreground text-sm">{t('new.advancedModeDescription')}</p>
              </div>
              <Switch
                checked={schedulingMode === 'advanced'}
                onCheckedChange={(checked) => setSchedulingMode(checked ? 'advanced' : 'simple')}
              />
            </div>

            {schedulingMode === 'advanced' && (
              <div className="border-border space-y-3 border-t pt-2">
                <p className="text-muted-foreground text-sm">{t('new.advancedModeHint')}</p>
                {scheduledTimes.map((time, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => handleTimeChange(index, e.target.value)}
                      className="flex-1"
                    />
                    {scheduledTimes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveTime(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTime}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {t('new.addTime')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('new.stockTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">{t('form.stock')}</Label>
                <Input
                  id="stock"
                  type="number"
                  step="0.1"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockUnit">{t('form.stockUnit')}</Label>
                <Select value={stockUnit} onValueChange={setStockUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.selectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {STOCK_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {t(`stockUnits.${u}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockAlert">{t('form.lowStockAlert')}</Label>
              <Input
                id="stockAlert"
                type="number"
                step="0.1"
                value={stockAlert}
                onChange={(e) => setStockAlert(e.target.value)}
                placeholder="7"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link href="/medications" className="flex-1">
            <Button variant="outline" className="w-full" type="button">
              {tc('cancel')}
            </Button>
          </Link>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? tc('saving') : tc('save')}
          </Button>
        </div>
      </form>
    </div>
  )
}
