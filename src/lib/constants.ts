/**
 * Constantes pour Chrysalide
 * Médicaments THS courants, plages de référence, unités
 */

import type {
  MedicationType,
  AdministrationMethod,
  BloodMarker,
  ReferenceRange,
  PillAdministrationRoute,
  InjectionAdministrationRoute,
  GelApplicationZone,
} from './types'

// === MEDICATION TYPES ===

export const MEDICATION_TYPES: Record<MedicationType, { label: string; color: string }> = {
  estrogen: { label: 'Œstrogène', color: '#F5A9B8' }, // Trans pink
  antiandrogen: { label: 'Anti-androgène', color: '#5BCEFA' }, // Trans blue
  progesteron: { label: 'Progestérone', color: '#E8A0BF' },
  testosterone: { label: 'Testostérone', color: '#5BCEFA' },
  gnrh: { label: 'Agoniste GnRH', color: '#91DEFF' },
  other: { label: 'Autre', color: '#9CA3AF' },
}

export const ADMINISTRATION_METHODS: Record<AdministrationMethod, string> = {
  pill: 'Comprimé',
  injection: 'Injection',
  patch: 'Patch',
  gel: 'Gel',
  implant: 'Implant',
}

// Routes d'administration spécifiques
export const PILL_ROUTES: Record<PillAdministrationRoute, string> = {
  oral: 'Oral',
  sublingual: 'Sublingual',
  vaginal: 'Vaginal',
  rectal: 'Rectal',
}

export const INJECTION_ROUTES: Record<InjectionAdministrationRoute, string> = {
  subcutaneous: 'Sous-cutané (SC)',
  intramuscular: 'Intra-musculaire (IM)',
}

// Zones d'application gel
export const GEL_APPLICATION_ZONES: Record<GelApplicationZone, string> = {
  forearm_left: 'Avant-bras gauche',
  forearm_right: 'Avant-bras droit',
  inner_thigh_left: 'Intérieur cuisse gauche',
  inner_thigh_right: 'Intérieur cuisse droite',
  scrotal: 'Scrotale',
}

// === COMMON MEDICATIONS ===

export interface CommonMedication {
  name: string
  type: MedicationType
  defaultDosage: number
  defaultUnit: string
  method: AdministrationMethod
  frequency: string
}

