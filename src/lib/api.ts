import { createClient } from '@supabase/supabase-js'
import { DEFAULT_CONFIG, type Config, type Entry, type EntryType, type FoodItem, type StoredFile } from './types'

export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY, {
  auth: { persistSession: false },
})

/**
 * Writes need the shared PIN. Once it has been accepted on a device it is kept
 * in localStorage, so the daily user is not asked every time; "forget" in
 * settings clears it.
 */
const PIN_KEY = 'registrari.pin'
export function getStoredPin(): string | null {
  try { return localStorage.getItem(PIN_KEY) } catch { return null }
}
export function storePin(pin: string | null) {
  try {
    if (pin) localStorage.setItem(PIN_KEY, pin)
    else localStorage.removeItem(PIN_KEY)
  } catch { /* ignore */ }
}

export type RpcError = 'bad_pin' | 'locked' | 'no_pin' | 'invalid_pin' | 'network' | string
export class ApiError extends Error {
  constructor(public code: RpcError) { super(code) }
}

async function rpc<T = Record<string, unknown>>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw new ApiError('network')
  const res = data as { ok: boolean; error?: string } & T
  if (!res.ok) throw new ApiError(res.error ?? 'unknown')
  return res
}

// ── Change notifications: screens refetch when anything was written. ──
const listeners = new Set<() => void>()
export function onDataChange(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
export function emitDataChange() { listeners.forEach((f) => f()) }

// ── PIN ──
export async function pinStatus(): Promise<{ has_pin: boolean; locked: boolean }> {
  const { data, error } = await supabase.rpc('pin_status')
  if (error) throw new ApiError('network')
  return data
}
export const checkPin = (pin: string) => rpc('check_pin', { p_pin: pin })
export const setPin = (oldPin: string | null, newPin: string) => rpc('set_pin', { p_old: oldPin, p_new: newPin })

// ── Entries ──
export async function fetchEntries(from: Date, to: Date, types?: EntryType[]): Promise<Entry[]> {
  const out: Entry[] = []
  const page = 1000
  for (let offset = 0; ; offset += page) {
    let q = supabase
      .from('entries')
      .select('*')
      .gte('occurred_at', from.toISOString())
      .lt('occurred_at', to.toISOString())
      .order('occurred_at', { ascending: true })
      .range(offset, offset + page - 1)
    if (types && types.length) q = q.in('type', types)
    const { data, error } = await q
    if (error) throw new ApiError('network')
    out.push(...(data as Entry[]))
    if (!data || data.length < page) break
  }
  return out
}

export async function saveEntry(pin: string, e: { id?: string; type: EntryType; occurred_at: string; data: unknown }) {
  const r = await rpc<{ id: string }>('save_entry', {
    p_pin: pin, p_id: e.id ?? null, p_type: e.type, p_occurred_at: e.occurred_at, p_data: e.data,
  })
  emitDataChange()
  return r.id
}

export async function deleteEntry(pin: string, id: string) {
  const r = await rpc<{ paths: string[] }>('delete_entry', { p_pin: pin, p_id: id })
  if (r.paths?.length) await supabase.storage.from('documents').remove(r.paths)
  emitDataChange()
}

// ── Settings ──
export async function fetchConfig(): Promise<Config> {
  const { data, error } = await supabase.from('app_settings').select('value').eq('key', 'config').maybeSingle()
  if (error) throw new ApiError('network')
  return { ...DEFAULT_CONFIG, ...((data?.value as Partial<Config>) ?? {}) }
}
export async function saveConfig(pin: string, c: Config) {
  await rpc('save_setting', { p_pin: pin, p_key: 'config', p_value: c })
}

// ── Files ──
export async function uploadFile(pin: string, file: File): Promise<StoredFile> {
  const ext = (file.name.split('.').pop() || (file.type === 'application/pdf' ? 'pdf' : 'jpg')).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin'
  const { path } = await rpc<{ path: string }>('issue_upload', { p_pin: pin, p_ext: ext })
  const { error } = await supabase.storage.from('documents').upload(path, file, { contentType: file.type || undefined })
  if (error) throw new ApiError('network')
  return { path, name: file.name, mime: file.type, size: file.size }
}

export async function fileUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, 60 * 60)
  if (error || !data) throw new ApiError('network')
  return data.signedUrl
}

// ── AI nutrition (edge function "nutrition", Gemini behind it) ──
export async function estimateNutrition(pin: string, lang: string, items: FoodItem[]): Promise<FoodItem[]> {
  const { data, error } = await supabase.functions.invoke('nutrition', {
    body: { pin, lang, items: items.map((i) => ({ name: i.name, qty: i.qty, unit: i.unit })) },
  })
  if (error) throw new ApiError('ai_error')
  if (!data?.ok) throw new ApiError(data?.error ?? 'ai_error')
  return data.items as FoodItem[]
}
