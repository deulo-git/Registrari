import { useMemo, useState } from 'react'
import { useEntries } from '../lib/data'
import { useAuth } from '../lib/auth'
import { useI18n, type TKey } from '../lib/i18n'
import { addDays, cap, dayKey, fmtDate, parseDayKey, sameDay, startOfDay } from '../lib/format'
import { ENTRY_TYPES, TYPE_COLOR, type Entry, type EntryType } from '../lib/types'
import { Timeline } from '../components/Timeline'
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, DownloadIcon, SettingsIcon, TypeIcon } from '../components/Icons'
import { ExportDialog } from '../components/ExportDialog'

const FILTER_KEY = 'registrari.calFilter'
function readFilter(): EntryType[] {
  try {
    const v = JSON.parse(localStorage.getItem(FILTER_KEY) ?? 'null')
    if (Array.isArray(v) && v.length) return v.filter((x) => (ENTRY_TYPES as readonly string[]).includes(x))
  } catch { /* ignore */ }
  return [...ENTRY_TYPES]
}

export function TypeFilter({ value, onChange }: { value: EntryType[]; onChange: (v: EntryType[]) => void }) {
  const { t } = useI18n()
  const all = value.length === ENTRY_TYPES.length
  return (
    <div className="filter-chips">
      <button type="button" className={'fchip' + (all ? ' on' : '')} onClick={() => onChange([...ENTRY_TYPES])}>{t('all')}</button>
      {ENTRY_TYPES.map((ty) => {
        const on = !all && value.includes(ty)
        return (
          <button key={ty} type="button" className={'fchip' + (on ? ' on' : '')}
            style={{ '--c': TYPE_COLOR[ty] } as React.CSSProperties}
            onClick={() => {
              if (all) onChange([ty])
              else if (on) onChange(value.length === 1 ? [...ENTRY_TYPES] : value.filter((x) => x !== ty))
              else onChange([...value, ty])
            }}>
            <TypeIcon type={ty} size={14} color={on ? '#fff' : TYPE_COLOR[ty]} /> {t(`type_${ty}` as TKey)}
          </button>
        )
      })}
    </div>
  )
}

/** Cronologia: the records in order, with the calendar as a collapsible helper. */
export function Calendar({ initialDay, onEdit, onOpenDay, onSettings }: {
  /** Day to open on (the one shown in Today). */
  initialDay: Date; onEdit: (e: Entry) => void; onOpenDay: (d: Date) => void; onSettings: () => void
}) {
  const { t, locale } = useI18n()
  const { can } = useAuth()
  const [month, setMonth] = useState(() => { const d = startOfDay(initialDay); d.setDate(1); return d })
  const [selected, setSelected] = useState(() => startOfDay(initialDay))
  const [filter, setFilterState] = useState<EntryType[]>(readFilter)
  const [exporting, setExporting] = useState(false)
  // The calendar always starts folded.
  const [calOpen, setCalOpen] = useState(false)
  const setFilter = (v: EntryType[]) => {
    setFilterState(v)
    try { localStorage.setItem(FILTER_KEY, JSON.stringify(v)) } catch { /* ignore */ }
  }
  // Grid starts on Monday.
  const gridStart = useMemo(() => addDays(month, -((month.getDay() + 6) % 7)), [month])
  const gridEnd = useMemo(() => addDays(gridStart, 42), [gridStart])
  const { entries, loading } = useEntries(gridStart, gridEnd, filter, { keepPrevious: true })

  const byDay = useMemo(() => {
    const m = new Map<string, Entry[]>()
    for (const e of entries) {
      const k = dayKey(new Date(e.occurred_at))
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(e)
    }
    return m
  }, [entries])

  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const today = new Date()
  const selEntries = byDay.get(dayKey(selected)) ?? []
  const weekdays = t('weekdaysShort').split(',')
  // Calendar closed: every day of the month with records, newest first.
  const monthDays = useMemo(() => {
    const out: { day: Date; list: Entry[] }[] = []
    for (const [k, list] of byDay) {
      const day = parseDayKey(k)
      if (day.getMonth() === month.getMonth() && day.getFullYear() === month.getFullYear()) out.push({ day, list })
    }
    return out.sort((a, b) => b.day.getTime() - a.day.getTime())
  }, [byDay, month])

  return (
    <div className="screen calendar">
      <div className="screen-head">
        <h1>{t('timeline')}</h1>
        <div className="head-actions">
          <button type="button" className={'btn ghost small cal-toggle' + (calOpen ? ' open' : '')} aria-expanded={calOpen}
            onClick={() => setCalOpen(!calOpen)}>
            <CalendarIcon size={16} /> {t('showCalendar')} <ChevronDown size={16} />
          </button>
          <button type="button" className="icon-btn" onClick={onSettings} aria-label={t('settings')}><SettingsIcon size={22} /></button>
        </div>
      </div>

      <div className="cal-head">
        <button type="button" className="icon-btn" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="←"><ChevronLeft /></button>
        <h2>{cap(fmtDate(month, locale, { month: 'long', year: 'numeric' }))}</h2>
        <button type="button" className="icon-btn" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="→"><ChevronRight /></button>
      </div>

      <TypeFilter value={filter} onChange={setFilter} />

      <div className={'cal-collapse' + (calOpen ? ' open' : '')}>
        <div className="cal-inner">
          <div className="cal-grid">
            {weekdays.map((w) => <div key={w} className="cal-wd">{w}</div>)}
            {days.map((d) => {
              const k = dayKey(d)
              const es = byDay.get(k) ?? []
              const types = ENTRY_TYPES.filter((ty) => es.some((e) => e.type === ty))
              const out = d.getMonth() !== month.getMonth()
              return (
                <button key={k} type="button" tabIndex={calOpen ? 0 : -1}
                  className={'cal-day' + (out ? ' out' : '') + (sameDay(d, today) ? ' today' : '') + (sameDay(d, selected) ? ' sel' : '')}
                  onClick={() => setSelected(d)}>
                  <span className="cal-n">{d.getDate()}</span>
                  <span className="cal-dots">
                    {types.map((ty) => <i key={ty} style={{ background: TYPE_COLOR[ty] }} />)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <button type="button" className="btn primary export-btn" onClick={() => setExporting(true)}>
        <DownloadIcon size={18} /> {t('exportPdf')}
      </button>

      {calOpen ? (
        <>
          <div className="cal-day-head">
            <strong>{cap(fmtDate(selected, locale, { weekday: 'long', day: 'numeric', month: 'long' }))}</strong>
            {can.write && <button type="button" className="link-btn" onClick={() => onOpenDay(selected)}>{t('add')} +</button>}
          </div>
          <div className="cal-list">
            {loading && !selEntries.length ? null : <Timeline entries={selEntries} onSelect={onEdit} />}
          </div>
        </>
      ) : (
        <div className="cal-list">
          {!loading && !monthDays.length && <p className="empty">{t('noEntriesMonth')}</p>}
          {monthDays.map(({ day, list }) => (
            <section key={dayKey(day)} className="tl-day">
              <h3>{cap(fmtDate(day, locale, { weekday: 'long', day: 'numeric', month: 'long' }))}</h3>
              <Timeline entries={list} onSelect={onEdit} />
            </section>
          ))}
        </div>
      )}

      {exporting && (
        <ExportDialog
          initialFrom={month}
          initialTo={new Date(month.getFullYear(), month.getMonth() + 1, 0)}
          initialTypes={filter}
          onClose={() => setExporting(false)}
        />
      )}
    </div>
  )
}
