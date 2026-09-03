<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    href,
    children,
  }: {
    href?: string
    children: Snippet
  } = $props()
</script>

{#if href}
  <a class="row" {href}>{@render children()}</a>
{:else}
  <div class="row">{@render children()}</div>
{/if}

<style>
  .row {
    display: block;
    padding: 13px 10px;
    margin: 0 -10px;
    border-radius: 12px;
    background: var(--bg);
    color: inherit;
    text-decoration: none;
    transition:
      background 0.18s ease,
      transform 0.12s ease;
  }
  a.row:active {
    background: var(--line);
    transform: scale(0.985);
  }
  :global(.row .title) {
    font-size: 15px;
    font-weight: 600;
    margin: 0;
  }
  :global(.row .meta) {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 2px 0 0;
  }
  :global(.row .when) {
    font-size: 12.5px;
    color: var(--ink-soft);
    text-align: right;
  }
</style>
