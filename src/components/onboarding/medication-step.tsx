'use client'

import { Pill, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

interface MedicationStepProps {
  onNext: () => void
  onSkip: () => void
}

export function MedicationStep({ onNext, onSkip }: MedicationStepProps) {
  const t = useTranslations('onboarding')
  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="space-y-2 text-center">
        <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
          <Pill className="text-primary h-8 w-8" />
        </div>
        <h2 className="text-foreground text-2xl font-bold">{t('medication.title')}</h2>
        <p className="text-muted-foreground">{t('medication.subtitle')}</p>
      </div>

      {/* Features */}
      <div className="space-y-3 text-left">
        <div className="bg-muted/30 flex items-center gap-3 rounded-lg p-3">
          <div className="bg-primary h-2 w-2 rounded-full" />
          <span className="text-foreground text-sm">{t('medication.reminders')}</span>
        </div>
        <div className="bg-muted/30 flex items-center gap-3 rounded-lg p-3">
          <div className="bg-secondary h-2 w-2 rounded-full" />
          <span className="text-foreground text-sm">{t('medication.stockAlerts')}</span>
        </div>
        <div className="bg-muted/30 flex items-center gap-3 rounded-lg p-3">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-foreground text-sm">{t('medication.changeHistory')}</span>
        </div>
        <div className="bg-muted/30 flex items-center gap-3 rounded-lg p-3">
          <div className="h-2 w-2 rounded-full bg-yellow-500" />
          <span className="text-foreground text-sm">{t('medication.calendar')}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-4">
        <Link
          href="/medications/new?onboarding=true"
          onClick={onNext}
          className="gradient-trans-glow shadow-trans-glow hover:shadow-trans-glow-lg flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium text-white transition-all active:scale-[0.98]"
        >
          {t('medication.addMed')}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <button
          onClick={onSkip}
          className="text-muted-foreground bg-muted hover:bg-muted/80 w-full rounded-xl py-3 font-medium transition-colors"
        >
          {t('medication.later')}
        </button>
      </div>

      <p className="text-muted-foreground text-center text-xs">{t('medication.helpText')}</p>
    </div>
  )
}
