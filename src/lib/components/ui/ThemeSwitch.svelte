<script lang="ts">
  import { theme } from '$lib/theme.svelte'
</script>

<div class="theme-switch">
  <button
    class="ts-btn"
    class:active={theme.resolvedMode === 'light'}
    onclick={() => theme.setMode('light')}
  >
    Clair
  </button>
  <button
    class="ts-btn"
    class:active={theme.resolvedMode === 'dark'}
    onclick={() => theme.setMode('dark')}
  >
    Sombre
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
