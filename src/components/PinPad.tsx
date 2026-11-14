import { useEffect, useState } from 'react'
import { LockIcon } from './Icons'
import { useI18n } from '../lib/i18n'

interface Props {
  title: string
  hint: string
  error: string
  busy: boolean
  onComplete: (pin: string) => void
  onCancel: () => void
}

/** Full-screen 4-digit keypad. Digits reset after each complete attempt. */
export function PinPad({ title, hint, error, busy, onComplete, onCancel }: Props) {
  const { t } = useI18n()
  const [digits, setDigits] = useState('')

  useEffect(() => {
    if (digits.length === 4) {
      onComplete(digits)
      setDigits('')
    }
  }, [digits, onComplete])

  const press = (d: string) => { if (!busy) setDigits((x) => (x.length < 4 ? x + d : x)) }
  const back = () => setDigits((x) => x.slice(0, -1))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') back()
      else if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="pin-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="pin-box">
        <div className="pin-lock"><LockIcon size={26} /></div>
        <h2>{title}</h2>
        <p className="muted">{hint}</p>
        <div className={'pin-dots' + (error ? ' shake' : '')} aria-live="polite">
          {[0, 1, 2, 3].map((i) => <span key={i} className={i < digits.length ? 'on' : ''} />)}
        </div>
        <p className="pin-error" role="alert">{error}</p>
        <div className="pin-keys">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} type="button" onClick={() => press(d)}>{d}</button>
          ))}
          <button type="button" className="pin-text" onClick={onCancel}>{t('cancel')}</button>
          <button type="button" onClick={() => press('0')}>0</button>
          <button type="button" className="pin-text" onClick={back} aria-label="⌫">⌫</button>
        </div>
      </div>
    </div>
  )
}
