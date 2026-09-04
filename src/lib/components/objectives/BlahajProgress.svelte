<script lang="ts">
  // BLAHAJ: silhouette of the IKEA shark plush emblematic of the trans community.
  // Fills bottom-to-top with the given percentage.
  let {
    progress,
    context = 'feminizing',
  }: {
    progress: number
    context?: 'feminizing' | 'masculinizing'
  } = $props()

  const FILL_COLORS = { feminizing: '#F5A9B8', masculinizing: '#5BCEFA' }

  let clamped = $derived(Math.max(0, Math.min(100, progress)))
  let fillColor = $derived(FILL_COLORS[context])
  const clipId = `blahaj-clip-${Math.random().toString(36).slice(2)}`

  const BODY_PATH = `
    M 20 60
    Q 30 45 50 40
    Q 65 35 85 35
    L 90 20
    Q 92 15 95 20
    L 100 35
    Q 130 35 150 40
    Q 170 45 180 55
    Q 185 60 180 65
    L 175 65
    Q 178 70 175 75
    L 170 75
    Q 172 78 170 80
    Q 165 85 155 85
    Q 140 85 120 82
    Q 100 80 80 80
    Q 60 80 45 78
    Q 35 77 25 72
    Q 15 68 20 60
    Z
  `
</script>

<div class="wrap">
  <svg viewBox="0 0 200 100" role="img" aria-label={`BLAHAJ ${clamped}%`}>
    <defs>
      <clipPath id={clipId}>
        <rect x="0" y={100 - clamped} width="200" height={clamped} />
      </clipPath>
    </defs>
    <path d={BODY_PATH} fill={fillColor} clip-path={`url(#${clipId})`} opacity="0.9" />
    <path
      d={BODY_PATH}
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="40" cy="55" r="4" fill="currentColor" />
    <path
      d="M 35 65 Q 42 70 50 66"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />
    <path
      d="M 170 75 Q 175 80 185 78 Q 180 82 175 82"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />
  </svg>
  <span class="pct" class:light={clamped > 50}>{clamped}%</span>
</div>

<style>
  .wrap {
    position: relative;
    width: 120px;
    color: var(--ink-soft);
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .pct {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 700;
    color: var(--ink);
  }
  .pct.light {
    color: #fff;
    text-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
  }
</style>
