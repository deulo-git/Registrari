import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  fetchProfiles, fetchShares, linkShares, setActiveOwner, signInWithGoogle, signOut as apiSignOut, supabase,
} from './api'
import type { EntryType, Profile, Share, ShareLevel } from './types'

/** One person's data the signed-in user can open: their own, or one shared with them. */
export interface Access { ownerId: string; profile: Profile; level: 'owner' | ShareLevel; types: EntryType[] }

type Status = 'loading' | 'signedOut' | 'needsProfile' | 'ready'

interface AuthApi {
  status: Status
  user: User | null
  /** The signed-in user's own profile. */
  me: Profile | undefined
  access: Access[]
  /** Whose data is on screen. */
  active: Access | undefined
  /** What the user may do with the data on screen. */
  can: { write: boolean; admin: boolean; share: boolean }
  /** Shares I gave to helpers. */
  myShares: Share[]
  switchOwner: (id: string) => void
  refresh: () => Promise<void>
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthApi | null>(null)
const OWNER_KEY = 'registrari.owner'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [me, setMe] = useState<Profile | undefined>()
  const [access, setAccess] = useState<Access[]>([])
  const [myShares, setMyShares] = useState<Share[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const userRef = useRef<User | null>(null)

  const load = useCallback(async (u: User | null) => {
    userRef.current = u
    setUser(u)
    if (!u) { setActiveOwner(null); setMe(undefined); setAccess([]); setStatus('signedOut'); return }
    try {
      await linkShares()
      const [profiles, shares] = await Promise.all([fetchProfiles(), fetchShares()])
      const mine = profiles.find((p) => p.id === u.id)
      setMyShares(shares.filter((s) => s.owner_id === u.id))
      if (!mine) { setMe(undefined); setAccess([]); setStatus('needsProfile'); return }
      const list: Access[] = [{ ownerId: mine.id, profile: mine, level: 'owner', types: [] }]
      for (const s of shares) {
        if (s.helper_id !== u.id) continue
        const p = profiles.find((x) => x.id === s.owner_id)
        if (p) list.push({ ownerId: p.id, profile: p, level: s.level, types: s.types })
      }
      let saved: string | null = null
      try { saved = localStorage.getItem(OWNER_KEY) } catch { /* ignore */ }
      const pick = list.find((a) => a.ownerId === saved) ?? list[0]
      setActiveOwner(pick.ownerId)
      setMe(mine); setAccess(list); setActiveId(pick.ownerId); setStatus('ready')
    } catch {
      // Offline: keep whatever we had; first load falls back to the sign-in screen.
      setStatus((s) => (s === 'loading' ? 'signedOut' : s))
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => load(data.session?.user ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // Token refreshes keep the same user: nothing to reload.
      if (event === 'TOKEN_REFRESHED' && session?.user.id === userRef.current?.id) return
      if (event === 'INITIAL_SESSION') return
      window.setTimeout(() => load(session?.user ?? null), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [load])

  const active = access.find((a) => a.ownerId === activeId)
  const can = useMemo(() => {
    const l = active?.level
    return { write: l === 'owner' || l === 'full' || l === 'edit', admin: l === 'owner' || l === 'full', share: l === 'owner' }
  }, [active])

  const switchOwner = useCallback((id: string) => {
    try { localStorage.setItem(OWNER_KEY, id) } catch { /* ignore */ }
    setActiveOwner(id)
    setActiveId(id)
  }, [])
  const refresh = useCallback(() => load(userRef.current), [load])

  const value: AuthApi = {
    status, user, me, access, active, can, myShares, switchOwner, refresh,
    signIn: async () => { await signInWithGoogle() },
    signOut: async () => { await apiSignOut(); try { localStorage.removeItem(OWNER_KEY) } catch { /* ignore */ } },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth outside provider')
  return v
}
