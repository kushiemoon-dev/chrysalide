/**
 * Constants for Chrysalide
 * Common HRT medications, reference ranges, units
 */

import type {
  MedicationType,
  AdministrationMethod,
  BloodMarker,
  ReferenceRange,
  PillAdministrationRoute,
  InjectionAdministrationRoute,
  GelApplicationZone,
  PatchApplicationZone,
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

// Specific administration routes
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

// Gel application zones
export const GEL_APPLICATION_ZONES: Record<GelApplicationZone, string> = {
  forearm_left: 'Avant-bras gauche',
  forearm_right: 'Avant-bras droit',
  inner_thigh_left: 'Intérieur cuisse gauche',
  inner_thigh_right: 'Intérieur cuisse droite',
  scrotal: 'Scrotale',
}

// Patch application zones (rotation site)
export const PATCH_APPLICATION_ZONES: Record<PatchApplicationZone, string> = {
  thigh_left: 'Cuisse gauche',
  abdomen: 'Abdomen',
  thigh_right: 'Cuisse droite',
  buttock: 'Fessier',
}

export const PATCH_APPLICATION_ZONE_ORDER: PatchApplicationZone[] = [
  'thigh_left',
  'abdomen',
  'thigh_right',
  'buttock',
]

// === HEMATOCRIT SAFETY THRESHOLD ===
// Distinct from the comfort range in REFERENCE_RANGES (37-52%): this is a
// safety signal (HAS 2025 + French literature 2004-2023), not a hormone
// target, and is never presented as an alert until the watch threshold.
export const HEMATOCRIT_WATCH_THRESHOLD = 52
export const HEMATOCRIT_ALERT_THRESHOLD = 54
export const HEMATOCRIT_ALERT_THRESHOLD_SOURCE = 'HAS France 2025 (R72)'

export function getHematocritStatus(value: number): 'ok' | 'watch' | 'alert' {
  if (value >= HEMATOCRIT_ALERT_THRESHOLD) return 'alert'
  if (value >= HEMATOCRIT_WATCH_THRESHOLD) return 'watch'
  return 'ok'
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
  // Estrogens
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

  // Antiandrogens
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

  // Progesterone
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

  // Testosterone (masculinizing HRT)
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

// === BLOOD MARKER UNIT CONVERSION ===
// Community-reported friction (2 independent tickets on a competing app + a patient
// testimony doing manual tracking): labs report testosterone/estradiol in units the
// app doesn't expect (ng/dL, nmol/L, pmol/L). Canonical storage stays
// BLOOD_MARKERS[marker].unit; these let the entry form accept an alternate unit and
// convert to canonical before saving, so trends and reference ranges stay comparable.
interface AlternateUnit {
  unit: string
  toCanonical: (value: number) => number
}

const BLOOD_MARKER_ALTERNATE_UNITS: Partial<Record<BloodMarker, AlternateUnit[]>> = {
  estradiol: [
    // pmol/L -> pg/mL (molar mass 272.38 g/mol)
    { unit: 'pmol/L', toCanonical: (v) => v / 3.671 },
  ],
  testosterone: [
    // ng/dL -> ng/mL
    { unit: 'ng/dL', toCanonical: (v) => v / 100 },
    // nmol/L -> ng/mL (molar mass 288.42 g/mol)
    { unit: 'nmol/L', toCanonical: (v) => v / 3.467 },
  ],
}

export function getMarkerUnitOptions(marker: BloodMarker): string[] {
  const alternates = BLOOD_MARKER_ALTERNATE_UNITS[marker] ?? []
  return [BLOOD_MARKERS[marker].unit, ...alternates.map((a) => a.unit)]
}

export function convertToCanonicalUnit(marker: BloodMarker, value: number, unit: string): number {
  const alt = BLOOD_MARKER_ALTERNATE_UNITS[marker]?.find((a) => a.unit === unit)
  return alt ? alt.toCanonical(value) : value
}

// === REFERENCE RANGE SOURCES ===
// Only the pair actually verified against a primary source during chantier 0 research
// gets a citation: Callen-Lorde's masculinizing testosterone range matches the app's
// figures exactly. HAS France 2025 explicitly declines a universal numeric target for
// masculinizing HRT (R69/R70), so every other combination stays uncited rather than
// fabricated (see wiki/tickets/chrysalide-v2/sources-medicales.md).
export function getReferenceRangeSource(marker: BloodMarker, context: string): string | undefined {
  if (marker === 'testosterone' && context === 'masculinizing') return 'Callen-Lorde'
  return undefined
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

const FREQUENCIES = [
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

// Frequencies adapted by administration method
const FREQUENCIES_BY_METHOD: Record<AdministrationMethod, string[]> = {
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

// Helper to get the frequencies for a given method
export function getFrequenciesForMethod(method: AdministrationMethod): string[] {
  return FREQUENCIES_BY_METHOD[method] || FREQUENCIES
}

// === UNITS ===

export const DOSAGE_UNITS = ['mg', 'µg', 'mL', 'pressions', 'patches']

// Units for stock (different from the dosage unit)
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
  laboratoire: { label: 'Laboratoire', color: '#7C3AED', icon: 'FlaskConical' },
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

// === ACT CATEGORIES ===

import type { ActCategory } from './types'

export const ACT_CATEGORIES: Record<ActCategory, { icon: string; color: string }> = {
  ffs: { icon: 'Sparkles', color: '#EC4899' },
  vaginoplasty: { icon: 'Heart', color: '#F5A9B8' },
  hrt: { icon: 'Syringe', color: '#5BCEFA' },
  orchiectomy: { icon: 'Scissors', color: '#E8A0BF' },
  breast_augmentation: { icon: 'Heart', color: '#F9A8D4' },
  voice: { icon: 'Mic', color: '#06B6D4' },
  hair_removal: { icon: 'Zap', color: '#F97316' },
  civil_status: { icon: 'FileText', color: '#9CA3AF' },
  other: { icon: 'MoreHorizontal', color: '#6B7280' },
}
