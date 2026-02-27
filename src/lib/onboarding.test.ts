import { describe, it, expect, beforeEach } from 'vitest'
import {
  getOnboardingState,
  saveOnboardingState,
  completeOnboarding,
  resetOnboarding,
  isOnboardingComplete,
  ONBOARDING_STEPS,
  PRONOUNS_OPTIONS,
  TRANSITION_TYPES,
} from './onboarding'

beforeEach(() => {
  localStorage.clear()
})

describe('getOnboardingState', () => {
  it('retourne le state par défaut si localStorage est vide', () => {
    const state = getOnboardingState()
    expect(state.completed).toBe(false)
    expect(state.currentStep).toBe(0)
  })

  it('relit un state précédemment sauvegardé', () => {
    localStorage.setItem(
      'chrysalide-onboarding',
      JSON.stringify({ completed: true, currentStep: 3 })
    )
    const state = getOnboardingState()
    expect(state.completed).toBe(true)
    expect(state.currentStep).toBe(3)
  })

  it('retourne le state par défaut si le JSON est invalide', () => {
    localStorage.setItem('chrysalide-onboarding', 'not-json')
    const state = getOnboardingState()
    expect(state.completed).toBe(false)
  })
})

describe('saveOnboardingState', () => {
  it('persiste le state dans localStorage', () => {
    saveOnboardingState({ completed: true, currentStep: 2 })
    const raw = localStorage.getItem('chrysalide-onboarding')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.completed).toBe(true)
    expect(parsed.currentStep).toBe(2)
  })

  it('sauvegarde le profil optionnel', () => {
    saveOnboardingState({
      completed: false,
      currentStep: 1,
      profile: { pronouns: 'iel', transitionType: 'non-binary' },
    })
    const state = getOnboardingState()
    expect(state.profile?.pronouns).toBe('iel')
    expect(state.profile?.transitionType).toBe('non-binary')
  })
})

describe('completeOnboarding', () => {
  it('marque le state comme complété', () => {
    saveOnboardingState({ completed: false, currentStep: 2 })
    completeOnboarding()
    expect(getOnboardingState().completed).toBe(true)
    expect(getOnboardingState().currentStep).toBe(2) // préserve le reste
  })
})

describe('resetOnboarding', () => {
  it('supprime le state de localStorage', () => {
    saveOnboardingState({ completed: true, currentStep: 3 })
    resetOnboarding()
    expect(localStorage.getItem('chrysalide-onboarding')).toBeNull()
  })

  it('après reset, getOnboardingState retourne le défaut', () => {
    saveOnboardingState({ completed: true, currentStep: 3 })
    resetOnboarding()
    expect(getOnboardingState().completed).toBe(false)
  })
})

describe('isOnboardingComplete', () => {
  it('retourne false par défaut', () => {
    expect(isOnboardingComplete()).toBe(false)
  })

  it('retourne true après completeOnboarding', () => {
    completeOnboarding()
    expect(isOnboardingComplete()).toBe(true)
  })

  it('retourne false après reset', () => {
    completeOnboarding()
    resetOnboarding()
    expect(isOnboardingComplete()).toBe(false)
  })
})

describe('ONBOARDING_STEPS', () => {
  it('contient 4 étapes', () => {
    expect(ONBOARDING_STEPS).toHaveLength(4)
  })

  it('commence par welcome et finit par tour', () => {
    expect(ONBOARDING_STEPS[0].id).toBe('welcome')
    expect(ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1].id).toBe('tour')
  })

  it('toutes les étapes ont id, title, description et optional', () => {
    ONBOARDING_STEPS.forEach((step) => {
      expect(step.id).toBeTruthy()
      expect(step.title).toBeTruthy()
      expect(step.description).toBeTruthy()
      expect(typeof step.optional).toBe('boolean')
    })
  })
})

describe('PRONOUNS_OPTIONS', () => {
  it("contient l'option prefer-not-say", () => {
    expect(PRONOUNS_OPTIONS.some((o) => o.value === 'prefer-not-say')).toBe(true)
  })

  it('toutes les options ont value et label', () => {
    PRONOUNS_OPTIONS.forEach((opt) => {
      expect(opt.value).toBeTruthy()
      expect(opt.label).toBeTruthy()
    })
  })
})

describe('TRANSITION_TYPES', () => {
  it('inclut mtf, ftm et non-binary', () => {
    const values = TRANSITION_TYPES.map((t) => t.value)
    expect(values).toContain('mtf')
    expect(values).toContain('ftm')
    expect(values).toContain('non-binary')
  })

  it('toutes les options ont value, label et emoji', () => {
    TRANSITION_TYPES.forEach((type) => {
      expect(type.value).toBeTruthy()
      expect(type.label).toBeTruthy()
      expect(type.emoji).toBeTruthy()
    })
  })
})
