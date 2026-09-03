import type { JournalTagCategory } from '$lib/types'

export const PREDEFINED_TAGS: { name: string; category: JournalTagCategory }[] = [
  { name: 'heureux', category: 'mood' },
  { name: 'triste', category: 'mood' },
  { name: 'anxieux', category: 'mood' },
  { name: 'calme', category: 'mood' },
  { name: 'irrité', category: 'mood' },
  { name: 'euphorique', category: 'mood' },
  { name: 'fatigue', category: 'side_effects' },
  { name: 'nausées', category: 'side_effects' },
  { name: 'maux de tête', category: 'side_effects' },
  { name: 'bouffées de chaleur', category: 'side_effects' },
  { name: 'sensibilité', category: 'side_effects' },
  { name: "plein d'énergie", category: 'energy' },
  { name: 'énergie normale', category: 'energy' },
  { name: 'fatigué', category: 'energy' },
  { name: 'épuisé', category: 'energy' },
  { name: 'bien dormi', category: 'sleep' },
  { name: 'sommeil moyen', category: 'sleep' },
  { name: 'mal dormi', category: 'sleep' },
  { name: 'insomnie', category: 'sleep' },
  { name: 'sortie', category: 'social' },
  { name: 'amis', category: 'social' },
  { name: 'famille', category: 'social' },
  { name: 'isolé', category: 'social' },
  { name: 'coming out', category: 'social' },
]

export const TAG_CATEGORY_KEY: Record<JournalTagCategory, string> = {
  mood: 'mood',
  side_effects: 'sideEffects',
  energy: 'energy',
  sleep: 'sleep',
  social: 'social',
  custom: 'custom',
}

export const TAG_CATEGORY_COLOR: Record<JournalTagCategory, string> = {
  mood: 'var(--pink-deep)',
  side_effects: 'var(--alert)',
  energy: 'var(--gold)',
  sleep: 'var(--blue-deep)',
  social: 'var(--ok)',
  custom: 'var(--ink-soft)',
}

export function getTagCategory(name: string): JournalTagCategory {
  return PREDEFINED_TAGS.find((t) => t.name === name)?.category ?? 'custom'
}

export function isPredefinedTag(name: string): boolean {
  return PREDEFINED_TAGS.some((t) => t.name === name)
}
