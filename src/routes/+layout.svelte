<script lang="ts">
  import '../app.css'
  import { theme } from '$lib/theme.svelte'
  import AuroraBackground from '$lib/components/ui/AuroraBackground.svelte'
  import GlassNav from '$lib/components/ui/GlassNav.svelte'

  let { children } = $props()

  $effect(() => {
    document.documentElement.dataset.theme = theme.resolvedMode
  })
</script>

<AuroraBackground />

<div class="content">
  {@render children()}
</div>

<GlassNav />

<style>
  .content {
    position: relative;
    z-index: 1;
    max-width: 480px;
    margin: 0 auto;
    padding: 26px 22px 110px;
    min-height: 100vh;
  }
</style>
