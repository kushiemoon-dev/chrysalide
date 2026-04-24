'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Scissors, Plus, Sparkles } from 'lucide-react'
import { getActs } from '@/lib/db'
import type { Act, ActStatus } from '@/lib/types'
import { ACT_CATEGORIES } from '@/lib/constants'

const STATUS_CONFIG: Record<ActStatus, { label: string; color: string; bgColor: string }> = {
  planning: { label: 'En préparation', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  in_progress: { label: 'En cours', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
  done: { label: 'Terminé', color: 'text-green-400', bgColor: 'bg-green-400/10' },
  cancelled: { label: 'Annulé', color: 'text-muted-foreground', bgColor: 'bg-muted/30' },
}

const STATUS_ORDER: ActStatus[] = ['in_progress', 'planning', 'done', 'cancelled']

export default function ActsPage() {
  const [acts, setActs] = useState<Act[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getActs()
        setActs(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const grouped = STATUS_ORDER.reduce<Record<ActStatus, Act[]>>(
    (acc, status) => ({
      ...acc,
      [status]: acts.filter((a) => a.status === status),
    }),
    { planning: [], in_progress: [], done: [], cancelled: [] }
  )

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold">
            <Scissors className="text-trans-pink h-6 w-6" />
            Mes actes
          </h1>
          <p className="text-muted-foreground text-sm">Tes démarches médicales de transition</p>
        </div>
        <Link href="/acts/new">
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Nouveau
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="bg-muted h-12 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : acts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Sparkles className="text-trans-pink mx-auto mb-4 h-12 w-12" />
            <h3 className="text-foreground mb-2 font-semibold">Commence ton parcours</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Ajoute tes premiers actes médicaux pour suivre ta transition.
            </p>
            <Link href="/acts/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Créer un acte
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        STATUS_ORDER.map((status) => {
          const group = grouped[status]
          if (group.length === 0) return null
          const statusCfg = STATUS_CONFIG[status]
          return (
            <div key={status} className="space-y-2">
              <h2 className={`text-sm font-semibold tracking-wide uppercase ${statusCfg.color}`}>
                {statusCfg.label} ({group.length})
              </h2>
              {group.map((act) => {
                const catCfg = ACT_CATEGORIES[act.category]
                return (
                  <Link key={act.id} href={`/acts/${act.id}`}>
                    <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground truncate font-medium">{act.title}</p>
                          <p className="text-muted-foreground mt-0.5 text-xs">
                            {new Date(act.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="ml-3 shrink-0 border-0 text-xs"
                          style={{
                            backgroundColor: catCfg.color + '20',
                            color: catCfg.color,
                          }}
                        >
                          {catCfg.label}
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )
        })
      )}
    </div>
  )
}
