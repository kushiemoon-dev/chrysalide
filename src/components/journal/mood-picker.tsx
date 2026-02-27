'use client'

import { cn } from '@/lib/utils'
import type { MoodLevel } from '@/lib/types'

interface MoodPickerProps {
  value?: MoodLevel
  onChange: (mood: MoodLevel) => void
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

const moodConfig: { level: MoodLevel; emoji: string; label: string; color: string }[] = [
  {
    level: 1,
    emoji: '😢',
    label: 'Très mal',
    color: 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30',
  },
  {
    level: 2,
    emoji: '😔',
    label: 'Mal',
    color: 'bg-orange-500/20 border-orange-500/50 hover:bg-orange-500/30',
  },
  {
    level: 3,
    emoji: '😐',
    label: 'Neutre',
    color: 'bg-yellow-500/20 border-yellow-500/50 hover:bg-yellow-500/30',
  },
  {
    level: 4,
    emoji: '🙂',
    label: 'Bien',
    color: 'bg-green-500/20 border-green-500/50 hover:bg-green-500/30',
  },
  {
    level: 5,
    emoji: '😊',
    label: 'Très bien',
    color: 'bg-emerald-500/20 border-emerald-500/50 hover:bg-emerald-500/30',
  },
]

const selectedColors: Record<MoodLevel, string> = {
  1: 'bg-red-500 border-red-500 text-white',
  2: 'bg-orange-500 border-orange-500 text-white',
  3: 'bg-yellow-500 border-yellow-500 text-black',
  4: 'bg-green-500 border-green-500 text-white',
  5: 'bg-emerald-500 border-emerald-500 text-white',
}

const sizeClasses = {
  sm: 'w-8 h-8 text-lg',
  md: 'w-10 h-10 text-xl',
  lg: 'w-12 h-12 text-2xl',
}

export function MoodPicker({ value, onChange, label, size = 'md' }: MoodPickerProps) {
  return (
    <div className="space-y-2">
      {label && <label className="text-foreground text-sm font-medium">{label}</label>}
      <div className="flex items-center gap-2">
        {moodConfig.map((mood) => {
          const isSelected = value === mood.level
          return (
            <button
              key={mood.level}
              type="button"
              onClick={() => onChange(mood.level)}
              className={cn(
                'flex items-center justify-center rounded-full border-2 transition-all',
                sizeClasses[size],
                isSelected ? selectedColors[mood.level] : mood.color + ' opacity-60'
              )}
              title={mood.label}
              aria-label={mood.label}
            >
              {mood.emoji}
            </button>
          )
        })}
      </div>
      {value && (
        <p className="text-muted-foreground text-xs">
          {moodConfig.find((m) => m.level === value)?.label}
        </p>
      )}
    </div>
  )
}

export function MoodDisplay({ mood, size = 'sm' }: { mood: MoodLevel; size?: 'sm' | 'md' | 'lg' }) {
  const config = moodConfig.find((m) => m.level === mood)
  if (!config) return null

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        sizeClasses[size],
        selectedColors[mood]
      )}
      title={config.label}
    >
      {config.emoji}
    </span>
  )
}

export { moodConfig }
