'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { getPractitioner, updatePractitioner } from '@/lib/db'
import { PractitionerFormFields } from '@/components/practitioners/PractitionerFormFields'
import type { AppointmentType, Practitioner } from '@/lib/types'

export default function EditPractitionerPage() {
  const router = useRouter()
  const params = useParams()
  const t = useTranslations('practitioners')
  const tAppt = useTranslations('appointments')
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

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <p className="text-muted-foreground">{tAppt('detail.loading')}</p>
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
          <h1 className="text-foreground text-2xl font-bold">{t('edit.title')}</h1>
          <p className="text-muted-foreground text-sm">{practitioner?.name}</p>
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
            basicInfo: t('edit.basicInfo'),
            fullName: t('edit.fullName'),
            namePlaceholder: t('edit.namePlaceholder'),
            specialty: t('edit.specialty'),
            transFriendly: t('edit.transFriendly'),
            transFriendlyDesc: t('edit.transFriendlyDesc'),
            contact: t('edit.contact'),
            address: t('edit.address'),
            addressPlaceholder: t('edit.addressPlaceholder'),
            phone: t('edit.phone'),
            phonePlaceholder: t('edit.phonePlaceholder'),
            email: t('edit.email'),
            emailPlaceholder: t('edit.emailPlaceholder'),
            website: t('edit.website'),
            websitePlaceholder: t('edit.websitePlaceholder'),
            notes: t('edit.notes'),
            notesPlaceholder: t('edit.notesPlaceholder'),
            cancel: t('editPage.cancel'),
            save: t('editPage.save'),
            saving: t('editPage.saving'),
          }}
        />
      </form>
    </div>
  )
}
