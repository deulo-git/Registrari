import { useEffect, useMemo, useRef, useState } from 'react'
import { useEntries, useConfig } from '../lib/data'
import { useI18n, type TKey } from '../lib/i18n'
import { addDays, cap, fmtDate, sameDay, startOfDay } from '../lib/format'
import { ENTRY_TYPES, GAS_LABELS, TYPE_COLOR, isPlainWater, type EntryType, symptomList, type SymptomData, type GasData, type WaterData } from '../lib/types'
import { fmtMl } from '../lib/format'
import { AddButton } from '../components/AddButton'
import { Pet, callPet } from '../components/Pet'
import { ChevronLeft, ChevronRight } from '../components/Icons'

interface Props {
  /** False while another tab is shown (the screen stays mounted so Pipa carries on). */
  active: boolean
  day: Date
  setDay: (d: Date) => void
  onAdd: (t: EntryType) => void
  /** Tapping the date (not the arrows) opens the calendar on that day. */
  onOpenCalendar: (d: Date) => void
}

/** Horizontal drag (px) that changes the day when released. */
const SWIPE = 45
/** How long the old date takes to slide out before the new one slides in. */
const OUT_MS = 170

/**
 * Today screen, exactly the size of the viewport (no scrolling either way):
 * day picker on top, a one-line-per-kind summary of the day's records, the big
 * + button at the vertical centre of the screen, and Pipa walking below it,
 * just above the tab bar. The full entries live in the calendar: tapping the
 * date goes there. Swiping left/right anywhere
 * changes day (the button's water is that day's water). Tapping empty space
 * calls Pipa back when she has wandered off.
 */
