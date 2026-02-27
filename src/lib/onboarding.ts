'use client'

// ═══════════════════════════════════════════════════════════════════════════
// ONBOARDING STATE
// ═══════════════════════════════════════════════════════════════════════════

const ONBOARDING_KEY = 'chrysalide-onboarding'

export interface OnboardingState {
  completed: boolean
  currentStep: number
  profile?: {
    pronouns?: string
    transitionType?: 'mtf' | 'ftm' | 'non-binary' | 'other' | 'prefer-not-say'
    startDate?: string
  }
}

const DEFAULT_STATE: OnboardingState = {
  completed: false,
  currentStep: 0,
}

export function getOnboardingState(): OnboardingState {
  if (typeof window === 'undefined') {
    return DEFAULT_STATE
  }

  try {
    const stored = localStorage.getItem(ONBOARDING_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Invalid JSON
  }

  return DEFAULT_STATE
}

export function saveOnboardingState(state: OnboardingState): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state))
}

export function completeOnboarding(): void {
  const state = getOnboardingState()
  saveOnboardingState({ ...state, completed: true })
}

export function resetOnboarding(): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem(ONBOARDING_KEY)
}

export function isOnboardingComplete(): boolean {
  return getOnboardingState().completed
}

// ═══════════════════════════════════════════════════════════════════════════
// ONBOARDING STEPS
// ═══════════════════════════════════════════════════════════════════════════

export interface OnboardingStep {
  id: string
  title: string
  description: string
  optional: boolean
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenue',
    description: 'Chrysalide, ton compagnon de transition',
    optional: false,
  },
  {
    id: 'profile',
    title: 'Ton profil',
    description: 'Personnalise ton expérience',
    optional: true,
  },
  {
    id: 'medication',
    title: 'Premier médicament',
    description: 'Ajoute ton traitement',
    optional: true,
  },
  {
    id: 'tour',
    title: 'Découverte',
    description: 'Explore les fonctionnalités',
    optional: false,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const PRONOUNS_OPTIONS = [
  { value: 'elle', label: 'Elle/She' },
  { value: 'il', label: 'Il/He' },
  { value: 'iel', label: 'Iel/They' },
  { value: 'autre', label: 'Autre' },
  { value: 'prefer-not-say', label: 'Ne pas préciser' },
]

export const TRANSITION_TYPES = [
  { value: 'mtf', label: 'MtF (Transféminines)', emoji: '💜' },
  { value: 'ftm', label: 'FtM (Transmasculins)', emoji: '💙' },
  { value: 'non-binary', label: 'Non-binaire', emoji: '💛' },
  { value: 'other', label: 'Autre parcours', emoji: '🌈' },
  { value: 'prefer-not-say', label: 'Ne pas préciser', emoji: '🦋' },
]
