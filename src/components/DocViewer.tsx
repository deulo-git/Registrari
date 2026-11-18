import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../lib/i18n'
import { docKindLabel, fmtDate } from '../lib/format'
import { fileUrl } from '../lib/api'
import { DOC_COLOR, type DocumentData, type Entry, type StoredFile } from '../lib/types'
import { ChevronLeft, ChevronRight, FileIcon, PencilIcon } from './Icons'

const urlCache = new Map<string, Promise<string>>()
/** Signed URLs last an hour; keep them for 50 minutes so reopening is instant. */
function signed(path: string) {
  let p = urlCache.get(path)
  if (!p) {
    p = fileUrl(path)
    urlCache.set(path, p)
    p.then(() => window.setTimeout(() => urlCache.delete(path), 50 * 60 * 1000)).catch(() => urlCache.delete(path))
  }
  return p
}

const isImage = (f: StoredFile) => f.mime?.startsWith('image/') || /\.(jpe?g|png|gif|webp|heic)$/i.test(f.name)
const isPdf = (f: StoredFile) => f.mime === 'application/pdf' || /\.pdf$/i.test(f.name)

function useUrl(path: string) {
  const [url, setUrl] = useState<string | null>(null)
  const [err, setErr] = useState(false)
  useEffect(() => {
    let alive = true
    setUrl(null); setErr(false)
    signed(path).then((u) => { if (alive) setUrl(u) }).catch(() => { if (alive) setErr(true) })
    return () => { alive = false }
  }, [path])
  return { url, err }
}

/** Horizontal swipe strip: one slide per file, with the "1 / 3" counter. */
function Carousel({ files, index, setIndex, render, className }: {
  files: StoredFile[]; index: number; setIndex: (i: number) => void
  render: (f: StoredFile, i: number) => React.ReactNode; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  // Jump to the requested slide (no animation) when it changes from outside.
  useEffect(() => {
    const el = ref.current
    if (el && Math.round(el.scrollLeft / el.clientWidth) !== index) el.scrollTo({ left: index * el.clientWidth })
  }, [index])
  return (
    <div className={'dv-carousel ' + (className ?? '')}>
      <div ref={ref} className="dv-strip" onScroll={(e) => {
        const el = e.currentTarget
        const i = Math.round(el.scrollLeft / el.clientWidth)
        if (i !== index && i >= 0 && i < files.length) setIndex(i)
      }}>
        {files.map((f, i) => <div key={f.path} className="dv-slide">{render(f, i)}</div>)}
      </div>
      {files.length > 1 && <span className="dv-count">{index + 1} / {files.length}</span>}
    </div>
  )
}

function FileView({ file, big, onOpen }: { file: StoredFile; big?: boolean; onOpen?: () => void }) {
  const { t } = useI18n()
  const { url, err } = useUrl(file.path)
  const [zoom, setZoom] = useState(false)
  if (err) return <div className="dv-msg">{t('errorGeneric')}</div>
  if (!url) return <div className="dv-skel" />
  if (isImage(file)) {
    return big
      ? (
        <div className={'dv-zoom' + (zoom ? ' on' : '')}>
          <img src={url} alt={file.name} onClick={() => setZoom(!zoom)} />
        </div>
      )
      : (
        <button type="button" className="dv-open" onClick={onOpen} aria-label={t('tapToEnlarge')}>
          <img src={url} alt={file.name} loading="lazy" />
        </button>
      )
  }
  if (isPdf(file)) {
    return big
      ? <iframe className="dv-pdf" src={url} title={file.name} />
      : (
        <div className="dv-pdf-wrap">
          <iframe className="dv-pdf" src={`${url}#toolbar=0&navpanes=0`} title={file.name} tabIndex={-1} />
          <button type="button" className="dv-pdf-hit" onClick={onOpen} aria-label={t('tapToEnlarge')} />
        </div>
      )
  }
  return (
    <a className="dv-msg" href={url} target="_blank" rel="noreferrer"><FileIcon size={28} /><span>{file.name}</span></a>
  )
}

/** Full-screen look at the files: swipe between them, back button to return. */
function Lightbox({ files, start, onClose }: { files: StoredFile[]; start: number; onClose: () => void }) {
  const { t } = useI18n()
  const [i, setI] = useState(start)
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopImmediatePropagation(); onClose() } }
    window.addEventListener('keydown', k, true)
    return () => window.removeEventListener('keydown', k, true)
  }, [onClose])
  return (
    <div className="dv-light" role="dialog" aria-modal="true">
      <header>
        <button type="button" className="dv-back" onClick={onClose}><ChevronLeft size={22} /> {t('back')}</button>
        <span className="dv-light-name">{files[i]?.name}{files.length > 1 ? ` · ${i + 1}/${files.length}` : ''}</span>
      </header>
      <Carousel files={files} index={i} setIndex={setI} className="dark"
        render={(f) => <FileView file={f} big />} />
    </div>
  )
}