export const COMMON_MEDICATIONS: CommonMedication[] = [
  // Œstrogènes
  {
    name: 'Œstradiol (Estrofem)',
    type: 'estrogen',
    defaultDosage: 2,
    defaultUnit: 'mg',
    method: 'pill',
    frequency: '2x/jour',
  },
  {
    name: 'Œstradiol (Progynova)',
    type: 'estrogen',
    defaultDosage: 2,
    defaultUnit: 'mg',
    method: 'pill',
    frequency: '2x/jour',
  },
  {
    name: 'Œstrogel',
    type: 'estrogen',
    defaultDosage: 2,
    defaultUnit: 'pressions',
    method: 'gel',
    frequency: '1x/jour',
  },
  {
    name: 'Estraderm TTS',
    type: 'estrogen',
    defaultDosage: 100,
    defaultUnit: 'µg',
    method: 'patch',
    frequency: '2x/semaine',
  },
  {
    name: "Valérate d'œstradiol (EV)",
    type: 'estrogen',
    defaultDosage: 5,
    defaultUnit: 'mg',
    method: 'injection',
    frequency: '1x/semaine',
  },
  {
    name: "Cypionate d'œstradiol (EC)",
    type: 'estrogen',
    defaultDosage: 5,
    defaultUnit: 'mg',
    method: 'injection',
    frequency: '1x/2semaines',
  },
  {
    name: "Énanthate d'estradiol (EEn)",
    type: 'estrogen',
    defaultDosage: 5,
    defaultUnit: 'mg',
    method: 'injection',
    frequency: '1x/5jours',
  },
  {
    name: "Undécylate d'estradiol (EUn)",
    type: 'estrogen',
    defaultDosage: 40,
    defaultUnit: 'mg',
    method: 'injection',
    frequency: '1x/mois',
  },
  {
    name: 'Provames',
    type: 'estrogen',
    defaultDosage: 2,
    defaultUnit: 'mg',
    method: 'pill',
    frequency: '2x/jour',
  },
  {
    name: 'Oestrodose',
    type: 'estrogen',
    defaultDosage: 2,
    defaultUnit: 'pressions',
    method: 'gel',
    frequency: '1x/jour',
  },
  {
    name: 'Estreva',
    type: 'estrogen',
    defaultDosage: 1.5,
    defaultUnit: 'mg',
    method: 'gel',
    frequency: '1x/jour',
  },

  // Anti-androgènes
  {
    name: 'Spironolactone',
    type: 'antiandrogen',
    defaultDosage: 100,
    defaultUnit: 'mg',
    method: 'pill',
    frequency: '2x/jour',
  },
  {
    name: 'Acétate de cyprotérone (Androcur)',
    type: 'antiandrogen',
    defaultDosage: 12.5,
    defaultUnit: 'mg',
    method: 'pill',
    frequency: '1x/jour',
  },
  {
    name: 'Bicalutamide',
    type: 'antiandrogen',
    defaultDosage: 50,
    defaultUnit: 'mg',
    method: 'pill',
    frequency: '1x/jour',
  },

  // Progestérone
  {
    name: 'Progestérone (Utrogestan)',
    type: 'progesteron',
    defaultDosage: 100,
    defaultUnit: 'mg',
    method: 'pill',
    frequency: '1x/jour (soir)',
  },
  {
    name: 'Progestérone micronisée',
    type: 'progesteron',
    defaultDosage: 200,
    defaultUnit: 'mg',
    method: 'pill',
    frequency: '1x/jour (soir)',
  },

  // Testostérone (THS masculinisant)
  {
    name: 'Testostérone (Androgel)',
    type: 'testosterone',
    defaultDosage: 50,
    defaultUnit: 'mg',
    method: 'gel',
    frequency: '1x/jour',
  },
  {
    name: 'Énanthate de testostérone',
    type: 'testosterone',
    defaultDosage: 250,
    defaultUnit: 'mg',
    method: 'injection',
    frequency: '1x/2semaines',
  },
  {
    name: 'Cypionate de testostérone',
    type: 'testosterone',
    defaultDosage: 100,
    defaultUnit: 'mg',
    method: 'injection',
    frequency: '1x/semaine',
  },
  {
    name: 'Undécanoate de testostérone (Nebido)',
    type: 'testosterone',
    defaultDosage: 1000,
    defaultUnit: 'mg',
    method: 'injection',
    frequency: '1x/12semaines',
  },

  // GnRH
  {
    name: 'Décapeptyl',
    type: 'gnrh',
    defaultDosage: 3,
    defaultUnit: 'mg',
    method: 'injection',
    frequency: '1x/mois',
  },
  {
    name: 'Lupron',
    type: 'gnrh',
    defaultDosage: 3.75,
    defaultUnit: 'mg',
    method: 'injection',
    frequency: '1x/mois',
  },
]

// === BLOOD MARKERS ===

export const BLOOD_MARKERS: Record<
  BloodMarker,
  { label: string; unit: string; description: string }
