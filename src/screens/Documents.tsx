import { useMemo } from 'react'
import { useEntries } from '../lib/data'
import { useI18n, type TKey } from '../lib/i18n'
import { fmtDate } from '../lib/format'
import { fileUrl } from '../lib/api'
import { TYPE_COLOR, type DocumentData, type Entry } from '../lib/types'
import { FileIcon, PlusIcon } from '../components/Icons'
import { toast } from '../components/Toast'

export function Documents({ onAdd, onEdit }: { onAdd: () => void; onEdit: (e: Entry) => void }) {
  const { t, locale } = useI18n()
  const from = useMemo(() => new Date(2000, 0, 1), [])
  const to = useMemo(() => new Date(2100, 0, 1), [])
  const { entries, loading } = useEntries(from, to, ['document'])
  const docs = [...entries].reverse()

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
      {!loading && !docs.length && <p className="empty">{t('noDocuments')}</p>}
      <ul className="doc-list">
        {docs.map((e) => {
          const d = e.data as DocumentData
          return (
            <li key={e.id} className="doc-card" style={{ '--c': TYPE_COLOR.document } as React.CSSProperties}>
              <button type="button" className="doc-main" onClick={() => onEdit(e)}>
                <span className="doc-kind">{t(`doc_${d.kind}` as TKey)}</span>
                <strong>{d.title || '—'}</strong>
                <small>{fmtDate(new Date(e.occurred_at), locale)}</small>
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
