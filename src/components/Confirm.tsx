import { useEffect, useState } from 'react'
import { TrashIcon } from './Icons'

/**
 * App-styled replacement for window.confirm(). Call confirmDialog() from
 * anywhere; <ConfirmHost/> (mounted once in App) shows it.
 */
interface Req {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  danger?: boolean
  resolve: (ok: boolean) => void
}

const EVT = 'registrari:confirm'

export function confirmDialog(o: Omit<Req, 'resolve'>): Promise<boolean> {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent(EVT, { detail: { ...o, resolve } }))
  })
}

export function ConfirmHost() {
  const [req, setReq] = useState<Req | null>(null)
  useEffect(() => {
    const on = (e: Event) => setReq((e as CustomEvent<Req>).detail)
    window.addEventListener(EVT, on)
    return () => window.removeEventListener(EVT, on)
  }, [])
  useEffect(() => {
    if (!req) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  if (!req) return null
  const close = (ok: boolean) => { req.resolve(ok); setReq(null) }
  return (
    <div className="confirm-overlay" onClick={() => close(false)}>
      <div className="confirm-box" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}>
        <span className={'confirm-icon' + (req.danger ? ' danger' : '')}><TrashIcon size={26} /></span>
        <h2 id="confirm-title">{req.title}</h2>
        <p>{req.message}</p>
        <div className="confirm-actions">
          <button type="button" className="btn ghost" onClick={() => close(false)}>{req.cancelLabel}</button>
          <button type="button" className={'btn primary' + (req.danger ? ' danger-fill' : '')} autoFocus
            onClick={() => close(true)}>{req.confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