> = {
  estradiol: {
    label: 'Œstradiol (E2)',
    unit: 'pg/mL',
    description: 'Hormone principale pour la féminisation',
  },
  testosterone: {
    label: 'Testostérone (T)',
    unit: 'ng/mL',
    description: 'Hormone principale pour la masculinisation',
  },
  lh: { label: 'LH', unit: 'UI/L', description: 'Hormone lutéinisante' },
  fsh: { label: 'FSH', unit: 'UI/L', description: 'Hormone folliculo-stimulante' },
  prolactin: { label: 'Prolactine', unit: 'µg/L', description: 'À surveiller avec cyprotérone' },
  shbg: { label: 'SHBG', unit: 'nmol/L', description: 'Protéine de liaison des hormones' },
  hematocrit: { label: 'Hématocrite', unit: '%', description: 'À surveiller avec testostérone' },
  hemoglobin: { label: 'Hémoglobine', unit: 'g/dL', description: 'Santé du sang' },
  alt: { label: 'ALT (ALAT)', unit: 'U/L', description: 'Fonction hépatique' },
  ast: { label: 'AST (ASAT)', unit: 'U/L', description: 'Fonction hépatique' },
  creatinine: { label: 'Créatinine', unit: 'mg/dL', description: 'Fonction rénale' },
  potassium: { label: 'Potassium', unit: 'mEq/L', description: 'Important avec spironolactone' },
  dheas: { label: 'DHEA-S', unit: 'µg/dL', description: 'Précurseur hormonal surrénalien' },
  progesterone: { label: 'Progestérone', unit: 'µg/L', description: 'Hormone progestative' },
}

// === REFERENCE RANGES ===

export const REFERENCE_RANGES: ReferenceRange[] = [
  // Feminizing HRT targets (ng/mL = ng/dL ÷ 100)
  { marker: 'estradiol', min: 100, max: 200, unit: 'pg/mL', context: 'feminizing' },
  { marker: 'testosterone', min: 0.15, max: 0.5, unit: 'ng/mL', context: 'feminizing' },
  { marker: 'prolactin', min: 0, max: 25, unit: 'µg/L', context: 'feminizing' },

  // Masculinizing HRT targets (ng/mL = ng/dL ÷ 100)
  { marker: 'testosterone', min: 4.0, max: 7.0, unit: 'ng/mL', context: 'masculinizing' },
  { marker: 'estradiol', min: 20, max: 50, unit: 'pg/mL', context: 'masculinizing' },
  { marker: 'hematocrit', min: 37, max: 52, unit: '%', context: 'masculinizing' },

  // Cis female reference (ng/mL = ng/dL ÷ 100)
  { marker: 'estradiol', min: 30, max: 400, unit: 'pg/mL', context: 'cis-female' },
  { marker: 'testosterone', min: 0.15, max: 0.7, unit: 'ng/mL', context: 'cis-female' },
  { marker: 'lh', min: 1.9, max: 12.5, unit: 'UI/L', context: 'cis-female' },
  { marker: 'fsh', min: 2.5, max: 10.2, unit: 'UI/L', context: 'cis-female' },

  // Cis male reference (ng/mL = ng/dL ÷ 100)
  { marker: 'testosterone', min: 3.0, max: 10.0, unit: 'ng/mL', context: 'cis-male' },
  { marker: 'estradiol', min: 10, max: 40, unit: 'pg/mL', context: 'cis-male' },
  { marker: 'hematocrit', min: 38.5, max: 50, unit: '%', context: 'cis-male' },

  // General safety ranges
  { marker: 'alt', min: 0, max: 40, unit: 'U/L', context: 'feminizing' },
  { marker: 'alt', min: 0, max: 40, unit: 'U/L', context: 'masculinizing' },
  { marker: 'ast', min: 0, max: 40, unit: 'U/L', context: 'feminizing' },
  { marker: 'ast', min: 0, max: 40, unit: 'U/L', context: 'masculinizing' },
  { marker: 'potassium', min: 3.5, max: 5.0, unit: 'mEq/L', context: 'feminizing' },
  { marker: 'creatinine', min: 0.6, max: 1.2, unit: 'mg/dL', context: 'feminizing' },
  { marker: 'creatinine', min: 0.7, max: 1.3, unit: 'mg/dL', context: 'masculinizing' },
]

// === FREQUENCIES ===

export const FREQUENCIES = [
  '1x/jour',
  '2x/jour',
  '3x/jour',
  '1x/2jours',
  '1x/3jours',
  '1x/4jours',
  '1x/5jours',
  '1x/6jours',
  '1x/10jours',
  '2x/semaine',
  '1x/semaine',
  '1x/2semaines',
  '1x/mois',
  '1x/3mois',
  '1x/6mois',
]

