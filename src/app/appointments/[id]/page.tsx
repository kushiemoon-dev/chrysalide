'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Trash2,
  Pencil,
  Calendar,
  Clock,
  MapPin,
  User,
  Bell,
  FileText,
  Stethoscope,
  Brain,
  Heart,
  Scissors,
  Droplet,
  CalendarDays,
  Syringe,
  Mic,
  Zap,
  Coins,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { getAppointmentWithPractitioner, deleteAppointment } from '@/lib/db'
import { APPOINTMENT_TYPES } from '@/lib/constants'
import type { Appointment, AppointmentType, Practitioner } from '@/lib/types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { isAppointmentPast } from '@/lib/utils'
import { getModulePreferences } from '@/lib/notifications'

// Icon mapping
const ICONS: Record<string, React.ElementType> = {
  Stethoscope,
  Brain,
  Heart,
  Scissors,
  User,
  Droplet,
  Calendar: CalendarDays,
  Syringe,
  Mic,
  Zap,
}

// Separate component to render the appointment icon
function AppointmentIcon({
  type,
  className,
  style,
}: {
  type: AppointmentType
  className?: string
  style?: React.CSSProperties
}) {
  const iconName = APPOINTMENT_TYPES[type]?.icon || 'Calendar'
  const IconComponent = ICONS[iconName] || CalendarDays
  return <IconComponent className={className} style={style} />
}

export default function AppointmentDetailPage() {
  const t = useTranslations('appointments')
  const params = useParams()
  const router = useRouter()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showCostTracking, setShowCostTracking] = useState(
    () => getModulePreferences().costTrackingEnabled
  )

  useEffect(() => {
    async function loadAppointment() {
      const id = parseInt(params.id as string)
      if (isNaN(id)) {
        router.push('/appointments')
        return
      }

      const result = await getAppointmentWithPractitioner(id)
      if (!result) {
        router.push('/appointments')
        return
      }

      setAppointment(result.appointment)
      setPractitioner(result.practitioner ?? null)
      setLoading(false)
    }
    loadAppointment()
  }, [params.id, router])

  async function handleDelete() {
    if (!appointment?.id || !confirm('Supprimer ce rendez-vous ?')) return

    setDeleting(true)
    try {
      await deleteAppointment(appointment.id)
      router.push('/appointments')
    } catch (error) {
      console.error('Error deleting appointment:', error)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (!appointment) return null

  const typeInfo = APPOINTMENT_TYPES[appointment.type]
  const isPastAppointment = isAppointmentPast(appointment)

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Link href="/appointments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-foreground text-xl font-bold">{t('types.' + appointment.type)}</h1>
            <p className="text-muted-foreground text-sm">
              {format(new Date(appointment.date), 'EEEE d MMMM yyyy', { locale: fr })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link href={`/appointments/${appointment.id}/edit`}>
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

      {/* Status Badge */}
      {isPastAppointment && (
        <Badge variant="secondary" className="w-fit">
          Rendez-vous passé
        </Badge>
      )}

      {/* Type Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl p-3" style={{ backgroundColor: `${typeInfo?.color}20` }}>
              <AppointmentIcon
                type={appointment.type}
                className="h-8 w-8"
                style={{ color: typeInfo?.color }}
              />
            </div>
            <div>
              <p className="text-foreground text-lg font-medium">
                {t('types.' + appointment.type)}
              </p>
              <p className="text-muted-foreground capitalize">{appointment.type}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date & Time */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Date et heure
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-muted-foreground h-5 w-5" />
            <div>
              <p className="font-medium">
                {format(new Date(appointment.date), 'EEEE d MMMM yyyy', { locale: fr })}
              </p>
            </div>
          </div>
          {appointment.time && (
            <div className="flex items-center gap-3">
              <Clock className="text-muted-foreground h-5 w-5" />
              <p className="font-medium">{appointment.time}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Doctor & Location - priorité au praticien lié */}
      {(() => {
        const displayName = practitioner?.name || appointment.doctor
        const displayLocation = practitioner?.location || appointment.location
        if (!displayName && !displayLocation) return null
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {displayName && (
                <div className="flex items-center gap-3">
                  <User className="text-muted-foreground h-5 w-5" />
                  <div>
                    <p className="text-muted-foreground text-xs">Praticien·ne</p>
                    <p className="font-medium">{displayName}</p>
                  </div>
                </div>
              )}
              {displayLocation && (
                <div className="flex items-center gap-3">
                  <MapPin className="text-muted-foreground h-5 w-5" />
                  <div>
                    <p className="text-muted-foreground text-xs">Lieu</p>
                    <p className="font-medium">{displayLocation}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })()}

      {/* Reminder */}
      {appointment.reminderMinutes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              Rappel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{t('reminderTimes.' + appointment.reminderMinutes)}</Badge>
          </CardContent>
        </Card>
      )}

      {/* Cost */}
      {showCostTracking && appointment.cost !== undefined && appointment.cost > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="h-4 w-4" />
              Reste à charge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground text-xl font-bold">
              {appointment.cost.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              €
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {appointment.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap">{appointment.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
