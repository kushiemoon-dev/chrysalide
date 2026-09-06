<script lang="ts">
  import { i18n } from '$lib/i18n.svelte'
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'
  import Smartphone from '@lucide/svelte/icons/smartphone'
  import Stethoscope from '@lucide/svelte/icons/stethoscope'
  import HelpCircle from '@lucide/svelte/icons/help-circle'

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

  const categoryConfig: Record<FAQCategory, { icon: typeof Smartphone; color: string }> = {
    app: { icon: Smartphone, color: 'var(--blue-deep)' },
    medical: { icon: Stethoscope, color: 'var(--pink-deep)' },
    general: { icon: HelpCircle, color: 'var(--gold)' },
  }

  const categories: FAQCategory[] = ['app', 'medical', 'general']

  let selectedCategory = $state<FAQCategory | 'all'>('all')

  let displayedItemIds = $derived(
    selectedCategory === 'all'
      ? categories.flatMap((cat) => faqItemIds[cat].map((id) => ({ id, category: cat })))
      : faqItemIds[selectedCategory].map((id) => ({ id, category: selectedCategory }))
  )

  const seoTitle = 'FAQ Chrysalide : confidentialité, sécurité des données et suivi HRT'
  const seoDescription =
    "Vos données sont-elles sécurisées ? Comment fonctionne le suivi hormonal ? Réponses aux questions fréquentes sur Chrysalide, l'application de suivi HRT 100% locale pour personnes trans."
  const seoUrl = 'https://chrysalide.kushie.dev/resources/faq'
  const seoImage = 'https://chrysalide.kushie.dev/og-banner.png'
</script>

<svelte:head>
  <title>{seoTitle}</title>
  <meta name="description" content={seoDescription} />
  <link rel="canonical" href={seoUrl} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={seoUrl} />
  <meta property="og:title" content={seoTitle} />
  <meta property="og:description" content={seoDescription} />
  <meta property="og:image" content={seoImage} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={seoTitle} />
  <meta name="twitter:description" content={seoDescription} />
  <meta name="twitter:image" content={seoImage} />
</svelte:head>

<div class="header">
  <a href="/resources" class="back-btn" aria-label={i18n.t('common.back')}>
    <ArrowLeft size={18} />
  </a>
  <div>
    <h1>{i18n.t('resources.faq.title')}</h1>
    <p class="subtitle">{i18n.t('resources.faq.subtitle')}</p>
  </div>
</div>

<div class="filter-row">
  <button
    type="button"
    class="filter-btn"
    class:active={selectedCategory === 'all'}
    onclick={() => (selectedCategory = 'all')}
  >
    {i18n.t('resources.faq.all')}
  </button>
  {#each categories as cat (cat)}
    {@const config = categoryConfig[cat]}
    <button
      type="button"
      class="filter-btn"
      class:active={selectedCategory === cat}
      onclick={() => (selectedCategory = cat)}
    >
      <config.icon size={14} />
      {i18n.t(`resources.faq.categoriesLabels.${cat}`)}
    </button>
  {/each}
</div>

{#if selectedCategory === 'all'}
  {#each categories as category (category)}
    {@const itemIds = faqItemIds[category]}
    {@const config = categoryConfig[category]}
    <section class="faq-section">
      <div class="section-head">
        <span
          class="category-badge"
          style:background={`color-mix(in srgb, ${config.color} 16%, transparent)`}
          style:color={config.color}
        >
          <config.icon size={13} />
          {i18n.t(`resources.faq.categoriesLabels.${category}`)}
        </span>
        <span class="count-text">
          {itemIds.length}
          {itemIds.length > 1
            ? i18n.t('resources.faq.questions')
            : i18n.t('resources.faq.question')}
        </span>
      </div>
      <div class="item-list">
        {#each itemIds as id (id)}
          {@render faqItem(id)}
        {/each}
      </div>
    </section>
  {/each}
{:else}
  <div class="item-list">
    {#each displayedItemIds as { id } (id)}
      {@render faqItem(id)}
    {/each}
  </div>
{/if}

<div class="card contact-card">
  <p class="row-desc">{i18n.t('resources.faq.helpText')}</p>
  <p class="row-desc">
    {i18n.t('resources.faq.consultPrefix')}
    <a href="/resources">{i18n.t('resources.faq.communityResources')}</a>
    {i18n.t('resources.faq.orReport')}
  </p>
</div>

{#snippet faqItem(id: string)}
  <details class="faq-item">
    <summary>{i18n.t(`resources.faq.items.${id}.q`)}</summary>
    <p class="answer">{i18n.t(`resources.faq.items.${id}.a`)}</p>
  </details>
{/snippet}

<style>
  .header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }
  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--bg);
    border: 1px solid var(--line);
    color: var(--ink);
    text-decoration: none;
    flex-shrink: 0;
  }
  h1 {
    font-size: 21px;
    font-weight: 700;
    margin: 0;
  }
  .subtitle {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 2px 0 0;
  }
  .filter-row {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    margin-bottom: 18px;
  }
  .filter-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
    padding: 7px 12px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: var(--bg);
    color: var(--ink-soft);
    font-family: inherit;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
  }
  .filter-btn.active {
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    color: #fff;
    border-color: transparent;
  }
  .faq-section {
    margin-bottom: 20px;
  }
  .section-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  .category-badge {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11.5px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 999px;
  }
  .count-text {
    font-size: 12px;
    color: var(--ink-soft);
  }
  .item-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .faq-item {
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 4px 14px;
  }
  .faq-item summary {
    padding: 10px 0;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    list-style: none;
  }
  .faq-item summary::-webkit-details-marker {
    display: none;
  }
  .answer {
    font-size: 12.5px;
    line-height: 1.5;
    color: var(--ink-soft);
    border-left: 2px solid color-mix(in srgb, var(--blue-deep) 30%, transparent);
    margin: 0 0 12px;
    padding-left: 12px;
  }
  .row-desc {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 0 0 6px;
  }
  .card {
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 16px;
  }
  .contact-card {
    text-align: center;
    margin-top: 8px;
  }
  .contact-card a {
    color: var(--blue-deep);
    text-decoration: underline;
  }
</style>
