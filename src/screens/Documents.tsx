import { useMemo, useState } from 'react'
import { useEntries } from '../lib/data'
import { useI18n, type TKey } from '../lib/i18n'
import { fmtDate } from '../lib/format'
import { fileUrl } from '../lib/api'
import { DOC_COLOR, type DocumentData, type Entry } from '../lib/types'
import { FileIcon, PlusIcon } from '../components/Icons'
import { toast } from '../components/Toast'

export function Documents({ onAdd, onEdit }: { onAdd: () => void; onEdit: (e: Entry) => void }) {
  const { t, locale } = useI18n()
  const from = useMemo(() => new Date(2000, 0, 1), [])
  const to = useMemo(() => new Date(2100, 0, 1), [])
  const { entries, loading } = useEntries(from, to, ['document'])
  const [mode, setMode] = useState<'all' | 'day' | 'month' | 'year'>('all')
  const today = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const [val, setVal] = useState({
    day: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
    month: `${today.getFullYear()}-${pad(today.getMonth() + 1)}`,
    year: String(today.getFullYear()),
  })
  // Chronological (oldest first), narrowed to the chosen day / month / year.
  const docs = [...entries]
    .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime())
    .filter((e) => {
      if (mode === 'all') return true
      const d = new Date(e.occurred_at)
      const k = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      return mode === 'day' ? k === val.day : mode === 'month' ? k.startsWith(val.month) : k.startsWith(val.year)
    })

  const open = async (path: string) => {
    // Open the tab synchronously (iOS blocks popups opened after an await).
    const w = window.open('', '_blank')
    try { const u = await fileUrl(path); if (w) w.location.href = u; else window.location.href = u }
    catch { w?.close(); toast(t('errorGeneric'), 'error') }
  }

  return (
    <div className="screen documents">
      <div className="screen-head">
        <h1>{t('documents')}</h1>
        <button type="button" className="btn primary small" onClick={onAdd}><PlusIcon size={18} /> {t('add')}</button>
      </div>
      <div className="doc-filter">
        <div className="filter-chips">
          {(['all', 'day', 'month', 'year'] as const).map((m) => (
            <button key={m} type="button" className={'fchip' + (mode === m ? ' on' : '')} onClick={() => setMode(m)}>
              {t(m === 'all' ? 'pAll' : m === 'day' ? 'pDay' : m === 'month' ? 'pMonth' : 'pYear')}
            </button>
          ))}
        </div>
        {mode === 'day' && <input type="date" value={val.day} onChange={(e) => e.target.value && setVal({ ...val, day: e.target.value })} />}
        {mode === 'month' && <input type="month" value={val.month} onChange={(e) => e.target.value && setVal({ ...val, month: e.target.value })} />}
        {mode === 'year' && <input type="number" inputMode="numeric" min={2000} max={2100} value={val.year}
          onChange={(e) => setVal({ ...val, year: e.target.value })} />}
      </div>
      {!loading && !docs.length && <p className="empty">{t('noDocuments')}</p>}
      <ul className="doc-list">
        {docs.map((e) => {
          const d = e.data as DocumentData
          return (
            <li key={e.id} className="doc-card" style={{ '--c': DOC_COLOR[d.kind] ?? DOC_COLOR.other } as React.CSSProperties}>
              <button type="button" className="doc-main" onClick={() => onEdit(e)}>
                <span className="doc-kind">{t(`doc_${d.kind}` as TKey)}</span>
                <strong>{d.title || '—'}</strong>
                <small>{fmtDate(new Date(e.occurred_at), locale)}</small>
                {d.appointmentLabel && <span className="doc-appt">{t('linkedAppt')}: {d.appointmentLabel}</span>}
                {d.notes && <p>{d.notes}</p>}
              </button>
              {d.files?.length > 0 && (
                <div className="doc-files">
                  {d.files.map((f) => (
                    <button key={f.path} type="button" className="file-pill" onClick={() => open(f.path)}>
                      <FileIcon size={15} /> {f.name}
                    </button>
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
