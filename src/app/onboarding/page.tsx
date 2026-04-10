'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  getOnboardingState,
  saveOnboardingState,
  completeOnboarding,
  ONBOARDING_STEPS,
  OnboardingState,
} from '@/lib/onboarding'
import { WelcomeStep } from '@/components/onboarding/welcome-step'
import { ProfileStep } from '@/components/onboarding/profile-step'
import { MedicationStep } from '@/components/onboarding/medication-step'
import { TourStep } from '@/components/onboarding/tour-step'

export default function OnboardingPage() {
  const router = useRouter()
  const t = useTranslations('onboarding')
  const [state, setState] = useState<OnboardingState>({
    completed: false,
    currentStep: 0,
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedState = getOnboardingState()
    // If already completed, redirect to home
    if (savedState.completed) {
      router.replace('/')
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(savedState)

    setMounted(true)
  }, [router])

  const goToStep = (step: number) => {
    const newState = { ...state, currentStep: step }
    setState(newState)
    saveOnboardingState(newState)
  }

  const nextStep = () => {
    if (state.currentStep < ONBOARDING_STEPS.length - 1) {
      goToStep(state.currentStep + 1)
    }
  }

  const updateProfile = (profile: OnboardingState['profile']) => {
    const newState = { ...state, profile }
    setState(newState)
    saveOnboardingState(newState)
  }

  const handleComplete = () => {
    completeOnboarding()
    router.replace('/')
  }

  if (!mounted) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    )
  }

  const currentStep = ONBOARDING_STEPS[state.currentStep]

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* Progress Indicator */}
      <div className="p-4 pt-8">
        <div className="flex items-center justify-center gap-2">
          {ONBOARDING_STEPS.map((step, index) => (
            <button
              key={step.id}
              onClick={() => index < state.currentStep && goToStep(index)}
              disabled={index > state.currentStep}
              className={cn(
                'h-2 rounded-full transition-all',
                index === state.currentStep
                  ? 'bg-primary w-8'
                  : index < state.currentStep
                    ? 'bg-primary/50 hover:bg-primary/70 w-2'
                    : 'bg-muted w-2'
              )}
            />
          ))}
        </div>
        <p className="text-muted-foreground mt-2 text-center text-xs">
          {state.currentStep + 1} / {ONBOARDING_STEPS.length}
          {currentStep.optional && ` (${t('optional')})`}
        </p>
      </div>

      {/* Step Content */}
      <div className="flex-1 px-6 pb-8">
        {currentStep.id === 'welcome' && <WelcomeStep onNext={nextStep} />}
        {currentStep.id === 'profile' && (
          <ProfileStep state={state} onUpdate={updateProfile} onNext={nextStep} onSkip={nextStep} />
        )}
        {currentStep.id === 'medication' && <MedicationStep onNext={nextStep} onSkip={nextStep} />}
        {currentStep.id === 'tour' && <TourStep onComplete={handleComplete} />}
      </div>
    </div>
  )
}