// Fréquences adaptées par méthode d'administration
export const FREQUENCIES_BY_METHOD: Record<AdministrationMethod, string[]> = {
  pill: ['1x/jour', '2x/jour', '3x/jour', '1x/2jours'],
  gel: ['1x/jour', '2x/jour'],
  patch: ['2x/semaine', '1x/semaine', '1x/3jours'],
  injection: [
    '1x/3jours',
    '1x/4jours',
    '1x/5jours',
    '1x/6jours',
    '1x/10jours',
    '2x/semaine',
    '1x/semaine',
    '1x/2semaines',
    '1x/mois',
    '1x/3mois',
  ],
  implant: ['1x/3mois', '1x/6mois'],
}

// Helper pour obtenir les fréquences selon la méthode
export function getFrequenciesForMethod(method: AdministrationMethod): string[] {
  return FREQUENCIES_BY_METHOD[method] || FREQUENCIES
}

// === UNITS ===

export const DOSAGE_UNITS = ['mg', 'µg', 'mL', 'pressions', 'patches']

// Unités pour le stock (différentes de l'unité de dosage)
export const STOCK_UNITS = [
  'comprimés',
  'tubes',
  'boîtes',
  'patches',
  'flacons',
  'ampoules',
  'seringues',
  'sachets',
]

// === APPOINTMENT TYPES ===

import type { AppointmentType } from './types'

export const APPOINTMENT_TYPES: Record<
  AppointmentType,
  { label: string; color: string; icon: string }
> = {
  endocrinologist: { label: 'Endocrinologue', color: '#F5A9B8', icon: 'Stethoscope' },
  psychiatrist: { label: 'Psychiatre', color: '#5BCEFA', icon: 'Brain' },
  psychologist: { label: 'Psychologue', color: '#91DEFF', icon: 'Heart' },
  surgeon: { label: 'Chirurgien·ne', color: '#E8A0BF', icon: 'Scissors' },
  general: { label: 'Médecin généraliste', color: '#9CA3AF', icon: 'User' },
  nurse: { label: 'Infirmier·e', color: '#10B981', icon: 'Syringe' },
  speechtherapist: { label: 'Orthophoniste', color: '#06B6D4', icon: 'Mic' },
  bloodtest: { label: 'Prise de sang', color: '#DC2626', icon: 'Droplet' },
  laser: { label: 'Épilation laser', color: '#EF4444', icon: 'Zap' },
  electrolysis: { label: 'Électrolyse', color: '#F97316', icon: 'Zap' },
  tattoo: { label: 'Tatoueur·se', color: '#8B5CF6', icon: 'Pen' },
  aesthetician: { label: 'Esthéticien·ne', color: '#EC4899', icon: 'Sparkles' },
  hairdresser: { label: 'Coiffeur·se', color: '#F59E0B', icon: 'Scissors' },
  other: { label: 'Autre', color: '#6B7280', icon: 'Calendar' },
}

// === REMINDER DEFAULTS ===

export const REMINDER_TIMES = [
  { value: 15, label: '15 minutes avant' },
  { value: 30, label: '30 minutes avant' },
  { value: 60, label: '1 heure avant' },
  { value: 120, label: '2 heures avant' },
  { value: 1440, label: '1 jour avant' },
  { value: 2880, label: '2 jours avant' },
]

// === OBJECTIVE TEMPLATES ===

import type { ObjectiveCategory, ObjectiveStatus } from './types'

export interface ObjectiveTemplate {
  id: string
  title: string
  description: string
  category: ObjectiveCategory
  context: 'feminizing' | 'masculinizing' | 'common'
  milestones: string[]
  estimatedDuration?: string
}

