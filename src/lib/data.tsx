import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchConfig, fetchEntries, onDataChange, saveConfig } from './api'
import { DEFAULT_CONFIG, type Config, type Entry, type EntryType } from './types'
import { usePin } from './pin'

interface ConfigApi {
  config: Config
  /** Saves the whole config (PIN-protected). Resolves false when cancelled. */
  updateConfig: (c: Config) => Promise<boolean>
}
const Ctx = createContext<ConfigApi | null>(null)

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { withPin } = usePin()
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)

  useEffect(() => {
    const load = () => fetchConfig().then(setConfig).catch(() => {})
    load()
    const onVis = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const updateConfig = useCallback(async (c: Config) => {
    const r = await withPin(async (pin) => { await saveConfig(pin, c); return true })
    if (r) setConfig(c)
    return !!r
  }, [withPin])

  return <Ctx.Provider value={{ config, updateConfig }}>{children}</Ctx.Provider>
}

export function useConfig() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useConfig outside provider')
  return v
}

/**
 * Entries in [from, to). Refetches after any write in this tab and when the
 * app comes back to the foreground (another phone may have added something).
 */
export function useEntries(from: Date, to: Date, types?: EntryType[]) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const fromMs = from.getTime()
  const toMs = to.getTime()
  const typesKey = types?.join(',') ?? ''

  useEffect(() => {
    let alive = true
    const load = () => {
      fetchEntries(new Date(fromMs), new Date(toMs), typesKey ? (typesKey.split(',') as EntryType[]) : undefined)
        .then((r) => { if (alive) setEntries(r) })
        .catch(() => {})
        .finally(() => { if (alive) setLoading(false) })
    }
    setLoading(true)
    load()
    const off = onDataChange(load)
    const onVis = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVis)
    return () => { alive = false; off(); document.removeEventListener('visibilitychange', onVis) }
  }, [fromMs, toMs, typesKey])

  return { entries, loading }
}
