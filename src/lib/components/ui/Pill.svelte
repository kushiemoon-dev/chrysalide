<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    status = 'neutral',
    children,
  }: {
    status?: 'ok' | 'watch' | 'alert' | 'neutral'
    children: Snippet
  } = $props()
</script>

<div class="pill">
  {#if status !== 'neutral'}
    <span class="dot dot-{status}"></span>
  {/if}
  <span>{@render children()}</span>
</div>

<style>
  .pill {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 9px 14px;
    font-size: 12.5px;
    width: fit-content;
    transition:
      background 0.3s ease,
      border-color 0.3s ease;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .dot-ok {
    background: var(--ok);
  }
  .dot-watch {
    background: var(--watch);
  }
  .dot-alert {
    background: var(--alert);
  }
</style>
