/**
 * Trans community resources: static data
 * For Chrysalide v0.2.0
 */

import { fuzzySearch } from './utils'

export type ResourceCategory =
  | 'community' // Community and mutual aid
  | 'medical' // Health and medical
  | 'legal' // Administrative and legal procedures
  | 'support' // Psychological support
  | 'information' // General information

export interface Resource {
  id: string
  name: string
  description: string
  url: string
  category: ResourceCategory
  tags: string[]
  language: 'fr' | 'en' | 'multi'
  isFree: boolean
  isOnline: boolean
  location?: string // If the resource is local
}

// === COMMUNITY RESOURCES ===

export const resources: Resource[] = [
  // Community
  {
    id: 'partagenre',
    name: 'Partagenre',
    description:
      'Forum francophone historique de la communauté trans. Discussions, témoignages, conseils et soutien entre pairs.',
    url: 'https://partagenre.fransgenre.fr/',
    category: 'community',
    tags: ['forum', 'communauté', 'témoignages', 'entraide'],
    language: 'fr',
    isFree: true,
    isOnline: true,
  },
  {
    id: 'wiki-trans',
    name: 'Wiki Trans',
    description:
      'Wiki collaboratif avec des informations complètes sur les parcours trans en France : médical, administratif, social.',
    url: 'https://wikitrans.co',
    category: 'information',
    tags: ['wiki', 'information', 'parcours', 'guide'],
    language: 'fr',
    isFree: true,
    isOnline: true,
  },
  {
    id: 'carte-associations',
    name: 'Carte des associations trans',
    description:
      'Carte collaborative des associations trans en France. Trouvez des groupes de soutien et associations près de chez vous.',
    url: 'https://wikitrans.co/carte/',
    category: 'community',
    tags: ['associations', 'carte', 'groupes', 'local'],
    language: 'fr',
    isFree: true,
    isOnline: true,
  },
  {
    id: 'fransgenre',
    name: 'Fransgenre',
    description:
      'Association nationale trans et intersexe. Ressources, accompagnement et plaidoyer pour les droits des personnes trans.',
    url: 'https://fransgenre.fr',
    category: 'community',
    tags: ['association', 'droits', 'plaidoyer', 'national'],
    language: 'fr',
    isFree: true,
    isOnline: true,
  },

  // Medical
  {
    id: 'sofect-alternatives',
    name: 'Parcours libres (hors SOFeRT)',
    description:
      'Informations sur les parcours de transition médicale en dehors des équipes hospitalières officielles.',
    url: 'https://wikitrans.co/2019/08/10/hormones-et-parcours-medical/',
    category: 'medical',
    tags: ['THS', 'parcours', 'médecins', 'hormones'],
    language: 'fr',
    isFree: true,
    isOnline: true,
  },
  {
    id: 'ths-feminisant',
    name: 'Guide THS féminisant',
    description:
      'Informations détaillées sur le traitement hormonal féminisant : molécules, dosages, effets, suivi.',
    url: 'https://wikitrans.co/ths/fem',
    category: 'medical',
    tags: ['THS', 'hormones', 'féminisant', 'oestrogènes'],
    language: 'fr',
    isFree: true,
    isOnline: true,
  },
  {
    id: 'ths-masculinisant',
    name: 'Guide THS masculinisant',
    description:
      'Informations détaillées sur le traitement hormonal masculinisant : testostérone, effets, suivi médical.',
    url: 'https://wikitrans.co/ths/masc',
    category: 'medical',
    tags: ['THS', 'hormones', 'masculinisant', 'testostérone'],
    language: 'fr',
    isFree: true,
    isOnline: true,
  },

  // Legal / Administrative
  {
    id: 'administrans',
    name: 'Administrans',
    description:
      "Guide complet des démarches administratives : changement d'état civil, prénom, mention de sexe.",
    url: 'https://administrans.fr',
    category: 'legal',
    tags: ['administratif', 'état civil', 'prénom', 'CEC'],
    language: 'fr',
    isFree: true,
    isOnline: true,
  },
  {
    id: 'cec-guide',
    name: "Changement d'état civil (CEC)",
    description:
      "Procédure détaillée pour le changement de la mention de sexe à l'état civil en France.",
    url: 'https://wikitrans.co/2019/11/26/changement-de-sexe-a-letat-civil-tgi/',
    category: 'legal',
    tags: ['CEC', 'état civil', 'tribunal', 'procédure'],
    language: 'fr',
    isFree: true,
    isOnline: true,
  },
  {
    id: 'droits-travail',
    name: 'Droits au travail',
    description:
      'Ressources sur les droits des personnes trans au travail : discrimination, transition en entreprise, guides pour RH.',
    url: 'https://partagenre.fransgenre.fr/tags/emploi',
    category: 'legal',
    tags: ['travail', 'droits', 'discrimination', 'entreprise'],
    language: 'fr',
    isFree: true,
    isOnline: true,
  },

  // Psychological support
  {
    id: 'ligne-ecoute',
    name: 'Ressources pour les proches',
    description:
      'Guides et ressources pour les proches de personnes trans. Soutien, conseils et informations pratiques.',
    url: 'https://wikitrans.co/hp-proches/',
    category: 'support',
    tags: ['proches', 'famille', 'soutien', 'guides'],
    language: 'fr',
    isFree: true,
    isOnline: true,
  },
  {
    id: 'trans-posez',
    name: 'Trans-Posez',
    description:
      "Association d'entraide entre personnes trans. Groupes de parole, activités, soutien par les pairs.",
    url: 'https://www.facebook.com/transposez',
    category: 'support',
    tags: ['association', 'groupes', 'parole', 'entraide'],
    language: 'fr',
    isFree: true,
    isOnline: true,
  },

  // International information
  {
    id: 'transfemscience',
    name: 'Transfeminine Science',
    description:
      'Ressource scientifique anglophone sur les THS féminisants. Articles détaillés, recherches, données.',
    url: 'https://transfemscience.org',
    category: 'medical',
    tags: ['science', 'recherche', 'THS', 'données'],
    language: 'en',
    isFree: true,
    isOnline: true,
  },
  {
    id: 'folx-health',
    name: 'FOLX Health (US)',
    description:
      'Ressources éducatives sur la santé trans. Bien que basé aux US, contient des informations médicales utiles.',
    url: 'https://www.folxhealth.com/library',
    category: 'medical',
    tags: ['santé', 'éducation', 'US', 'THS'],
    language: 'en',
    isFree: true,
    isOnline: true,
  },
]

// === HELPERS ===

export const categoryColors: Record<ResourceCategory, string> = {
  community: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  medical: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  legal: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  support: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  information: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
}

export function getResourcesByCategory(category: ResourceCategory): Resource[] {
  return resources.filter((r) => r.category === category)
}

export function searchResources(query: string): Resource[] {
  return resources.filter(
    (r) =>
      fuzzySearch(r.name, query) ||
      fuzzySearch(r.description, query) ||
      r.tags.some((t) => fuzzySearch(t, query))
  )
}
