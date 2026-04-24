'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, X } from 'lucide-react'
import { getAct, updateAct, getPractitioner } from '@/lib/db'
import { PractitionerInput } from '@/components/appointments/practitioner-input'
import type { Act, ActCategory, ActStatus } from '@/lib/types'
import type { Practitioner } from '@/lib/types'
import { ACT_CATEGORIES } from '@/lib/constants'

export default function EditActPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const actId = Number(resolvedParams.id)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [act, setAct] = useState<Act | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<ActCategory>('hrt')
  const [status, setStatus] = useState<ActStatus>('planning')
  const [information, setInformation] = useState('')
  const [notes, setNotes] = useState('')

  // Practitioner lists
  const [envisagedIds, setEnvisagedIds] = useState<number[]>([])
  const [chosenIds, setChosenIds] = useState<number[]>([])
  const [envisagedNames, setEnvisagedNames] = useState<Record<number, string>>({})
  const [chosenNames, setChosenNames] = useState<Record<number, string>>({})

  // PractitionerInput controlled values
  const [envisagedInput, setEnvisagedInput] = useState('')
  const [chosenInput, setChosenInput] = useState('')

  useEffect(() => {
    async function loadAct() {
      setLoading(true)
      try {
        const data = await getAct(actId)
        if (data) {
          setAct(data)
          setTitle(data.title)
          setCategory(data.category)
          setStatus(data.status)
          setInformation(data.information || '')
          setNotes(data.notes || '')
          setEnvisagedIds(data.envisagedPractitionerIds)
          setChosenIds(data.chosenPractitionerIds)

          const eMap: Record<number, string> = {}
          await Promise.all(
            data.envisagedPractitionerIds.map(async (pid) => {
              const p = await getPractitioner(pid)
              if (p) eMap[pid] = p.name
            })
          )
          setEnvisagedNames(eMap)

          const cMap: Record<number, string> = {}
          await Promise.all(
            data.chosenPractitionerIds.map(async (pid) => {
              const p = await getPractitioner(pid)
              if (p) cMap[pid] = p.name
            })
          )
          setChosenNames(cMap)
        }
      } finally {
        setLoading(false)
      }
    }
    loadAct()
  }, [actId])

  const handleSelectEnvisaged = (practitioner: Practitioner) => {
    if (!practitioner.id || envisagedIds.includes(practitioner.id)) return
    setEnvisagedIds((prev) => [...prev, practitioner.id!])
    setEnvisagedNames((prev) => ({ ...prev, [practitioner.id!]: practitioner.name }))
    setEnvisagedInput('')
  }

  const handleRemoveEnvisaged = (pid: number) => {
    setEnvisagedIds((prev) => prev.filter((id) => id !== pid))
    setEnvisagedNames((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [pid]: _drop, ...rest } = prev
      return rest
    })
  }

  const handleSelectChosen = (practitioner: Practitioner) => {
    if (!practitioner.id || chosenIds.includes(practitioner.id)) return
    setChosenIds((prev) => [...prev, practitioner.id!])
    setChosenNames((prev) => ({ ...prev, [practitioner.id!]: practitioner.name }))
    setChosenInput('')
  }

  const handleRemoveChosen = (pid: number) => {
    setChosenIds((prev) => prev.filter((id) => id !== pid))
    setChosenNames((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [pid]: _drop, ...rest } = prev
      return rest
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !act?.id) return

    setSaving(true)
    try {
      await updateAct(act.id, {
        title: title.trim(),
        category,
        status,
        information: information.trim() || undefined,
        notes: notes.trim() || undefined,
        envisagedPractitionerIds: envisagedIds,
        chosenPractitionerIds: chosenIds,
      })
      router.push(`/acts/${act.id}`)
    } catch {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 pb-24">
        <div className="flex items-center gap-3 pt-2">
          <div className="bg-muted h-10 w-10 animate-pulse rounded" />
          <div className="flex-1 space-y-2">
            <div className="bg-muted h-6 w-48 animate-pulse rounded" />
            <div className="bg-muted h-4 w-32 animate-pulse rounded" />
          </div>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="bg-muted h-32 animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!act) {
    return (
      <div className="space-y-6 p-4 pb-24">
        <div className="flex items-center gap-3 pt-2">
          <Link href="/acts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Acte introuvable</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Cet acte n&apos;existe pas ou a été supprimé.</p>
            <Link href="/acts">
              <Button className="mt-4">Retour aux actes</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isValid = title.trim().length > 0

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link href={`/acts/${act.id}`}>
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-2xl font-bold">Modifier l&apos;acte</h1>
          <p className="text-muted-foreground text-sm">Mets à jour les informations</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Champs principaux */}
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
              <Label>Catégorie</Label>
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

        {/* Praticien·ne·s envisagé·e·s */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Praticien·ne·s envisagé·e·s</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {envisagedIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {envisagedIds.map((pid) => (
                  <Badge key={pid} variant="secondary" className="gap-1 pr-1">
                    {envisagedNames[pid] ?? `#${pid}`}
                    <button
                      type="button"
                      onClick={() => handleRemoveEnvisaged(pid)}
                      className="hover:text-destructive ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <PractitionerInput
              value={envisagedInput}
              onChange={(name) => setEnvisagedInput(name)}
              onSelect={handleSelectEnvisaged}
              placeholder="Rechercher un·e praticien·ne..."
            />
          </CardContent>
        </Card>

        {/* Praticien·ne·s choisi·e·s */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Praticien·ne·s choisi·e·s</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {chosenIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {chosenIds.map((pid) => (
                  <Badge key={pid} variant="secondary" className="gap-1 pr-1">
                    {chosenNames[pid] ?? `#${pid}`}
                    <button
                      type="button"
                      onClick={() => handleRemoveChosen(pid)}
                      className="hover:text-destructive ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <PractitionerInput
              value={chosenInput}
              onChange={(name) => setChosenInput(name)}
              onSelect={handleSelectChosen}
              placeholder="Rechercher un·e praticien·ne..."
            />
          </CardContent>
        </Card>

        {/* Informations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={information}
              onChange={(e) => setInformation(e.target.value)}
              placeholder="Informations sur cet acte..."
              className="min-h-[100px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notes diverses</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes personnelles..."
              className="min-h-[80px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Link href={`/acts/${act.id}`} className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Annuler
            </Button>
          </Link>
          <Button type="submit" className="flex-1 gap-2" disabled={!isValid || saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </div>
  )
}
