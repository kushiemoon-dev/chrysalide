<script module lang="ts">
  const TRANS_COLORS = ['#5BCEFA', '#F5A9B8', '#FFFFFF']

  // ponytail: inline confetti, no canvas-confetti dep (rAF canvas, auto-cleanup)
  export function fireConfetti(): void {
    const canvas = document.createElement('canvas')
    Object.assign(canvas.style, {
      position: 'fixed',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '9999',
    })
    document.body.appendChild(canvas)
    canvas.width = innerWidth
    canvas.height = innerHeight
    const ctx = canvas.getContext('2d')!
    const ox = canvas.width / 2
    const oy = canvas.height * 0.6
    const particles = Array.from({ length: 90 }, () => {
      const angle = (Math.random() - 0.5) * Math.PI * 0.7 - Math.PI / 2
      const v = 6 + Math.random() * 6
      return {
        x: ox,
        y: oy,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        color: TRANS_COLORS[Math.floor(Math.random() * TRANS_COLORS.length)]!,
        w: 6 + Math.random() * 5,
        r: Math.random() * Math.PI * 2,
        rs: (Math.random() - 0.5) * 0.3,
        a: 1,
      }
    })
    let raf: number
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = false
      for (const p of particles) {
        p.vy += 0.25
        p.x += p.vx
        p.y += p.vy
        p.r += p.rs
        p.a -= 0.012
        if (p.a > 0) {
          alive = true
          ctx.save()
          ctx.globalAlpha = p.a
          ctx.translate(p.x, p.y)
          ctx.rotate(p.r)
          ctx.fillStyle = p.color
          ctx.fillRect(-p.w / 2, -p.w / 4, p.w, p.w / 2)
          ctx.restore()
        }
      }
      if (alive) {
        raf = requestAnimationFrame(tick)
      } else {
        canvas.remove()
      }
    }
    raf = requestAnimationFrame(tick)
    setTimeout(() => {
      cancelAnimationFrame(raf)
      canvas.remove()
    }, 4000)
  }
</script>

<script lang="ts">
  import { i18n } from '$lib/i18n.svelte'
  import PartyPopper from '@lucide/svelte/icons/party-popper'

  let {
    open = $bindable(),
    title,
  }: {
    open: boolean
    title: string
  } = $props()

  $effect(() => {
    if (open) fireConfetti()
  })
</script>

{#if open}
  <button class="overlay" aria-label={i18n.t('common.close')} onclick={() => (open = false)}
  ></button>
  <div class="modal" role="dialog" aria-modal="true">
    <div class="icon-circle">
      <PartyPopper size={28} color="#fff" />
    </div>
    <h2>{title}</h2>
    <p>{i18n.t('objectives.detail.celebrationDesc')}</p>
    <button type="button" class="btn-primary-sm" onclick={() => (open = false)}>
      {i18n.t('objectives.celebration.continue')}
    </button>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 90;
    background: rgb(0 0 0 / 0.4);
    border: none;
    padding: 0;
  }
  .modal {
    position: fixed;
    z-index: 91;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(340px, calc(100vw - 32px));
    background: var(--bg);
    border-radius: 20px;
    padding: 28px 20px;
    text-align: center;
    box-shadow: 0 20px 50px -18px var(--shadow);
  }
  .icon-circle {
    width: 64px;
    height: 64px;
    margin: 0 auto 14px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
  }
  h2 {
    font-size: 19px;
    font-weight: 700;
    margin: 0 0 6px;
  }
  p {
    font-size: 13px;
    color: var(--ink-soft);
    margin: 0 0 18px;
  }
  .btn-primary-sm {
    padding: 10px 22px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    color: #fff;
    font-family: inherit;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
  }
</style>
