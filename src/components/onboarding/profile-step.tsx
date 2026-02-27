'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PRONOUNS_OPTIONS, TRANSITION_TYPES, OnboardingState } from '@/lib/onboarding'

interface ProfileStepProps {
  state: OnboardingState
  onUpdate: (profile: OnboardingState['profile']) => void
  onNext: () => void
  onSkip: () => void
}

export function ProfileStep({ state, onUpdate, onNext, onSkip }: ProfileStepProps) {
  const [pronouns, setPronouns] = useState(state.profile?.pronouns || '')
  const [transitionType, setTransitionType] = useState(state.profile?.transitionType || '')

  const handleNext = () => {
    const profile: OnboardingState['profile'] = {
      pronouns: pronouns || undefined,
      transitionType:
        (transitionType as 'mtf' | 'ftm' | 'non-binary' | 'other' | 'prefer-not-say') || undefined,
    }
    onUpdate(profile)
    onNext()
  }

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h2 className="text-foreground text-2xl font-bold">Ton profil</h2>
        <p className="text-muted-foreground">
          Ces informations sont optionnelles et restent privées
        </p>
      </div>

      {/* Pronouns */}
      <div className="space-y-3">
        <label className="text-foreground text-sm font-medium">Tes pronoms (optionnel)</label>
        <div className="flex flex-wrap gap-2">
          {PRONOUNS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setPronouns(option.value)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-all',
                'border-2',
                pronouns === option.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transition Type */}
      <div className="space-y-3">
        <label className="text-foreground text-sm font-medium">
          Type de transition (optionnel)
        </label>
        <div className="space-y-2">
          {TRANSITION_TYPES.map((option) => (
            <button
              key={option.value}
              onClick={() => setTransitionType(option.value)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all',
                'border-2',
                transitionType === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-muted/30 hover:bg-muted'
              )}
            >
              <span className="text-2xl">{option.emoji}</span>
              <span
                className={cn(
                  'font-medium',
                  transitionType === option.value ? 'text-primary' : 'text-foreground'
                )}
              >
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onSkip}
          className="text-muted-foreground bg-muted hover:bg-muted/80 flex-1 rounded-xl py-3 font-medium transition-colors"
        >
          Passer
        </button>
        <button
          onClick={handleNext}
          className="gradient-trans-glow shadow-trans-glow hover:shadow-trans-glow-lg flex-1 rounded-xl py-3 font-medium text-white transition-all active:scale-[0.98]"
        >
          Continuer
        </button>
      </div>
    </div>
  )
}
