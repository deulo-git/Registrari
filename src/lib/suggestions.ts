import { useEffect, useState } from 'react'
import { getActiveOwner, onDataChange, supabase } from './api'
import { LIQUID_KINDS, apptGroup, type AppointmentData, type DocumentData, type FoodItem, type MealData, type MedicationData, type MedicationPreset, type WaterData } from './types'

/**
 * Names already used, so they don't have to be typed again. Built from the
 * history itself (no separate list to keep in sync): most used first, and
 * for foods/medications the last values used with that name.
 */
export interface Suggestions {
  foods: FoodItem[]
  meds: MedicationPreset[]
  /** Custom drink names (built-in kinds are always shown). */
  liquids: string[]
  /**
   * Values already typed in a given text box, most used first. Keys:
   * notes.<type>, doc.title, doc.kind, appt.title, appt.place, appt.doctor,
   * appt.sub.<group>, med.dose, med.unit.
   */
  fields: Record<string, string[]>
}

const EMPTY: Suggestions = { foods: [], meds: [], liquids: [], fields: {} }
let cache: Promise<Suggestions> | null = null
onDataChange(() => { cache = null })

const norm = (s: string) => s.trim().toLocaleLowerCase()

async function load(): Promise<Suggestions> {
  const { data, error } = await supabase
    .from('entries')
    .select('type,data')
    .eq('owner_id', getActiveOwner() ?? '')
    .order('occurred_at', { ascending: false })
    .limit(2000)
  if (error || !data) return EMPTY

  // Rows come newest first, so the first time a name is seen holds its latest values.
  const foods = new Map<string, { v: FoodItem; n: number }>()
  const meds = new Map<string, { v: MedicationPreset; n: number }>()
  const liquids = new Map<string, { v: string; n: number }>()
  const fields = new Map<string, Map<string, { v: string; n: number }>>()
  const addField = (key: string, raw: unknown) => {
    const v = typeof raw === 'string' ? raw.trim() : ''
    if (!v || v.length > 160) return
    let m = fields.get(key)
    if (!m) fields.set(key, (m = new Map()))
    const k = norm(v)
    const cur = m.get(k)
    if (cur) cur.n++
    else m.set(k, { v, n: 1 })
  }
  const bump = <T,>(m: Map<string, { v: T; n: number }>, k: string, v: T) => {
    const cur = m.get(k)
    if (cur) cur.n++
    else m.set(k, { v, n: 1 })
  }

  for (const row of data as { type: string; data: unknown }[]) {
    addField(`notes.${row.type}`, (row.data as { notes?: string }).notes)
    if (row.type === 'document') {
      const d = row.data as DocumentData
      addField('doc.title', d.title)
      addField('doc.kind', d.kind)
    } else if (row.type === 'appointment') {
      const d = row.data as AppointmentData
      addField('appt.title', d.title)
      addField('appt.place', d.place)
      addField('appt.doctor', d.doctor)
      addField(`appt.sub.${apptGroup(d.kind)}`, d.sub)
    }
    if (row.type === 'meal') {
      for (const it of (row.data as MealData).items ?? []) {
        if (it.name?.trim()) bump(foods, norm(it.name), { ...it, name: it.name.trim() })
      }
    } else if (row.type === 'medication') {
      const m = row.data as MedicationData
      if (m.name?.trim()) {
        const v = { name: m.name.trim(), dose: m.dose ?? '', unit: m.unit ?? '' }
        bump(meds, `${norm(v.name)}|${norm(v.dose)}|${norm(v.unit)}`, v)
        addField('med.dose', m.dose)
        addField('med.unit', m.unit)
      }
    } else if (row.type === 'water') {
      const k = (row.data as WaterData).kind?.trim()
      if (k && !(LIQUID_KINDS as readonly string[]).includes(k)) bump(liquids, norm(k), k)
    }
  }
  const sorted = <T,>(m: Map<string, { v: T; n: number }>) => [...m.values()].sort((a, b) => b.n - a.n).map((x) => x.v)
  const outFields: Record<string, string[]> = {}
  for (const [k, m] of fields) outFields[k] = [...m.values()].sort((a, b) => b.n - a.n).map((x) => x.v)
  return { foods: sorted(foods), meds: sorted(meds), liquids: sorted(liquids), fields: outFields }
}

/** Last loaded value: forms start with it, so the chips are there on the first paint. */
let last: Suggestions = EMPTY
const loadAndKeep = () => load().then((v) => { last = v; return v })

/** Forget everything (another person's data is now on screen). */
export function resetSuggestions() { cache = null; last = EMPTY }

/** Warm the cache early (called at start-up and after each save). */
export function preloadSuggestions() { cache ??= loadAndKeep() }

export function useSuggestions(): Suggestions {
  const [s, setS] = useState<Suggestions>(() => last)
  useEffect(() => {
    let alive = true
    cache ??= loadAndKeep()
    cache.then((v) => { if (alive) setS(v) }).catch(() => {})
    return () => { alive = false }
  }, [])
  return s
}

/** Items whose name contains the query (all when empty), minus exact matches. */
export function matching<T>(list: T[], query: string, name: (x: T) => string, max = 8): T[] {
  const q = norm(query)
  return list.filter((x) => {
    const n = norm(name(x))
    return n !== q && (!q || n.includes(q))
  }).slice(0, max)
}
