<script lang="ts">
  import Pill from '@lucide/svelte/icons/pill'
  import TestTube2 from '@lucide/svelte/icons/test-tube-2'
  import TrendingUp from '@lucide/svelte/icons/trending-up'
  import Calendar from '@lucide/svelte/icons/calendar'
  import BookOpen from '@lucide/svelte/icons/book-open'
  import Target from '@lucide/svelte/icons/target'
  import Sparkles from '@lucide/svelte/icons/sparkles'

  let { onComplete }: { onComplete: () => void } = $props()

  const features = [
    {
      icon: Pill,
      title: 'Médicaments',
      description: 'Suivi des prises et du stock',
      color: 'var(--blue-deep)',
    },
    {
      icon: TestTube2,
      title: 'Analyses',
      description: 'Graphiques de tes taux hormonaux',
      color: 'var(--pink-deep)',
    },
    {
      icon: TrendingUp,
      title: 'Évolution',
      description: 'Photos et mensurations',
      color: 'var(--ok)',
    },
    {
      icon: Calendar,
      title: 'Rendez-vous',
      description: 'Calendrier de tes RDV médicaux',
      color: 'var(--gold)',
    },
    {
      icon: BookOpen,
      title: 'Journal',
      description: 'Note ton humeur et tes ressentis',
      color: 'var(--blue)',
    },
    {
      icon: Target,
      title: 'Objectifs',
      description: 'Définis et suis tes milestones',
      color: 'var(--pink)',
    },
  ]
</script>

<div class="tour">
  <div class="head">
    <div class="kicker"><Sparkles size={16} />C'est parti !</div>
    <h2>Découvre Chrysalide</h2>
    <p class="subtitle">Tout ce dont tu as besoin pour accompagner ta transition</p>
  </div>

  <div class="grid">
    {#each features as feature (feature.title)}
      <div class="feature-card">
        <div
          class="feature-icon"
          style:background={`color-mix(in srgb, ${feature.color} 16%, transparent)`}
        >
          <feature.icon size={18} color={feature.color} />
        </div>
        <p class="feature-title">{feature.title}</p>
        <p class="feature-desc">{feature.description}</p>
      </div>
    {/each}
  </div>

  <div class="footer">
    <button type="button" class="cta" onclick={onComplete}>Commencer mon suivi</button>
    <p class="wordmark">Chrysalide t'accompagne</p>
  </div>
</div>

<style>
  .tour {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 12px 0;
  }
  .head {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .kicker {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--blue-deep);
    font-size: 12.5px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  h2 {
    font-size: 20px;
    font-weight: 700;
    margin: 0;
  }
  .subtitle {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 0;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .feature-card {
    border: 1px solid var(--line);
    background: var(--bg);
    border-radius: 14px;
    padding: 14px;
  }
  .feature-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    margin-bottom: 8px;
  }
  .feature-title {
    font-size: 13px;
    font-weight: 600;
    margin: 0;
  }
  .feature-desc {
    font-size: 11px;
    color: var(--ink-soft);
    margin: 2px 0 0;
  }
  .footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding-top: 8px;
  }
  .cta {
    width: 100%;
    padding: 14px;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, var(--blue-deep), var(--pink-deep));
    color: #fff;
    font-family: inherit;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
  }
  .cta:active {
    transform: scale(0.98);
  }
  .wordmark {
    font-size: 12.5px;
    color: var(--ink-soft);
    margin: 0;
  }
</style>
