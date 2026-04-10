'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ArrowLeft, ChevronDown, Smartphone, Stethoscope, HelpCircle } from 'lucide-react'
import Link from 'next/link'

type FAQCategory = 'app' | 'medical' | 'general'

const faqItemIds: Record<FAQCategory, string[]> = {
  app: [
    'app-data-privacy',
    'app-offline',
    'app-backup',
    'app-install',
    'app-notifications',
    'app-delete-data',
  ],
  medical: ['med-ranges', 'med-tracking', 'med-not-advice'],
  general: ['gen-name', 'gen-contribute', 'gen-support'],
}

const categoryConfig: Record<FAQCategory, { icon: React.ReactNode; color: string }> = {
  app: {
    icon: <Smartphone className="h-4 w-4" />,
    color: 'bg-blue-500/20 text-blue-400',
  },
  medical: {
    icon: <Stethoscope className="h-4 w-4" />,
    color: 'bg-pink-500/20 text-pink-400',
  },
  general: {
    icon: <HelpCircle className="h-4 w-4" />,
    color: 'bg-purple-500/20 text-purple-400',
  },
}

function FAQItemCard({
  id,
  category,
  t,
}: {
  id: string
  category: FAQCategory
  t: ReturnType<typeof useTranslations<'resources'>>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const config = categoryConfig[category]

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={isOpen ? 'ring-primary/30 ring-1' : ''}>
        <CollapsibleTrigger asChild>
          <CardContent className="cursor-pointer p-4">
            <div className="flex items-start gap-3">
              <div className={`rounded-lg p-2 ${config.color} shrink-0`}>{config.icon}</div>
              <div className="min-w-0 flex-1">
                <h3 className="text-foreground text-left font-medium">{t(`faq.items.${id}.q`)}</h3>
              </div>
              <ChevronDown
                className={`text-muted-foreground h-5 w-5 shrink-0 transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pt-0 pb-4">
            <div className="border-primary/20 ml-4 border-l-2 pl-12">
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t(`faq.items.${id}.a`)}
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function FAQSection({
  category,
  itemIds,
  t,
}: {
  category: FAQCategory
  itemIds: string[]
  t: ReturnType<typeof useTranslations<'resources'>>
}) {
  const config = categoryConfig[category]

  if (itemIds.length === 0) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`${config.color} border-0`}>
          {config.icon}
          <span className="ml-1">{t(`faq.categoriesLabels.${category}`)}</span>
        </Badge>
        <span className="text-muted-foreground text-sm">
          {itemIds.length} {itemIds.length > 1 ? t('faq.questions') : t('faq.question')}
        </span>
      </div>
      <div className="space-y-2">
        {itemIds.map((id) => (
          <FAQItemCard key={id} id={id} category={category} t={t} />
        ))}
      </div>
    </section>
  )
}

export default function FAQPage() {
  const t = useTranslations('resources')
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | 'all'>('all')

  const categories: FAQCategory[] = ['app', 'medical', 'general']

  const displayedItemIds =
    selectedCategory === 'all'
      ? categories.flatMap((cat) => faqItemIds[cat].map((id) => ({ id, category: cat })))
      : faqItemIds[selectedCategory].map((id) => ({ id, category: selectedCategory }))

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link href="/resources">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t('faq.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('faq.subtitle')}</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
          className="shrink-0"
        >
          {t('faq.all')}
        </Button>
        {categories.map((cat) => {
          const config = categoryConfig[cat]
          return (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="shrink-0 gap-1"
            >
              {config.icon}
              {t(`faq.categoriesLabels.${cat}`)}
            </Button>
          )
        })}
      </div>

      {/* Content */}
      {selectedCategory === 'all' ? (
        <div className="space-y-8">
          {categories.map((category) => (
            <FAQSection key={category} category={category} itemIds={faqItemIds[category]} t={t} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {displayedItemIds.map(({ id, category }) => (
            <FAQItemCard key={id} id={id} category={category} t={t} />
          ))}
        </div>
      )}

      {/* Contact */}
      <Card className="from-primary/5 bg-gradient-to-r to-pink-500/5">
        <CardContent className="space-y-2 p-4 text-center">
          <p className="text-muted-foreground text-sm">{t('faq.helpText')}</p>
          <p className="text-muted-foreground text-sm">
            {t('faq.consultPrefix')}{' '}
            <Link href="/resources" className="text-primary hover:underline">
              {t('faq.communityResources')}
            </Link>{' '}
            {t('faq.orReport')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
