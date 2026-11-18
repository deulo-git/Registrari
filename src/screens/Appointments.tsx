import { useMemo, useState } from 'react'
import { useEntries } from '../lib/data'
import { useI18n, type TKey } from '../lib/i18n'
import { apptLabel, cap, fmtDate, fmtTime } from '../lib/format'
import { APPOINTMENT_KINDS, TYPE_COLOR, apptGroup, type AppointmentData, type Entry } from '../lib/types'
import { PlusIcon, SettingsIcon, TypeIcon } from '../components/Icons'

/** Every appointment the patient has had, newest first, grouped by year. */
export function Appointments({ onAdd, onEdit, onSettings }: { onAdd: () => void; onEdit: (e: Entry) => void; onSettings: () => void }) {
  const { t, locale } = useI18n()
  const from = useMemo(() => new Date(2000, 0, 1), [])
  const to = useMemo(() => new Date(2100, 0, 1), [])
  const { entries, loading } = useEntries(from, to, ['appointment'])
  const [group, setGroup] = useState<string>('all')
  const now = Date.now()

  const list = useMemo(() => [...entries]
    .filter((e) => group === 'all' || apptGroup((e.data as AppointmentData).kind) === group)
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()), [entries, group])

  const byYear = useMemo(() => {
    const m = new Map<number, Entry[]>()
    for (const e of list) {
      const y = new Date(e.occurred_at).getFullYear()
      if (!m.has(y)) m.set(y, [])
      m.get(y)!.push(e)
    }
    return [...m.entries()]
  }, [list])

  return (
    <div className="screen appointments">
      <div className="screen-head">
        <h1>{t('appointments')}</h1>
        <div className="head-actions">
          <button type="button" className="btn primary small" onClick={onAdd}><PlusIcon size={18} /> {t('add')}</button>
          <button type="button" className="icon-btn" onClick={onSettings} aria-label={t('settings')}><SettingsIcon size={22} /></button>
        </div>
      </div>

      <div className="filter-chips">
        <button type="button" className={'fchip' + (group === 'all' ? ' on' : '')} onClick={() => setGroup('all')}>{t('all')}</button>
        {APPOINTMENT_KINDS.map((k) => (
          <button key={k} type="button" className={'fchip' + (group === k ? ' on' : '')}
            style={{ '--c': TYPE_COLOR.appointment } as React.CSSProperties} onClick={() => setGroup(k)}>
            {t(`appt_${k}` as TKey)}
          </button>
        ))}
      </div>

      {!loading && !list.length && <p className="empty">{t('noAppointments')}</p>}
      {byYear.map(([year, items]) => (
        <section key={year} className="appt-year">
          <h3>{year}</h3>
          <ul className="appt-list">
            {items.map((e) => {
              const d = e.data as AppointmentData
              const date = new Date(e.occurred_at)
              const future = date.getTime() > now
              const meta = [d.place?.trim(), d.doctor?.trim()].filter(Boolean).join(' · ')
              return (
                <li key={e.id}>
                  <button type="button" className={'appt-item' + (future ? ' future' : '')} onClick={() => onEdit(e)}>
                    <span className="appt-date">
                      <b>{date.getDate()}</b>
                      <small>{fmtDate(date, locale, { month: 'short' })}</small>
                    </span>
                    <span className="appt-text">
                      <strong>{apptLabel(d, t)}</strong>
                      <small>{cap(t(`appt_${apptGroup(d.kind)}` as TKey))} · {fmtTime(e.occurred_at, locale)}{meta ? ` · ${meta}` : ''}</small>
                      {d.notes?.trim() && <em>{d.notes.trim()}</em>}
                    </span>
                    <TypeIcon type="appointment" size={18} color={TYPE_COLOR.appointment} />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
