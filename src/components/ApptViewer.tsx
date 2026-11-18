import { useEffect, useRef, useState } from 'react'
import { useI18n, type TKey } from '../lib/i18n'
import { apptLabel, docKindLabel, fmtDate, fmtTime } from '../lib/format'
import { apptGroup, type AppointmentData, type DocumentData, type Entry } from '../lib/types'
import { ChevronLeft, ChevronRight, ImageIcon, PdfIcon, PencilIcon, FileIcon } from './Icons'
import { DocViewer } from './DocViewer'
import { APPT_COLORS } from '../lib/apptColors'

export const isPdfFile = (f: { mime?: string; name: string }) => f.mime === 'application/pdf' || /\.pdf$/i.test(f.name)

/** One appointment in full screen: arrows to step through them, pencil to edit, summary and notes big. */
export function ApptViewer({ appts, index, setIndex, docsFor, onClose, onEdit }: {
  appts: Entry[]; index: number; setIndex: (i: number) => void
  docsFor: (apptId: string) => Entry[]; onClose: () => void; onEdit: (e: Entry) => void
}) {
  const { t, locale } = useI18n()
  const entry = appts[index]
  const d = entry?.data as AppointmentData | undefined
  const bodyRef = useRef<HTMLDivElement>(null)
  const [docIdx, setDocIdx] = useState<number | null>(null)
  useEffect(() => { setDocIdx(null); bodyRef.current?.scrollTo({ top: 0 }) }, [entry?.id])
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (document.querySelector('.sheet-overlay') || document.querySelectorAll('.dv').length > 1) return
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft' && index > 0) setIndex(index - 1)
      else if (e.key === 'ArrowRight' && index < appts.length - 1) setIndex(index + 1)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [index, appts.length, onClose, setIndex])
  if (!entry || !d) return null
  const g = apptGroup(d.kind)
  const col = APPT_COLORS[g]
  const docs = docsFor(entry.id)
  const date = new Date(entry.occurred_at)

  return (
    <div className="dv av" style={{ '--c': col.ink } as React.CSSProperties}>
      <header className="dv-top">
        <button type="button" className="icon-btn" onClick={onClose} aria-label={t('back')}><ChevronLeft size={24} /></button>
        <div className="dv-step">
          <button type="button" className="icon-btn" disabled={index === 0} onClick={() => setIndex(index - 1)} aria-label={t('prevItem')}><ChevronLeft /></button>
          <span>{index + 1} / {appts.length}</span>
          <button type="button" className="icon-btn" disabled={index >= appts.length - 1} onClick={() => setIndex(index + 1)} aria-label={t('nextItem')}><ChevronRight /></button>
        </div>
        <button type="button" className="icon-btn dv-edit" onClick={() => onEdit(entry)} aria-label={t('edit')}><PencilIcon size={20} /></button>
      </header>

      <div ref={bodyRef} className="dv-body" key={entry.id}>
        <section className="dv-summary" style={{ background: col.bg }}>
          <span className="doc-kind">{t(`appt_${g}` as TKey)}</span>
          <h2>{apptLabel(d, t)}</h2>
          <small>{fmtDate(date, locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {fmtTime(entry.occurred_at, locale)}</small>
        </section>

        {(d.place?.trim() || d.doctor?.trim()) && (
          <dl className="av-facts">
            {d.place?.trim() && <div><dt>{t('place')}</dt><dd>{d.place.trim()}</dd></div>}
            {d.doctor?.trim() && <div><dt>{t('doctor')}</dt><dd>{d.doctor.trim()}</dd></div>}
          </dl>
        )}

        <section className="av-notes">
          <h3>{t('notes')}</h3>
          {d.notes?.trim() ? <p>{d.notes.trim()}</p> : <p className="muted">—</p>}
        </section>

        <section className="av-docs">
          <h3>{t('linkedDocs')}</h3>
          {docs.length ? (
            <ul>
              {docs.map((x, i) => {
                const dd = x.data as DocumentData
                const files = dd.files ?? []
                const pdfs = files.filter(isPdfFile).length
                const imgs = files.length - pdfs
                return (
                  <li key={x.id}>
                    <button type="button" className="av-doc" onClick={() => setDocIdx(i)}>
                      <FileIcon size={20} />
                      <span className="grow">
                        <strong>{dd.title || docKindLabel(dd.kind, t)}</strong>
                        <small>{docKindLabel(dd.kind, t)} · {fmtDate(new Date(x.occurred_at), locale, { day: 'numeric', month: 'short', year: 'numeric' })}</small>
                      </span>
                      {pdfs > 0 && <span className="file-badge"><PdfIcon size={15} />{pdfs}</span>}
                      {imgs > 0 && <span className="file-badge"><ImageIcon size={15} />{imgs}</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : <small className="muted">{t('noLinkedDocs')}</small>}
        </section>
      </div>

      {docIdx !== null && docs[docIdx] && (
        <DocViewer docs={docs} index={docIdx} setIndex={setDocIdx} onClose={() => setDocIdx(null)} onEdit={onEdit} />
      )}
    </div>
  )
}
