/** Every kind of record the app keeps. Order = order in the add menu. */
export const ENTRY_TYPES = ['water', 'meal', 'symptom', 'bowel', 'gas', 'medication', 'document'] as const
export type EntryType = (typeof ENTRY_TYPES)[number]

/** One colour per entry type, used everywhere (bubbles, timeline, calendar, PDF). */
export const TYPE_COLOR: Record<EntryType, string> = {
  water: '#2563eb',
  meal: '#16a34a',
  symptom: '#dc2626',
  bowel: '#92400e',
  gas: '#7c3aed',
  medication: '#ea580c',
  document: '#475569',
}

export interface WaterData { ml: number }

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

export interface SymptomData { category: string; intensity: number; durationMin?: number; notes?: string }

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
export const DOC_KINDS = ['prescription', 'result', 'analysis', 'report', 'other'] as const
export type DocKind = (typeof DOC_KINDS)[number]
export interface DocumentData { kind: DocKind; title: string; files: StoredFile[]; notes?: string }

export interface DataByType {
  water: WaterData
  meal: MealData
  symptom: SymptomData
  bowel: BowelData
  gas: GasData
  medication: MedicationData
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