// Templates pour THS féminisant
export const FEMINIZING_TEMPLATES: ObjectiveTemplate[] = [
  {
    id: 'ths-feminisant',
    title: 'THS féminisant',
    description: 'Suivi du traitement hormonal féminisant sur 5 ans',
    category: 'medical',
    context: 'feminizing',
    estimatedDuration: '5 ans',
    milestones: [
      'Début du THS',
      '3 mois - Premiers changements',
      '6 mois - Développement mammaire',
      '1 an - Redistribution des graisses',
      '2 ans - Stabilisation',
      '5 ans - Effets maximaux',
    ],
  },
  {
    id: 'epilation-visage',
    title: 'Épilation laser visage',
    description: "Parcours d'épilation laser du visage (barbe)",
    category: 'medical',
    context: 'feminizing',
    estimatedDuration: '18-24 mois',
    milestones: [
      'Séance 1-3 : Premiers traitements',
      'Séance 4-6 : Réduction visible',
      'Séance 7-9 : Mi-parcours',
      'Séance 10-12 : Zones résistantes',
      'Séance 13-15 : Finitions',
      'Séance 16-18 : Retouches finales',
    ],
  },
  {
    id: 'epilation-corps',
    title: 'Épilation laser corps',
    description: "Parcours d'épilation laser du corps",
    category: 'medical',
    context: 'feminizing',
    estimatedDuration: '12-18 mois',
    milestones: [
      'Première zone traitée',
      'Réduction 30%',
      'Réduction 50%',
      'Réduction 70%',
      'Finitions et retouches',
    ],
  },
  {
    id: 'chirurgie-mammoplastie',
    title: 'Augmentation mammaire',
    description: "Parcours chirurgical mammoplastie d'augmentation",
    category: 'medical',
    context: 'feminizing',
    milestones: [
      'Consultation initiale',
      'Deuxième avis médical',
      'Dossier complet constitué',
      "Date d'opération fixée",
      'Chirurgie réalisée',
      'Récupération complète',
    ],
  },
  {
    id: 'chirurgie-vaginoplastie',
    title: 'Vaginoplastie',
    description: 'Parcours chirurgical de vaginoplastie',
    category: 'medical',
    context: 'feminizing',
    milestones: [
      'Consultations préliminaires',
      'Évaluation psychologique',
      'Choix du chirurgien',
      'Dossier ALD complet',
      "Date d'opération",
      'Chirurgie réalisée',
      'Suivi post-opératoire',
      'Dilatations régulières',
    ],
  },
  {
    id: 'chirurgie-ffs',
    title: 'Féminisation faciale (FFS)',
    description: 'Chirurgie de féminisation du visage',
    category: 'medical',
    context: 'feminizing',
    milestones: [
      'Consultation initiale',
      'Plan chirurgical établi',
      'Financement organisé',
      'Chirurgie programmée',
      'Intervention réalisée',
      'Récupération complète',
    ],
  },
]

// Templates pour THS masculinisant
export const MASCULINIZING_TEMPLATES: ObjectiveTemplate[] = [
  {
    id: 'ths-masculinisant',
    title: 'THS masculinisant',
    description: 'Suivi du traitement hormonal masculinisant sur 5 ans',
    category: 'medical',
    context: 'masculinizing',
    estimatedDuration: '5 ans',
    milestones: [
      'Début du THS',
      '3 mois - Mue de la voix, acné',
      '6 mois - Pilosité faciale',
      '1 an - Redistribution musculaire',
      '2 ans - Pilosité corporelle',
      '5 ans - Effets maximaux',
    ],
  },
  {
    id: 'chirurgie-torsoplastie',
    title: 'Torsoplastie',
    description: 'Chirurgie de masculinisation du torse',
    category: 'medical',
    context: 'masculinizing',
    milestones: [
      'Consultation initiale',
      'Deuxième avis médical',
      'Dossier complet constitué',
      "Date d'opération fixée",
      'Chirurgie réalisée',
      'Récupération complète',
    ],
  },
  {
    id: 'chirurgie-hysterectomie',
    title: 'Hystérectomie',
    description: "Parcours chirurgical d'hystérectomie",
    category: 'medical',
    context: 'masculinizing',
    milestones: [
      'Consultations préliminaires',
      'Choix du chirurgien',
      'Dossier médical complet',
      "Date d'opération",
      'Chirurgie réalisée',
      'Suivi post-opératoire',
    ],
  },
  {
    id: 'chirurgie-phalloplastie',
    title: 'Phalloplastie',
    description: 'Parcours chirurgical de phalloplastie',
    category: 'medical',
    context: 'masculinizing',
    milestones: [
      'Consultations préliminaires',
      'Évaluation psychologique',
      'Choix de la technique',
      'Dossier ALD complet',
      'Première intervention',
      'Interventions secondaires',
      'Récupération complète',
    ],
  },
  {
    id: 'chirurgie-metoidioplastie',
    title: 'Métoïdioplastie',
    description: 'Parcours chirurgical de métoïdioplastie',
    category: 'medical',
    context: 'masculinizing',
    milestones: [
      'Consultations préliminaires',
      'Évaluation psychologique',
      'Dossier ALD complet',
      "Date d'opération",
      'Chirurgie réalisée',
      'Récupération complète',
    ],
  },
]

