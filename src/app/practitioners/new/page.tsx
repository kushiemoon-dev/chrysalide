'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
import { addPractitioner } from '@/lib/db'
import { APPOINTMENT_TYPES } from '@/lib/constants'
import type { AppointmentType } from '@/lib/types'

export default function NewPractitionerPage() {
  const router = useRouter()
  const t = useTranslations('practitioners')
  const tc = useTranslations('common')
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState<AppointmentType>('general')
  const [location, setLocation] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [notes, setNotes] = useState('')
  const [isTransFriendly, setIsTransFriendly] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    try {
      await addPractitioner({
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
      console.error('Failed to create practitioner:', error)
      setSaving(false)
    }
  }

  const isValid = name.trim().length > 0

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
          <h1 className="text-foreground text-2xl font-bold">{t('new.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('new.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="text-primary h-4 w-4" />
              {t('new.basicInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('new.fullName')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('new.namePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty">{t('new.specialty')}</Label>
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
                  {t('new.transFriendly')}
                </Label>
                <p className="text-muted-foreground text-xs">{t('new.transFriendlyDesc')}</p>
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
              {t('new.contact')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                {t('new.address')}
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('new.addressPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                {t('new.phone')}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('new.phonePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                {t('new.email')}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('new.emailPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="h-3 w-3" />
                {t('new.website')}
              </Label>
              <Input
                id="website"
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder={t('new.websitePlaceholder')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('new.notes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('new.notesPlaceholder')}
              className="min-h-[100px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Link href="/practitioners" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              {tc('cancel')}
            </Button>
          </Link>
          <Button type="submit" className="flex-1 gap-2" disabled={!isValid || saving}>
            <Save className="h-4 w-4" />
            {saving ? t('new.saving') : t('new.save')}
          </Button>
        </div>
      </form>
    </div>
  )
}
