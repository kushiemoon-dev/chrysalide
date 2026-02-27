'use client'

import { useEffect, useCallback } from 'react'
import confetti from 'canvas-confetti'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PartyPopper, Sparkles } from 'lucide-react'

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
    // Trans flag colors
    const transColors = ['#5BCEFA', '#F5A9B8', '#FFFFFF']

    // First burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: transColors,
    })

    // Second burst with delay
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: transColors,
      })
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: transColors,
      })
    }, 250)
  }, [])

  useEffect(() => {
    if (open) {
      // Small delay to ensure modal is visible
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
    const transColors = ['#5BCEFA', '#F5A9B8', '#FFFFFF']

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: transColors,
    })
  }, [])

  return { fire }
}
