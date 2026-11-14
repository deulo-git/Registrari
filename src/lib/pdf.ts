import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { describe, dayKey, fmtDate, fmtMl, fmtTime, parseDayKey } from './format'
import {
  GAS_LABELS, TYPE_COLOR, mealTotals,
  type BowelData, type Config, type Entry, type EntryType, type GasData, type MealData, type SymptomData, type WaterData,
} from './types'
import type { TKey } from './i18n'

interface Opts {
  entries: Entry[]
  from: Date
  /** Inclusive last day. */
  to: Date
  types: EntryType[]
  includeNotes: boolean
  config: Config
  t: (k: TKey) => string
  symptomLabel: (c: string) => string
  locale: string
}

/** The built-in PDF fonts only cover Latin-1: swap typographic characters. */
const clean = (s: string) =>
  s.replace(/[“”«»]/g, '"').replace(/[‘’]/g, "'").replace(/[—–]/g, '-').replace(/…/g, '...').replace(/[^\x00-\xff]/g, '')

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function tint(c: string, k = 0.88): [number, number, number] {
  const [r, g, b] = hex(c)
  return [Math.round(r + (255 - r) * k), Math.round(g + (255 - g) * k), Math.round(b + (255 - b) * k)]
}

const TEAL = '#0f766e'

