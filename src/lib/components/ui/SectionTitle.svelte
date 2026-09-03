<script lang="ts">
  let { text }: { text: string } = $props()
</script>

<p class="section-title">{text}</p>

<style>
  .section-title {
    font-size: 13px;
    color: var(--ink-soft);
    margin: 26px 0 10px;
    font-weight: 500;
  }
</style>
