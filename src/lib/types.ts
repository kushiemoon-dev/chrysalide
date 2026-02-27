/**
 * Types pour Chrysalide - Suivi médical trans
 */

// === MEDICATIONS ===

export type MedicationType =
  | 'estrogen' // Œstradiol, EV, etc.
  | 'antiandrogen' // Spiro, Cypro, Bica
  | 'progesteron' // Progestérone
  | 'testosterone' // Testostérone
  | 'gnrh' // Agonistes GnRH
  | 'other'

export type AdministrationMethod =
  | 'pill' // Comprimé oral/sublingual
  | 'injection' // IM ou SC
  | 'patch' // Transdermique
  | 'gel' // Topique
  | 'implant' // Sous-cutané

export type SchedulingMode = 'simple' | 'advanced'

// Routes d'administration spécifiques
export type PillAdministrationRoute = 'oral' | 'sublingual'
export type InjectionAdministrationRoute = 'subcutaneous' | 'intramuscular'

// Zones d'application gel
export type GelApplicationZone =
  | 'forearm_left'
  | 'forearm_right'
  | 'inner_thigh_left'
  | 'inner_thigh_right'
  | 'scrotal'

export interface Medication {
  id?: number
  name: string
  type: MedicationType
  dosage: number
  unit: string
  frequency: string // "1x/jour", "2x/semaine", etc.
  method: AdministrationMethod
  startDate: Date
  endDate?: Date
  stock?: number
  stockUnit?: string // Unité pour le stock (comprimés, tubes, boîtes, etc.)
  stockAlert?: number
  notes?: string
  isActive: boolean
  // Mode avancé pour doses multiples
  schedulingMode?: SchedulingMode // 'simple' = 1 bouton, 'advanced' = multi-doses
  scheduledTimes?: string[] // ["08:00", "14:00", "20:00"] - horaires précis
  // Routes d'administration spécifiques
  pillRoute?: PillAdministrationRoute // oral | sublingual (pour method === 'pill')
  injectionRoute?: InjectionAdministrationRoute // subcutaneous | intramuscular (pour method === 'injection')
  // Medication history tracking
  replacedById?: number // ID of the medication that replaced this one
  replacesId?: number // ID of the medication this one replaced
  createdAt: Date
  updatedAt: Date
}

// === MEDICATION LOGS ===

export interface MedicationLog {
  id?: number
  medicationId: number
  timestamp: Date
  taken: boolean
  // Mode avancé: quelle dose a été prise
  scheduledTime?: string // "08:00" - l'horaire prévu de cette dose
  doseIndex?: number // 0, 1, 2... - index dans scheduledTimes
  notes?: string
  sideEffects?: string
  // Zone d'application pour les gels
  applicationZone?: GelApplicationZone
}

// === BLOOD TESTS ===

export type BloodMarker =
  | 'estradiol' // E2 (pg/mL)
  | 'testosterone' // T (ng/dL)
  | 'lh' // LH (mIU/mL)
  | 'fsh' // FSH (mIU/mL)
  | 'prolactin' // PRL (ng/mL)
  | 'shbg' // SHBG (nmol/L)
  | 'hematocrit' // %
  | 'hemoglobin' // g/dL
  | 'alt' // Foie (U/L)
  | 'ast' // Foie (U/L)
  | 'creatinine' // Reins (mg/dL)
  | 'potassium' // K+ (mEq/L)
  | 'dheas' // DHEA-S
  | 'progesterone' // P4

export interface BloodTestResult {
  marker: BloodMarker
  value: number
  unit: string
}

export interface BloodTest {
  id?: number
  date: Date
  lab?: string
  results: BloodTestResult[]
  notes?: string
  documentPhoto?: string // base64 ou blob
  createdAt: Date
}

// === PHYSICAL PROGRESS ===

export interface Measurements {
  weight?: number // kg
  height?: number // cm
  chest?: number // cm
  underbust?: number // cm
  waist?: number // cm
  hips?: number // cm
  shoulders?: number // cm
}

export interface PhysicalProgress {
  id?: number
  date: Date
  measurements?: Measurements
  photos?: string[] // base64 ou blob IDs
  notes?: string
  tags?: string[]
  createdAt: Date
}

// === APPOINTMENTS ===

export type AppointmentType =
  | 'endocrinologist'
  | 'psychiatrist'
  | 'psychologist'
  | 'surgeon'
  | 'general'
  | 'nurse'
  | 'speechtherapist'
  | 'bloodtest'
  | 'laser'
  | 'electrolysis'
  | 'tattoo'
  | 'aesthetician'
  | 'hairdresser'
  | 'other'

