'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Users,
  Plus,
  User,
  MapPin,
  Phone,
  Mail,
  Star,
  Trash2,
  Filter,
  ExternalLink,
  Pencil,
} from 'lucide-react'
import {
  getPractitioners,
  deletePractitioner,
  countAppointmentsForAllPractitioners,
} from '@/lib/db'
import { useTranslations } from 'next-intl'
import { APPOINTMENT_TYPES } from '@/lib/constants'
import type { Practitioner, AppointmentType } from '@/lib/types'

type FilterType = 'all' | AppointmentType

export default function PractitionersPage() {
  const tAppt = useTranslations('appointments')
  const t = useTranslations('practitioners')
  const [practitioners, setPractitioners] = useState<Practitioner[]>([])
  const [appointmentCounts, setAppointmentCounts] = useState<Map<number, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [deleteTarget, setDeleteTarget] = useState<Practitioner | null>(null)

  useEffect(() => {
    loadPractitioners()
  }, [])

  async function loadPractitioners() {
    setLoading(true)
    try {
      const [data, counts] = await Promise.all([
        getPractitioners(),
        countAppointmentsForAllPractitioners(),
      ])
      setPractitioners(data)
      setAppointmentCounts(counts)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget?.id) return
    await deletePractitioner(deleteTarget.id)
    setPractitioners((prev) => prev.filter((p) => p.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const filteredPractitioners = practitioners.filter(
    (p) => filter === 'all' || p.specialty === filter
  )

  // Group by specialty
  const grouped = filteredPractitioners.reduce(
    (acc, p) => {
      if (!acc[p.specialty]) acc[p.specialty] = []
      acc[p.specialty].push(p)
      return acc
    },
    {} as Record<AppointmentType, Practitioner[]>
  )

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold">
            <Users className="text-trans-blue h-6 w-6" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {practitioners.length}{' '}
            {practitioners.length > 1 ? t('registeredPlural') : t('registered')}
          </p>
        </div>
        <Link href="/practitioners/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {t('add')}
          </Button>
        </Link>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-3">
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <SelectTrigger className="w-full">
              <Filter className="text-muted-foreground mr-2 h-4 w-4" />
              <SelectValue placeholder={t('list.filterByType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('list.allTypes')}</SelectItem>
              {Object.entries(APPOINTMENT_TYPES).map(([key]) => (
                <SelectItem key={key} value={key}>
                  {tAppt('types.' + key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Empty state */}
      {!loading && practitioners.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="bg-muted/50 mx-auto mb-4 w-fit rounded-full p-4">
              <Users className="text-muted-foreground h-8 w-8" />
            </div>
            <h3 className="text-foreground mb-2 font-medium">{t('list.empty')}</h3>
            <p className="text-muted-foreground mb-4 text-sm">{t('list.emptyDesc')}</p>
            <Link href="/practitioners/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t('addPractitioner')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-muted h-10 w-10 animate-pulse rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="bg-muted h-4 w-1/3 animate-pulse rounded" />
                    <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Practitioners list grouped by specialty */}
      {!loading && filter === 'all' && Object.entries(grouped).length > 0 && (
        <div className="space-y-6">
          {Object.entries(grouped).map(([specialty, list]) => (
            <div key={specialty} className="space-y-2">
              <h3 className="text-muted-foreground px-1 text-sm font-medium">
                {tAppt('types.' + specialty)}
              </h3>
              <div className="space-y-2">
                {list.map((practitioner) => (
                  <PractitionerCard
                    key={practitioner.id}
                    practitioner={practitioner}
                    appointmentCount={appointmentCounts.get(practitioner.id!) || 0}
                    onDelete={() => setDeleteTarget(practitioner)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtered list (no grouping) */}
      {!loading && filter !== 'all' && (
        <div className="space-y-2">
          {filteredPractitioners.map((practitioner) => (
            <PractitionerCard
              key={practitioner.id}
              practitioner={practitioner}
              appointmentCount={appointmentCounts.get(practitioner.id!) || 0}
              onDelete={() => setDeleteTarget(practitioner)}
            />
          ))}
          {filteredPractitioners.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">{t('list.emptyOfType')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog.description', { name: deleteTarget?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {t('deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function PractitionerCard({
  practitioner,
  appointmentCount,
  onDelete,
}: {
  practitioner: Practitioner
  appointmentCount: number
  onDelete: () => void
}) {
  const t = useTranslations('practitioners')
  const typeInfo = APPOINTMENT_TYPES[practitioner.specialty]

  return (
    <Card className="hover:bg-muted/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="shrink-0 rounded-lg p-2"
            style={{ backgroundColor: `${typeInfo?.color}20` }}
          >
            <User className="h-5 w-5" style={{ color: typeInfo?.color }} />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-foreground truncate font-medium">{practitioner.name}</h4>
              {practitioner.isTransFriendly && (
                <Star className="h-4 w-4 shrink-0 fill-yellow-500 text-yellow-500" />
              )}
            </div>

            <div className="text-muted-foreground mt-1.5 flex flex-wrap gap-2 text-sm">
              {practitioner.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {practitioner.location}
                </span>
              )}
              {practitioner.phone && (
                <a
                  href={`tel:${practitioner.phone}`}
                  className="hover:text-foreground flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="h-3 w-3" />
                  {practitioner.phone}
                </a>
              )}
              {practitioner.email && (
                <a
                  href={`mailto:${practitioner.email}`}
                  className="hover:text-foreground flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail className="h-3 w-3" />
                  {t('email')}
                </a>
              )}
              {practitioner.website && (
                <a
                  href={practitioner.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  {t('siteWeb')}
                </a>
              )}
            </div>

            {practitioner.notes && (
              <p className="text-muted-foreground mt-2 line-clamp-2 text-xs">
                {practitioner.notes}
              </p>
            )}

            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {t('countRDV', { count: appointmentCount })}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 gap-1">
            <Link href={`/practitioners/${practitioner.id}/edit`}>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
