import { useState } from 'react'
import { useI18n } from '../lib/i18n'
import { useConfig } from '../lib/data'
import { fetchEntries } from '../lib/api'
import { addDays, dayKey, parseDayKey } from '../lib/format'
import type { deliverPdf as DeliverPdf } from '../lib/pdf'
import type { EntryType } from '../lib/types'
import { TypeFilter } from '../screens/Calendar'
import { CloseIcon, DownloadIcon } from './Icons'
import { toast } from './Toast'

/** Pick a date range + entry types and produce the PDF chronology. */
export function ExportDialog({ initialFrom, initialTo, initialTypes, onClose }: {
  initialFrom: Date; initialTo: Date; initialTypes: EntryType[]; onClose: () => void
}) {
  const { t, symptomLabel, locale } = useI18n()
  const { config } = useConfig()
  const [from, setFrom] = useState(dayKey(initialFrom))
  const [to, setTo] = useState(dayKey(initialTo))
  const [types, setTypes] = useState<EntryType[]>(initialTypes)
  const [notes, setNotes] = useState(true)
  const [busy, setBusy] = useState(false)
  // iOS only opens the share sheet straight from a tap, so building the PDF
  // (async) and delivering it are two taps.
  const [ready, setReady] = useState<{ blob: Blob; filename: string; deliver: typeof DeliverPdf } | null>(null)

  const go = async () => {
    if (!from || !to || busy) return
    setBusy(true)
    try {
      let f = parseDayKey(from)
      let l = parseDayKey(to)
      if (l < f) [f, l] = [l, f]
      const entries = await fetchEntries(f, addDays(l, 1), types)
      // jsPDF is heavy: load it only when a report is asked for.
      const { buildReport, deliverPdf } = await import('../lib/pdf')
      setReady({ deliver: deliverPdf, ...buildReport({ entries, from: f, to: l, types, includeNotes: notes, config, t, symptomLabel, locale }) })
    } catch {
      toast(t('errorGeneric'), 'error')
    } finally { setBusy(false) }
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
        style={{ '--c': '#0f766e' } as React.CSSProperties}>
        <header className="sheet-head">
          <span className="sheet-icon"><DownloadIcon size={20} color="#fff" /></span>
          <h2>{t('exportPdf')}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('close')}><CloseIcon /></button>
        </header>
        <div className="sheet-body">
          <div className="row">
            <label className="field grow"><span>{t('from')}</span>
              <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setReady(null) }} /></label>
            <label className="field grow"><span>{t('to')}</span>
              <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setReady(null) }} /></label>
          </div>
          <div className="field">
            <span>{t('filter')}</span>
            <TypeFilter value={types} onChange={(v) => { setTypes(v); setReady(null) }} />
          </div>
          <label className="toggle"><input type="checkbox" checked={notes} onChange={(e) => { setNotes(e.target.checked); setReady(null) }} /> {t('includeNotes')}</label>
        </div>
        <footer className="sheet-foot">
          {ready ? (
            <button type="button" className="btn primary" onClick={() => { ready.deliver(ready.blob, ready.filename); onClose() }}>
              <DownloadIcon size={18} /> {ready.filename}
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={go} disabled={busy}>
              {busy ? t('loading') : t('generate')}
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}
