'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
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
import { Switch } from '@/components/ui/switch'
import { Clock, Plus, Trash2 } from 'lucide-react'
import {
  MEDICATION_TYPES,
  ADMINISTRATION_METHODS,
  DOSAGE_UNITS,
  STOCK_UNITS,
  PILL_ROUTES,
  INJECTION_ROUTES,
  getFrequenciesForMethod,
} from '@/lib/constants'
import type {
  MedicationType,
  AdministrationMethod,
  SchedulingMode,
  PillAdministrationRoute,
  InjectionAdministrationRoute,
} from '@/lib/types'

interface Props {
  name: string
  onNameChange: (v: string) => void
  type: MedicationType
  onTypeChange: (v: MedicationType) => void
  dosage: string
  onDosageChange: (v: string) => void
  unit: string
  onUnitChange: (v: string) => void
  method: AdministrationMethod
  onMethodChange: (v: AdministrationMethod) => void
  frequency: string
  onFrequencyChange: (v: string) => void
  startDate: string
  onStartDateChange: (v: string) => void
  pillRoute: PillAdministrationRoute | undefined
  onPillRouteChange: (v: PillAdministrationRoute | undefined) => void
  injectionRoute: InjectionAdministrationRoute | undefined
  onInjectionRouteChange: (v: InjectionAdministrationRoute | undefined) => void
  schedulingMode: SchedulingMode
  onSchedulingModeChange: (v: SchedulingMode) => void
  scheduledTimes: string[]
  onScheduledTimesChange: (v: string[]) => void
  stock: string
  onStockChange: (v: string) => void
  stockUnit: string
  onStockUnitChange: (v: string) => void
  stockAlert: string
  onStockAlertChange: (v: string) => void
  saving: boolean
  backHref: string
  cancelLabel: string
  saveLabel: string
  savingLabel: string
  // edit-only optional
  endDate?: string
  onEndDateChange?: (v: string) => void
  isActive?: boolean
  onIsActiveChange?: (v: boolean) => void
  notes?: string
  onNotesChange?: (v: string) => void
}

export function MedicationFormFields({
  name,
  onNameChange,
  type,
  onTypeChange,
  dosage,
  onDosageChange,
  unit,
  onUnitChange,
  method,
  onMethodChange,
  frequency,
  onFrequencyChange,
  startDate,
  onStartDateChange,
  pillRoute,
  onPillRouteChange,
  injectionRoute,
  onInjectionRouteChange,
  schedulingMode,
  onSchedulingModeChange,
  scheduledTimes,
  onScheduledTimesChange,
  stock,
  onStockChange,
  stockUnit,
  onStockUnitChange,
  stockAlert,
  onStockAlertChange,
  saving,
  backHref,
  cancelLabel,
  saveLabel,
  savingLabel,
  endDate,
  onEndDateChange,
  isActive,
  onIsActiveChange,
  notes,
  onNotesChange,
}: Props) {
  const t = useTranslations('medications')

  function handleMethodChange(newMethod: AdministrationMethod) {
    onMethodChange(newMethod)
    const valid = getFrequenciesForMethod(newMethod)
    if (!valid.includes(frequency)) onFrequencyChange(valid[0])
  }

  function handleAddTime() {
    onScheduledTimesChange([...scheduledTimes, '12:00'])
  }

  function handleRemoveTime(index: number) {
    if (scheduledTimes.length > 1) {
      onScheduledTimesChange(scheduledTimes.filter((_, i) => i !== index))
    }
  }

  function handleTimeChange(index: number, value: string) {
    const next = [...scheduledTimes]
    next[index] = value
    onScheduledTimesChange(next)
  }

  return (
    <>
      {/* General Info */}
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
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={t('new.namePlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">{t('form.type')}</Label>
            <Select value={type} onValueChange={(v) => onTypeChange(v as MedicationType)}>
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
                onChange={(e) => onDosageChange(e.target.value)}
                placeholder="2"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">{t('form.unit')}</Label>
              <Select value={unit} onValueChange={onUnitChange}>
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
              onValueChange={(v) => handleMethodChange(v as AdministrationMethod)}
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

          {method === 'pill' && (
            <div className="space-y-2">
              <Label htmlFor="pillRoute">{t('form.pillRoute')}</Label>
              <Select
                value={pillRoute || ''}
                onValueChange={(v) =>
                  onPillRouteChange((v as PillAdministrationRoute) || undefined)
                }
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

          {method === 'injection' && (
            <div className="space-y-2">
              <Label htmlFor="injectionRoute">{t('form.injectionRoute')}</Label>
              <Select
                value={injectionRoute || ''}
                onValueChange={(v) =>
                  onInjectionRouteChange((v as InjectionAdministrationRoute) || undefined)
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
            <Select value={frequency} onValueChange={onFrequencyChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getFrequenciesForMethod(method).map((f) => (
                  <SelectItem key={f} value={f}>
                    {t('frequencies.' + f)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {endDate !== undefined ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">{t('form.startDate')}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">{t('form.endDate')}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange?.(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="startDate">{t('form.startDate')}</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                required
              />
            </div>
          )}

          {isActive !== undefined && onIsActiveChange && (
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-foreground font-medium">Médicament actif</p>
                <p className="text-muted-foreground text-sm">
                  Afficher dans la liste des médicaments à prendre
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={onIsActiveChange} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduling */}
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
              onCheckedChange={(checked) => onSchedulingModeChange(checked ? 'advanced' : 'simple')}
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

      {/* Stock */}
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
                onChange={(e) => onStockChange(e.target.value)}
                placeholder="30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockUnit">{t('form.stockUnit')}</Label>
              <Select value={stockUnit} onValueChange={onStockUnitChange}>
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
              onChange={(e) => onStockAlertChange(e.target.value)}
              placeholder="7"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes (edit-only) */}
      {notes !== undefined && onNotesChange && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes (optionnel)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Notes personnelles, effets secondaires observés, etc."
              rows={3}
            />
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex gap-3">
        <Link href={backHref} className="flex-1">
          <Button variant="outline" className="w-full" type="button">
            {cancelLabel}
          </Button>
        </Link>
        <Button type="submit" className="flex-1" disabled={saving}>
          {saving ? savingLabel : saveLabel}
        </Button>
      </div>
    </>
  )
}