export function Today({ active, day, setDay, onAdd, onOpenCalendar }: Props) {
  const { t, locale } = useI18n()
  const { config } = useConfig()
  const [open, setOpen] = useState(false)
  const [slide, setSlide] = useState<'' | 'from-left' | 'from-right'>('')
  const [drag, setDrag] = useState(0)
  /** -1/1 while the current date slides out to the right/left. */
  const [leaving, setLeaving] = useState(0)
  const [entering, setEntering] = useState(true)
  const from = useMemo(() => startOfDay(day), [day])
  const to = useMemo(() => addDays(from, 1), [from])
  const { entries } = useEntries(from, to)

  const isToday = sameDay(day, new Date())
  const isYesterday = sameDay(day, addDays(new Date(), -1))
  // Only plain water fills the button (other drinks are logged but don't count).
  const waterMl = entries
    .filter((e) => isPlainWater(e.data as WaterData))
    .reduce((s, e) => s + ((e.data as WaterData).ml || 0), 0)
  const water = waterMl / (config.waterGoalMl || 2000)

  // One chip per kind of record logged that day: "2 àpats", "> 2 ventilacions"...
  // Plain water and other drinks are told apart, as in the button.
  const summary = useMemo(() => {
    const out: { key: string; type: EntryType; text: string }[] = []
    const otherMl = entries
      .filter((e) => e.type === 'water' && !isPlainWater(e.data as WaterData))
      .reduce((s, e) => s + ((e.data as WaterData).ml || 0), 0)
    if (waterMl > 0) out.push({ key: 'aigua', type: 'water', text: `${t('drinkWater')} ${fmtMl(waterMl)}` })
    if (otherMl > 0) out.push({ key: 'liq', type: 'water', text: `${t('sumPl_water')} ${fmtMl(otherMl)}` })
    for (const type of ENTRY_TYPES) {
      if (type === 'water') continue
      const list = entries.filter((e) => e.type === type)
      if (!list.length) continue
      if (type === 'gas') {
        const top = Math.max(...list.map((e) => (e.data as GasData).level ?? 0))
        out.push({ key: type, type, text: `${GAS_LABELS[top] ?? top} ${t('sumPl_gas')}` })
      } else if (type === 'symptom') {
        const n = list.reduce((s, e) => s + Math.max(1, symptomList(e.data as SymptomData).length), 0)
        out.push({ key: type, type, text: `${n} ${t(n === 1 ? 'type_symptom' : 'type_symptoms').toLowerCase()}` })
      } else {
        const label = list.length === 1 ? t(`type_${type}` as TKey).toLowerCase() : t(`sumPl_${type}` as TKey)
        out.push({ key: type, type, text: `${list.length} ${label}` })
      }
    }
    return out
  }, [entries, waterMl, t])

  // Coming back to this tab: play the entrance animation again (Pipa is not
  // re-created, she just carries on).
  const wasActive = useRef(active)
  useEffect(() => {
    if (active && !wasActive.current) setEntering(true)
    wasActive.current = active
  }, [active])
  useEffect(() => {
    if (!entering) return
    const h = window.setTimeout(() => setEntering(false), 900)
    return () => window.clearTimeout(h)
  }, [entering])

  /** The date slides out (OUT_MS), then the new one slides in from the other side. */
  const changeTo = (target: Date, forward: boolean) => {
    if (leaving) return
    setLeaving(forward ? 1 : -1)
    window.setTimeout(() => {
      setSlide(forward ? 'from-right' : 'from-left')
      setDay(target)
      setLeaving(0)
      setDrag(0)
    }, OUT_MS)
  }
  const go = (delta: number) => {
    if (delta > 0 && isToday) return
    changeTo(addDays(day, delta), delta > 0)
  }
  const goToday = () => changeTo(startOfDay(new Date()), true)

  // ── Swipe anywhere: the date follows the finger, release past SWIPE to change day ──
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
    setDrag(dx < 0 && isToday ? dx * 0.2 : dx * 0.6)
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current
    touch.current = null
    if (!s?.horizontal || open) { setDrag(0); return }
    const dx = e.changedTouches[0].clientX - s.x
    const delta = dx < 0 ? 1 : -1
    if (Math.abs(dx) > SWIPE && !(delta > 0 && isToday)) go(delta)
    else setDrag(0)
  }

  return (
    <div className={'screen today-screen' + (entering ? ' entering' : '')} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      onTouchCancel={() => { touch.current = null; setDrag(0) }}>
      <div className="day-nav" aria-hidden={open}>
        <button type="button" className="day-arrow" onClick={() => go(-1)} aria-label="←"><ChevronLeft size={26} /></button>
        <button type="button" className={'day-title ' + slide} key={day.getTime()}
          onClick={() => onOpenCalendar(day)} aria-label={t('calendar')}
          style={leaving
            ? { transform: `translateX(${leaving > 0 ? -50 : 50}%)`, opacity: 0, transition: `transform ${OUT_MS}ms ease-in, opacity ${OUT_MS}ms ease-in` }
            : drag ? { transform: `translateX(${drag}px)`, transition: 'none' } : undefined}>
          <strong>{isToday ? t('today') : isYesterday ? t('yesterday') : cap(fmtDate(day, locale, { weekday: 'long' }))}</strong>
          <small>{isToday ? fmtDate(day, locale) : fmtDate(day, locale, { day: 'numeric', month: 'short', year: 'numeric' })}</small>
        </button>
        {!isToday && (
          <button type="button" className="today-pill" onClick={goToday}>{t('backToToday')}</button>
        )}
        <button type="button" className="day-arrow" onClick={() => go(1)} disabled={isToday} aria-label="→"><ChevronRight size={26} /></button>
      </div>

      <ul className="day-summary" aria-label={t('sumTitle')}>
        {summary.length === 0
          ? <li className="sum-none">{t('sumNone')}</li>
          : summary.map((x) => (
            <li key={x.key} style={{ '--c': TYPE_COLOR[x.type] } as React.CSSProperties}>
              <button type="button" className="sum-chip" onClick={() => onOpenCalendar(day)}>{x.text}</button>
            </li>
          ))}
      </ul>

      <section className="hero" onClick={(e) => {
        if (!(e.target as HTMLElement).closest('.add-hub, .pet, .poop')) callPet()
      }}>
        <Pet hidden={open || !active} water={water} />
        <AddButton open={open} setOpen={setOpen} onPick={onAdd} waterProgress={water} />
      </section>
    </div>
  )
}
