<script lang="ts">
  import { i18n } from '$lib/i18n.svelte'
  import Lock from '@lucide/svelte/icons/lock'
  import Shield from '@lucide/svelte/icons/shield'
  import Heart from '@lucide/svelte/icons/heart'

  let { onNext }: { onNext: () => void } = $props()
</script>

<div class="welcome">
  <p class="wordmark">Chrysalide</p>

  <div class="intro">
    <h1>{i18n.t('onboarding.welcome.title')}</h1>
    <p class="subtitle">{i18n.t('onboarding.welcome.subtitle')}</p>
  </div>

  <div class="features">
    <div class="feature">
      <div class="feature-icon"><Lock size={18} /></div>
      <div>
        <p class="feature-title">{i18n.t('onboarding.welcome.localTitle')}</p>
        <p class="feature-desc">{i18n.t('onboarding.welcome.localDesc')}</p>
      </div>
    </div>
    <div class="feature">
      <div class="feature-icon pink"><Shield size={18} /></div>
      <div>
        <p class="feature-title">{i18n.t('onboarding.welcome.privacyTitle')}</p>
        <p class="feature-desc">{i18n.t('onboarding.welcome.privacyDesc')}</p>
      </div>
    </div>
    <div class="feature">
      <div class="feature-icon ok"><Heart size={18} /></div>
      <div>
        <p class="feature-title">{i18n.t('onboarding.welcome.communityTitle')}</p>
        <p class="feature-desc">{i18n.t('onboarding.welcome.communityDesc')}</p>
      </div>
    </div>
  </div>

  <button type="button" class="cta" onclick={onNext}>
    {i18n.t('onboarding.welcome.start')}
  </button>
</div>

<style>
  .welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 28px;
    padding: 32px 0;
  }
  .wordmark {
    font-size: 26px;
    font-weight: 800;
    margin: 0;
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
  }
  .intro {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  h1 {
    font-size: 22px;
    font-weight: 700;
    margin: 0;
  }
  .subtitle {
    font-size: 13px;
    color: var(--ink-soft);
    margin: 0;
  }
  .features {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    text-align: left;
  }
  .feature {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px;
    border-radius: 14px;
    border: 1px solid var(--line);
    background: var(--bg);
  }
  .feature-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--blue-deep) 14%, transparent);
    color: var(--blue-deep);
    flex-shrink: 0;
  }
  .feature-icon.pink {
    background: color-mix(in srgb, var(--pink-deep) 14%, transparent);
    color: var(--pink-deep);
  }
  .feature-icon.ok {
    background: color-mix(in srgb, var(--ok) 16%, transparent);
    color: var(--ok);
  }
  .feature-title {
    font-size: 13.5px;
    font-weight: 600;
    margin: 0;
  }
  .feature-desc {
    font-size: 12px;
    color: var(--ink-soft);
    margin: 2px 0 0;
  }
  .cta {
    width: 100%;
    padding: 14px;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    color: #fff;
    font-family: inherit;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
  }
  .cta:active {
    transform: scale(0.98);
  }
</style>
