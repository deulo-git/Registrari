import { useMemo, useState } from 'react'
import { useEntries, useConfig } from '../lib/data'
import { useI18n, type TKey } from '../lib/i18n'
import { addDays, cap, fmtDate, fmtMl, sameDay, startOfDay } from '../lib/format'
import { ENTRY_TYPES, TYPE_COLOR, type Entry, type EntryType, type WaterData } from '../lib/types'
import { AddButton } from '../components/AddButton'
import { Timeline } from '../components/Timeline'
import { ChevronLeft, ChevronRight, TypeIcon } from '../components/Icons'

interface Props {
  day: Date
  setDay: (d: Date) => void
  onAdd: (t: EntryType) => void
  onEdit: (e: Entry) => void
}

export function Today({ day, setDay, onAdd, onEdit }: Props) {
  const { t, locale } = useI18n()
  const { config } = useConfig()
  const [open, setOpen] = useState(false)
  const from = useMemo(() => startOfDay(day), [day])
  const to = useMemo(() => addDays(from, 1), [from])
  const { entries } = useEntries(from, to)

  const isToday = sameDay(day, new Date())
  const isYesterday = sameDay(day, addDays(new Date(), -1))
  const waterMl = entries.filter((e) => e.type === 'water').reduce((s, e) => s + ((e.data as WaterData).ml || 0), 0)
  const counts = ENTRY_TYPES.map((ty) => ({ ty, n: entries.filter((e) => e.type === ty).length })).filter((c) => c.n && c.ty !== 'water')

  return (
    <div className="screen today">
      <div className="day-nav">
        <button type="button" className="icon-btn" onClick={() => setDay(addDays(day, -1))} aria-label="←"><ChevronLeft /></button>
        <div className="day-title">
          <strong>{isToday ? t('today') : isYesterday ? t('yesterday') : cap(fmtDate(day, locale, { weekday: 'long' }))}</strong>
          <small>{fmtDate(day, locale)}</small>
        </div>
        <button type="button" className="icon-btn" onClick={() => setDay(addDays(day, 1))} disabled={isToday} aria-label="→"><ChevronRight /></button>
      </div>

      <section className="hero">
        <AddButton open={open} setOpen={setOpen} onPick={onAdd} waterProgress={waterMl / (config.waterGoalMl || 2000)} />
        <p className="hero-caption" aria-hidden={open}>
          <span style={{ color: TYPE_COLOR.water }}>{fmtMl(waterMl)}</span>
          <small> / {fmtMl(config.waterGoalMl)}</small>
        </p>
      </section>

      {counts.length > 0 && (
        <div className="day-counts">
          {counts.map(({ ty, n }) => (
            <span key={ty} className="count-chip" style={{ '--c': TYPE_COLOR[ty] } as React.CSSProperties}>
              <TypeIcon type={ty} size={15} color={TYPE_COLOR[ty]} /> {n} {t(`type_${ty}` as TKey)}
            </span>
          ))}
        </div>
      )}

      <Timeline entries={[...entries].reverse()} onSelect={onEdit} empty={t('tapToAdd')} />
    </div>
  )
}
