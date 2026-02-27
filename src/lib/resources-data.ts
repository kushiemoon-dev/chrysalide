/**
 * Ressources communautaires trans - Données statiques
 * Pour Chrysalide v0.2.0
 */

import { fuzzySearch } from './utils'

export type ResourceCategory =
  | 'community' // Communauté et entraide
  | 'medical' // Santé et médical
  | 'legal' // Démarches administratives et légales
  | 'support' // Soutien psychologique
  | 'information' // Information générale

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
  location?: string // Si ressource locale
}

export interface FAQItem {
  id: string
  question: string
  answer: string
  category: 'app' | 'medical' | 'general'
}

// === RESSOURCES COMMUNAUTAIRES ===

export const resources: Resource[] = [
  // Communauté
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

  // Médical
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

  // Légal / Administratif
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

  // Soutien psychologique
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

  // Information internationale
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

// === FAQ APPLICATION ===

export const faqItems: FAQItem[] = [
  // Application
  {
    id: 'app-data-privacy',
    question: 'Mes données sont-elles sécurisées ?',
    answer:
      "Oui, toutes vos données sont stockées uniquement sur votre appareil (IndexedDB). Rien n'est envoyé sur un serveur. Vous avez le contrôle total de vos informations personnelles. Pensez à faire des sauvegardes régulières via la fonction Export dans les paramètres.",
    category: 'app',
  },
  {
    id: 'app-offline',
    question: "L'application fonctionne-t-elle hors ligne ?",
    answer:
      'Oui ! Chrysalide est une PWA (Progressive Web App) qui fonctionne entièrement hors ligne une fois installée. Toutes les fonctionnalités sont disponibles sans connexion internet.',
    category: 'app',
  },
  {
    id: 'app-backup',
    question: 'Comment sauvegarder mes données ?',
    answer:
      'Allez dans Paramètres > Exporter les données. Un fichier JSON contenant toutes vos données sera téléchargé. Conservez-le en lieu sûr. Pour restaurer, utilisez la fonction Importer dans les paramètres.',
    category: 'app',
  },
  {
    id: 'app-install',
    question: "Comment installer l'application sur mon téléphone ?",
    answer:
      'Sur Android (Chrome) : Menu ⋮ > "Installer l\'application" ou "Ajouter à l\'écran d\'accueil". Sur iOS (Safari) : Bouton Partager > "Sur l\'écran d\'accueil". L\'app sera disponible comme une application native.',
    category: 'app',
  },
  {
    id: 'app-notifications',
    question: 'Comment activer les rappels de médicaments ?',
    answer:
      "Allez dans Paramètres > Notifications et activez les rappels. Assurez-vous d'autoriser les notifications dans votre navigateur. Les rappels fonctionnent même quand l'app est fermée (si installée en PWA).",
    category: 'app',
  },
  {
    id: 'app-delete-data',
    question: 'Comment supprimer toutes mes données ?',
    answer:
      'Allez dans Paramètres > Supprimer toutes les données. Cette action est irréversible. Pensez à exporter vos données avant si vous souhaitez les conserver.',
    category: 'app',
  },

  // Médical
  {
    id: 'med-ranges',
    question: 'Que signifient les plages de référence sur les graphiques ?',
    answer:
      "Les zones colorées sur les graphiques d'analyses représentent les plages cibles pour un THS. Les valeurs dans la zone verte sont généralement optimales. Ces plages sont indicatives - seul·e votre médecin peut interpréter vos résultats dans votre contexte personnel.",
    category: 'medical',
  },
  {
    id: 'med-tracking',
    question: 'Pourquoi suivre mes prises de médicaments ?',
    answer:
      'Le suivi permet de : 1) Ne pas oublier de prises, 2) Avoir un historique précis pour vos RDV médicaux, 3) Identifier des patterns (oublis récurrents, effets secondaires), 4) Gérer votre stock et anticiper les renouvellements.',
    category: 'medical',
  },
  {
    id: 'med-not-advice',
    question: 'Cette application remplace-t-elle un suivi médical ?',
    answer:
      "Non, absolument pas. Chrysalide est un outil de suivi personnel, pas un conseil médical. Consultez toujours un·e professionnel·le de santé pour vos décisions médicales. L'app vous aide à organiser vos informations pour vos RDV.",
    category: 'medical',
  },

  // Général
  {
    id: 'gen-name',
    question: 'Pourquoi le nom "Chrysalide" ?',
    answer:
      "La chrysalide est le cocon dans lequel la chenille se transforme en papillon. C'est une métaphore de la transition : un espace protégé de transformation personnelle. Le papillon qui en émerge symbolise l'épanouissement.",
    category: 'general',
  },
  {
    id: 'gen-contribute',
    question: 'Comment puis-je contribuer au projet ?',
    answer:
      'Chrysalide est un projet open source. Vous pouvez contribuer via GitHub : signaler des bugs, proposer des fonctionnalités, améliorer le code ou la documentation. Tout retour est précieux !',
    category: 'general',
  },
  {
    id: 'gen-support',
    question: "J'ai besoin d'aide urgente, que faire ?",
    answer:
      "Si vous êtes en détresse, contactez une ligne d'écoute (voir Ressources > Soutien). En cas d'urgence médicale, appelez le 15 (SAMU) ou le 112. Vous n'êtes pas seul·e.",
    category: 'general',
  },
]

// === HELPERS ===

export const categoryLabels: Record<ResourceCategory, string> = {
  community: 'Communauté',
  medical: 'Médical',
  legal: 'Légal & Administratif',
  support: 'Soutien',
  information: 'Information',
}

export const categoryIcons: Record<ResourceCategory, string> = {
  community: 'Users',
  medical: 'Stethoscope',
  legal: 'Scale',
  support: 'Heart',
  information: 'BookOpen',
}

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

export function getFAQByCategory(category: FAQItem['category']): FAQItem[] {
  return faqItems.filter((f) => f.category === category)
}
