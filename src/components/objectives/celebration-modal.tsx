'use client'

import { useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PartyPopper, Sparkles } from 'lucide-react'

const TRANS_COLORS = ['#5BCEFA', '#F5A9B8', '#FFFFFF']

// ponytail: inline confetti — drops canvas-confetti dep (rAF canvas, auto-cleanup)
function fireParticles(opts: {
  particleCount?: number
  spread?: number
  angle?: number
  origin?: { x?: number; y?: number }
}): void {
  const { particleCount = 50, spread = 70, angle = 90, origin = {} } = opts
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
  const ox = (origin.x ?? 0.5) * canvas.width
  const oy = (origin.y ?? 0.5) * canvas.height
  const θ = (angle * Math.PI) / 180
  const s = (spread * Math.PI) / 180
  const ps = Array.from({ length: particleCount }, () => {
    const a = θ - s / 2 + Math.random() * s
    const v = 6 + Math.random() * 6
    return {
      x: ox,
      y: oy,
      vx: Math.cos(a) * v,
      vy: -Math.sin(a) * v,
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
    for (const p of ps) {
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
    alive ? (raf = requestAnimationFrame(tick)) : canvas.remove()
  }
  raf = requestAnimationFrame(tick)
  setTimeout(() => {
    cancelAnimationFrame(raf)
    canvas.remove()
  }, 5000)
}

interface CelebrationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
}

export function CelebrationModal({
  open,
  onOpenChange,
  title,
  description,
}: CelebrationModalProps) {
  const fireConfetti = useCallback(() => {
    fireParticles({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
    setTimeout(() => {
      fireParticles({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } })
      fireParticles({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } })
    }, 250)
  }, [])

  useEffect(() => {
    if (open) {
      const timer = setTimeout(fireConfetti, 100)
      return () => clearTimeout(timer)
    }
  }, [open, fireConfetti])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-center sm:max-w-md">
        <DialogHeader className="items-center">
          <div className="from-trans-blue to-trans-pink mb-4 flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-gradient-to-br via-white">
            <PartyPopper className="text-primary h-8 w-8" />
          </div>
          <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
            <Sparkles className="text-trans-pink h-5 w-5" />
            {title}
            <Sparkles className="text-trans-blue h-5 w-5" />
          </DialogTitle>
          {description && (
            <DialogDescription className="pt-2 text-center">{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex justify-center pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="from-trans-blue to-trans-pink text-foreground bg-gradient-to-r via-white hover:opacity-90"
          >
            Continuer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook to trigger confetti without modal
export function useConfetti() {
  const fire = useCallback(() => {
    fireParticles({ particleCount: 80, spread: 60, origin: { y: 0.7 } })
  }, [])

  return { fire }
}
