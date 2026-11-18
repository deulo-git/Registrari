import { useEffect, useMemo, useState } from 'react'
import { useEntries } from '../lib/data'
import { useI18n, type TKey } from '../lib/i18n'
import { apptLabel, cap, fmtDate, fmtTime } from '../lib/format'
import { APPOINTMENT_KINDS, TYPE_COLOR, apptGroup, type AppointmentData, type DocumentData, type Entry } from '../lib/types'
import { ImageIcon, PdfIcon, PlusIcon, SettingsIcon, TypeIcon } from '../components/Icons'
import { APPT_COLORS } from '../lib/apptColors'
import { ApptViewer, isPdfFile } from '../components/ApptViewer'

/** Every appointment the patient has had, newest first, grouped by year. */
export function Appointments({ onAdd, onEdit, onSettings }: { onAdd: () => void; onEdit: (e: Entry) => void; onSettings: () => void }) {
  const { t, locale } = useI18n()
  const from = useMemo(() => new Date(2000, 0, 1), [])
  const to = useMemo(() => new Date(2100, 0, 1), [])
  const { entries, loading } = useEntries(from, to, ['appointment'])
  const { entries: docEntries } = useEntries(from, to, ['document'])
  const [group, setGroup] = useState<string>('all')
  const [viewId, setViewId] = useState<string | null>(null)
  // Documents linked to each appointment (newest first).
  const docsByAppt = useMemo(() => {
    const m = new Map<string, Entry[]>()
    for (const e of [...docEntries].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())) {
      const id = (e.data as DocumentData).appointmentId
      if (!id) continue
      if (!m.has(id)) m.set(id, [])
      m.get(id)!.push(e)
    }
    return m
  }, [docEntries])
  const docsFor = (id: string) => docsByAppt.get(id) ?? []
  const now = Date.now()

  const list = useMemo(() => [...entries]
    .filter((e) => group === 'all' || apptGroup((e.data as AppointmentData).kind) === group)
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()), [entries, group])

  const viewIndex = viewId ? list.findIndex((e) => e.id === viewId) : -1
  useEffect(() => { if (viewId && !loading && viewIndex < 0) setViewId(null) }, [viewId, loading, viewIndex])

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
            style={{ '--c': APPT_COLORS[k].ink } as React.CSSProperties} onClick={() => setGroup(k)}>
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
              const g = apptGroup(d.kind)
              const col = APPT_COLORS[g]
              const future = date.getTime() > now
              const meta = [d.place?.trim(), d.doctor?.trim()].filter(Boolean).join(' · ')
              return (
                <li key={e.id}>
                  <button type="button" className={'appt-item' + (future ? ' future' : '')} style={{ '--k': col.ink } as React.CSSProperties} onClick={() => setViewId(e.id)}>
                    <span className="appt-date" style={{ background: col.bg, color: col.ink }}>
                      <b>{date.getDate()}</b>
                      <small>{fmtDate(date, locale, { month: 'short' })}</small>
                    </span>
                    <span className="appt-text">
                      <strong><span className="appt-kind" style={{ color: col.ink }}>{t(`appt_${g}` as TKey)}</span> · {apptLabel(d, t)}</strong>
                      <small>{cap(fmtTime(e.occurred_at, locale))}{meta ? ` · ${meta}` : ''}</small>
                      {d.notes?.trim() && <em>{d.notes.trim()}</em>}
                    </span>
                    {(() => {
                      const files = docsFor(e.id).flatMap((x) => (x.data as DocumentData).files ?? [])
                      const pdfs = files.filter(isPdfFile).length
                      const imgs = files.length - pdfs
                      return files.length ? (
                        <span className="appt-files">
                          {pdfs > 0 && <span className="file-badge"><PdfIcon size={15} />{pdfs}</span>}
                          {imgs > 0 && <span className="file-badge"><ImageIcon size={15} />{imgs}</span>}
                        </span>
                      ) : <TypeIcon type="appointment" size={18} color={TYPE_COLOR.appointment} />
                    })()}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      {viewId && viewIndex >= 0 && (
        <ApptViewer appts={list} index={viewIndex} setIndex={(i) => setViewId(list[i]?.id ?? null)}
          docsFor={docsFor} onClose={() => setViewId(null)} onEdit={onEdit} />
      )}
    </div>
  )
}
