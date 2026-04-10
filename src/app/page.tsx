'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, StatCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Header, SectionHeader } from '@/components/layout/header'
import { DecoratedIcon } from '@/components/brand/decorated-icon'
import { Pill, TestTube, Calendar, Plus, Sparkles, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getTodayLogs, getMedications, getUpcomingAppointments } from '@/lib/db'
import { RecapCard } from '@/components/dashboard/recap-card'
import { getMedicationReminderTimes, shouldTakeMedicationToday } from '@/lib/notifications'
import type { Medication, MedicationLog, Appointment } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function Dashboard() {
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  const tMed = useTranslations('medications')
  const [medications, setMedications] = useState<Medication[]>([])
  const [todayLogs, setTodayLogs] = useState<MedicationLog[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [meds, logs, appts] = await Promise.all([
          getMedications(true),
          getTodayLogs(),
          getUpcomingAppointments(),
        ])
        setMedications(meds)
        setTodayLogs(logs)
        setAppointments(appts.slice(0, 3))
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const takenToday = todayLogs.filter((log) => log.taken).length
  const totalDoses = medications
    .filter((med) => shouldTakeMedicationToday(med))
    .reduce((sum, med) => {
      const doseTimes = getMedicationReminderTimes(med)
      return sum + doseTimes.length
    }, 0)

  return (
    <div className="animate-emerge space-y-6">
      {/* Branded Header */}
      <Header title="Chrysalide" showDate showLogo />

      {/* Welcome Card */}
      <div className="px-4">
        <Card variant="gradient" padding="compact">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="from-trans-blue/20 to-trans-pink/20 rounded-xl bg-gradient-to-br p-2.5">
              <Sparkles className="text-trans-pink h-5 w-5" />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">{t('welcome')}</p>
              <p className="text-muted-foreground text-xs">{t('subtitle')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 px-4">
        <StatCard accentColor="blue">
          <div className="flex items-center gap-3">
            <DecoratedIcon icon={Pill} variant="blue" size="md" />
            <div>
              <p className="text-foreground text-2xl font-bold">
                {takenToday}/{totalDoses}
              </p>
              <p className="text-muted-foreground text-xs">{t('todayDoses')}</p>
            </div>
          </div>
        </StatCard>

        <StatCard accentColor="pink">
          <div className="flex items-center gap-3">
            <DecoratedIcon icon={TestTube} variant="pink" size="md" />
            <div>
              <p className="text-foreground text-2xl font-bold">{medications.length}</p>
              <p className="text-muted-foreground text-xs">{t('activeMeds')}</p>
            </div>
          </div>
        </StatCard>
      </div>

      {/* Dashboard Recap */}
      <div className="px-4">
        <RecapCard />
      </div>

      {/* Today's Medications */}
      <div className="px-4">
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader
              title={t('todayMeds')}
              action={
                <Link href="/medications">
                  <Button variant="ghost" size="sm" className="text-primary -mr-2">
                    {t('viewAll')}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              }
            />
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground text-sm">{tCommon('loading')}</p>
              </div>
            ) : medications.length === 0 ? (
              <div className="py-8 text-center">
                <div className="bg-muted/30 mx-auto mb-3 w-fit rounded-2xl p-3">
                  <Pill className="text-muted-foreground h-6 w-6" />
                </div>
                <p className="text-muted-foreground mb-4 text-sm">{t('noMeds')}</p>
                <Link href="/medications/new">
                  <Button size="sm" variant="gradient" className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('addMed')}
                  </Button>
                </Link>
              </div>
            ) : (
              medications
                .filter((med) => shouldTakeMedicationToday(med))
                .slice(0, 4)
                .map((med) => {
                  const doseTimes = getMedicationReminderTimes(med)
                  const medLogs = todayLogs.filter(
                    (log) => log.medicationId === med.id && log.taken
                  )
                  const takenCount = medLogs.length
                  const totalCount = doseTimes.length
                  const allTaken = takenCount >= totalCount

                  return (
                    <Link key={med.id} href={`/medications/${med.id}`}>
                      <div className="bg-muted/30 hover:bg-muted/50 flex items-center justify-between rounded-xl p-3 transition-colors">
                        <div>
                          <p className="text-foreground font-medium">{med.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {med.dosage} {med.unit} - {tMed('frequencies.' + med.frequency)}
                          </p>
                        </div>
                        <Badge variant={allTaken ? 'trans-blue' : 'outline'}>
                          {totalCount > 1
                            ? `${takenCount}/${totalCount}`
                            : allTaken
                              ? 'Pris'
                              : 'A prendre'}
                        </Badge>
                      </div>
                    </Link>
                  )
                })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <div className="px-4">
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader
              title={t('upcomingAppts')}
              action={
                <Link href="/appointments">
                  <Button variant="ghost" size="sm" className="text-primary -mr-2">
                    {t('viewAll')}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              }
            />
          </CardHeader>
          <CardContent className="space-y-2">
            {appointments.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-muted-foreground mb-3 text-sm">{t('noAppts')}</p>
                <Link href="/appointments/new">
                  <Button size="sm" variant="soft-outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('addAppt')}
                  </Button>
                </Link>
              </div>
            ) : (
              appointments.map((appt) => (
                <Link key={appt.id} href={`/appointments/${appt.id}`}>
                  <div className="bg-muted/30 hover:bg-muted/50 flex items-center gap-3 rounded-xl p-3 transition-colors">
                    <DecoratedIcon icon={Calendar} variant="pink" size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground truncate font-medium">
                        {appt.doctor || appt.type}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(appt.date), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                    <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        <Link href="/medications/new">
          <Button variant="soft-outline" className="h-auto w-full flex-col gap-2 rounded-2xl py-5">
            <Pill className="text-trans-blue h-5 w-5" />
            <span className="text-xs">{t('newMed')}</span>
          </Button>
        </Link>
        <Link href="/bloodtests/new">
          <Button variant="soft-outline" className="h-auto w-full flex-col gap-2 rounded-2xl py-5">
            <TestTube className="text-trans-pink h-5 w-5" />
            <span className="text-xs">{t('newTest')}</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
