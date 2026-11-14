import { useEffect, useState } from 'react'
import { onDataChange, supabase } from './api'
import { LIQUID_KINDS, type FoodItem, type MealData, type MedicationData, type MedicationPreset, type WaterData } from './types'

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
}

const EMPTY: Suggestions = { foods: [], meds: [], liquids: [] }
let cache: Promise<Suggestions> | null = null
onDataChange(() => { cache = null })

const norm = (s: string) => s.trim().toLocaleLowerCase()

async function load(): Promise<Suggestions> {
  const { data, error } = await supabase
    .from('entries')
    .select('type,data')
    .in('type', ['meal', 'medication', 'water'])
    .order('occurred_at', { ascending: false })
    .limit(2000)
  if (error || !data) return EMPTY

  // Rows come newest first, so the first time a name is seen holds its latest values.
  const foods = new Map<string, { v: FoodItem; n: number }>()
  const meds = new Map<string, { v: MedicationPreset; n: number }>()
  const liquids = new Map<string, { v: string; n: number }>()
  const bump = <T,>(m: Map<string, { v: T; n: number }>, k: string, v: T) => {
    const cur = m.get(k)
    if (cur) cur.n++
    else m.set(k, { v, n: 1 })
  }

  for (const row of data as { type: string; data: unknown }[]) {
    if (row.type === 'meal') {
      for (const it of (row.data as MealData).items ?? []) {
        if (it.name?.trim()) bump(foods, norm(it.name), { ...it, name: it.name.trim() })
      }
    } else if (row.type === 'medication') {
      const m = row.data as MedicationData
      if (m.name?.trim()) {
        const v = { name: m.name.trim(), dose: m.dose ?? '', unit: m.unit ?? '' }
        bump(meds, `${norm(v.name)}|${norm(v.dose)}|${norm(v.unit)}`, v)
      }
    } else if (row.type === 'water') {
      const k = (row.data as WaterData).kind?.trim()
      if (k && !(LIQUID_KINDS as readonly string[]).includes(k)) bump(liquids, norm(k), k)
    }
  }
  const sorted = <T,>(m: Map<string, { v: T; n: number }>) => [...m.values()].sort((a, b) => b.n - a.n).map((x) => x.v)
  return { foods: sorted(foods), meds: sorted(meds), liquids: sorted(liquids) }
}

export function useSuggestions(): Suggestions {
  const [s, setS] = useState<Suggestions>(EMPTY)
  useEffect(() => {
    let alive = true
    cache ??= load()
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
