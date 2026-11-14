import { useEffect, useState } from 'react'

type Kind = 'ok' | 'error'
const EVT = 'registrari:toast'

/** Fire-and-forget toast from anywhere. */
export function toast(message: string, kind: Kind = 'ok') {
  window.dispatchEvent(new CustomEvent(EVT, { detail: { message, kind } }))
}

export function ToastHost() {
  const [item, setItem] = useState<{ message: string; kind: Kind; id: number } | null>(null)
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail
      setItem({ ...d, id: Date.now() })
    }
    window.addEventListener(EVT, on)
    return () => window.removeEventListener(EVT, on)
  }, [])
  useEffect(() => {
    if (!item) return
    const h = setTimeout(() => setItem(null), 2600)
    return () => clearTimeout(h)
  }, [item])
  if (!item) return null
  return <div key={item.id} className={'toast ' + item.kind} role="status">{item.message}</div>
}
