'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Users,
  Stethoscope,
  Scale,
  Heart,
  BookOpen,
  ExternalLink,
  Search,
  HelpCircle,
  ChevronRight,
  Globe,
} from 'lucide-react'
import Link from 'next/link'
import {
  resources,
  categoryColors,
  getResourcesByCategory,
  searchResources,
  type Resource,
  type ResourceCategory,
} from '@/lib/resources-data'

const categoryIconMap: Record<ResourceCategory, React.ReactNode> = {
  community: <Users className="h-5 w-5" />,
  medical: <Stethoscope className="h-5 w-5" />,
  legal: <Scale className="h-5 w-5" />,
  support: <Heart className="h-5 w-5" />,
  information: <BookOpen className="h-5 w-5" />,
}

function ResourceCard({
  resource,
  t,
}: {
  resource: Resource
  t: ReturnType<typeof useTranslations<'resources'>>
}) {
  return (
    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="block">
      <Card className="hover:bg-muted/30 h-full cursor-pointer transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-foreground truncate font-medium">
                  {t(`items.${resource.id}.name`)}
                </h3>
                {resource.language !== 'fr' && (
                  <Badge variant="outline" className="shrink-0 text-xs">
                    <Globe className="mr-1 h-3 w-3" />
                    {resource.language.toUpperCase()}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground line-clamp-2 text-sm">
                {t(`items.${resource.id}.description`)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {resource.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <ExternalLink className="text-muted-foreground mt-1 h-4 w-4 shrink-0" />
          </div>
        </CardContent>
      </Card>
    </a>
  )
}

function CategorySection({
  category,
  categoryLabel,
  t,
}: {
  category: ResourceCategory
  categoryLabel: string
  t: ReturnType<typeof useTranslations<'resources'>>
}) {
  const categoryResources = getResourcesByCategory(category)

  if (categoryResources.length === 0) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`rounded-lg p-2 ${categoryColors[category].split(' ')[0]}`}>
          <span className={categoryColors[category].split(' ')[1]}>
            {categoryIconMap[category]}
          </span>
        </div>
        <h2 className="text-foreground font-semibold">{categoryLabel}</h2>
        <Badge variant="outline" className="ml-auto">
          {categoryResources.length}
        </Badge>
      </div>
      <div className="grid gap-3">
        {categoryResources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} t={t} />
        ))}
      </div>
    </section>
  )
}

export default function ResourcesPage() {
  const t = useTranslations('resources')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'all'>('all')

  const filteredResources = searchQuery
    ? searchResources(searchQuery)
    : selectedCategory === 'all'
      ? resources
      : getResourcesByCategory(selectedCategory)

  const categories: ResourceCategory[] = ['community', 'medical', 'legal', 'support', 'information']

  return (
    <div className="space-y-6 p-4 pb-24">
      <div className="pt-2">
        <h1 className="text-foreground text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category Filter */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
          className="shrink-0"
        >
          {t('all')}
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedCategory(cat)
              setSearchQuery('')
            }}
            className="shrink-0 gap-1"
          >
            {categoryIconMap[cat]}
            <span className="hidden sm:inline">{t(`categories.${cat}`)}</span>
          </Button>
        ))}
      </div>

      {/* FAQ Link */}
      <Link href="/resources/faq">
        <Card className="hover:bg-muted/30 from-primary/5 cursor-pointer bg-gradient-to-r to-pink-500/5 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-lg p-2">
                  <HelpCircle className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground font-medium">{t('faqCard')}</p>
                  <p className="text-muted-foreground text-sm">{t('faqCardDesc')}</p>
                </div>
              </div>
              <ChevronRight className="text-muted-foreground h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Content */}
      {searchQuery || selectedCategory !== 'all' ? (
        // Search/filter results
        <section className="space-y-3">
          <p className="text-muted-foreground text-sm">
            {filteredResources.length !== 1
              ? t('resultsCount', { count: filteredResources.length })
              : t('resultCount', { count: filteredResources.length })}
            {searchQuery && ` ${t('for')} "${searchQuery}"`}
          </p>
          <div className="grid gap-3">
            {filteredResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} t={t} />
            ))}
          </div>
          {filteredResources.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="text-muted-foreground/50 mx-auto mb-3 h-12 w-12" />
                <p className="text-muted-foreground">{t('noResults')}</p>
              </CardContent>
            </Card>
          )}
        </section>
      ) : (
        // All categories
        <div className="space-y-8">
          {categories.map((category) => (
            <CategorySection
              key={category}
              category={category}
              categoryLabel={t(`categories.${category}`)}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <p className="text-muted-foreground text-xs">{t('disclaimer')}</p>
        </CardContent>
      </Card>
    </div>
  )
}
