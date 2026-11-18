import { createClient, type Session } from '@supabase/supabase-js'
import {
  DEFAULT_CONFIG, DEFAULT_PET, type Config, type Entry, type EntryType, type FoodItem, type Profile, type PetProfile,
  type Share, type StoredFile,
} from './types'

export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export class ApiError extends Error {
  constructor(public code: string) { super(code) }
}

// ── Whose data is on screen: the user's own, or the owner who shared theirs with them ──
let activeOwner: string | null = null
export function setActiveOwner(id: string | null) { activeOwner = id }
export function getActiveOwner() { return activeOwner }
const owner = () => { if (!activeOwner) throw new ApiError('no_owner'); return activeOwner }

// ── Change notifications: screens refetch when anything was written. ──
const listeners = new Set<() => void>()
export function onDataChange(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
export function emitDataChange() { listeners.forEach((f) => f()) }

// ── Auth ──
export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
export const signOut = () => supabase.auth.signOut()
export async function currentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// ── Profiles & helpers ──
const toProfile = (r: Record<string, unknown>): Profile => ({
  ...(r as unknown as Profile),
  pet: { ...DEFAULT_PET, ...((r.pet as Partial<PetProfile>) ?? {}) },
  config: (r.config as Partial<Config>) ?? {},
})

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*')
  if (error) throw new ApiError('network')
  return (data ?? []).map(toProfile)
}

export type NewProfile = Pick<Profile, 'first_name' | 'last_name' | 'birth_date' | 'weight_kg' | 'height_cm' | 'pet'> & { email: string | null }
export async function createProfile(id: string, p: NewProfile): Promise<void> {
  const patientName = `${p.first_name} ${p.last_name}`.trim()
  const { error } = await supabase.from('profiles').insert({ id, ...p, config: { patientName } })
  if (error) throw new ApiError('network')
  // The first person to sign up takes the data that existed before accounts.
  await supabase.rpc('claim_legacy')
}

export async function updateProfile(id: string, patch: Partial<Omit<Profile, 'id'>>): Promise<void> {
  const { error } = await supabase.from('profiles').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new ApiError('network')
}

export async function linkShares() { await supabase.rpc('link_shares') }

/** Shares I gave (owner) and shares given to me (helper). */
export async function fetchShares(): Promise<Share[]> {
  const { data, error } = await supabase.from('shares').select('*').order('created_at')
  if (error) throw new ApiError('network')
  return (data ?? []) as Share[]
}
export async function saveShare(s: { owner_id: string; helper_email: string; level: Share['level']; types: EntryType[] }) {
  const { error } = await supabase.from('shares').upsert(
    { ...s, helper_email: s.helper_email.trim().toLowerCase() }, { onConflict: 'owner_id,helper_email' })
  if (error) throw new ApiError('network')
}
export async function deleteShare(id: string) {
  const { error } = await supabase.from('shares').delete().eq('id', id)
  if (error) throw new ApiError('network')
}

// ── Entries ──
export async function fetchEntries(from: Date, to: Date, types?: EntryType[]): Promise<Entry[]> {
  const o = owner()
  const out: Entry[] = []
  const page = 1000
  for (let offset = 0; ; offset += page) {
    let q = supabase
      .from('entries')
      .select('*')
      .eq('owner_id', o)
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

/** When the last bowel movement happened (null if none yet). */
export async function fetchLastBowel(): Promise<string | null> {
  const { data, error } = await supabase.from('entries').select('occurred_at').eq('owner_id', owner()).eq('type', 'bowel')
    .lte('occurred_at', new Date().toISOString()).order('occurred_at', { ascending: false }).limit(1)
  if (error) throw new ApiError('network')
  return (data as { occurred_at: string }[])[0]?.occurred_at ?? null
}

export async function saveEntry(e: { id?: string; type: EntryType; occurred_at: string; data: unknown }) {
  const id = e.id ?? crypto.randomUUID()
  const { error } = await supabase.from('entries').upsert({
    id, owner_id: owner(), type: e.type, occurred_at: e.occurred_at, data: e.data, updated_at: new Date().toISOString(),
  })
  if (error) throw new ApiError('network')
  emitDataChange()
  return id
}

export async function deleteEntry(entry: Entry) {
  const { error } = await supabase.from('entries').delete().eq('id', entry.id)
  if (error) throw new ApiError('network')
  const paths = ((entry.data as { files?: StoredFile[] }).files ?? []).map((f) => f.path)
  if (paths.length) await supabase.storage.from('documents').remove(paths)
  emitDataChange()
}

// ── Settings (stored in the owner's profile) ──
export function configFrom(p: Profile | undefined): Config {
  return { ...DEFAULT_CONFIG, ...(p?.config ?? {}) }
}
export async function saveConfig(c: Config) {
  await updateProfile(owner(), { config: c })
}

// ── Files (under <owner id>/) ──
export async function uploadFile(file: File): Promise<StoredFile> {
  const ext = (file.name.split('.').pop() || (file.type === 'application/pdf' ? 'pdf' : 'jpg')).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin'
  const path = `${owner()}/${crypto.randomUUID()}.${ext}`
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
export async function estimateNutrition(lang: string, items: FoodItem[]): Promise<FoodItem[]> {
  const { data, error } = await supabase.functions.invoke('nutrition', {
    body: { lang, items: items.map((i) => ({ name: i.name, qty: i.qty, unit: i.unit })) },
  })
  if (error) throw new ApiError('ai_error')
  if (!data?.ok) throw new ApiError(data?.error ?? 'ai_error')
  return data.items as FoodItem[]
}
