import { useEffect, useMemo, useState } from 'react'
import { useEntries } from '../lib/data'
import { useI18n } from '../lib/i18n'
import { docKindLabel, fmtDate } from '../lib/format'
import { DOC_COLOR, type DocumentData, type Entry } from '../lib/types'
import { FileIcon, PlusIcon, SettingsIcon } from '../components/Icons'
import { DocViewer } from '../components/DocViewer'

export function Documents({ onAdd, onEdit, onSettings }: { onAdd: () => void; onEdit: (e: Entry) => void; onSettings: () => void }) {
  const { t, locale } = useI18n()
  const from = useMemo(() => new Date(2000, 0, 1), [])
  const to = useMemo(() => new Date(2100, 0, 1), [])
  const { entries, loading } = useEntries(from, to, ['document'])
  const [mode, setMode] = useState<'all' | 'day' | 'month' | 'year'>('all')
  const [viewId, setViewId] = useState<string | null>(null)
  const today = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const [val, setVal] = useState({
    day: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
    month: `${today.getFullYear()}-${pad(today.getMonth() + 1)}`,
    year: String(today.getFullYear()),
  })
  // Newest first, narrowed to the chosen day / month / year.
  const docs = useMemo(() => [...entries]
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
    .filter((e) => {
      if (mode === 'all') return true
      const d = new Date(e.occurred_at)
      const k = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      return mode === 'day' ? k === val.day : mode === 'month' ? k.startsWith(val.month) : k.startsWith(val.year)
    }), [entries, mode, val])

  const viewIndex = viewId ? docs.findIndex((e) => e.id === viewId) : -1
  // The viewed document was deleted (or filtered out): leave the viewer.
  useEffect(() => { if (viewId && !loading && viewIndex < 0) setViewId(null) }, [viewId, loading, viewIndex])

  return (
    <div className="screen documents">
      <div className="screen-head">
        <h1>{t('documents')}</h1>
        <div className="head-actions">
          <button type="button" className="btn primary small" onClick={onAdd}><PlusIcon size={18} /> {t('add')}</button>
          <button type="button" className="icon-btn" onClick={onSettings} aria-label={t('settings')}><SettingsIcon size={22} /></button>
        </div>
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
              <button type="button" className="doc-main" onClick={() => setViewId(e.id)}>
                <span className="doc-kind">{docKindLabel(d.kind, t)}</span>
                <strong>{d.title || '—'}</strong>
                <small>{fmtDate(new Date(e.occurred_at), locale)}</small>
                {d.appointmentLabel && <span className="doc-appt">{t('linkedAppt')}: {d.appointmentLabel}</span>}
                {d.files?.length > 0 && <span className="doc-count"><FileIcon size={14} /> {d.files.length}</span>}
              </button>
            </li>
          )
        })}
      </ul>

      {viewId && viewIndex >= 0 && (
        <DocViewer docs={docs} index={viewIndex} setIndex={(i) => setViewId(docs[i]?.id ?? null)}
          onClose={() => setViewId(null)} onEdit={onEdit} />
      )}
    </div>
  )
}
