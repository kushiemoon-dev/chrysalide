<script lang="ts">
  import { i18n } from '$lib/i18n.svelte'
  import Pill from '@lucide/svelte/icons/pill'
  import ArrowRight from '@lucide/svelte/icons/arrow-right'

  let { onNext, onSkip }: { onNext: () => void; onSkip: () => void } = $props()
</script>

<div class="medication">
  <div class="head">
    <div class="icon-wrap"><Pill size={28} /></div>
    <h2>{i18n.t('onboarding.medication.title')}</h2>
    <p class="subtitle">{i18n.t('onboarding.medication.subtitle')}</p>
  </div>

  <div class="feature-list">
    <div class="feature-row">
      <span class="dot blue"></span>{i18n.t('onboarding.medication.reminders')}
    </div>
    <div class="feature-row">
      <span class="dot pink"></span>{i18n.t('onboarding.medication.stockAlerts')}
    </div>
    <div class="feature-row">
      <span class="dot ok"></span>{i18n.t('onboarding.medication.changeHistory')}
    </div>
    <div class="feature-row">
      <span class="dot gold"></span>{i18n.t('onboarding.medication.calendar')}
    </div>
  </div>

  <div class="actions">
    <a href="/medications/new?onboarding=true" onclick={onNext} class="cta">
      {i18n.t('onboarding.medication.addMed')}
      <ArrowRight size={16} />
    </a>
    <button type="button" class="btn-secondary" onclick={onSkip}>
      {i18n.t('onboarding.medication.later')}
    </button>
  </div>

  <p class="help-text">{i18n.t('onboarding.medication.helpText')}</p>
</div>

<style>
  .medication {
    display: flex;
    flex-direction: column;
    gap: 28px;
    padding: 12px 0;
  }
  .head {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border-radius: 18px;
    background: color-mix(in srgb, var(--blue-deep) 14%, transparent);
    color: var(--blue-deep);
    margin-bottom: 8px;
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
  .feature-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    text-align: left;
  }
  .feature-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--bg);
    font-size: 13px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .dot.blue {
    background: var(--blue-deep);
  }
  .dot.pink {
    background: var(--pink-deep);
  }
  .dot.ok {
    background: var(--ok);
  }
  .dot.gold {
    background: var(--gold);
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .cta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 13px;
    border-radius: 14px;
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    color: #fff;
    text-decoration: none;
    font-size: 14px;
    font-weight: 700;
  }
  .btn-secondary {
    padding: 13px;
    border-radius: 14px;
    border: none;
    background: var(--line);
    color: var(--ink-soft);
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }
  .cta:active,
  .btn-secondary:active {
    transform: scale(0.98);
  }
  .help-text {
    text-align: center;
    font-size: 11.5px;
    color: var(--ink-soft);
    margin: 0;
  }
</style>
