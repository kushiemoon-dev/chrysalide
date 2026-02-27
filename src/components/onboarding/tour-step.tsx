'use client'

import { Pill, TestTube2, TrendingUp, Calendar, BookOpen, Target, Sparkles } from 'lucide-react'
import { ChrysalideLogo } from '@/components/brand/logo'

interface TourStepProps {
  onComplete: () => void
}

const features = [
  {
    icon: Pill,
    title: 'Médicaments',
    description: 'Suivi des prises et du stock',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: TestTube2,
    title: 'Analyses',
    description: 'Graphiques de tes taux hormonaux',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
  },
  {
    icon: TrendingUp,
    title: 'Évolution',
    description: 'Photos et mensurations',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    icon: Calendar,
    title: 'Rendez-vous',
    description: 'Calendrier de tes RDV médicaux',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
  {
    icon: BookOpen,
    title: 'Journal',
    description: 'Note ton humeur et tes ressentis',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  {
    icon: Target,
    title: 'Objectifs',
    description: 'Définis et suis tes milestones',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
]

export function TourStep({ onComplete }: TourStepProps) {
  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="space-y-2 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Sparkles className="text-primary h-5 w-5" />
          <span className="text-primary text-sm font-medium">C&apos;est parti !</span>
        </div>
        <h2 className="text-foreground text-2xl font-bold">Découvre Chrysalide</h2>
        <p className="text-muted-foreground">
          Tout ce dont tu as besoin pour accompagner ta transition
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 gap-3">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <div
              key={feature.title}
              className="bg-card border-border animate-slide-up rounded-xl border p-4"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div
                className={`h-10 w-10 rounded-lg ${feature.bg} mb-2 flex items-center justify-center`}
              >
                <Icon className={`h-5 w-5 ${feature.color}`} />
              </div>
              <p className="text-foreground text-sm font-medium">{feature.title}</p>
              <p className="text-muted-foreground text-xs">{feature.description}</p>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="space-y-4 pt-4">
        <button
          onClick={onComplete}
          className="gradient-trans-glow shadow-trans-glow hover:shadow-trans-glow-lg w-full rounded-xl py-4 text-lg font-semibold text-white transition-all active:scale-[0.98]"
        >
          Commencer mon suivi
        </button>

        <div className="text-muted-foreground flex items-center justify-center gap-2">
          <ChrysalideLogo size={24} />
          <span className="text-sm">Chrysalide t&apos;accompagne</span>
        </div>
      </div>
    </div>
  )
}
