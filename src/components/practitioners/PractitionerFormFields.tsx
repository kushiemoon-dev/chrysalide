'use client'

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
import { Save, User, MapPin, Phone, Mail, Globe, Star } from 'lucide-react'
import { APPOINTMENT_TYPES } from '@/lib/constants'
import type { AppointmentType } from '@/lib/types'

export interface PractitionerLabels {
  basicInfo: string
  fullName: string
  namePlaceholder: string
  specialty: string
  transFriendly: string
  transFriendlyDesc: string
  contact: string
  address: string
  addressPlaceholder: string
  phone: string
  phonePlaceholder: string
  email: string
  emailPlaceholder: string
  website: string
  websitePlaceholder: string
  notes: string
  notesPlaceholder: string
  cancel: string
  save: string
  saving: string
}

interface Props {
  name: string
  onNameChange: (v: string) => void
  specialty: AppointmentType
  onSpecialtyChange: (v: AppointmentType) => void
  location: string
  onLocationChange: (v: string) => void
  phone: string
  onPhoneChange: (v: string) => void
  email: string
  onEmailChange: (v: string) => void
  website: string
  onWebsiteChange: (v: string) => void
  notes: string
  onNotesChange: (v: string) => void
  isTransFriendly: boolean
  onIsTransFriendlyChange: (v: boolean) => void
  saving: boolean
  isValid: boolean
  backHref: string
  labels: PractitionerLabels
}

export function PractitionerFormFields({
  name,
  onNameChange,
  specialty,
  onSpecialtyChange,
  location,
  onLocationChange,
  phone,
  onPhoneChange,
  email,
  onEmailChange,
  website,
  onWebsiteChange,
  notes,
  onNotesChange,
  isTransFriendly,
  onIsTransFriendlyChange,
  saving,
  isValid,
  backHref,
  labels,
}: Props) {
  const tAppt = useTranslations('appointments')

  return (
    <>
      {/* Basic info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="text-primary h-4 w-4" />
            {labels.basicInfo}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{labels.fullName}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={labels.namePlaceholder}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialty">{labels.specialty}</Label>
            <Select
              value={specialty}
              onValueChange={(v) => onSpecialtyChange(v as AppointmentType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(APPOINTMENT_TYPES).map(([key]) => (
                  <SelectItem key={key} value={key}>
                    {tAppt('types.' + key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="trans-friendly" className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                {labels.transFriendly}
              </Label>
              <p className="text-muted-foreground text-xs">{labels.transFriendlyDesc}</p>
            </div>
            <Switch
              id="trans-friendly"
              checked={isTransFriendly}
              onCheckedChange={onIsTransFriendlyChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="text-primary h-4 w-4" />
            {labels.contact}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              {labels.address}
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder={labels.addressPlaceholder}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-3 w-3" />
              {labels.phone}
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder={labels.phonePlaceholder}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-3 w-3" />
              {labels.email}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder={labels.emailPlaceholder}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-3 w-3" />
              {labels.website}
            </Label>
            <Input
              id="website"
              type="text"
              value={website}
              onChange={(e) => onWebsiteChange(e.target.value)}
              placeholder={labels.websitePlaceholder}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{labels.notes}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={labels.notesPlaceholder}
            className="min-h-[100px] resize-none"
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-3">
        <Link href={backHref} className="flex-1">
          <Button type="button" variant="outline" className="w-full">
            {labels.cancel}
          </Button>
        </Link>
        <Button type="submit" className="flex-1 gap-2" disabled={!isValid || saving}>
          <Save className="h-4 w-4" />
          {saving ? labels.saving : labels.save}
        </Button>
      </div>
    </>
  )
}
