import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { ApiError, checkPin, getStoredPin, pinStatus, setPin, storePin } from './api'
import { useI18n } from './i18n'
import { PinPad } from '../components/PinPad'
import { toast } from '../components/Toast'

type Mode = 'enter' | 'create'

interface PinApi {
  /**
   * Runs a write that needs the PIN. Uses the PIN remembered on this device,
   * asks for it (or asks to create one on a fresh install) when needed, and
   * asks again once if the server says the remembered PIN is no longer valid.
   * Returns undefined when the user cancelled.
   */
  withPin: <T>(action: (pin: string) => Promise<T>) => Promise<T | undefined>
}

const Ctx = createContext<PinApi | null>(null)

export function PinProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const [prompt, setPrompt] = useState<{ mode: Mode } | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const firstPin = useRef<string | null>(null)
  const resolver = useRef<((pin: string | null) => void) | null>(null)

  const requestPin = useCallback(async (): Promise<string | null> => {
    let mode: Mode = 'enter'
    try {
      const st = await pinStatus()
      if (!st.has_pin) mode = 'create'
      if (st.locked) { toast(t('pinLocked'), 'error'); return null }
    } catch { /* offline: try entering anyway */ }
    firstPin.current = null
    setError('')
    setPrompt({ mode })
    return new Promise((res) => { resolver.current = res })
  }, [t])

  const finish = (pin: string | null) => {
    setPrompt(null)
    resolver.current?.(pin)
    resolver.current = null
  }

  const onComplete = async (pin: string) => {
    if (!prompt) return
    setError('')
    if (prompt.mode === 'create') {
      if (!firstPin.current) { firstPin.current = pin; setPrompt({ mode: 'create' }); return }
      if (firstPin.current !== pin) { firstPin.current = null; setError(t('pinMismatch')); return }
      setBusy(true)
      try { await setPin(null, pin); storePin(pin); finish(pin) }
      catch (e) { setError(e instanceof ApiError && e.code === 'locked' ? t('pinLocked') : t('errorGeneric')) }
      finally { setBusy(false) }
      return
    }
    setBusy(true)
    try { await checkPin(pin); storePin(pin); finish(pin) }
    catch (e) {
      const code = e instanceof ApiError ? e.code : 'network'
      setError(code === 'locked' ? t('pinLocked') : code === 'bad_pin' ? t('pinWrong') : t('errorGeneric'))
    } finally { setBusy(false) }
  }

  const withPin = useCallback(async <T,>(action: (pin: string) => Promise<T>): Promise<T | undefined> => {
    let pin = getStoredPin() ?? (await requestPin())
    if (!pin) return undefined
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await action(pin)
      } catch (e) {
        if (e instanceof ApiError && (e.code === 'bad_pin' || e.code === 'no_pin') && attempt === 0) {
          storePin(null)
          pin = await requestPin()
          if (!pin) return undefined
          continue
        }
        if (e instanceof ApiError && e.code === 'locked') toast(t('pinLocked'), 'error')
        else toast(t('errorGeneric'), 'error')
        throw e
      }
    }
    return undefined
  }, [requestPin, t])

  const title = prompt?.mode === 'create'
    ? (firstPin.current ? t('pinRepeat') : t('pinCreate'))
    : t('pinEnter')
  const hint = prompt?.mode === 'create' ? t('pinCreateHint') : t('pinEnterHint')

  return (
    <Ctx.Provider value={{ withPin }}>
      {children}
      {prompt && (
        <PinPad
          key={prompt.mode + String(!!firstPin.current)}
          title={title}
          hint={hint}
          error={error}
          busy={busy}
          onComplete={onComplete}
          onCancel={() => finish(null)}
        />
      )}
    </Ctx.Provider>
  )
}

export function usePin() {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePin outside provider')
  return v
}
