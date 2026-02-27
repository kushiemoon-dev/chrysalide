'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ArrowLeft, ChevronDown, Smartphone, Stethoscope, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { faqItems, getFAQByCategory, type FAQItem } from '@/lib/resources-data'

const categoryConfig = {
  app: {
    label: 'Application',
    icon: <Smartphone className="h-4 w-4" />,
    color: 'bg-blue-500/20 text-blue-400',
  },
  medical: {
    label: 'Médical',
    icon: <Stethoscope className="h-4 w-4" />,
    color: 'bg-pink-500/20 text-pink-400',
  },
  general: {
    label: 'Général',
    icon: <HelpCircle className="h-4 w-4" />,
    color: 'bg-purple-500/20 text-purple-400',
  },
}

function FAQItemCard({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false)
  const config = categoryConfig[item.category]

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={isOpen ? 'ring-primary/30 ring-1' : ''}>
        <CollapsibleTrigger asChild>
          <CardContent className="cursor-pointer p-4">
            <div className="flex items-start gap-3">
              <div className={`rounded-lg p-2 ${config.color} shrink-0`}>{config.icon}</div>
              <div className="min-w-0 flex-1">
                <h3 className="text-foreground text-left font-medium">{item.question}</h3>
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
              <p className="text-muted-foreground text-sm leading-relaxed">{item.answer}</p>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function FAQSection({ category, items }: { category: FAQItem['category']; items: FAQItem[] }) {
  const config = categoryConfig[category]

  if (items.length === 0) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`${config.color} border-0`}>
          {config.icon}
          <span className="ml-1">{config.label}</span>
        </Badge>
        <span className="text-muted-foreground text-sm">
          {items.length} question{items.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <FAQItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState<FAQItem['category'] | 'all'>('all')

  const categories: FAQItem['category'][] = ['app', 'medical', 'general']

  const displayedItems = selectedCategory === 'all' ? faqItems : getFAQByCategory(selectedCategory)

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
          <h1 className="text-foreground text-2xl font-bold">FAQ</h1>
          <p className="text-muted-foreground text-sm">Questions fréquentes</p>
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
          Tout
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
              {config.label}
            </Button>
          )
        })}
      </div>

      {/* Content */}
      {selectedCategory === 'all' ? (
        <div className="space-y-8">
          {categories.map((category) => (
            <FAQSection key={category} category={category} items={getFAQByCategory(category)} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {displayedItems.map((item) => (
            <FAQItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Contact */}
      <Card className="from-primary/5 bg-gradient-to-r to-pink-500/5">
        <CardContent className="space-y-2 p-4 text-center">
          <p className="text-muted-foreground text-sm">
            Vous ne trouvez pas la réponse à votre question ?
          </p>
          <p className="text-muted-foreground text-sm">
            Consultez les{' '}
            <Link href="/resources" className="text-primary hover:underline">
              ressources communautaires
            </Link>{' '}
            ou signalez un problème sur GitHub.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
