<script lang="ts">
  import { i18n } from '$lib/i18n.svelte'
  import { PRONOUNS_OPTIONS, TRANSITION_TYPES, type OnboardingState } from '$lib/onboarding'

  let {
    onboardingState,
    onUpdate,
    onNext,
    onSkip,
  }: {
    onboardingState: OnboardingState
    onUpdate: (profile: OnboardingState['profile']) => void
    onNext: () => void
    onSkip: () => void
  } = $props()

  type TransitionType = NonNullable<OnboardingState['profile']>['transitionType']

  let pronouns = $state(onboardingState.profile?.pronouns ?? '')
  let transitionType = $state<TransitionType | ''>(onboardingState.profile?.transitionType ?? '')

  function handleNext() {
    onUpdate({
      pronouns: pronouns || undefined,
      transitionType: transitionType || undefined,
    })
    onNext()
  }
</script>

<div class="profile">
  <div class="head">
    <h2>{i18n.t('onboarding.profile.title')}</h2>
    <p class="subtitle">{i18n.t('onboarding.profile.subtitle')}</p>
  </div>

  <div class="field">
    <label for="pronouns-group">{i18n.t('onboarding.profile.pronouns')}</label>
    <div id="pronouns-group" class="pill-row">
      {#each PRONOUNS_OPTIONS as option (option.value)}
        <button
          type="button"
          class="pill"
          class:active={pronouns === option.value}
          onclick={() => (pronouns = option.value)}
        >
          {option.label}
        </button>
      {/each}
    </div>
  </div>

  <div class="field">
    <label for="transition-group">{i18n.t('onboarding.profile.transitionType')}</label>
    <div id="transition-group" class="option-list">
      {#each TRANSITION_TYPES as option (option.value)}
        <button
          type="button"
          class="option"
          class:active={transitionType === option.value}
          onclick={() => (transitionType = option.value as TransitionType)}
        >
          <span class="emoji">{option.emoji}</span>
          <span>{option.label}</span>
        </button>
      {/each}
    </div>
  </div>

  <div class="actions">
    <button type="button" class="btn-secondary" onclick={onSkip}>
      {i18n.t('onboarding.profile.skip')}
    </button>
    <button type="button" class="btn-primary" onclick={handleNext}>
      {i18n.t('onboarding.profile.continue')}
    </button>
  </div>
</div>

<style>
  .profile {
    display: flex;
    flex-direction: column;
    gap: 28px;
    padding: 12px 0;
  }
  .head {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  h2 {
    font-size: 20px;
    font-weight: 700;
    margin: 0;
  }
  .subtitle {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 0;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  label {
    font-size: 13px;
    font-weight: 600;
  }
  .pill-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .pill {
    padding: 8px 16px;
    border-radius: 999px;
    border: 2px solid var(--line);
    background: var(--bg);
    color: var(--ink-soft);
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .pill.active {
    border-color: var(--blue-deep);
    background: color-mix(in srgb, var(--blue-deep) 12%, transparent);
    color: var(--ink);
  }
  .option-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .option {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border-radius: 14px;
    border: 2px solid var(--line);
    background: var(--bg);
    text-align: left;
    font-family: inherit;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--ink);
    cursor: pointer;
  }
  .option.active {
    border-color: var(--blue-deep);
    background: color-mix(in srgb, var(--blue-deep) 10%, transparent);
    color: var(--blue-deep);
  }
  .emoji {
    font-size: 20px;
  }
  .actions {
    display: flex;
    gap: 10px;
  }
  .btn-secondary,
  .btn-primary {
    flex: 1;
    padding: 13px;
    border-radius: 14px;
    border: none;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }
  .btn-secondary {
    background: var(--line);
    color: var(--ink-soft);
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    color: #fff;
  }
  .btn-secondary:active,
  .btn-primary:active {
    transform: scale(0.98);
  }
</style>
