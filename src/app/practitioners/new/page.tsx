'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { addPractitioner } from '@/lib/db'
import { PractitionerFormFields } from '@/components/practitioners/PractitionerFormFields'
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

  return (
    <div className="space-y-6 p-4 pb-24">
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
        <PractitionerFormFields
          name={name}
          onNameChange={setName}
          specialty={specialty}
          onSpecialtyChange={setSpecialty}
          location={location}
          onLocationChange={setLocation}
          phone={phone}
          onPhoneChange={setPhone}
          email={email}
          onEmailChange={setEmail}
          website={website}
          onWebsiteChange={setWebsite}
          notes={notes}
          onNotesChange={setNotes}
          isTransFriendly={isTransFriendly}
          onIsTransFriendlyChange={setIsTransFriendly}
          saving={saving}
          isValid={name.trim().length > 0}
          backHref="/practitioners"
          labels={{
            basicInfo: t('new.basicInfo'),
            fullName: t('new.fullName'),
            namePlaceholder: t('new.namePlaceholder'),
            specialty: t('new.specialty'),
            transFriendly: t('new.transFriendly'),
            transFriendlyDesc: t('new.transFriendlyDesc'),
            contact: t('new.contact'),
            address: t('new.address'),
            addressPlaceholder: t('new.addressPlaceholder'),
            phone: t('new.phone'),
            phonePlaceholder: t('new.phonePlaceholder'),
            email: t('new.email'),
            emailPlaceholder: t('new.emailPlaceholder'),
            website: t('new.website'),
            websitePlaceholder: t('new.websitePlaceholder'),
            notes: t('new.notes'),
            notesPlaceholder: t('new.notesPlaceholder'),
            cancel: tc('cancel'),
            save: t('new.save'),
            saving: t('new.saving'),
          }}
        />
      </form>
    </div>
  )
}
