import { useMemo, useRef, useState } from 'react'
import { useEntries, useConfig } from '../lib/data'
import { useI18n, type TKey } from '../lib/i18n'
import { addDays, cap, fmtDate, sameDay, startOfDay } from '../lib/format'
import { ENTRY_TYPES, TYPE_COLOR, isPlainWater, type Entry, type EntryType, type WaterData } from '../lib/types'
import { AddButton } from '../components/AddButton'
import { Pet } from '../components/Pet'
import { Timeline } from '../components/Timeline'
import { ChevronLeft, ChevronRight, TypeIcon } from '../components/Icons'

interface Props {
  day: Date
  setDay: (d: Date) => void
  onAdd: (t: EntryType) => void
  onEdit: (e: Entry) => void
}

/** Horizontal drag (px) that changes the day when released. */
const SWIPE = 45

/**
 * Today screen: day picker on top, the day's entries in the middle, and the
 * big button with Pipa pinned at the bottom (above the tab bar).
 * The day content follows the finger while swiping left/right.
 */
export function Today({ day, setDay, onAdd, onEdit }: Props) {
  const { t, locale } = useI18n()
  const { config } = useConfig()
  const [open, setOpen] = useState(false)
  const [slide, setSlide] = useState<'' | 'from-left' | 'from-right'>('')
  const [drag, setDrag] = useState(0)
  const from = useMemo(() => startOfDay(day), [day])
  const to = useMemo(() => addDays(from, 1), [from])
  const { entries } = useEntries(from, to)

  const isToday = sameDay(day, new Date())
  const isYesterday = sameDay(day, addDays(new Date(), -1))
  // Only plain water fills the button (other drinks are logged but don't count).
  const waterMl = entries
    .filter((e) => e.type === 'water' && isPlainWater(e.data as WaterData))
    .reduce((s, e) => s + ((e.data as WaterData).ml || 0), 0)
  const water = waterMl / (config.waterGoalMl || 2000)
  const counts = ENTRY_TYPES.map((ty) => ({ ty, n: entries.filter((e) => e.type === ty).length })).filter((c) => c.n)

  const go = (delta: number) => {
    if (delta > 0 && isToday) return
    setSlide(delta > 0 ? 'from-right' : 'from-left')
    setDay(addDays(day, delta))
  }
  const goToday = () => {
    setSlide('from-right')
    setDay(startOfDay(new Date()))
  }

  // ── Swipe: the content follows the finger, release past SWIPE to change day ──
  const touch = useRef<{ x: number; y: number; horizontal: boolean | null } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    if (open) return
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, horizontal: null }
  }
  const onTouchMove = (e: React.TouchEvent) => {
    const s = touch.current
    if (!s) return
    const dx = e.touches[0].clientX - s.x
    const dy = e.touches[0].clientY - s.y
    if (s.horizontal === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) s.horizontal = Math.abs(dx) > Math.abs(dy)
    if (!s.horizontal) return
    // Resist when there is no "tomorrow" to go to.
    setDrag(dx < 0 && isToday ? dx * 0.2 : dx * 0.75)
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current
    touch.current = null
    setDrag(0)
    if (!s?.horizontal || open) return
    const dx = e.changedTouches[0].clientX - s.x
    if (Math.abs(dx) > SWIPE) go(dx < 0 ? 1 : -1)
  }

  return (
    <div className="screen today" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      onTouchCancel={() => { touch.current = null; setDrag(0) }}>
      <div className="day-nav" aria-hidden={open}>
        <button type="button" className="day-arrow" onClick={() => go(-1)} aria-label="←"><ChevronLeft size={26} /></button>
        <div className={'day-title ' + slide} key={day.getTime()}>
          <strong>{isToday ? t('today') : isYesterday ? t('yesterday') : cap(fmtDate(day, locale, { weekday: 'long' }))}</strong>
          <small>{fmtDate(day, locale)}</small>
        </div>
        {!isToday && (
          <button type="button" className="today-pill" onClick={goToday}>{t('backToToday')}</button>
        )}
        <button type="button" className="day-arrow" onClick={() => go(1)} disabled={isToday} aria-label="→"><ChevronRight size={26} /></button>
      </div>

      <div className={'day-content ' + slide} key={'c' + day.getTime()}
        style={{ transform: drag ? `translateX(${drag}px)` : undefined, transition: drag ? 'none' : undefined }}>
        {counts.length > 0 && (
          <div className="day-counts">
            {counts.map(({ ty, n }, i) => (
              <span key={ty + n} className="count-chip" style={{ '--c': TYPE_COLOR[ty], '--i': i } as React.CSSProperties}>
                <TypeIcon type={ty} size={15} color={TYPE_COLOR[ty]} /> {n} {t(`type_${ty}` as TKey)}
              </span>
            ))}
          </div>
        )}
        {entries.length > 0 && <Timeline entries={[...entries].reverse()} onSelect={onEdit} />}
      </div>

      <section className="hero">
        <Pet hidden={open} water={water} />
        <AddButton open={open} setOpen={setOpen} onPick={onAdd} waterProgress={water} />
      </section>
    </div>
  )
}
