'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, User, MapPin, Phone, Mail, Globe, Star } from 'lucide-react'
import { getPractitioner, updatePractitioner } from '@/lib/db'
import { APPOINTMENT_TYPES } from '@/lib/constants'
import type { AppointmentType, Practitioner } from '@/lib/types'

export default function EditPractitionerPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState<AppointmentType>('general')
  const [location, setLocation] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [notes, setNotes] = useState('')
  const [isTransFriendly, setIsTransFriendly] = useState(false)

  useEffect(() => {
    async function loadPractitioner() {
      const id = parseInt(params.id as string)
      if (isNaN(id)) {
        router.push('/practitioners')
        return
      }

      const data = await getPractitioner(id)
      if (!data) {
        router.push('/practitioners')
        return
      }

      setPractitioner(data)
      setName(data.name)
      setSpecialty(data.specialty)
      setLocation(data.location || '')
      setPhone(data.phone || '')
      setEmail(data.email || '')
      setWebsite(data.website || '')
      setNotes(data.notes || '')
      setIsTransFriendly(data.isTransFriendly || false)
      setLoading(false)
    }
    loadPractitioner()
  }, [params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !practitioner?.id) return

    setSaving(true)
    try {
      await updatePractitioner(practitioner.id, {
        name: name.trim(),
        specialty,
        location: location.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        notes: notes.trim() || undefined,
        isTransFriendly,
      })

      router.push('/practitioners')
    } catch (error) {
      console.error('Failed to update practitioner:', error)
      setSaving(false)
    }
  }

  const isValid = name.trim().length > 0

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
      <div className="flex items-center gap-3 pt-2">
        <Link href="/practitioners">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-2xl font-bold">Modifier praticien·ne</h1>
          <p className="text-muted-foreground text-sm">{practitioner?.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="text-primary h-4 w-4" />
              Informations de base
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Prenom Nom"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty">Specialite</Label>
              <Select value={specialty} onValueChange={(v) => setSpecialty(v as AppointmentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(APPOINTMENT_TYPES).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="trans-friendly" className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Trans-friendly
                </Label>
                <p className="text-muted-foreground text-xs">
                  Ce·tte praticien·ne est connu·e pour accompagner les personnes trans
                </p>
              </div>
              <Switch
                id="trans-friendly"
                checked={isTransFriendly}
                onCheckedChange={setIsTransFriendly}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="text-primary h-4 w-4" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                Adresse
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="123 rue de la Sante, 75000 Paris"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                Telephone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01 23 45 67 89"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@praticien.fr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="h-3 w-3" />
                Site web
              </Label>
              <Input
                id="website"
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="www.praticien.fr ou https://..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes personnelles sur ce·tte praticien·ne..."
              className="min-h-[100px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Link href="/practitioners" className="flex-1">
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
