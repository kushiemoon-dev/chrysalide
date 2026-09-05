<script lang="ts">
  import '../app.css'
  import { page } from '$app/state'
  import { theme } from '$lib/theme.svelte'
  import {
    isNotificationEnabled,
    startReminderService,
    stopReminderService,
  } from '$lib/notification-scheduler'
  import AuroraBackground from '$lib/components/ui/AuroraBackground.svelte'
  import GlassNav from '$lib/components/ui/GlassNav.svelte'
  import DesktopNav from '$lib/components/ui/DesktopNav.svelte'
  import { getContentWidthClass } from '$lib/content-width'

  let { children } = $props()

  let widthClass = $derived(getContentWidthClass(page.url.pathname))
  let isOnboarding = $derived(page.url.pathname.startsWith('/onboarding'))

  $effect(() => {
    document.documentElement.dataset.theme = theme.resolvedMode
  })

  $effect(() => {
    document.documentElement.classList.toggle('reduce-motion', theme.config.reducedMotion)
  })

  $effect(() => {
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error)
      })
    }

    if (isNotificationEnabled()) {
      startReminderService()
    }

    return () => stopReminderService()
  })
</script>

<AuroraBackground />

<div class="content {widthClass}">
  {@render children()}
</div>

<GlassNav />
{#if !isOnboarding}
  <DesktopNav />
{/if}

<style>
  .content {
    position: relative;
    z-index: 1;
    max-width: 480px;
    margin: 0 auto;
    padding: 26px 22px 110px;
    min-height: 100vh;
  }

  @media (min-width: 1024px) {
    .content {
      --rail: 260px;
      margin: 0 auto 0 var(--rail);
      padding: 56px 24px 70px;
    }
    .content.standard {
      --content-max: 640px;
    }
    .content.large {
      --content-max: 960px;
    }
    .content.dashboard {
      --content-max: 1180px;
    }
    /* Centred in the space that remains to the right of the fixed nav rail.
       `margin: 0 auto` would centre in the full viewport instead, which pins the
       box to the left edge of that remaining space on wide screens. */
    .content.standard,
    .content.large,
    .content.dashboard {
      max-width: var(--content-max);
      margin-left: calc(var(--rail) + max(0px, (100% - var(--rail) - var(--content-max)) / 2));
    }
    .content.onboarding {
      max-width: 480px;
      margin: 0 auto;
      padding: 26px 22px 110px;
    }
  }
</style>
