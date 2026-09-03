/**
 * Types for Chrysalide: trans medical tracking
 */

// === MEDICATIONS ===

export type MedicationType =
  | 'estrogen' // Estradiol, EV, etc.
  | 'antiandrogen' // Spiro, Cypro, Bica
  | 'progesteron' // Progesterone
  | 'testosterone' // Testosterone
  | 'gnrh' // GnRH agonists
  | 'other'

export type AdministrationMethod =
  | 'pill' // Oral/sublingual tablet
  | 'injection' // IM or SC
  | 'patch' // Transdermal
  | 'gel' // Topical
  | 'implant' // Subcutaneous

export type SchedulingMode = 'simple' | 'advanced'

// Specific administration routes
export type PillAdministrationRoute = 'oral' | 'sublingual' | 'vaginal' | 'rectal'
export type InjectionAdministrationRoute = 'subcutaneous' | 'intramuscular'

// Gel application zones
export type GelApplicationZone =
  'forearm_left' | 'forearm_right' | 'inner_thigh_left' | 'inner_thigh_right' | 'scrotal'

// Patch application zones
export type PatchApplicationZone = 'thigh_left' | 'abdomen' | 'thigh_right' | 'buttock'

export type ApplicationZone = GelApplicationZone | PatchApplicationZone

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
  stockUnit?: string // Unit for stock (tablets, tubes, boxes, etc.)
  stockAlert?: number
  notes?: string
  isActive: boolean
  // Advanced mode for multiple doses
  schedulingMode?: SchedulingMode // 'simple' = 1 button, 'advanced' = multiple doses
  scheduledTimes?: string[] // ["08:00", "14:00", "20:00"], precise times
  // Specific administration routes
  pillRoute?: PillAdministrationRoute // oral | sublingual (for method === 'pill')
  injectionRoute?: InjectionAdministrationRoute // subcutaneous | intramuscular (for method === 'injection')
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
  // Advanced mode: which dose was taken
  scheduledTime?: string // "08:00", the scheduled time for this dose
  doseIndex?: number // 0, 1, 2... index within scheduledTimes
  notes?: string
  sideEffects?: string
  // Application zone for gels and patches
  applicationZone?: ApplicationZone
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
  | 'alt' // Liver (U/L)
  | 'ast' // Liver (U/L)
  | 'creatinine' // Kidneys (mg/dL)
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
  practitionerId?: number // Reference to the lab in the directory
  results: BloodTestResult[]
  notes?: string
  documentPhoto?: string // base64 or blob
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
  photos?: string[] // base64 or blob IDs
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
  | 'laboratoire'
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
  practitionerId?: number // Reference to the practitioner in the directory
  doctor?: string // Fallback if no practitioner is linked
  location?: string // Fallback if no practitioner is linked
  notes?: string
  reminderMinutes?: number
  cost?: number // Out-of-pocket cost in euros (optional)
  actId?: number // @deprecated: use objectiveId since v1.3.0
  objectiveId?: number // Link to a medical objective (replaces actId)
  createdAt: Date
}

// === REMINDERS ===

type ReminderType = 'medication' | 'appointment' | 'refill' | 'bloodtest'

