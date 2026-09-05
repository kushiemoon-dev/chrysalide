<script lang="ts">
  import { page } from '$app/state'
  import { getModulePreferences } from '$lib/notifications'
  import { i18n } from '$lib/i18n.svelte'

  const itemDefs = [
    { href: '/', key: 'nav.home', moduleKey: null },
    { href: '/medications', key: 'nav.medications', moduleKey: null },
    { href: '/bloodtests', key: 'nav.bloodtests', moduleKey: null },
    { href: '/progress', key: 'nav.evolution', moduleKey: 'evolution' as const },
    { href: '/journal', key: 'nav.journal', moduleKey: null },
    { href: '/objectives', key: 'nav.objectives', moduleKey: null },
    { href: '/appointments', key: 'nav.appointments', moduleKey: null },
    { href: '/practitioners', key: 'nav.practitioners', moduleKey: null },
    { href: '/resources', key: 'nav.resources', moduleKey: null },
  ]

  let moduleFilter = $state(getModulePreferences())

  const items = $derived(
    itemDefs
      .filter((item) => (item.moduleKey === 'evolution' ? moduleFilter.evolutionEnabled : true))
      .map((item) => ({ href: item.href, label: i18n.t(item.key) }))
  )

  function refreshModuleFilter() {
    moduleFilter = getModulePreferences()
  }

  $effect(() => {
    window.addEventListener('modulePrefsChanged', refreshModuleFilter)
    return () => window.removeEventListener('modulePrefsChanged', refreshModuleFilter)
  })

  function isActive(href: string) {
    return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href)
  }
</script>

<nav class="nav" data-testid="desktop-nav">
  <div class="items">
    {#each items as item (item.href)}
      <a href={item.href} class="item" class:active={isActive(item.href)}>
        <span class="dot"></span>{item.label}
      </a>
    {/each}
  </div>
  <a href="/settings" class="item settings" class:active={isActive('/settings')}>
    <span class="dot"></span>{i18n.t('nav.settings')}
  </a>
</nav>

<style>
  .nav {
    display: none;
  }

  @media (min-width: 1024px) {
    .nav {
      position: fixed;
      left: 56px;
      top: 0;
      bottom: 0;
      width: 180px;
      z-index: 30;
      display: flex;
      flex-direction: column;
      padding: 56px 0;
    }
    .items {
      display: flex;
      flex-direction: column;
      gap: 21px;
    }
    .item {
      display: flex;
      align-items: baseline;
      gap: 9px;
      color: var(--ink-soft);
      font-size: 15px;
      font-weight: 500;
      text-decoration: none;
      transition:
        color 0.2s ease,
        transform 0.2s ease;
    }
    .item:hover {
      color: var(--ink);
      transform: translateX(2px);
    }
    .item .dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: transparent;
      flex-shrink: 0;
      transition: background 0.2s ease;
    }
    .item.active {
      color: var(--ink);
      font-weight: 700;
      font-size: 16px;
    }
    .item.active .dot {
      background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    }
    .settings {
      margin-top: auto;
      padding-top: 20px;
      border-top: 1px solid var(--line);
    }
  }
</style>
