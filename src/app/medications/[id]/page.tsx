'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { getDateLocale } from '@/i18n/date-locale'
import type { Locale } from '@/i18n/config'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Trash2,
  Pill,
  Clock,
  Calendar,
  Package,
  AlertTriangle,
  FileText,
  Syringe,
  Pencil,
  X,
  Check,
  Droplet,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import {
  getMedication,
  deleteMedication,
  getMedicationLogs,
  deleteMedicationLog,
  updateMedicationLog,
  getGelApplicationHistory,
} from '@/lib/db'
import { MEDICATION_TYPES } from '@/lib/constants'
import type { Medication, MedicationLog } from '@/lib/types'
import { format, differenceInDays } from 'date-fns'

export default function MedicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('medications')
  const locale = useLocale()
  const dateLocale = getDateLocale(locale as Locale)
  const [medication, setMedication] = useState<Medication | null>(null)
  const [recentLogs, setRecentLogs] = useState<MedicationLog[]>([])
  const [gelHistory, setGelHistory] = useState<MedicationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [editingLogId, setEditingLogId] = useState<number | null>(null)
  const [editingLogDate, setEditingLogDate] = useState('')
  const [editingLogTime, setEditingLogTime] = useState('')

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

    const logs = await getMedicationLogs(id, 10)
    setMedication(med)
    setRecentLogs(logs)

    // Charger l'historique des zones gel si c'est un gel
    if (med.method === 'gel') {
      const gelLogs = await getGelApplicationHistory(id, 10)
      setGelHistory(gelLogs)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function handleDelete() {
    if (!medication?.id || !confirm('Supprimer ce médicament ?')) return

    setDeleting(true)
    try {
      await deleteMedication(medication.id)
      router.push('/medications')
    } catch (error) {
      console.error('Error deleting medication:', error)
      setDeleting(false)
    }
  }

  function startEditLog(log: MedicationLog) {
    if (!log.id) return
    const date = new Date(log.timestamp)
    setEditingLogId(log.id)
    setEditingLogDate(date.toISOString().split('T')[0])
    setEditingLogTime(format(date, 'HH:mm'))
  }

  function cancelEditLog() {
    setEditingLogId(null)
    setEditingLogDate('')
    setEditingLogTime('')
  }

  async function saveEditLog() {
    if (!editingLogId || !editingLogDate || !editingLogTime) return

    try {
      const newTimestamp = new Date(`${editingLogDate}T${editingLogTime}`)
      await updateMedicationLog(editingLogId, { timestamp: newTimestamp })
      cancelEditLog()
      await loadData()
    } catch (error) {
      console.error('Error updating log:', error)
    }
  }

  async function handleDeleteLog(logId: number) {
    if (!confirm('Supprimer cette prise ?')) return

    try {
      await deleteMedicationLog(logId)
      await loadData()
    } catch (error) {
      console.error('Error deleting log:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (!medication) return null

  const typeInfo = MEDICATION_TYPES[medication.type]

  // Defensive date parsing - handle both Date objects and strings
  const startDate =
    medication.startDate instanceof Date ? medication.startDate : new Date(medication.startDate)

  const daysSinceStart = differenceInDays(new Date(), startDate)
  const isLowStock =
    medication.stock !== undefined &&
    medication.stockAlert !== undefined &&
    medication.stock <= medication.stockAlert

  // Construire la description complète de la méthode d'administration
  const getFullMethodDescription = () => {
    const baseMethod = t(`methods.${medication.method}`)
    if (medication.method === 'pill' && medication.pillRoute) {
      return `${baseMethod} (${t(`pillRoutes.${medication.pillRoute}`)})`
    }
    if (medication.method === 'injection' && medication.injectionRoute) {
      return `${baseMethod} (${t(`injectionRoutes.${medication.injectionRoute}`)})`
    }
    return baseMethod
  }

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Link href="/medications">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-foreground text-xl font-bold">{medication.name}</h1>
            <p className="text-muted-foreground text-sm">
              {medication.dosage} {medication.unit} - {getFullMethodDescription()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link href={`/medications/${medication.id}/edit`}>
            <Button variant="ghost" size="icon">
              <Pencil className="h-5 w-5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={deleting}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" style={{ borderColor: typeInfo.color, color: typeInfo.color }}>
          {t(`types.${medication.type}`)}
        </Badge>
        {medication.isActive ? (
          <Badge variant="default" className="bg-green-600">
            Actif
          </Badge>
        ) : (
          <Badge variant="secondary">Inactif</Badge>
        )}
        {isLowStock && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Stock bas
          </Badge>
        )}
      </div>

      {/* Type Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl p-3" style={{ backgroundColor: `${typeInfo.color}20` }}>
              <Pill className="h-8 w-8" style={{ color: typeInfo.color }} />
            </div>
            <div className="flex-1">
              <p className="text-foreground text-lg font-medium">{medication.name}</p>
              <p className="text-muted-foreground">
                {medication.dosage} {medication.unit} - {getFullMethodDescription()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Frequency & Scheduling */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Fréquence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-foreground font-medium">{t('frequencies.' + medication.frequency)}</p>

          {/* Mode avancé: afficher les horaires */}
          {medication.schedulingMode === 'advanced' && medication.scheduledTimes?.length && (
            <div className="border-border space-y-2 border-t pt-2">
              <p className="text-muted-foreground text-sm">Horaires programmés :</p>
              <div className="flex flex-wrap gap-2">
                {medication.scheduledTimes.map((time) => (
                  <Badge key={time} variant="outline" className="text-sm">
                    {time}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Période
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('detail.startDate')}</span>
            <span className="font-medium">
              {format(startDate, 'd MMMM yyyy', { locale: dateLocale })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Durée</span>
            <span className="font-medium">{daysSinceStart} jours</span>
          </div>
          {medication.endDate && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('detail.endDate')}</span>
              <span className="font-medium">
                {format(
                  medication.endDate instanceof Date
                    ? medication.endDate
                    : new Date(medication.endDate),
                  'd MMMM yyyy',
                  { locale: dateLocale }
                )}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock */}
      {(medication.stock !== undefined || medication.stockAlert !== undefined) && (
        <Card className={isLowStock ? 'border-destructive/50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {medication.stock !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stock actuel</span>
                <span className={`font-medium ${isLowStock ? 'text-destructive' : ''}`}>
                  {medication.stock} {medication.stockUnit || medication.unit}
                </span>
              </div>
            )}
            {medication.stockAlert !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('detail.lowStockAlert')}</span>
                <span className="font-medium">
                  {medication.stockAlert} {medication.stockUnit || medication.unit}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {medication.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap">{medication.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Zones d'application récentes (gel uniquement) */}
      {medication.method === 'gel' && gelHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Droplet className="h-4 w-4" />
              Zones d&apos;application récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {gelHistory.map((log) => (
                <div
                  key={log.id}
                  className="border-border flex items-center justify-between border-b py-2 text-sm last:border-0"
                >
                  <span className="text-muted-foreground">
                    {format(new Date(log.timestamp), 'EEEE d MMM', { locale: dateLocale })}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {log.applicationZone && t(`gelZones.${log.applicationZone}`)}
                    </Badge>
                    <span className="text-foreground">
                      {format(new Date(log.timestamp), 'HH:mm')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Logs */}
      {recentLogs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Syringe className="h-4 w-4" />
              Dernières prises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentLogs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="border-border flex items-center justify-between border-b py-2 text-sm last:border-0"
                >
                  {editingLogId === log.id ? (
                    // Mode édition
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        type="date"
                        value={editingLogDate}
                        onChange={(e) => setEditingLogDate(e.target.value)}
                        className="h-8 w-32"
                      />
                      <Input
                        type="time"
                        value={editingLogTime}
                        onChange={(e) => setEditingLogTime(e.target.value)}
                        className="h-8 w-24"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600"
                        onClick={saveEditLog}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={cancelEditLog}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    // Mode affichage
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {format(new Date(log.timestamp), 'EEEE d MMM', { locale: dateLocale })}
                        </span>
                        <div className="flex items-center gap-2">
                          {log.scheduledTime && (
                            <Badge variant="outline" className="text-xs">
                              {log.scheduledTime}
                            </Badge>
                          )}
                          <span className="text-foreground">
                            {format(new Date(log.timestamp), 'HH:mm')}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => startEditLog(log)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive h-7 w-7"
                            onClick={() => log.id && handleDeleteLog(log.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {log.notes && (
                        <p className="text-muted-foreground mt-1 text-xs italic">{log.notes}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
