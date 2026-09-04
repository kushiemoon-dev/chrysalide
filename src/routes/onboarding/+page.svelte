<script lang="ts">
  import { goto } from '$app/navigation'
  import { i18n } from '$lib/i18n.svelte'
  import {
    getOnboardingState,
    saveOnboardingState,
    completeOnboarding,
    ONBOARDING_STEPS,
    type OnboardingState,
  } from '$lib/onboarding'
  import WelcomeStep from '$lib/components/onboarding/WelcomeStep.svelte'
  import ProfileStep from '$lib/components/onboarding/ProfileStep.svelte'
  import MedicationStep from '$lib/components/onboarding/MedicationStep.svelte'
  import TourStep from '$lib/components/onboarding/TourStep.svelte'

  let onboardingState = $state<OnboardingState>({ completed: false, currentStep: 0 })
  let mounted = $state(false)

  $effect(() => {
    const saved = getOnboardingState()
    if (saved.completed) {
      goto('/', { replaceState: true })
      return
    }
    onboardingState = saved
    mounted = true
  })

  function goToStep(step: number) {
    onboardingState = { ...onboardingState, currentStep: step }
    saveOnboardingState(onboardingState)
  }

  function nextStep() {
    if (onboardingState.currentStep < ONBOARDING_STEPS.length - 1) {
      goToStep(onboardingState.currentStep + 1)
    }
  }

  function updateProfile(profile: OnboardingState['profile']) {
    onboardingState = { ...onboardingState, profile }
    saveOnboardingState(onboardingState)
  }

  function handleComplete() {
    completeOnboarding()
    goto('/', { replaceState: true })
  }

  let currentStep = $derived(ONBOARDING_STEPS[onboardingState.currentStep]!)
</script>

<div class="page">
  {#if mounted}
    <div class="progress">
      <div class="dots">
        {#each ONBOARDING_STEPS as step, index (step.id)}
          <button
            type="button"
            class="dot"
            class:current={index === onboardingState.currentStep}
            class:done={index < onboardingState.currentStep}
            disabled={index > onboardingState.currentStep}
            onclick={() => index < onboardingState.currentStep && goToStep(index)}
            aria-label={step.title}
          ></button>
        {/each}
      </div>
      <p class="counter">
        {onboardingState.currentStep + 1} / {ONBOARDING_STEPS.length}
        {#if currentStep.optional}
          ({i18n.t('onboarding.optional')})
        {/if}
      </p>
    </div>

    <div class="content">
      {#if currentStep.id === 'welcome'}
        <WelcomeStep onNext={nextStep} />
      {:else if currentStep.id === 'profile'}
        <ProfileStep
          {onboardingState}
          onUpdate={updateProfile}
          onNext={nextStep}
          onSkip={nextStep}
        />
      {:else if currentStep.id === 'medication'}
        <MedicationStep onNext={nextStep} onSkip={nextStep} />
      {:else if currentStep.id === 'tour'}
        <TourStep onComplete={handleComplete} />
      {/if}
    </div>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - 136px);
  }
  .progress {
    padding: 12px 0 4px;
  }
  .dots {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .dot {
    height: 6px;
    width: 6px;
    border-radius: 999px;
    border: none;
    background: var(--line);
    padding: 0;
    cursor: default;
  }
  .dot.current {
    width: 24px;
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
  }
  .dot.done {
    background: color-mix(in srgb, var(--blue-deep) 45%, transparent);
    cursor: pointer;
  }
  .counter {
    text-align: center;
    font-size: 11px;
    color: var(--ink-soft);
    margin: 6px 0 0;
  }
  .content {
    flex: 1;
  }
</style>
