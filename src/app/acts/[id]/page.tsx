'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Edit, Plus, Trash2 } from 'lucide-react'
import {
  getAct,
  getActTodos,
  addActTodo,
  updateActTodo,
  deleteActTodo,
  getAppointmentsByAct,
  getPractitioner,
} from '@/lib/db'
import type { Act, ActTodo, ActStatus, Appointment } from '@/lib/types'
import { ACT_CATEGORIES } from '@/lib/constants'

const STATUS_CONFIG: Record<ActStatus, { label: string; color: string; bgColor: string }> = {
  planning: { label: 'En préparation', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  in_progress: { label: 'En cours', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
  done: { label: 'Terminé', color: 'text-green-400', bgColor: 'bg-green-400/10' },
  cancelled: { label: 'Annulé', color: 'text-muted-foreground', bgColor: 'bg-muted/30' },
}

export default function ActDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const actId = Number(resolvedParams.id)

  const [act, setAct] = useState<Act | null>(null)
  const [todos, setTodos] = useState<ActTodo[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [envisagedNames, setEnvisagedNames] = useState<Record<number, string>>({})
  const [chosenNames, setChosenNames] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [newTodo, setNewTodo] = useState('')
  const [addingTodo, setAddingTodo] = useState(false)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [actData, todosData, aptsData] = await Promise.all([
          getAct(actId),
          getActTodos(actId),
          getAppointmentsByAct(actId),
        ])

        if (!actData) {
          setLoading(false)
          return
        }

        setAct(actData)
        setTodos(todosData)
        setAppointments(
          aptsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        )

        const envisagedMap: Record<number, string> = {}
        await Promise.all(
          actData.envisagedPractitionerIds.map(async (pid) => {
            const p = await getPractitioner(pid)
            if (p) envisagedMap[pid] = p.name
          })
        )
        setEnvisagedNames(envisagedMap)

        const chosenMap: Record<number, string> = {}
        await Promise.all(
          actData.chosenPractitionerIds.map(async (pid) => {
            const p = await getPractitioner(pid)
            if (p) chosenMap[pid] = p.name
          })
        )
        setChosenNames(chosenMap)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [actId])

  const handleToggleTodo = async (todo: ActTodo) => {
    if (!todo.id) return
    await updateActTodo(todo.id, { done: !todo.done })
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)))
  }

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return
    setAddingTodo(true)
    try {
      const id = await addActTodo({
        actId,
        text: newTodo.trim(),
        done: false,
        order: todos.length,
      })
      setTodos((prev) => [
        ...prev,
        {
          id: id as number,
          actId,
          text: newTodo.trim(),
          done: false,
          order: todos.length,
          createdAt: new Date(),
        },
      ])
      setNewTodo('')
    } finally {
      setAddingTodo(false)
    }
  }

  const handleDeleteTodo = async (id: number) => {
    await deleteActTodo(id)
    setTodos((prev) => prev.filter((t) => t.id !== id))
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
            <div className="bg-muted h-24 animate-pulse rounded" />
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

  const catCfg = ACT_CATEGORIES[act.category]
  const statusCfg = STATUS_CONFIG[act.status]

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* 1. Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Link href="/acts">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-foreground text-xl font-bold">{act.title}</h1>
            <div className="mt-1 flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="border-0 text-xs"
                style={{ backgroundColor: catCfg.color + '20', color: catCfg.color }}
              >
                {catCfg.label}
              </Badge>
              <Badge
                variant="outline"
                className={`border-0 text-xs ${statusCfg.bgColor} ${statusCfg.color}`}
              >
                {statusCfg.label}
              </Badge>
            </div>
          </div>
        </div>
        <Link href={`/acts/${act.id}/edit`}>
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* 2. Praticien·ne·s envisagé·e·s */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Praticien·ne·s envisagé·e·s</CardTitle>
        </CardHeader>
        <CardContent>
          {act.envisagedPractitionerIds.length === 0 ? (
            <p className="text-muted-foreground text-sm italic">Aucun·e praticien·ne envisagé·e.</p>
          ) : (
            <ul className="space-y-1">
              {act.envisagedPractitionerIds.map((pid) => (
                <li key={pid} className="text-foreground text-sm">
                  {envisagedNames[pid] ?? `Praticien·ne #${pid}`}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 3. Praticien·ne·s choisi·e·s */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Praticien·ne·s choisi·e·s</CardTitle>
        </CardHeader>
        <CardContent>
          {act.chosenPractitionerIds.length === 0 ? (
            <p className="text-muted-foreground text-sm italic">Aucun·e praticien·ne choisi·e.</p>
          ) : (
            <ul className="space-y-1">
              {act.chosenPractitionerIds.map((pid) => (
                <li key={pid} className="text-foreground text-sm">
                  {chosenNames[pid] ?? `Praticien·ne #${pid}`}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 4. Informations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent>
          {act.information ? (
            <p className="text-foreground text-sm whitespace-pre-wrap">{act.information}</p>
          ) : (
            <p className="text-muted-foreground text-sm italic">Aucune information.</p>
          )}
        </CardContent>
      </Card>

      {/* 5. À faire */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            À faire ({todos.filter((t) => t.done).length}/{todos.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {todos.length > 0 && (
            <div className="space-y-2">
              {todos.map((todo) => (
                <div key={todo.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`todo-${todo.id}`}
                    checked={todo.done}
                    onCheckedChange={() => handleToggleTodo(todo)}
                  />
                  <label
                    htmlFor={`todo-${todo.id}`}
                    className={`flex-1 cursor-pointer text-sm ${todo.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                  >
                    {todo.text}
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground h-7 w-7"
                    onClick={() => todo.id && handleDeleteTodo(todo.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 border-t pt-2">
            <Input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Ajouter une tâche..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTodo()
                }
              }}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddTodo}
              disabled={!newTodo.trim() || addingTodo}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 6. Comptes-rendus de RDV */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Comptes-rendus de RDV</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-muted-foreground text-sm italic">
              Aucun RDV lié. Liez un RDV depuis la page Rendez-vous.
            </p>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div key={apt.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground text-sm font-medium">
                      {apt.doctor || 'Praticien·ne'}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(apt.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  {apt.notes && (
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">{apt.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 7. Notes diverses */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Notes diverses</CardTitle>
        </CardHeader>
        <CardContent>
          {act.notes ? (
            <p className="text-foreground text-sm whitespace-pre-wrap">{act.notes}</p>
          ) : (
            <p className="text-muted-foreground text-sm italic">Aucune note.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
