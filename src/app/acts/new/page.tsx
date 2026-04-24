'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'
import { addAct } from '@/lib/db'
import type { ActCategory, ActStatus } from '@/lib/types'
import { ACT_CATEGORIES } from '@/lib/constants'

export default function NewActPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<ActCategory>('hrt')
  const [status, setStatus] = useState<ActStatus>('planning')

  const isValid = title.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setSaving(true)
    try {
      const id = await addAct({
        title: title.trim(),
        category,
        status,
        envisagedPractitionerIds: [],
        chosenPractitionerIds: [],
      })
      router.push(`/acts/${id}`)
    } catch {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link href="/acts">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-2xl font-bold">Nouvel acte</h1>
          <p className="text-muted-foreground text-sm">Ajoute un acte médical à ton suivi</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex : Consultation THS initiale"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Catégorie *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ActCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACT_CATEGORIES).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ActStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">En préparation</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="done">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link href="/acts" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Annuler
            </Button>
          </Link>
          <Button type="submit" className="flex-1 gap-2" disabled={!isValid || saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Création...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </div>
  )
}