export interface Reminder {
  id?: number
  type: ReminderType
  referenceId?: number // ID of the associated medication or appointment
  title: string
  message?: string
  schedule: string // Cron-like or simple format
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

export type MoodLevel = 1 | 2 | 3 | 4 | 5 // 1 = very bad, 5 = very good

export type JournalTagCategory =
  | 'mood' // general mood
  | 'side_effects' // side effects
  | 'energy' // energy level
  | 'sleep' // sleep quality
  | 'social' // social interactions
  | 'custom' // custom tags

export interface JournalEntry {
  id?: number
  date: Date
  content: string // free-form entry text
  mood?: MoodLevel // mood level 1-5
  tags: string[] // list of tag names
  sideEffects?: string[] // noted side effects
  energyLevel?: MoodLevel // energy level 1-5
  sleepQuality?: MoodLevel // sleep quality 1-5
  isPrivate?: boolean // private entry (future: encryption)
  createdAt: Date
  updatedAt: Date
}

// === OBJECTIVES & MILESTONES ===

export type ObjectiveCategory =
  | 'medical' // Medical (hormones, surgeries, etc.)
  | 'administrative' // Administrative (legal name/gender change, etc.)
  | 'social' // Social (coming out, relationships, etc.)
  | 'physical' // Physical (exercise, body, etc.)
  | 'mental' // Mental (well-being, therapy, etc.)

export type ObjectiveStatus =
  | 'not_started' // Not started yet
  | 'in_progress' // In progress
  | 'completed' // Completed
  | 'paused' // Paused
  | 'cancelled' // Cancelled

export interface Objective {
  id?: number
  title: string
  description?: string
  category: ObjectiveCategory
  status: ObjectiveStatus
  targetDate?: Date // optional target date
  completedDate?: Date // actual completion date
  progress?: number // 0-100% (computed from milestones or manual)
  notes?: string
  // Fields from the merge with Act (all optional since v1.3.0)
  actCategory?: ActCategory
  information?: string
  envisagedPractitionerIds?: number[]
  chosenPractitionerIds?: number[]
  source?: 'act' | 'objective'
  createdAt: Date
  updatedAt: Date
}

export interface Milestone {
  id?: number
  objectiveId: number // linked to an objective
  title: string
  description?: string
  date?: Date // target date of the milestone
  achieved: boolean
  achievedDate?: Date
  order: number // display order
  createdAt: Date
}

// === TREATMENT CHANGES (History) ===

export type TreatmentChangeType =
  | 'started' // New medication started
  | 'stopped' // Medication stopped
  | 'paused' // Medication paused
  | 'resumed' // Medication resumed
  | 'dosage_change' // Dosage change
  | 'method_change' // Administration method change
  | 'frequency_change' // Frequency change

export interface TreatmentChange {
  id?: number
  medicationId: number // ID of the affected medication
  medicationName: string // Name stored for history even if deleted
  changeType: TreatmentChangeType
  date: Date // Date of the change
  oldValue?: string // Old value (e.g., "2mg")
  newValue?: string // New value (e.g., "4mg")
  reason?: string // Reason for the change
  prescribedBy?: string // Prescribing doctor
  notes?: string
  createdAt: Date
}

// === MEDICAL PROCEDURES (Notes per procedure) ===
// @deprecated Merged into Objective since v1.3.0

export type ActCategory =
  | 'ffs'
  | 'vaginoplasty'
  | 'hrt'
  | 'orchiectomy'
  | 'breast_augmentation'
  | 'voice'
  | 'hair_removal'
  | 'civil_status'
  | 'other'

type ActStatus = 'planning' | 'in_progress' | 'done' | 'cancelled'

/** @deprecated Merged into Objective since v1.3.0 */
export interface Act {
  id?: number
  title: string
  category: ActCategory
  status: ActStatus
  information?: string
  notes?: string
  envisagedPractitionerIds: number[]
  chosenPractitionerIds: number[]
  createdAt: Date
  updatedAt: Date
}

/** @deprecated Merged into Milestone since v1.3.0 */
export interface ActTodo {
  id?: number
  actId: number
  text: string
  done: boolean
  order: number
  createdAt: Date
}

// === PRACTITIONERS (Directory) ===

export interface Practitioner {
  id?: number
  name: string // Full name
  specialty: AppointmentType // Practitioner type
  location?: string // Address/location
  phone?: string // Phone number
  email?: string // Email
  website?: string // Website
  notes?: string // Personal notes
  lastUsed: Date // Last used (for sorting by recency)
  usageCount: number // Number of uses (for suggestions)
  isTransFriendly?: boolean // Known trans-friendly practitioner
  createdAt: Date
}
