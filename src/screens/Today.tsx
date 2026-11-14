import { useMemo, useRef, useState } from 'react'
import { useEntries, useConfig } from '../lib/data'
import { useI18n, type TKey } from '../lib/i18n'
import { addDays, cap, fmtDate, sameDay, startOfDay } from '../lib/format'
import { ENTRY_TYPES, TYPE_COLOR, isPlainWater, type Entry, type EntryType, type WaterData } from '../lib/types'
import { AddButton } from '../components/AddButton'
import { Timeline } from '../components/Timeline'
import { ChevronLeft, ChevronRight, TypeIcon } from '../components/Icons'

interface Props {
  day: Date
  setDay: (d: Date) => void
  onAdd: (t: EntryType) => void
  onEdit: (e: Entry) => void
}

/** Horizontal swipe distance (px) that changes the day. */
const SWIPE = 60

export function Today({ day, setDay, onAdd, onEdit }: Props) {
  const { t, locale } = useI18n()
  const { config } = useConfig()
  const [open, setOpen] = useState(false)
  const [slide, setSlide] = useState<'' | 'from-left' | 'from-right'>('')
  const from = useMemo(() => startOfDay(day), [day])
  const to = useMemo(() => addDays(from, 1), [from])
  const { entries } = useEntries(from, to)

  const isToday = sameDay(day, new Date())
  const isYesterday = sameDay(day, addDays(new Date(), -1))
  // The ring counts plain water only; other drinks are logged but don't fill it.
  const waterMl = entries
    .filter((e) => e.type === 'water' && isPlainWater(e.data as WaterData))
    .reduce((s, e) => s + ((e.data as WaterData).ml || 0), 0)
  const counts = ENTRY_TYPES.map((ty) => ({ ty, n: entries.filter((e) => e.type === ty).length })).filter((c) => c.n)

  const go = (delta: number) => {
    if (delta > 0 && isToday) return
    setSlide(delta > 0 ? 'from-right' : 'from-left')
    setDay(addDays(day, delta))
  }

  // ── Swipe left/right anywhere on the screen to change day ──
  const touch = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    if (open) return
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current
    touch.current = null
    if (!s || open) return
    const dx = e.changedTouches[0].clientX - s.x
    const dy = e.changedTouches[0].clientY - s.y
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1)
  }

  return (
    <div className="screen today" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <section className="hero">
        <AddButton open={open} setOpen={setOpen} onPick={onAdd} waterProgress={waterMl / (config.waterGoalMl || 2000)} />
      </section>

      <div className={'day-nav ' + slide} key={day.getTime()} aria-hidden={open}>
        <button type="button" className="day-arrow" onClick={() => go(-1)} aria-label="←"><ChevronLeft size={26} /></button>
        <div className="day-title">
          <strong>{isToday ? t('today') : isYesterday ? t('yesterday') : cap(fmtDate(day, locale, { weekday: 'long' }))}</strong>
          <small>{fmtDate(day, locale)}</small>
        </div>
        <button type="button" className="day-arrow" onClick={() => go(1)} disabled={isToday} aria-label="→"><ChevronRight size={26} /></button>
      </div>
      <p className="swipe-hint">{t('swipeHint')}</p>

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
