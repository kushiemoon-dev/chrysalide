<script lang="ts">
  import { page } from '$app/state'
  import { onMount } from 'svelte'
  import X from '@lucide/svelte/icons/x'
  import TrendingUp from '@lucide/svelte/icons/trending-up'
  import BookOpen from '@lucide/svelte/icons/book-open'
  import Target from '@lucide/svelte/icons/target'
  import Calendar from '@lucide/svelte/icons/calendar'
  import Users from '@lucide/svelte/icons/users'
  import ExternalLink from '@lucide/svelte/icons/external-link'
  import { getModulePreferences } from '$lib/notifications'

  const mainItems = [
    { href: '/', label: 'Accueil' },
    { href: '/medications', label: 'Medocs' },
    { href: '/bloodtests', label: 'Analyses' },
  ]

  const allMoreItems = [
    { href: '/progress', icon: TrendingUp, label: 'Évolution', moduleKey: 'evolution' as const },
    { href: '/journal', icon: BookOpen, label: 'Journal', moduleKey: null },
    { href: '/objectives', icon: Target, label: 'Objectifs', moduleKey: null },
    { href: '/appointments', icon: Calendar, label: 'Rendez-vous', moduleKey: null },
    { href: '/practitioners', icon: Users, label: 'Praticien·nes', moduleKey: null },
    { href: '/resources', icon: ExternalLink, label: 'Ressources', moduleKey: null },
  ]

  let moreItems = $state(allMoreItems)
  let moreMenuOpen = $state(false)

  function refreshMoreItems() {
    const prefs = getModulePreferences()
    moreItems = allMoreItems.filter((item) =>
      item.moduleKey === 'evolution' ? prefs.evolutionEnabled : true
    )
  }

  onMount(() => {
    refreshMoreItems()
    window.addEventListener('modulePrefsChanged', refreshMoreItems)
    return () => window.removeEventListener('modulePrefsChanged', refreshMoreItems)
  })

  function isActive(href: string) {
    return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href)
  }

  const isMoreActive = $derived(moreItems.some((item) => isActive(item.href)))
</script>

{#if moreMenuOpen}
  <button class="overlay" aria-label="Fermer le menu" onclick={() => (moreMenuOpen = false)}
  ></button>
  <div class="sheet">
    <div class="sheet-head">
      <span>Plus</span>
      <button class="sheet-close" onclick={() => (moreMenuOpen = false)} aria-label="Fermer">
        <X size={18} />
      </button>
    </div>
    <div class="sheet-grid">
      {#each moreItems as item (item.href)}
        <a href={item.href} class="sheet-item" class:active={isActive(item.href)}>
          <item.icon size={22} />
          <span>{item.label}</span>
        </a>
      {/each}
    </div>
  </div>
{/if}

<nav class="nav">
  {#each mainItems as item (item.href)}
    <a href={item.href} class="nav-item" class:active={isActive(item.href)}>
      <span class="nav-dot"></span>
      <span class="nav-lbl">{item.label}</span>
    </a>
  {/each}
  <button
    class="nav-item"
    class:active={isMoreActive || moreMenuOpen}
    onclick={() => (moreMenuOpen = !moreMenuOpen)}
  >
    <span class="nav-dot"></span>
    <span class="nav-lbl">Plus</span>
  </button>
  <a href="/settings" class="nav-item" class:active={isActive('/settings')}>
    <span class="nav-dot"></span>
    <span class="nav-lbl">Réglages</span>
  </a>
</nav>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: transparent;
    border: none;
    padding: 0;
  }
  .sheet {
    position: fixed;
    left: 16px;
    right: 16px;
    bottom: 96px;
    z-index: 50;
    max-width: 480px;
    margin: 0 auto;
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 20px;
    box-shadow: 0 20px 50px -18px var(--shadow);
    overflow: hidden;
  }
  .sheet-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    border-bottom: 1px solid var(--line);
    font-weight: 600;
  }
  .sheet-close {
    border: none;
    background: transparent;
    color: var(--ink-soft);
    padding: 4px;
    cursor: pointer;
  }
  .sheet-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    padding: 8px;
  }
  .sheet-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px 6px;
    border-radius: 14px;
    color: var(--ink-soft);
    text-decoration: none;
    font-size: 11px;
    text-align: center;
  }
  .sheet-item.active {
    background: color-mix(in srgb, var(--blue) 15%, transparent);
    color: var(--ink);
  }

  .nav {
    position: fixed;
    left: 16px;
    right: 16px;
    bottom: 16px;
    z-index: 30;
    max-width: 480px;
    margin: 0 auto;
    background: var(--glass-bg);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid var(--glass-border);
    border-radius: 999px;
    height: 62px;
    display: flex;
    align-items: center;
    justify-content: space-around;
    box-shadow: 0 10px 30px -12px var(--shadow);
    transition:
      background 0.3s ease,
      border-color 0.3s ease;
    padding-bottom: env(safe-area-inset-bottom);
  }
  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    border: none;
    background: transparent;
    color: inherit;
    text-decoration: none;
    font-family: inherit;
    cursor: pointer;
    transition: transform 0.15s ease;
  }
  .nav-item:active {
    transform: scale(0.85);
  }
  .nav-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--ink-faint);
  }
  .nav-item.active .nav-dot {
    width: 11px;
    height: 11px;
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
  }
  .nav-lbl {
    font-size: 9.5px;
    color: transparent;
    height: 0;
    overflow: hidden;
  }
  .nav-item.active .nav-lbl {
    color: var(--ink);
    height: auto;
    font-weight: 600;
  }
</style>