/**
 * One document in full screen: arrows to step through the list, pencil to
 * edit, the summary on top and the file(s) big underneath.
 */
export function DocViewer({ docs, index, setIndex, onClose, onEdit }: {
  docs: Entry[]; index: number; setIndex: (i: number) => void; onClose: () => void; onEdit: (e: Entry) => void
}) {
  const { t, locale } = useI18n()
  const entry = docs[index]
  const d = entry?.data as DocumentData | undefined
  const [fileIdx, setFileIdx] = useState(0)
  const [light, setLight] = useState<number | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  useEffect(() => { setFileIdx(0); setLight(null); bodyRef.current?.scrollTo({ top: 0 }) }, [entry?.id])
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (document.querySelector('.sheet-overlay')) return
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft' && index > 0) setIndex(index - 1)
      else if (e.key === 'ArrowRight' && index < docs.length - 1) setIndex(index + 1)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [index, docs.length, onClose, setIndex])
  if (!entry || !d) return null
  const files = d.files ?? []
  const color = DOC_COLOR[d.kind] ?? DOC_COLOR.other

  return (
    <div className="dv" style={{ '--c': color } as React.CSSProperties}>
      <header className="dv-top">
        <button type="button" className="icon-btn" onClick={onClose} aria-label={t('back')}><ChevronLeft size={24} /></button>
        <div className="dv-step">
          <button type="button" className="icon-btn" disabled={index === 0} onClick={() => setIndex(index - 1)} aria-label={t('prevItem')}><ChevronLeft /></button>
          <span>{index + 1} / {docs.length}</span>
          <button type="button" className="icon-btn" disabled={index >= docs.length - 1} onClick={() => setIndex(index + 1)} aria-label={t('nextItem')}><ChevronRight /></button>
        </div>
        <button type="button" className="icon-btn dv-edit" onClick={() => onEdit(entry)} aria-label={t('edit')}><PencilIcon size={20} /></button>
      </header>

      <div ref={bodyRef} className="dv-body" key={entry.id}>
        <section className="dv-summary">
          <span className="doc-kind">{docKindLabel(d.kind, t)}</span>
          <h2>{d.title || '—'}</h2>
          <small>{fmtDate(new Date(entry.occurred_at), locale)}</small>
          {d.appointmentLabel && <span className="doc-appt">{t('linkedAppt')}: {d.appointmentLabel}</span>}
          {d.notes && <p>{d.notes}</p>}
        </section>

        {files.length
          ? <Carousel files={files} index={fileIdx} setIndex={setFileIdx}
              render={(f, i) => <FileView file={f} onOpen={() => { setFileIdx(i); setLight(i) }} />} />
          : <p className="empty">{t('noFilesYet')}</p>}
        {files.length > 0 && <p className="dv-hint">{t('tapToEnlarge')}{files.length > 1 ? ' · ←→' : ''}</p>}
      </div>

      {light !== null && <Lightbox files={files} start={light} onClose={() => setLight(null)} />}
    </div>
  )
}
