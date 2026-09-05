<script lang="ts">
  let {
    value,
    unit,
    min,
    max,
    label,
    note,
  }: {
    value: number
    unit: string
    min: number
    max: number
    label: string
    note: string
  } = $props()

  // The needle sweeps a -90..90deg semicircle. The visual domain extends past
  // [min, max] so an in-range value doesn't pin the needle to the arc edges.
  let angle = $derived.by(() => {
    const domainMargin = (max - min) * 0.5
    const domainMin = min - domainMargin
    const domainMax = max + domainMargin
    const ratio = (value - domainMin) / (domainMax - domainMin)
    return Math.max(-90, Math.min(90, -90 + 180 * ratio))
  })

  let mounted = $state(false)
  let displayValue = $state(0)

  $effect(() => {
    const enterTimer = setTimeout(() => {
      mounted = true
    }, 50)

    const target = value
    const reduce =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      displayValue = target
      return () => clearTimeout(enterTimer)
    }

    const duration = 1150
    const delay = 500
    const start = performance.now()
    let frame: number
    function tick(now: number) {
      const elapsed = now - start - delay
      if (elapsed < 0) {
        frame = requestAnimationFrame(tick)
        return
      }
      const p = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      displayValue = Math.round(eased * target)
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      clearTimeout(enterTimer)
      cancelAnimationFrame(frame)
    }
  })
</script>

<div class="meter-face">
  <div class="gauge">
    <div class="needle" style:transform={`rotate(${mounted ? angle : -90}deg)`}></div>
  </div>
  <div class="gauge-num tabular-nums">{displayValue}</div>
  <div class="gauge-unit">{label} ({unit})</div>
  <div class="gauge-note">{note}</div>
</div>

<style>
  .meter-face {
    width: 216px;
    background: var(--glass-bg);
    backdrop-filter: blur(20px) saturate(160%);
    -webkit-backdrop-filter: blur(20px) saturate(160%);
    border: 1px solid var(--glass-border);
    border-radius: 50%;
    padding: 22px 18px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 12px 32px -14px var(--shadow);
    transition:
      background 0.3s ease,
      border-color 0.3s ease;
  }
  .gauge {
    width: 168px;
    height: 84px;
    position: relative;
    overflow: hidden;
  }
  .gauge::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 168px;
    height: 168px;
    border-radius: 50%;
    background: conic-gradient(
      from -90deg,
      var(--neutral-zone) 0deg 80deg,
      var(--ok) 80deg 140deg,
      var(--neutral-zone) 140deg 180deg,
      transparent 180deg 360deg
    );
  }
  .gauge::after {
    content: '';
    position: absolute;
    top: 14px;
    left: 14px;
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: var(--bg);
  }
  .needle {
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 2px;
    height: 66px;
    background: var(--ink);
    transform-origin: bottom center;
    border-radius: 2px;
    transition: transform 1.15s cubic-bezier(0.16, 1, 0.3, 1) 0.5s;
  }
  .needle::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ink);
  }
  .gauge-num {
    font-size: 30px;
    font-weight: 700;
    margin-top: 6px;
    line-height: 1;
  }
  .gauge-unit {
    font-size: 12px;
    color: var(--ink-soft);
    margin-top: 2px;
  }
  .gauge-note {
    font-size: 10.5px;
    color: var(--ink-faint);
    text-align: center;
    margin-top: 8px;
    line-height: 1.4;
    max-width: 180px;
  }

  @media (min-width: 1024px) {
    .meter-face {
      width: 400px;
      padding: 38px 30px 42px;
      background: color-mix(in srgb, var(--bg) 80%, var(--glass-bg));
      backdrop-filter: blur(24px) saturate(110%);
      -webkit-backdrop-filter: blur(24px) saturate(110%);
    }
    .gauge {
      width: 310px;
      height: 155px;
    }
    .gauge::before {
      width: 310px;
      height: 310px;
    }
    .gauge::after {
      top: 26px;
      left: 26px;
      width: 258px;
      height: 258px;
    }
    .needle {
      width: 3px;
      height: 120px;
    }
    .needle::after {
      width: 12px;
      height: 12px;
    }
    .gauge-num {
      font-size: 54px;
      margin-top: 10px;
    }
    .gauge-unit {
      font-size: 14.5px;
      margin-top: 4px;
    }
    .gauge-note {
      font-size: 12px;
      margin-top: 12px;
      max-width: 230px;
    }
  }
</style>
