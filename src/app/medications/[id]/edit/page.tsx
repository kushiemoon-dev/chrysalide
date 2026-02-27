'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Clock, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { getMedication, updateMedication, recordTreatmentChange } from '@/lib/db'
import { Switch } from '@/components/ui/switch'
import type {
  MedicationType,
  AdministrationMethod,
  SchedulingMode,
  Medication,
  PillAdministrationRoute,
  InjectionAdministrationRoute,
} from '@/lib/types'
import {
  MEDICATION_TYPES,
  ADMINISTRATION_METHODS,
  DOSAGE_UNITS,
  STOCK_UNITS,
  PILL_ROUTES,
  INJECTION_ROUTES,
  getFrequenciesForMethod,
} from '@/lib/constants'

export default function EditMedicationPage() {
  const params = useParams()
  const router = useRouter()
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
          ADMINISTRATION_METHODS[medication.method],
          ADMINISTRATION_METHODS[method]
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
        <h1 className="text-foreground text-xl font-bold">Modifier le médicament</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du médicament</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Œstradiol"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as MedicationType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEDICATION_TYPES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage</Label>
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
                <Label htmlFor="unit">Unité</Label>
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
              <Label htmlFor="method">Mode d&apos;administration</Label>
              <Select
                value={method}
                onValueChange={(v) => {
                  const newMethod = v as AdministrationMethod
                  setMethod(newMethod)
                  // Reset fréquence si invalide pour cette méthode
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
                  {Object.entries(ADMINISTRATION_METHODS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Route d'administration pour comprimés */}
            {method === 'pill' && (
              <div className="space-y-2">
                <Label htmlFor="pillRoute">Voie d&apos;administration (optionnel)</Label>
                <Select
                  value={pillRoute || ''}
                  onValueChange={(v) => setPillRoute((v as PillAdministrationRoute) || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PILL_ROUTES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Route d'administration pour injections */}
            {method === 'injection' && (
              <div className="space-y-2">
                <Label htmlFor="injectionRoute">Type d&apos;injection (optionnel)</Label>
                <Select
                  value={injectionRoute || ''}
                  onValueChange={(v) =>
                    setInjectionRoute((v as InjectionAdministrationRoute) || undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INJECTION_ROUTES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="frequency">Fréquence</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin (optionnel)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-foreground font-medium">Médicament actif</p>
                <p className="text-muted-foreground text-sm">
                  Afficher dans la liste des médicaments à prendre
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </CardContent>
        </Card>

        {/* Mode avancé: horaires précis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="text-primary h-4 w-4" />
              Horaires de prise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">Mode avancé</p>
                <p className="text-muted-foreground text-sm">
                  Définir des horaires précis pour chaque dose
                </p>
              </div>
              <Switch
                checked={schedulingMode === 'advanced'}
                onCheckedChange={(checked) => setSchedulingMode(checked ? 'advanced' : 'simple')}
              />
            </div>

            {schedulingMode === 'advanced' && (
              <div className="border-border space-y-3 border-t pt-2">
                <p className="text-muted-foreground text-sm">
                  Ajoutez les horaires pour chaque prise quotidienne :
                </p>
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
                  Ajouter un horaire
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gestion du stock (optionnel)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock actuel</Label>
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
                <Label htmlFor="stockUnit">Unité de stock</Label>
                <Select value={stockUnit} onValueChange={setStockUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STOCK_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockAlert">Alerte si sous</Label>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes (optionnel)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes personnelles, effets secondaires observés, etc."
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link href={`/medications/${medication?.id}`} className="flex-1">
            <Button variant="outline" className="w-full" type="button">
              Annuler
            </Button>
          </Link>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </div>
  )
}
