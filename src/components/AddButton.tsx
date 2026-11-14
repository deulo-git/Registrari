import { useEffect, useRef, useState } from 'react'
import { ENTRY_TYPES, TYPE_COLOR, type EntryType } from '../lib/types'
import { useI18n, type TKey } from '../lib/i18n'
import { PlusIcon, TypeIcon } from './Icons'

interface Props {
  open: boolean
  setOpen: (v: boolean) => void
  onPick: (t: EntryType) => void
  /** 0..1 — today's water progress, drawn as a ring around the button. */
  waterProgress: number
}

const RADIUS = 128

/**
 * The big central "+" button. Tapping it bursts the categories out around it
 * as coloured bubbles (Glovo-style); tapping one opens its form.
 */
export function AddButton({ open, setOpen, onPick, waterProgress }: Props) {
  const { t } = useI18n()
  const ringR = 88
  const circ = 2 * Math.PI * ringR
  const target = Math.max(0, Math.min(1, waterProgress))
  // Start from empty and let CSS animate up to the real value, so the ring
  // visibly fills when the screen opens and whenever water is added.
  const [p, setP] = useState(0)
  const prev = useRef(0)
  const [bump, setBump] = useState(0)
  useEffect(() => {
    const h = window.setTimeout(() => setP(target), 120)
    if (target > prev.current + 0.001 && prev.current > 0) setBump((b) => b + 1)
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
        <svg key={bump} className={'water-ring' + (bump ? ' bump' : '')} width="196" height="196" viewBox="0 0 196 196" aria-hidden="true">
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#38bdf8" />
              <stop offset="1" stopColor={TYPE_COLOR.water} />
            </linearGradient>
          </defs>
          <circle cx="98" cy="98" r={ringR} fill="none" stroke="var(--ring-track)" strokeWidth="7" />
          <circle className="ring-fill" cx="98" cy="98" r={ringR} fill="none" stroke="url(#ringGrad)" strokeWidth="7"
            strokeLinecap="round" strokeDasharray={`${circ * p} ${circ}`} transform="rotate(-90 98 98)"
            style={{ opacity: p > 0 ? 1 : 0 }} />
          {/* A drop that rides on the tip of the fill. */}
          <g className="ring-tip" style={{ transform: `rotate(${360 * p}deg)`, opacity: p > 0 && p < 1 ? 1 : 0 }}>
            <circle cx="98" cy={98 - ringR} r="6.5" fill="#fff" stroke={TYPE_COLOR.water} strokeWidth="2.5" />
          </g>
        </svg>
        {full && <span className="ring-stars"><i>✦</i><i>✦</i><i>✦</i><i>✦</i></span>}

        {ENTRY_TYPES.map((type, i) => {
          const a = (-90 + (360 / ENTRY_TYPES.length) * i) * (Math.PI / 180)
          const x = Math.cos(a) * RADIUS
          const y = Math.sin(a) * RADIUS
          return (
            <button
              key={type}
              type="button"
              className="bubble"
              tabIndex={open ? 0 : -1}
              aria-hidden={!open}
              style={{
                '--x': `${x}px`, '--y': `${y}px`, '--d': `${i * 28}ms`, '--c': TYPE_COLOR[type],
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
          <PlusIcon size={56} strokeWidth={2.4} color="#fff" />
        </button>
      </div>
    </>
  )
}
