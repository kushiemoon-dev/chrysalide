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
      margin: 0 0 0 260px;
      padding: 56px 24px 70px;
    }
    .content.standard {
      max-width: 640px;
    }
    .content.large {
      max-width: 960px;
    }
    .content.dashboard {
      max-width: 1180px;
    }
    .content.onboarding {
      max-width: 480px;
      margin: 0 auto;
      padding: 26px 22px 110px;
    }
  }
</style>
