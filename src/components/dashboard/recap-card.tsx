'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getDateLocale } from '@/i18n/date-locale'
import type { Locale } from '@/i18n/config'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SectionHeader } from '@/components/layout/header'
import { Clock, Droplets, Heart, Target, TrendingUp, Zap } from 'lucide-react'
import { format, formatDistanceToNow, differenceInDays, differenceInMonths } from 'date-fns'
import {
  getBloodTests,
  getUserProfile,
  getObjectives,
  getMedications,
  getTodayLogs,
  getYesterdayLogs,
} from '@/lib/db'
import { REFERENCE_RANGES } from '@/lib/constants'
import { shouldTakeMedicationOnDate } from '@/lib/notifications'
import type { BloodTest, UserProfile, Objective, Medication, MedicationLog } from '@/lib/types'

interface RecapData {
  profile: UserProfile | null
  latestBloodTest: BloodTest | null
  objectives: Objective[]
  medications: Medication[]
  todayLogs: MedicationLog[]
  yesterdayLogs: MedicationLog[]
  streak: number
}

function calculateStreak(
  medications: Medication[],
  todayLogs: MedicationLog[],
  yesterdayLogs: MedicationLog[]
): number {
  if (medications.length === 0) return 0

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  // Uniquement les médicaments dus hier (évite les faux-négatifs pour les hebdo, injections, etc.)
  const dueYesterday = medications.filter((m) => shouldTakeMedicationOnDate(m, yesterday))
  if (dueYesterday.length === 0) return 0

  const allTaken = dueYesterday.every((med) =>
    yesterdayLogs.some((l) => l.medicationId === med.id && l.taken)
  )
  return allTaken ? 1 : 0
}

export function RecapCard() {
  const tBlood = useTranslations('bloodtests')
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const dateLocale = getDateLocale(locale as Locale)
  const [data, setData] = useState<RecapData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [bloodTests, profile, objectives, medications, todayLogs, yesterdayLogs] =
          await Promise.all([
            getBloodTests(1),
            getUserProfile(),
            getObjectives(),
            getMedications(true),
            getTodayLogs(),
            getYesterdayLogs(),
          ])

        const streak = calculateStreak(medications, todayLogs, yesterdayLogs)

        setData({
          profile: profile || null,
          latestBloodTest: bloodTests[0] || null,
          objectives,
          medications,
          todayLogs,
          yesterdayLogs,
          streak,
        })
      } catch (error) {
        console.error('Error loading recap data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground text-sm">{t('recap.loading')}</p>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const { profile, latestBloodTest, objectives, medications, streak } = data

  // Calculate transition duration
  const transitionStart = profile?.transitionStartDate
    ? new Date(profile.transitionStartDate)
    : null
  const transitionMonths = transitionStart ? differenceInMonths(new Date(), transitionStart) : null
  const transitionDays = transitionStart ? differenceInDays(new Date(), transitionStart) : null

  // Key hormone values from latest blood test
  const keyMarkers =
    latestBloodTest?.results?.filter((r) =>
      ['estradiol', 'testosterone', 'progesterone'].includes(r.marker)
    ) || []

  // Objectives progress
  const activeObjectives = objectives.filter((o) => o.status === 'in_progress')
  const completedObjectives = objectives.filter((o) => o.status === 'completed')

  return (
    <Card className="overflow-hidden">
      <CardHeader className="from-trans-blue/5 to-trans-pink/5 bg-gradient-to-r pb-2">
        <SectionHeader title={t('recap.title')} />
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Transition Duration */}
        {transitionStart && (
          <div className="from-trans-blue/10 to-trans-pink/10 flex items-center gap-3 rounded-xl bg-gradient-to-r p-3">
            <div className="rounded-lg bg-white/50 p-2 dark:bg-black/20">
              <Clock className="text-trans-pink h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-foreground text-sm font-medium">
                {transitionMonths !== null && transitionMonths >= 1
                  ? `${transitionMonths} ${t('recap.transitionMonths')}`
                  : `${transitionDays} ${t('recap.transitionDays')}`}
              </p>
              <p className="text-muted-foreground text-xs">
                {t('recap.since')} {format(transitionStart, 'd MMMM yyyy', { locale: dateLocale })}
              </p>
            </div>
            <Heart className="text-trans-pink/60 h-5 w-5" />
          </div>
        )}

        {/* Medication Streak */}
        {medications.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Zap className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-foreground text-sm">{t('recap.streak')}</p>
            </div>
            <Badge variant={streak > 0 ? 'default' : 'outline'}>
              {streak > 0
                ? `${streak}+ ${streak > 1 ? t('recap.days') : t('recap.day')}`
                : t('recap.toStart')}
            </Badge>
          </div>
        )}

        {/* Key Hormone Levels */}
        {keyMarkers.length > 0 && (
          <div className="space-y-2">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Droplets className="h-4 w-4" />
              <span>{t('recap.lastLevels')}</span>
              {latestBloodTest && (
                <span className="text-xs">
                  (
                  {formatDistanceToNow(new Date(latestBloodTest.date), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                  )
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {keyMarkers.map((marker) => {
                // Find reference range for feminizing
                const range = REFERENCE_RANGES.find(
                  (r) => r.marker === marker.marker && r.context === 'feminizing'
                )
                const isInRange = range
                  ? marker.value >= range.min && marker.value <= range.max
                  : true

                return (
                  <div
                    key={marker.marker}
                    className={`rounded-lg p-2 text-center ${
                      isInRange ? 'bg-green-500/10' : 'bg-amber-500/10'
                    }`}
                  >
                    <p className="text-foreground text-lg font-bold">{marker.value}</p>
                    <p className="text-muted-foreground text-[10px] tracking-wide uppercase">
                      {tBlood('markers.' + marker.marker)}
                    </p>
                    <p className="text-muted-foreground text-[10px]">{marker.unit}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Objectives Progress */}
        {objectives.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Target className="h-4 w-4 text-purple-500" />
            </div>
            <div className="flex-1">
              <p className="text-foreground text-sm">{t('recap.objectives')}</p>
              <p className="text-muted-foreground text-xs">
                {activeObjectives.length} {t('recap.inProgress')}, {completedObjectives.length}{' '}
                {t('recap.completed')}
              </p>
            </div>
            {activeObjectives.length > 0 && (
              <Badge variant="outline" className="border-purple-500/30 text-purple-500">
                {Math.round((completedObjectives.length / objectives.length) * 100)}%
              </Badge>
            )}
          </div>
        )}

        {/* Trend indicator */}
        {medications.length > 0 && (
          <div className="text-muted-foreground flex items-center justify-center gap-2 pt-2 text-xs">
            <TrendingUp className="h-3 w-3" />
            <span>{t('recap.encouragement')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
