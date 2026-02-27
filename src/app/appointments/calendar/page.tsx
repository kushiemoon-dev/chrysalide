'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  ArrowLeft,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  ChevronRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getAppointments } from '@/lib/db'
import { APPOINTMENT_TYPES } from '@/lib/constants'
import type { Appointment } from '@/lib/types'
import { YearCalendar } from '@/components/appointments/year-calendar'

export default function CalendarPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedAppointments, setSelectedAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    async function loadAppointments() {
      // Charger tous les RDV (limite haute pour vue annuelle)
      const data = await getAppointments(500)
      setAppointments(data)
      setLoading(false)
    }
    loadAppointments()
  }, [])

  const handleDayClick = (date: Date, dayAppointments: Appointment[]) => {
    setSelectedDate(date)
    setSelectedAppointments(dayAppointments)
  }

  const handleAppointmentClick = (appointment: Appointment) => {
    router.push(`/appointments/${appointment.id}`)
  }

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
            <h1 className="text-foreground flex items-center gap-2 text-xl font-bold">
              <CalendarIcon className="text-trans-pink h-5 w-5" />
              Calendrier annuel
            </h1>
            <p className="text-muted-foreground text-sm">Vue d&apos;ensemble de vos rendez-vous</p>
          </div>
        </div>
        <Link href="/appointments/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </Link>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-foreground text-2xl font-bold">{appointments.length}</p>
            <p className="text-muted-foreground text-xs">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-foreground text-2xl font-bold">
              {appointments.filter((a) => new Date(a.date) >= new Date()).length}
            </p>
            <p className="text-muted-foreground text-xs">À venir</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-foreground text-2xl font-bold">
              {
                appointments.filter((a) => {
                  const d = new Date(a.date)
                  const now = new Date()
                  return d.getFullYear() === now.getFullYear()
                }).length
              }
            </p>
            <p className="text-muted-foreground text-xs">Cette année</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendrier */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Chargement du calendrier...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <YearCalendar appointments={appointments} onDayClick={handleDayClick} />
          </CardContent>
        </Card>
      )}

      {/* Dialog pour les RDV du jour sélectionné */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="text-primary h-5 w-5" />
              {selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            {selectedAppointments.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-muted-foreground mb-4">Aucun rendez-vous ce jour</p>
                <Link href="/appointments/new">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter un RDV
                  </Button>
                </Link>
              </div>
            ) : (
              selectedAppointments
                .sort((a, b) => {
                  if (!a.time || !b.time) return 0
                  return a.time.localeCompare(b.time)
                })
                .map((apt) => {
                  const typeInfo = APPOINTMENT_TYPES[apt.type]
                  return (
                    <button
                      key={apt.id}
                      onClick={() => handleAppointmentClick(apt)}
                      className="border-border hover:bg-muted/50 w-full rounded-lg border p-3 text-left transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="shrink-0 rounded-lg p-2"
                          style={{ backgroundColor: `${typeInfo?.color}20` }}
                        >
                          <CalendarIcon className="h-4 w-4" style={{ color: typeInfo?.color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-foreground font-medium">{typeInfo?.label}</p>
                            {apt.time && (
                              <Badge variant="outline" className="text-xs">
                                {apt.time}
                              </Badge>
                            )}
                          </div>
                          <div className="text-muted-foreground mt-1 flex flex-wrap gap-2 text-sm">
                            {apt.doctor && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {apt.doctor}
                              </span>
                            )}
                            {apt.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {apt.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0 self-center" />
                      </div>
                    </button>
                  )
                })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
