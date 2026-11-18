/** Every kind of record the app keeps. Order = order in the add menu. */
export const ENTRY_TYPES = ['water', 'meal', 'symptom', 'bowel', 'gas', 'medication', 'appointment', 'document'] as const
export type EntryType = (typeof ENTRY_TYPES)[number]

/** One colour per entry type, used everywhere (bubbles, timeline, calendar, PDF). */
export const TYPE_COLOR: Record<EntryType, string> = {
  water: '#0284c7',
  meal: '#65a30d',
  symptom: '#dc2626',
  bowel: '#92400e',
  gas: '#7c3aed',
  medication: '#db2777',
  appointment: '#0d9488',
  document: '#475569',
}

/**
 * The "water" entry type is shown as "Liquids": kind says which drink it was.
 * Built-in kinds are translated (liquid_<kind>); anything else is free text.
 * Old entries without kind are water.
 */
export const LIQUID_KINDS = ['water', 'infusion', 'coffee', 'milk', 'juice', 'broth', 'isotonic', 'soda'] as const
export interface WaterData { ml: number; kind?: string }
export const isPlainWater = (d: WaterData) => !d.kind || d.kind === 'water'

export interface FoodItem {
  name: string
  qty?: number
  unit?: 'g' | 'ml' | 'u'
  kcal?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
}
export const MEAL_KINDS = ['breakfast', 'midmorning', 'lunch', 'snack', 'dinner', 'other'] as const
export type MealKind = (typeof MEAL_KINDS)[number]
export interface MealData { meal: MealKind; items: FoodItem[]; notes?: string }

export interface SymptomItem { category: string; intensity: number }
/**
 * One entry can hold several symptoms felt at the same time (symptoms[]).
 * Entries saved before that have a single category/intensity instead: read
 * them through symptomList().
 */
export interface SymptomData {
  symptoms?: SymptomItem[]
  category?: string
  intensity?: number
  durationMin?: number
  allDay?: boolean
  notes?: string
}
export function symptomList(d: SymptomData): SymptomItem[] {
  if (d.symptoms?.length) return d.symptoms
  return d.category ? [{ category: d.category, intensity: d.intensity ?? 0 }] : []
}
/**
 * Symptoms with a built-in description (guide in the symptom form). The
 * first ones are the defaults in settings; the rest can be picked from the guide.
 */
export const SYMPTOM_GUIDE = [
  'abdominal_pain', 'bloating', 'cramps', 'nausea', 'reflux', 'early_satiety', 'appetite_loss',
  'tenesmus', 'rectal_pain', 'fatigue', 'other',
] as const

export type BloodLevel = 'none' | 'little' | 'lot'
export interface BowelData {
  bristol: number
  blood: BloodLevel
  durationMin?: number
  /** 0 none · 1 mild · 2 moderate · 3 intense */
  effort: number
  urgency?: boolean
  pain?: boolean
  notes?: string
}

/** 0 → "0", 1 → "> 2", 2 → "> 5", 3 → "> 10" */
export interface GasData { level: number; notes?: string }
export const GAS_LABELS = ['0', '> 2', '> 5', '> 10']

export interface MedicationData { name: string; dose?: string; unit?: string; notes?: string }

export interface StoredFile { path: string; name: string; mime: string; size: number }
/** Background colour of each kind of document (same palette family as TYPE_COLOR). */
export const DOC_COLOR: Record<string, string> = {
  prescription: '#db2777',
  result: '#0d9488',
  analysis: '#dc2626',
  report: '#7c3aed',
  other: '#475569',
}
/** Built-in kinds ('other' only survives on old entries); anything else is a custom kind typed by the user ("Nou"). */
export const DOC_KINDS = ['prescription', 'result', 'analysis', 'report', 'other'] as const
export type DocKind = (typeof DOC_KINDS)[number]
export interface DocumentData {
  kind: string
  title: string
  files: StoredFile[]
  notes?: string
  /** Linked medical appointment (entry id) and its label when linked. */
  appointmentId?: string
  appointmentLabel?: string
}

/** Groups of appointment. A "test" (prova) is specified with `sub` (MRI, colonoscopy, blood test...). */
export const APPOINTMENT_KINDS = ['consultation', 'test', 'emergency', 'other'] as const
/** Kinds saved before the "test" group existed: they still read fine and are folded into it when edited. */
export const LEGACY_TEST_KINDS: Record<string, string> = {
  colonoscopy: 'colonoscopy', gastroscopy: 'gastroscopy', analysis: 'blood_test', imaging: 'ultrasound',
}
export const TEST_SUBS = ['mri', 'colonoscopy', 'gastroscopy', 'blood_test', 'ultrasound', 'ct', 'xray'] as const
export const CONSULT_SUBS = ['primary', 'digestive', 'oncology', 'surgery', 'nutrition'] as const
export type AppointmentKind = (typeof APPOINTMENT_KINDS)[number]
export const apptGroup = (kind: string): AppointmentKind =>
  kind in LEGACY_TEST_KINDS ? 'test' : (APPOINTMENT_KINDS as readonly string[]).includes(kind) ? (kind as AppointmentKind) : 'other'
export interface AppointmentData {
  kind: AppointmentKind | string
  /** Specific type inside the group: a test name or a speciality (built-in key or free text). */
  sub?: string
  /** Free text for "other" or to be more precise (e.g. "Ecografia abdominal"). */
  title?: string
  place?: string
  doctor?: string
  notes?: string
}

export interface DataByType {
  water: WaterData
  meal: MealData
  symptom: SymptomData
  bowel: BowelData
  gas: GasData
  medication: MedicationData
  appointment: AppointmentData
  document: DocumentData
}

export interface Entry<T extends EntryType = EntryType> {
  id: string
  type: T
  occurred_at: string
  data: DataByType[T]
  created_at?: string
  updated_at?: string
}

export interface MedicationPreset { name: string; dose: string; unit: string }

export interface Config {
  patientName: string
  glassMl: number
  waterGoalMl: number
  /** Built-in keys (translated) or free text added in settings. */
  symptomCategories: string[]
  medications: MedicationPreset[]
}

export const DEFAULT_CONFIG: Config = {
  patientName: '',
  glassMl: 250,
  waterGoalMl: 2000,
  symptomCategories: ['abdominal_pain', 'bloating', 'nausea', 'reflux', 'cramps', 'fatigue', 'other'],
  medications: [],
}

export function mealTotals(items: FoodItem[]) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  for (const it of items) {
    t.kcal += it.kcal ?? 0
    t.protein += it.protein ?? 0
    t.carbs += it.carbs ?? 0
    t.fat += it.fat ?? 0
    t.fiber += it.fiber ?? 0
  }
  return t
}