export function buildReport(o: Opts): { blob: Blob; filename: string } {
  const { t, locale } = o
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const M = 14

  // ── Header ──
  doc.setFillColor(...hex(TEAL))
  doc.rect(0, 0, W, 4, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...hex(TEAL))
  doc.text('REGISTRARI', M, 17)
  doc.setFontSize(11)
  doc.setTextColor(40)
  doc.text(clean(t('reportTitle')), M, 24)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(90)
  let y = 31
  if (o.config.patientName.trim()) { doc.text(clean(`${t('patient')}: ${o.config.patientName.trim()}`), M, y); y += 5 }
  doc.text(clean(`${t('period')}: ${fmtDate(o.from, locale)} - ${fmtDate(o.to, locale)}`), M, y); y += 5
  doc.text(clean(`${t('generatedOn')}: ${new Date().toLocaleString(locale)}`), M, y); y += 4

  // Legend
  let lx = M
  y += 3
  doc.setFontSize(8)
  for (const ty of o.types) {
    const label = clean(t(`type_${ty}` as TKey))
    doc.setFillColor(...hex(TYPE_COLOR[ty]))
    doc.circle(lx + 1.5, y - 1, 1.5, 'F')
    doc.setTextColor(60)
    doc.text(label, lx + 4.5, y)
    lx += doc.getTextWidth(label) + 10
  }
  y += 4
  doc.setDrawColor(220)
  doc.line(M, y, W - M, y)
  y += 6

  if (!o.entries.length) {
    doc.setFontSize(11)
    doc.setTextColor(90)
    doc.text(clean(t('noEntriesRange')), M, y + 4)
    return finish(doc, o)
  }

  // ── Daily summary ──
  const byDay = new Map<string, Entry[]>()
  for (const e of o.entries) {
    const k = dayKey(new Date(e.occurred_at))
    if (!byDay.has(k)) byDay.set(k, [])
    byDay.get(k)!.push(e)
  }
  const days = [...byDay.keys()].sort()
  const has = (ty: EntryType) => o.types.includes(ty)

  const cols: { key: string; label: string; cell: (es: Entry[]) => string }[] = [
    { key: 'date', label: t('date'), cell: () => '' },
  ]
  if (has('water')) cols.push({ key: 'water', label: t('water'), cell: (es) => {
    const ml = es.filter((e) => e.type === 'water').reduce((s, e) => s + ((e.data as WaterData).ml || 0), 0)
    return ml ? fmtMl(ml) : '-'
  } })
  if (has('meal')) cols.push({ key: 'meal', label: t('meals'), cell: (es) => {
    const ms = es.filter((e) => e.type === 'meal')
    if (!ms.length) return '-'
    const kcal = ms.reduce((s, e) => s + mealTotals((e.data as MealData).items).kcal, 0)
    return kcal ? `${ms.length} (${Math.round(kcal)} kcal)` : String(ms.length)
  } })
  if (has('symptom')) cols.push({ key: 'symptom', label: t('symptoms'), cell: (es) => {
    const ss = es.filter((e) => e.type === 'symptom')
    if (!ss.length) return '-'
    const max = Math.max(...ss.map((e) => (e.data as SymptomData).intensity))
    return `${ss.length} (${t('maxShort')} ${max}/10)`
  } })
  if (has('bowel')) cols.push({ key: 'bowel', label: t('bowels'), cell: (es) => {
    const bs = es.filter((e) => e.type === 'bowel')
    if (!bs.length) return '-'
    const blood = bs.some((e) => (e.data as BowelData).blood !== 'none')
    return `${bs.length}: B ${bs.map((e) => (e.data as BowelData).bristol).join(', ')}${blood ? ` · ${t('blood')}` : ''}`
  } })
  if (has('gas')) cols.push({ key: 'gas', label: t('gas'), cell: (es) => {
    const gs = es.filter((e) => e.type === 'gas')
    if (!gs.length) return '-'
    return GAS_LABELS[Math.max(...gs.map((e) => (e.data as GasData).level))]
  } })
  if (has('medication')) cols.push({ key: 'medication', label: t('meds'), cell: (es) => {
    const n = es.filter((e) => e.type === 'medication').length
    return n ? String(n) : '-'
  } })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(30)
  doc.text(clean(t('dailySummary')), M, y)
  autoTable(doc, {
    startY: y + 3,
    margin: { left: M, right: M },
    head: [cols.map((c) => clean(c.label))],
    body: days.map((k) => cols.map((c, i) =>
      clean(i === 0 ? fmtDate(parseDayKey(k), locale, { weekday: 'short', day: '2-digit', month: '2-digit' }) : c.cell(byDay.get(k)!)))),
    styles: { fontSize: 8, cellPadding: 1.8, textColor: 40, lineColor: 230, lineWidth: 0.1 },
    headStyles: { fillColor: hex(TEAL), textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [247, 249, 250] },
    didParseCell: (d) => {
      if (d.section === 'head' && d.column.index > 0) {
        const key = cols[d.column.index].key as EntryType
        if (TYPE_COLOR[key]) d.cell.styles.fillColor = hex(TYPE_COLOR[key])
      }
    },
  })

  // ── Chronology ──
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  if (y > doc.internal.pageSize.getHeight() - 30) { doc.addPage(); y = 18 }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(30)
  doc.text(clean(t('chronology')), M, y)

  const rows: { e: Entry; cells: string[] }[] = []
  let lastDay = ''
  for (const e of o.entries) {
    const d = new Date(e.occurred_at)
    const k = dayKey(d)
    rows.push({
      e,
      cells: [
        k === lastDay ? '' : fmtDate(d, locale, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }),
        fmtTime(d, locale),
        t(`type_${e.type}` as TKey),
        describe(e, t, o.symptomLabel, o.includeNotes),
      ].map(clean),
    })
    lastDay = k
  }

  autoTable(doc, {
    startY: y + 3,
    margin: { left: M, right: M },
    head: [[t('date'), t('time'), t('type'), t('detail')].map(clean)],
    body: rows.map((r) => r.cells),
    styles: { fontSize: 8, cellPadding: 1.8, textColor: 40, lineColor: 230, lineWidth: 0.1, valign: 'top' },
    headStyles: { fillColor: hex(TEAL), textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 26, fontStyle: 'bold' }, 1: { cellWidth: 12 }, 2: { cellWidth: 24 } },
    didParseCell: (d) => {
      if (d.section !== 'body') return
      const ty = rows[d.row.index].e.type
      if (d.column.index === 2) {
        d.cell.styles.fillColor = tint(TYPE_COLOR[ty])
        d.cell.styles.textColor = hex(TYPE_COLOR[ty])
        d.cell.styles.fontStyle = 'bold'
      }
    },
    didDrawCell: (d) => {
      if (d.section === 'body' && d.column.index === 2) {
        const ty = rows[d.row.index].e.type
        doc.setFillColor(...hex(TYPE_COLOR[ty]))
        doc.rect(d.cell.x, d.cell.y, 1.2, d.cell.height, 'F')
      }
    },
  })

  return finish(doc, o)
}

function finish(doc: jsPDF, o: Opts) {
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(140)
    const h = doc.internal.pageSize.getHeight()
    doc.text('Registrari', 14, h - 8)
    doc.text(`${i} / ${pages}`, doc.internal.pageSize.getWidth() - 14, h - 8, { align: 'right' })
  }
  const filename = `registrari_${dayKey(o.from)}_${dayKey(o.to)}.pdf`
  return { blob: doc.output('blob'), filename }
}

/** iPhone: share sheet (save to Files, Mail, WhatsApp…). Elsewhere: download. */
export async function deliverPdf(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: 'application/pdf' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.canShare?.({ files: [file] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
    try { await nav.share({ files: [file], title: filename }); return } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
