'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { User, Plus, MapPin, Phone, Star } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { searchPractitioners, getPractitioners } from '@/lib/db'
import { useTranslations } from 'next-intl'
import type { Practitioner, AppointmentType } from '@/lib/types'
import { APPOINTMENT_TYPES } from '@/lib/constants'

interface PractitionerInputProps {
  value: string
  onChange: (name: string, practitionerId?: number) => void
  onSelect?: (practitioner: Practitioner) => void
  specialty?: AppointmentType
  placeholder?: string
  className?: string
}

/**
 * Input avec autocomplete pour les praticien·nes
 * Suggère les praticien·nes existant·es et permet d'en créer de nouveaux
 */
export function PractitionerInput({
  value,
  onChange,
  onSelect,
  specialty,
  placeholder = 'Nom du/de la praticien·ne...',
  className,
}: PractitionerInputProps) {
  const t = useTranslations('appointments')
  const [inputValue, setInputValue] = useState(value)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<Practitioner[]>([])
  const [recentPractitioners, setRecentPractitioners] = useState<Practitioner[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync input value with prop
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Load recent practitioners when specialty changes
  useEffect(() => {
    async function loadRecent() {
      const recent = await getPractitioners(specialty)
      setRecentPractitioners(recent.slice(0, 5))
    }
    loadRecent()
  }, [specialty])

  // Search practitioners on input change
  const searchDebounced = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSuggestions([])
        return
      }

      setLoading(true)
      try {
        const results = await searchPractitioners(query, specialty)
        setSuggestions(results)
      } finally {
        setLoading(false)
      }
    },
    [specialty]
  )

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchDebounced(inputValue)
    }, 200)

    return () => clearTimeout(timer)
  }, [inputValue, searchDebounced])

  const selectPractitioner = (practitioner: Practitioner) => {
    setInputValue(practitioner.name)
    onChange(practitioner.name, practitioner.id)
    // Appeler onSelect avec le praticien complet pour l'auto-remplissage
    if (onSelect) {
      onSelect(practitioner)
    }
    setShowSuggestions(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue, undefined) // No ID when typing manually
    setShowSuggestions(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault()
      onChange(inputValue, undefined)
      setShowSuggestions(false)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Show recent or search results
  const displaySuggestions = inputValue.length >= 2 ? suggestions : recentPractitioners
  const showRecent = inputValue.length < 2 && recentPractitioners.length > 0
  const showCreateOption =
    inputValue.length >= 2 &&
    !suggestions.some((p) => p.name.toLowerCase() === inputValue.toLowerCase())

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <User className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>

      {/* Dropdown suggestions */}
      {showSuggestions && (displaySuggestions.length > 0 || showCreateOption || showRecent) && (
        <div className="bg-background border-border absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border shadow-lg">
          {/* Recent practitioners header */}
          {showRecent && (
            <div className="text-muted-foreground bg-muted/30 border-border border-b px-3 py-1.5 text-xs font-medium">
              Praticien·nes récent·es
            </div>
          )}

          {/* Search results header */}
          {inputValue.length >= 2 && suggestions.length > 0 && (
            <div className="text-muted-foreground bg-muted/30 border-border border-b px-3 py-1.5 text-xs font-medium">
              {loading
                ? 'Recherche...'
                : `${suggestions.length} résultat${suggestions.length > 1 ? 's' : ''}`}
            </div>
          )}

          {/* Create new option */}
          {showCreateOption && (
            <button
              type="button"
              className="hover:bg-muted/50 border-border flex w-full items-center gap-2 border-b px-3 py-2.5 text-left text-sm"
              onClick={() => {
                onChange(inputValue, undefined)
                setShowSuggestions(false)
              }}
            >
              <Plus className="text-primary h-4 w-4" />
              <span>Ajouter &quot;{inputValue}&quot;</span>
            </button>
          )}

          {/* Practitioner list */}
          {displaySuggestions.map((practitioner) => (
            <button
              key={practitioner.id}
              type="button"
              className="hover:bg-muted/50 flex w-full items-start gap-3 px-3 py-2.5 text-left"
              onClick={() => selectPractitioner(practitioner)}
            >
              <div className="bg-muted shrink-0 rounded-lg p-1.5">
                <User className="text-muted-foreground h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-foreground truncate text-sm font-medium">
                    {practitioner.name}
                  </span>
                  {practitioner.isTransFriendly && (
                    <Star className="h-3 w-3 shrink-0 fill-yellow-500 text-yellow-500" />
                  )}
                </div>
                <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
                  <span>{t('types.' + practitioner.specialty)}</span>
                  {practitioner.location && (
                    <>
                      <span className="text-border">•</span>
                      <span className="flex items-center gap-0.5 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {practitioner.location}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </button>
          ))}

          {/* Empty state */}
          {inputValue.length >= 2 && suggestions.length === 0 && !loading && (
            <div className="text-muted-foreground px-3 py-4 text-center text-sm">
              Aucun·e praticien·ne trouvé·e
            </div>
          )}
        </div>
      )}
    </div>
  )
}
