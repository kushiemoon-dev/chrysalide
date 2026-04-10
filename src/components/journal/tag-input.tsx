'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { X, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { JournalTagCategory } from '@/lib/types'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
}

// Tags prédéfinis par catégorie
export const predefinedTags: { name: string; category: JournalTagCategory }[] = [
  // Humeur
  { name: 'heureux', category: 'mood' },
  { name: 'triste', category: 'mood' },
  { name: 'anxieux', category: 'mood' },
  { name: 'calme', category: 'mood' },
  { name: 'irrité', category: 'mood' },
  { name: 'euphorique', category: 'mood' },
  // Effets secondaires
  { name: 'fatigue', category: 'side_effects' },
  { name: 'nausées', category: 'side_effects' },
  { name: 'maux de tête', category: 'side_effects' },
  { name: 'bouffées de chaleur', category: 'side_effects' },
  { name: 'sensibilité', category: 'side_effects' },
  // Énergie
  { name: "plein d'énergie", category: 'energy' },
  { name: 'énergie normale', category: 'energy' },
  { name: 'fatigué', category: 'energy' },
  { name: 'épuisé', category: 'energy' },
  // Sommeil
  { name: 'bien dormi', category: 'sleep' },
  { name: 'sommeil moyen', category: 'sleep' },
  { name: 'mal dormi', category: 'sleep' },
  { name: 'insomnie', category: 'sleep' },
  // Social
  { name: 'sortie', category: 'social' },
  { name: 'amis', category: 'social' },
  { name: 'famille', category: 'social' },
  { name: 'isolé', category: 'social' },
  { name: 'coming out', category: 'social' },
]

// Category label keys map to journal.tagCategories namespace
const categoryKeyMap: Record<JournalTagCategory, string> = {
  mood: 'mood',
  side_effects: 'sideEffects',
  energy: 'energy',
  sleep: 'sleep',
  social: 'social',
  custom: 'custom',
}

const categoryColors: Record<JournalTagCategory, string> = {
  mood: 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30',
  side_effects: 'bg-red-500/20 text-red-300 hover:bg-red-500/30',
  energy: 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30',
  sleep: 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30',
  social: 'bg-green-500/20 text-green-300 hover:bg-green-500/30',
  custom: 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30',
}

export function getTagCategory(tagName: string): JournalTagCategory {
  const predefined = predefinedTags.find((t) => t.name === tagName)
  return predefined?.category || 'custom'
}

export function TagInput({ value, onChange, placeholder, maxTags = 10 }: TagInputProps) {
  const t = useTranslations('journal')
  const defaultPlaceholder = t('tagInput.addTag')
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Filtrer les suggestions basées sur l'input
  const suggestions = predefinedTags
    .filter(
      (tag) =>
        !value.includes(tag.name) && tag.name.toLowerCase().includes(inputValue.toLowerCase())
    )
    .slice(0, 8)

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !value.includes(trimmed) && value.length < maxTags) {
      onChange([...value, trimmed])
      setInputValue('')
      setShowSuggestions(false)
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((t) => t !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Grouper les suggestions par catégorie
  const groupedSuggestions = suggestions.reduce(
    (acc, tag) => {
      if (!acc[tag.category]) acc[tag.category] = []
      acc[tag.category].push(tag)
      return acc
    },
    {} as Record<JournalTagCategory, typeof suggestions>
  )

  return (
    <div ref={containerRef} className="space-y-2">
      {/* Tags sélectionnés */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => {
            const category = getTagCategory(tag)
            return (
              <Badge
                key={tag}
                variant="secondary"
                className={cn('gap-1 pr-1', categoryColors[category])}
              >
                {t.has(`tags.${tag}`) ? t(`tags.${tag}`) : tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 rounded-full p-0.5 hover:bg-white/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}

      {/* Input avec suggestions */}
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={
            value.length >= maxTags ? t('tagInput.maxReached') : placeholder || defaultPlaceholder
          }
          disabled={value.length >= maxTags}
          className="pr-10"
        />
        {inputValue && value.length < maxTags && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
            onClick={() => addTag(inputValue)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}

        {/* Dropdown suggestions */}
        {showSuggestions && (inputValue || suggestions.length > 0) && (
          <div className="bg-background border-border absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border shadow-lg">
            {inputValue && !predefinedTags.some((t) => t.name === inputValue.toLowerCase()) && (
              <button
                type="button"
                className="hover:bg-muted/50 flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                onClick={() => addTag(inputValue)}
              >
                <Plus className="text-muted-foreground h-4 w-4" />
                <span>{t('tagInput.createTag', { tag: inputValue })}</span>
              </button>
            )}

            {Object.entries(groupedSuggestions).map(([category, tags]) => (
              <div key={category}>
                <div className="text-muted-foreground bg-muted/30 px-3 py-1 text-xs font-medium">
                  {t(`tagCategories.${categoryKeyMap[category as JournalTagCategory]}`)}
                </div>
                {tags.map((tag) => (
                  <button
                    key={tag.name}
                    type="button"
                    className="hover:bg-muted/50 w-full px-3 py-2 text-left text-sm"
                    onClick={() => addTag(tag.name)}
                  >
                    {t.has(`tags.${tag.name}`) ? t(`tags.${tag.name}`) : tag.name}
                  </button>
                ))}
              </div>
            ))}

            {suggestions.length === 0 && !inputValue && (
              <div className="text-muted-foreground px-3 py-2 text-sm">
                {t('tagInput.helpText')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function TagBadge({ tag }: { tag: string }) {
  const t = useTranslations('journal')
  const category = getTagCategory(tag)
  return (
    <Badge variant="secondary" className={cn('text-xs', categoryColors[category])}>
      {t.has(`tags.${tag}`) ? t(`tags.${tag}`) : tag}
    </Badge>
  )
}
