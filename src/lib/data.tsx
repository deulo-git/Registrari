import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { configFrom, fetchEntries, onDataChange, saveConfig } from './api'
import { type Config, type Entry, type EntryType } from './types'
import { useAuth } from './auth'

interface ConfigApi {
  config: Config
  /** True once the account finished loading (for the loading screen). */
  loaded: boolean
  /** Saves the whole config of the data on screen. Resolves false when not allowed or failed. */
  updateConfig: (c: Config) => Promise<boolean>
}
const Ctx = createContext<ConfigApi | null>(null)

/** Settings live in the owner's profile; helpers read them, owners and "full" helpers change them. */
export function ConfigProvider({ children }: { children: ReactNode }) {
  const { active, status, can, refresh } = useAuth()
  const config = useMemo(() => configFrom(active?.profile), [active])
  const updateConfig = useCallback(async (c: Config) => {
    if (!can.admin) return false
    try { await saveConfig(c); await refresh(); return true } catch { return false }
  }, [can.admin, refresh])
  return <Ctx.Provider value={{ config, loaded: status !== 'loading', updateConfig }}>{children}</Ctx.Provider>
}

export function useConfig() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useConfig outside provider')
  return v
}

/**
 * Entries in [from, to). Refetches after any write in this tab and when the
 * app comes back to the foreground (another phone may have added something).
 * keepPrevious: while a new range loads, keep showing the previous one's
 * entries instead of none (e.g. the calendar switching months).
 */
export function useEntries(from: Date, to: Date, types?: EntryType[], opts: { keepPrevious?: boolean } = {}) {
  // Entries are tagged with the range they belong to, so a screen never shows
  // the previous day's entries under the new day while the new ones load.
  const [state, setState] = useState<{ key: string; entries: Entry[] }>({ key: '', entries: [] })
  const fromMs = from.getTime()
  const toMs = to.getTime()
  const typesKey = types?.join(',') ?? ''
  const key = `${fromMs}|${toMs}|${typesKey}`

  useEffect(() => {
    let alive = true
    const load = () => {
      fetchEntries(new Date(fromMs), new Date(toMs), typesKey ? (typesKey.split(',') as EntryType[]) : undefined)
        .then((r) => { if (alive) setState({ key: `${fromMs}|${toMs}|${typesKey}`, entries: r }) })
        .catch(() => {
          // Offline: keep what this range already had; never reuse another range's entries.
          const k = `${fromMs}|${toMs}|${typesKey}`
          if (alive) setState((s) => (s.key === k ? s : { key: k, entries: [] }))
        })
    }
    load()
    const off = onDataChange(load)
    const onVis = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVis)
    return () => { alive = false; off(); document.removeEventListener('visibilitychange', onVis) }
  }, [fromMs, toMs, typesKey])

  const ready = state.key === key
  return { entries: ready || opts.keepPrevious ? state.entries : [], loading: !ready }
}
