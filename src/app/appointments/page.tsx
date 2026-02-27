'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  User,
  ChevronRight,
  Stethoscope,
  Brain,
  Heart,
  Scissors,
  Droplet,
  CalendarDays,
  Filter,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { getAppointments, getTotalAppointmentsCost, getPractitioners } from '@/lib/db'
import { APPOINTMENT_TYPES } from '@/lib/constants'
import type { Appointment, AppointmentType, Practitioner } from '@/lib/types'
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { isAppointmentPast, getAppointmentDateTime } from '@/lib/utils'
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

function getRelativeDate(date: Date, time?: string): string {
  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)
  const todayOnly = new Date()
  todayOnly.setHours(0, 0, 0, 0)

  if (isToday(dateOnly)) return "Aujourd'hui"
  if (isTomorrow(dateOnly)) return 'Demain'

  const days = differenceInDays(dateOnly, todayOnly)
  if (days > 0 && days <= 7) return `Dans ${days} jour${days > 1 ? 's' : ''}`
  if (days < 0) return 'Passé'

  return format(date, 'd MMMM', { locale: fr })
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [practitioners, setPractitioners] = useState<Practitioner[]>([])
  const [loading, setLoading] = useState(true)
  const [showCostTracking] = useState(() => getModulePreferences().costTrackingEnabled)
  const [totalCost, setTotalCost] = useState(0)
  const [practitionerFilter, setPractitionerFilter] = useState<string>('all')

  const loadAppointments = useCallback(async () => {
    const [data, practitionersList] = await Promise.all([getAppointments(200), getPractitioners()])
    setAppointments(data)
    setPractitioners(practitionersList)

    // Load cost tracking totals if enabled
    if (getModulePreferences().costTrackingEnabled) {
      const costs = await getTotalAppointmentsCost()
      setTotalCost(costs.total)
    }

    setLoading(false)
  }, [])

  // Charger au montage et recharger quand la page redevient visible
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAppointments()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadAppointments()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [loadAppointments])

  // Filter by practitioner
  const filterByPractitioner = (apt: Appointment) => {
    if (practitionerFilter === 'all') return true
    const filterId = parseInt(practitionerFilter)
    // Match by practitionerId or by doctor name
    if (apt.practitionerId === filterId) return true
    const practitioner = practitioners.find((p) => p.id === filterId)
    if (
      practitioner &&
      apt.doctor?.toLowerCase().trim() === practitioner.name.toLowerCase().trim()
    ) {
      return true
    }
    return false
  }

  const upcomingAppointments = appointments
    .filter((apt) => !isAppointmentPast(apt))
    .filter(filterByPractitioner)
    .sort((a, b) => getAppointmentDateTime(a).getTime() - getAppointmentDateTime(b).getTime())

  const pastAppointments = appointments
    .filter((apt) => isAppointmentPast(apt))
    .filter(filterByPractitioner)
    .sort((a, b) => getAppointmentDateTime(b).getTime() - getAppointmentDateTime(a).getTime())

  const nextAppointment = upcomingAppointments[0]

  // Get unique practitioners that have appointments
  const practitionersWithAppointments = practitioners.filter((p) => {
    return appointments.some((apt) => {
      if (apt.practitionerId === p.id) return true
      if (apt.doctor?.toLowerCase().trim() === p.name.toLowerCase().trim()) return true
      return false
    })
  })

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
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Rendez-vous</h1>
          <p className="text-muted-foreground text-sm">{upcomingAppointments.length} à venir</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/appointments/calendar">
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Calendrier
            </Button>
          </Link>
          <Link href="/appointments/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </Link>
        </div>
      </div>

      {/* Blahaj Cost Recap */}
      {showCostTracking && totalCost > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
          <CardContent className="flex items-center gap-4 p-4">
            <span className="text-4xl" role="img" aria-label="Blahaj">
              🦈
            </span>
            <div>
              <p className="text-foreground font-medium">Blahaj dit :</p>
              <p className="text-muted-foreground text-sm">
                Tu as investi{' '}
                <span className="text-foreground font-bold">
                  {totalCost.toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  €
                </span>{' '}
                dans ton bien-être
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter by practitioner */}
      {practitioners.length > 0 && appointments.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={practitionerFilter} onValueChange={setPractitionerFilter}>
            <SelectTrigger className="flex-1">
              <Filter className="text-muted-foreground mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtrer par praticien·ne" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les praticien·nes</SelectItem>
              {practitionersWithAppointments.map((p) => (
                <SelectItem key={p.id} value={p.id!.toString()}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {practitionerFilter !== 'all' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPractitionerFilter('all')}
              title="Effacer le filtre"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="bg-muted/50 mx-auto mb-4 w-fit rounded-full p-4">
              <Calendar className="text-muted-foreground h-8 w-8" />
            </div>
            <h3 className="text-foreground mb-2 font-medium">Aucun rendez-vous</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Ajoutez vos rendez-vous médicaux pour les suivre
            </p>
            <Link href="/appointments/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un rendez-vous
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Next Appointment Highlight */}
          {nextAppointment && (
            <Card className="border-trans-pink/30 bg-trans-pink/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm">
                  Prochain rendez-vous
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/appointments/${nextAppointment.id}`}>
                  <div className="flex items-start gap-3">
                    <div
                      className="rounded-lg p-2"
                      style={{
                        backgroundColor: `${APPOINTMENT_TYPES[nextAppointment.type]?.color}20`,
                      }}
                    >
                      <AppointmentIcon
                        type={nextAppointment.type}
                        className="h-5 w-5"
                        style={{ color: APPOINTMENT_TYPES[nextAppointment.type]?.color }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground font-medium">
                        {APPOINTMENT_TYPES[nextAppointment.type]?.label || 'Rendez-vous'}
                      </p>
                      <p className="text-primary text-lg font-bold">
                        {getRelativeDate(new Date(nextAppointment.date))}
                      </p>
                      <div className="text-muted-foreground mt-2 flex flex-wrap gap-2 text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {nextAppointment.time || format(new Date(nextAppointment.date), 'HH:mm')}
                        </span>
                        {nextAppointment.doctor && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {nextAppointment.doctor}
                          </span>
                        )}
                        {nextAppointment.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {nextAppointment.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="text-muted-foreground h-5 w-5" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming">À venir ({upcomingAppointments.length})</TabsTrigger>
              <TabsTrigger value="past">Passés ({pastAppointments.length})</TabsTrigger>
            </TabsList>

            {/* Upcoming */}
            <TabsContent value="upcoming" className="space-y-3">
              {upcomingAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">Aucun rendez-vous à venir</p>
                  </CardContent>
                </Card>
              ) : (
                upcomingAppointments.map((apt) => (
                  <AppointmentCard key={apt.id} appointment={apt} />
                ))
              )}
            </TabsContent>

            {/* Past */}
            <TabsContent value="past" className="space-y-3">
              {pastAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">Aucun rendez-vous passé</p>
                  </CardContent>
                </Card>
              ) : (
                pastAppointments.map((apt) => (
                  <AppointmentCard key={apt.id} appointment={apt} isPast />
                ))
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

function AppointmentCard({
  appointment,
  isPast = false,
}: {
  appointment: Appointment
  isPast?: boolean
}) {
  const typeInfo = APPOINTMENT_TYPES[appointment.type]

  return (
    <Link href={`/appointments/${appointment.id}`}>
      <Card
        className={`hover:bg-muted/30 overflow-hidden transition-colors ${isPast ? 'opacity-60' : ''}`}
      >
        <CardContent className="p-0">
          <div className="flex items-center gap-3 p-4">
            {/* Icon */}
            <div
              className="flex-shrink-0 rounded-lg p-2"
              style={{ backgroundColor: `${typeInfo?.color}20` }}
            >
              <AppointmentIcon
                type={appointment.type}
                className="h-5 w-5"
                style={{ color: typeInfo?.color }}
              />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-foreground truncate font-medium">
                  {typeInfo?.label || 'Rendez-vous'}
                </p>
                {appointment.reminderMinutes && (
                  <Badge variant="outline" className="text-xs">
                    Rappel
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                {format(new Date(appointment.date), 'EEEE d MMMM', { locale: fr })}
                {appointment.time && ` à ${appointment.time}`}
              </p>
              {appointment.doctor && (
                <p className="text-muted-foreground mt-1 text-xs">{appointment.doctor}</p>
              )}
            </div>

            <ChevronRight className="text-muted-foreground h-5 w-5 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