// Templates communs (parcours administratif, social, etc.)
export const COMMON_TEMPLATES: ObjectiveTemplate[] = [
  {
    id: 'changement-etat-civil',
    title: "Changement d'état civil",
    description: 'Modification du prénom et/ou de la mention de sexe',
    category: 'administrative',
    context: 'common',
    milestones: [
      'Rassembler les documents',
      'Rédiger la requête',
      'Déposer le dossier au tribunal',
      'Audience (si nécessaire)',
      'Jugement rendu',
      "Mise à jour des documents d'identité",
    ],
  },
  {
    id: 'changement-prenom',
    title: 'Changement de prénom',
    description: 'Procédure de changement de prénom en mairie',
    category: 'administrative',
    context: 'common',
    milestones: [
      'Rassembler les justificatifs',
      'Rendez-vous en mairie',
      'Dépôt du dossier',
      'Décision de la mairie',
      'Mise à jour des documents',
    ],
  },
  {
    id: 'parcours-psy',
    title: 'Suivi psychologique',
    description: 'Accompagnement psy et attestations',
    category: 'mental',
    context: 'common',
    milestones: [
      'Trouver un·e psy compétent·e',
      'Premiers rendez-vous',
      'Suivi régulier établi',
      'Attestation pour THS',
      'Attestation pour chirurgies',
    ],
  },
  {
    id: 'coming-out-proche',
    title: 'Coming out proches',
    description: 'Coming out auprès de la famille et ami·es',
    category: 'social',
    context: 'common',
    milestones: [
      'Préparation et réflexion',
      'Coming out première personne',
      'Coming out famille proche',
      'Coming out ami·es',
      'Coming out famille élargie',
    ],
  },
  {
    id: 'coming-out-travail',
    title: 'Coming out professionnel',
    description: 'Transition au travail',
    category: 'social',
    context: 'common',
    milestones: [
      'Informer les RH',
      'Informer le/la manager',
      "Communication à l'équipe",
      'Mise à jour des outils internes',
      'Changement de mail/badge',
    ],
  },
]

// Fonction pour obtenir les templates selon le contexte utilisateur
export function getTemplatesForContext(
  context: 'feminizing' | 'masculinizing' | 'non-binary'
): ObjectiveTemplate[] {
  switch (context) {
    case 'feminizing':
      return [...FEMINIZING_TEMPLATES, ...COMMON_TEMPLATES]
    case 'masculinizing':
      return [...MASCULINIZING_TEMPLATES, ...COMMON_TEMPLATES]
    case 'non-binary':
      return [...FEMINIZING_TEMPLATES, ...MASCULINIZING_TEMPLATES, ...COMMON_TEMPLATES]
    default:
      return COMMON_TEMPLATES
  }
}

// Tous les templates
export const ALL_OBJECTIVE_TEMPLATES: ObjectiveTemplate[] = [
  ...FEMINIZING_TEMPLATES,
  ...MASCULINIZING_TEMPLATES,
  ...COMMON_TEMPLATES,
]
