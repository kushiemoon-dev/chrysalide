<script lang="ts">
  let {
    fraction,
    label,
  }: {
    /** 0..1 share of stock remaining */
    fraction: number
    label: string
  } = $props()

  let clamped = $derived(Math.max(0, Math.min(1, fraction)))
</script>

<div class="stock-track">
  <div class="stock-fill" style:width={`${clamped * 100}%`}></div>
</div>
<p class="stock-txt">{label}</p>

<style>
  .stock-track {
    height: 5px;
    background: var(--line);
    border-radius: 3px;
    overflow: hidden;
    margin-top: 10px;
  }
  .stock-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--blue-deep), var(--pink-deep));
    transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .stock-txt {
    font-size: 11.5px;
    color: var(--watch);
    margin-top: 6px;
  }
</style>
