<script lang="ts">
  import { theme } from '$lib/theme.svelte'
  import { i18n } from '$lib/i18n.svelte'
</script>

<div class="theme-switch">
  <button
    class="ts-btn"
    class:active={theme.resolvedMode === 'light'}
    onclick={() => theme.setMode('light')}
  >
    {i18n.t('theme.modes.light.label')}
  </button>
  <button
    class="ts-btn"
    class:active={theme.resolvedMode === 'dark'}
    onclick={() => theme.setMode('dark')}
  >
    {i18n.t('theme.modes.dark.label')}
  </button>
</div>

<style>
  .theme-switch {
    display: flex;
    gap: 2px;
    background: var(--line);
    padding: 3px;
    border-radius: 999px;
    transition: background 0.3s ease;
  }
  .ts-btn {
    border: none;
    background: transparent;
    font-family: inherit;
    font-size: 11px;
    padding: 5px 11px;
    border-radius: 999px;
    color: var(--ink-soft);
    cursor: pointer;
    transition:
      background 0.2s ease,
      color 0.2s ease;
  }
  .ts-btn.active {
    background: var(--bg);
    color: var(--ink);
    font-weight: 600;
  }
</style>
