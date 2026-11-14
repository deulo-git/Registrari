import {
  GAS_LABELS, mealTotals, symptomList,
  type AppointmentData, type BowelData, type DocumentData, type Entry, type GasData, type MealData,
  type MedicationData, type SymptomData, type WaterData,
} from './types'
import type { TKey } from './i18n'

// ── Dates (all in the device's local time) ──
export function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
export function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x }
export function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
export function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function parseDayKey(k: string) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d) }
/** Value for <input type="datetime-local">. */
export function toLocalInput(d: Date) {
  return `${dayKey(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
export function fromLocalInput(v: string) { return new Date(v) }
export function fmtTime(iso: string | Date, locale: string) {
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
}
export function fmtDate(d: Date, locale: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
  return d.toLocaleDateString(locale, opts)
}

/** Upper-cases the first letter only (CSS capitalize would do every word). */
export const cap = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1)

export function fmtMl(ml: number) {
  return ml >= 1000 ? `${(ml / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} L` : `${ml} ml`
}
const r1 = (n: number) => Math.round(n * 10) / 10

type T = (k: TKey) => string

/** Short label for an appointment: its own title, or the kind. */
export function apptLabel(d: AppointmentData, t: T) {
  return d.title?.trim() || t(`appt_${d.kind}` as TKey)
}
export interface Labels { symptomLabel: (c: string) => string; liquidLabel: (k?: string) => string }

/**
 * One-line human description of an entry, shared by the timeline and the PDF
 * so both always say the same thing.
 */
export function describe(e: Entry, t: T, { symptomLabel, liquidLabel }: Labels, withNotes = true): string {
  const parts: string[] = []
  let notes: string | undefined
  switch (e.type) {
    case 'water': {
      const d = e.data as WaterData
      parts.push(`${liquidLabel(d.kind)} · ${fmtMl(d.ml)}`)
      break
    }
    case 'meal': {
      const d = e.data as MealData
      parts.push(t(`meal_${d.meal}` as TKey))
      const foods = d.items.filter((i) => i.name.trim()).map((i) =>
        i.qty ? `${i.name} (${i.qty}${i.unit === 'u' ? ' u' : ' ' + (i.unit ?? 'g')})` : i.name)
      if (foods.length) parts.push(foods.join(', '))
      const tot = mealTotals(d.items)
      const macros: string[] = []
      if (tot.kcal) macros.push(`${Math.round(tot.kcal)} kcal`)
      if (tot.protein) macros.push(`${t('protein')} ${r1(tot.protein)} g`)
      if (tot.carbs) macros.push(`${t('carbs')} ${r1(tot.carbs)} g`)
      if (tot.fat) macros.push(`${t('fat')} ${r1(tot.fat)} g`)
      if (tot.fiber) macros.push(`${t('fiber')} ${r1(tot.fiber)} g`)
      if (macros.length) parts.push(macros.join(' · '))
      notes = d.notes
      break
    }
    case 'symptom': {
      const d = e.data as SymptomData
      // "Dolor abdominal 6/10 · Inflor 4/10"
      parts.push(symptomList(d).map((s) => `${symptomLabel(s.category)} ${s.intensity}/10`).join(' · '))
      if (d.allDay) parts.push(t('allDay').toLocaleLowerCase())
      else if (d.durationMin) parts.push(`${d.durationMin} ${t('minutes')}`)
      notes = d.notes
      break
    }
    case 'bowel': {
      const d = e.data as BowelData
      parts.push(`Bristol ${d.bristol}`)
      parts.push(`${t('blood')}: ${t(`blood_${d.blood}` as TKey)}`)
      parts.push(`${t('effort')}: ${t(`effort${d.effort}` as TKey)}`)
      if (d.durationMin) parts.push(`${d.durationMin} ${t('minutes')}`)
      if (d.urgency) parts.push(t('urgency'))
      if (d.pain) parts.push(t('pain'))
      notes = d.notes
      break
    }
    case 'gas': {
      const d = e.data as GasData
      parts.push(GAS_LABELS[d.level] ?? String(d.level))
      notes = d.notes
      break
    }
    case 'medication': {
      const d = e.data as MedicationData
      parts.push([d.name, [d.dose, d.unit].filter(Boolean).join(' ')].filter(Boolean).join(' · '))
      notes = d.notes
      break
    }
    case 'document': {
      const d = e.data as DocumentData
      parts.push(`${t(`doc_${d.kind}` as TKey)}: ${d.title || '—'}`)
      if (d.files?.length) parts.push(`${d.files.length} ${t('files').toLowerCase()}`)
      if (d.appointmentLabel) parts.push(`${t('linkedAppt')}: ${d.appointmentLabel}`)
      notes = d.notes
      break
    }
    case 'appointment': {
      const d = e.data as AppointmentData
      parts.push(apptLabel(d, t))
      if (d.title?.trim()) parts.push(t(`appt_${d.kind}` as TKey))
      if (d.place?.trim()) parts.push(d.place.trim())
      if (d.doctor?.trim()) parts.push(d.doctor.trim())
      notes = d.notes
      break
    }
  }
  if (withNotes && notes?.trim()) parts.push(`“${notes.trim()}”`)
  return parts.join(' — ')
}
