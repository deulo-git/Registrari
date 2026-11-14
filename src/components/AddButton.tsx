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
  const p = Math.max(0, Math.min(1, waterProgress))

  return (
    <>
      {open && <div className="burst-backdrop" onClick={() => setOpen(false)} />}
      <div className={'add-hub' + (open ? ' open' : '')}>
        <svg className="water-ring" width="196" height="196" viewBox="0 0 196 196" aria-hidden="true">
          <circle cx="98" cy="98" r={ringR} fill="none" stroke="var(--ring-track)" strokeWidth="6" />
          {p > 0 && (
            <circle cx="98" cy="98" r={ringR} fill="none" stroke={TYPE_COLOR.water} strokeWidth="6"
              strokeLinecap="round" strokeDasharray={`${circ * p} ${circ}`} transform="rotate(-90 98 98)" />
          )}
        </svg>

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
