import type { MoodLevel } from '$lib/types'

export const MOOD_LEVELS: MoodLevel[] = [1, 2, 3, 4, 5]

export const MOOD_EMOJI: Record<MoodLevel, string> = {
  1: '😢',
  2: '😔',
  3: '😐',
  4: '🙂',
  5: '😊',
}

export const MOOD_COLOR: Record<MoodLevel, string> = {
  1: 'var(--alert)',
  2: 'var(--watch)',
  3: 'var(--gold)',
  4: 'var(--ok)',
  5: 'var(--blue-deep)',
}