export interface Appointment {
  id?: number
  date: Date
  time?: string
  type: AppointmentType
  practitionerId?: number // Référence au praticien dans l'annuaire
  doctor?: string // Fallback si pas de praticien lié
  location?: string // Fallback si pas de praticien lié
  notes?: string
  reminderMinutes?: number
  cost?: number // Reste à charge en euros (optionnel)
  createdAt: Date
}

// === REMINDERS ===

export type ReminderType = 'medication' | 'appointment' | 'refill' | 'bloodtest'

export interface Reminder {
  id?: number
  type: ReminderType
  referenceId?: number // ID du médicament ou RDV associé
  title: string
  message?: string
  schedule: string // Format cron-like ou simple
  enabled: boolean
  lastTriggered?: Date
  createdAt: Date
}

// === USER PROFILE ===

export interface UserProfile {
  id?: number
  firstName?: string
  pronouns?: string
  transitionStartDate?: Date
  targetGender?: 'feminizing' | 'masculinizing' | 'non-binary'
  createdAt: Date
  updatedAt: Date
}

// === HELPER TYPES ===

export interface ReferenceRange {
  marker: BloodMarker
  min: number
  max: number
  unit: string
  context: 'feminizing' | 'masculinizing' | 'cis-female' | 'cis-male'
}

// === JOURNAL ENTRIES ===

export type MoodLevel = 1 | 2 | 3 | 4 | 5 // 1 = très mal, 5 = très bien

export type JournalTagCategory =
  | 'mood' // humeur générale
  | 'side_effects' // effets secondaires
  | 'energy' // niveau d'énergie
  | 'sleep' // qualité du sommeil
  | 'social' // interactions sociales
  | 'custom' // tags personnalisés

export interface JournalTag {
  name: string
  category: JournalTagCategory
}

export interface JournalEntry {
  id?: number
  date: Date
  content: string // texte libre de l'entrée
  mood?: MoodLevel // niveau d'humeur 1-5
  tags: string[] // liste des tags (noms)
  sideEffects?: string[] // effets secondaires notés
  energyLevel?: MoodLevel // niveau d'énergie 1-5
  sleepQuality?: MoodLevel // qualité du sommeil 1-5
  isPrivate?: boolean // entrée privée (future: chiffrement)
  createdAt: Date
  updatedAt: Date
}

// === OBJECTIVES & MILESTONES ===

export type ObjectiveCategory =
  | 'medical' // Médical (hormones, chirurgies, etc.)
  | 'administrative' // Administratif (changement d'état civil, etc.)
  | 'social' // Social (coming out, relations, etc.)
  | 'physical' // Physique (exercice, corps, etc.)
  | 'mental' // Mental (bien-être, thérapie, etc.)

export type ObjectiveStatus =
  | 'not_started' // Pas encore commencé
  | 'in_progress' // En cours
  | 'completed' // Terminé
  | 'paused' // En pause
  | 'cancelled' // Annulé

export interface Objective {
  id?: number
  title: string
  description?: string
  category: ObjectiveCategory
  status: ObjectiveStatus
  targetDate?: Date // date cible optionnelle
  completedDate?: Date // date de complétion réelle
  progress?: number // 0-100% (calculé depuis milestones ou manuel)
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Milestone {
  id?: number
  objectiveId: number // lié à un objectif
  title: string
  description?: string
  date?: Date // date cible du milestone
  achieved: boolean
  achievedDate?: Date
  order: number // ordre d'affichage
  createdAt: Date
}

// === TREATMENT CHANGES (Historique) ===

export type TreatmentChangeType =
  | 'started' // Nouveau médicament commencé
  | 'stopped' // Médicament arrêté
  | 'paused' // Médicament mis en pause
  | 'resumed' // Médicament repris
  | 'dosage_change' // Changement de dosage
  | 'method_change' // Changement de méthode d'administration
  | 'frequency_change' // Changement de fréquence

export interface TreatmentChange {
  id?: number
  medicationId: number // ID du médicament concerné
  medicationName: string // Nom stocké pour historique même si supprimé
  changeType: TreatmentChangeType
  date: Date // Date du changement
  oldValue?: string // Ancienne valeur (ex: "2mg")
  newValue?: string // Nouvelle valeur (ex: "4mg")
  reason?: string // Raison du changement
  prescribedBy?: string // Médecin qui a prescrit
  notes?: string
  createdAt: Date
}

// === PRACTITIONERS (Annuaire) ===

export interface Practitioner {
  id?: number
  name: string // Nom complet
  specialty: AppointmentType // Type de praticien·ne
  location?: string // Adresse/lieu
  phone?: string // Téléphone
  email?: string // Email
  website?: string // Site web
  notes?: string // Notes personnelles
  lastUsed: Date // Dernière utilisation (pour tri par récence)
  usageCount: number // Nombre d'utilisations (pour suggestions)
  isTransFriendly?: boolean // Praticien·ne trans-friendly connu·e
  createdAt: Date
}
