import { useEffect, useRef, useState } from 'react'
import { ENTRY_TYPES, TYPE_COLOR, type EntryType } from '../lib/types'
import { useI18n, type TKey } from '../lib/i18n'
import { PlusIcon, TypeIcon } from './Icons'

interface Props {
  open: boolean
  setOpen: (v: boolean) => void
  onPick: (t: EntryType) => void
  /** 0..1 — today's water: the button fills with water up to this level (Pipa drinks from it). */
  waterProgress: number
}

/** The button sits at the bottom of the screen, so the bubbles fan out upwards. */
const RX = 138
const RY = 168
const FROM = -192
const TO = 12

/**
 * The big "+" button, at the bottom of the Today screen. It holds today's
 * water as a wavy fill that rises as water is logged. Tapping it fans the
 * categories out above it as coloured bubbles (Glovo-style).
 */
export function AddButton({ open, setOpen, onPick, waterProgress }: Props) {
  const { t } = useI18n()
  const target = Math.max(0, Math.min(1, waterProgress))
  // Start empty and let CSS animate up to the real level, so the water
  // visibly rises when the screen opens and whenever water is added.
  const [p, setP] = useState(0)
  const prev = useRef(0)
  const [splash, setSplash] = useState(0)
  useEffect(() => {
    const h = window.setTimeout(() => setP(target), 150)
    if (target > prev.current + 0.001 && prev.current > 0) setSplash((s) => s + 1)
    prev.current = target
    return () => window.clearTimeout(h)
  }, [target])
  const full = p >= 1

  return (
    <>
      {open && <div className="burst-backdrop" onClick={() => setOpen(false)} />}
      <div className={'add-hub' + (open ? ' open' : '') + (full ? ' full' : '')}>
        <span className="hub-ripple" />
        <span className="hub-ripple r2" />
        {full && <span className="ring-stars"><i>✦</i><i>✦</i><i>✦</i><i>✦</i></span>}

        {ENTRY_TYPES.map((type, i) => {
          const a = (FROM + ((TO - FROM) / (ENTRY_TYPES.length - 1)) * i) * (Math.PI / 180)
          const x = Math.cos(a) * RX
          const y = Math.sin(a) * RY
          return (
            <button
              key={type}
              type="button"
              className="bubble"
              tabIndex={open ? 0 : -1}
              aria-hidden={!open}
              style={{
                '--x': `${x}px`, '--y': `${y}px`, '--d': `${i * 30}ms`, '--c': TYPE_COLOR[type],
              } as React.CSSProperties}
              onClick={() => { setOpen(false); onPick(type) }}
            >
              <span className="bubble-dot"><TypeIcon type={type} size={26} color="#fff" /></span>
              <span className="bubble-label">{t(`type_${type}` as TKey)}</span>
            </button>
          )
        })}

        <button type="button" className="add-main" aria-expanded={open} aria-label={t('add')}
          onClick={() => setOpen(!open)}>
          <span className="water" style={{ height: `${p * 100}%` }} aria-hidden="true">
            <svg className="wave w1" viewBox="0 0 200 20" preserveAspectRatio="none">
              <path d="M0 10 Q25 0 50 10 T100 10 T150 10 T200 10 V20 H0Z" />
            </svg>
            <svg className="wave w2" viewBox="0 0 200 20" preserveAspectRatio="none">
              <path d="M0 10 Q25 20 50 10 T100 10 T150 10 T200 10 V20 H0Z" />
            </svg>
          </span>
          {splash > 0 && <span key={splash} className="splash"><i /><i /><i /><i /></span>}
          <span className="add-plus"><PlusIcon size={56} strokeWidth={2.4} color="#fff" /></span>
        </button>
      </div>
    </>
  )
}
