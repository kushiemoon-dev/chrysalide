'use client'

import { Shield, Lock, Heart } from 'lucide-react'
import { ChrysalideLogo } from '@/components/brand/logo'

interface WelcomeStepProps {
  onNext: () => void
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center space-y-8 py-8 text-center">
      {/* Logo */}
      <div className="animate-flutter">
        <ChrysalideLogo size={80} animated={false} />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-gradient-trans text-3xl font-bold">Bienvenue sur Chrysalide</h1>
        <p className="text-muted-foreground">
          Ton compagnon de transition, bienveillant et confidentiel
        </p>
      </div>

      {/* Privacy Features */}
      <div className="w-full space-y-3 text-left">
        <div
          className="bg-card border-border animate-slide-up flex items-start gap-3 rounded-xl border p-4"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="bg-primary/10 text-primary rounded-lg p-2">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground font-medium">100% Local</p>
            <p className="text-muted-foreground text-sm">
              Toutes tes données restent sur ton appareil. Aucun serveur, aucun compte.
            </p>
          </div>
        </div>

        <div
          className="bg-card border-border animate-slide-up flex items-start gap-3 rounded-xl border p-4"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="bg-secondary/10 text-secondary rounded-lg p-2">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground font-medium">Confidentialité maximale</p>
            <p className="text-muted-foreground text-sm">
              Tes informations médicales ne quittent jamais ton téléphone.
            </p>
          </div>
        </div>

        <div
          className="bg-card border-border animate-slide-up flex items-start gap-3 rounded-xl border p-4"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="rounded-lg bg-green-500/10 p-2 text-green-500">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground font-medium">Fait par et pour la communauté</p>
            <p className="text-muted-foreground text-sm">
              Conçu avec amour pour accompagner ta transition.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        className="gradient-trans-glow shadow-trans-glow hover:shadow-trans-glow-lg w-full rounded-xl py-4 text-lg font-semibold text-white transition-all active:scale-[0.98]"
      >
        Commencer
      </button>
    </div>
  )
}
