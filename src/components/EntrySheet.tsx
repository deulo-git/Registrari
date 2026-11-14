import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DOC_KINDS, GAS_LABELS, MEAL_KINDS, TYPE_COLOR, mealTotals,
  type BowelData, type DataByType, type DocumentData, type Entry, type EntryType, type FoodItem,
  type GasData, type MealData, type MealKind, type MedicationData, type StoredFile, type SymptomData, type WaterData,
} from '../lib/types'
import { useI18n, type TKey } from '../lib/i18n'
import { useConfig } from '../lib/data'
import { usePin } from '../lib/pin'
import { deleteEntry, fileUrl, saveEntry, uploadFile } from '../lib/api'
import { fmtMl, fromLocalInput, toLocalInput } from '../lib/format'
import { CameraIcon, CloseIcon, FileIcon, PlusIcon, TrashIcon, TypeIcon } from './Icons'
import { BristolIcon } from './Bristol'
import { toast } from './Toast'

interface Props {
  type: EntryType
  entry?: Entry
  /** When creating: the day being viewed (time = now). */
  defaultDate: Date
  onClose: () => void
}

function defaultMeal(d: Date): MealKind {
  const h = d.getHours()
  if (h < 10) return 'breakfast'
  if (h < 12) return 'midmorning'
  if (h < 16) return 'lunch'
  if (h < 19) return 'snack'
  return 'dinner'
}

function defaults(type: EntryType, when: Date, glassMl: number): DataByType[EntryType] {
  switch (type) {
    case 'water': return { ml: glassMl } satisfies WaterData
    case 'meal': return { meal: defaultMeal(when), items: [{ name: '', qty: undefined, unit: 'g' }] } satisfies MealData
    case 'symptom': return { category: '', intensity: 5 } satisfies SymptomData
    case 'bowel': return { bristol: 4, blood: 'none', effort: 0 } satisfies BowelData
    case 'gas': return { level: 0 } satisfies GasData
    case 'medication': return { name: '', dose: '', unit: '' } satisfies MedicationData
    case 'document': return { kind: 'result', title: '', files: [] } satisfies DocumentData
  }
}

export function EntrySheet({ type, entry, defaultDate, onClose }: Props) {
  const { t } = useI18n()
  const { config } = useConfig()
  const { withPin } = usePin()
  const initialWhen = useMemo(() => {
    if (entry) return new Date(entry.occurred_at)
    const now = new Date()
    const d = new Date(defaultDate)
    d.setHours(now.getHours(), now.getMinutes(), 0, 0)
    return d
  }, [entry, defaultDate])
  const [when, setWhen] = useState(toLocalInput(initialWhen))
  const [data, setData] = useState<DataByType[EntryType]>(() =>
    entry ? structuredClone(entry.data) : defaults(type, initialWhen, config.glassMl))
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const color = TYPE_COLOR[type]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('no-scroll')
    return () => { window.removeEventListener('keydown', onKey); document.body.classList.remove('no-scroll') }
  }, [onClose])

  const valid = (() => {
    switch (type) {
      case 'water': return (data as WaterData).ml > 0
      case 'meal': return (data as MealData).items.some((i) => i.name.trim())
      case 'symptom': return !!(data as SymptomData).category
      case 'medication': return !!(data as MedicationData).name.trim()
      case 'document': {
        const d = data as DocumentData
        return !!d.title.trim() || d.files.length + pendingFiles.length > 0
      }
      default: return true
    }
  })()

  const save = async () => {
    if (!valid || busy) return
    setBusy(true)
    try {
      const ok = await withPin(async (pin) => {
        let payload = data
        if (type === 'meal') {
          const m = data as MealData
          payload = { ...m, items: m.items.filter((i) => i.name.trim()) }
        }
        if (type === 'document' && pendingFiles.length) {
          const uploaded: StoredFile[] = []
          for (const f of pendingFiles) uploaded.push(await uploadFile(pin, f))
          payload = { ...(data as DocumentData), files: [...(data as DocumentData).files, ...uploaded] }
        }
        await saveEntry(pin, { id: entry?.id, type, occurred_at: fromLocalInput(when).toISOString(), data: payload })
        return true
      })
      if (ok) { toast(t('saved')); onClose() }
    } catch { /* toast already shown */ } finally { setBusy(false) }
  }

  const remove = async () => {
    if (!entry || busy || !confirm(t('confirmDelete'))) return
    setBusy(true)
    try {
      const ok = await withPin(async (pin) => { await deleteEntry(pin, entry.id); return true })
      if (ok) { toast(t('deleted')); onClose() }
    } catch { /* toast shown */ } finally { setBusy(false) }
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
        style={{ '--c': color } as React.CSSProperties}>
        <header className="sheet-head">
          <span className="sheet-icon"><TypeIcon type={type} size={22} color="#fff" /></span>
          <h2>{t(`type_${type}` as TKey)}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('close')}><CloseIcon /></button>
        </header>

        <div className="sheet-body">
          <label className="field">
            <span>{t('dateTime')}</span>
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </label>

          {type === 'water' && <WaterForm data={data as WaterData} set={setData} glassMl={config.glassMl} />}
          {type === 'meal' && <MealForm data={data as MealData} set={setData} />}
          {type === 'symptom' && <SymptomForm data={data as SymptomData} set={setData} categories={config.symptomCategories} />}
          {type === 'bowel' && <BowelForm data={data as BowelData} set={setData} />}
          {type === 'gas' && <GasForm data={data as GasData} set={setData} />}
          {type === 'medication' && <MedicationForm data={data as MedicationData} set={setData} />}
          {type === 'document' && (
            <DocumentForm data={data as DocumentData} set={setData} pending={pendingFiles} setPending={setPendingFiles} />
          )}

          {type !== 'water' && (
            <label className="field">
              <span>{t('notes')}</span>
              <textarea rows={2} placeholder={t('notesPlaceholder')}
                value={(data as { notes?: string }).notes ?? ''}
                onChange={(e) => setData({ ...data, notes: e.target.value } as DataByType[EntryType])} />
            </label>
          )}
        </div>

        <footer className="sheet-foot">
          {entry && (
            <button type="button" className="btn ghost danger" onClick={remove} disabled={busy}>
              <TrashIcon size={18} /> {t('delete')}
            </button>
          )}
          <button type="button" className="btn primary" onClick={save} disabled={!valid || busy}>
            {busy && type === 'document' && pendingFiles.length ? t('uploading') : t('save')}
          </button>
        </footer>
      </div>
    </div>
  )
}

type SetData = (d: DataByType[EntryType]) => void

// ── Small shared controls ──

function Chips<T extends string | number>({ options, value, onChange, label }: {
  options: { value: T; label: string }[]; value: T | undefined; onChange: (v: T) => void; label?: string
}) {
  return (
    <div className="field">
      {label && <span>{label}</span>}
      <div className="chips" role="radiogroup">
        {options.map((o) => (
          <button key={String(o.value)} type="button" role="radio" aria-checked={value === o.value}
            className={'chip' + (value === o.value ? ' on' : '')} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function NumberInput({ value, onChange, placeholder, step = 'any', suffix }: {
  value: number | undefined; onChange: (v: number | undefined) => void; placeholder?: string; step?: string; suffix?: string
}) {
  return (
    <div className="num-input">
      <input type="number" inputMode="decimal" step={step} min={0} placeholder={placeholder}
        value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
      {suffix && <em>{suffix}</em>}
    </div>
  )
}

// ── Water ──

function WaterForm({ data, set, glassMl }: { data: WaterData; set: SetData; glassMl: number }) {
  const { t } = useI18n()
  const [unit, setUnit] = useState<'glass' | 'ml' | 'l'>('ml')
  const quick = [
    { ml: glassMl, label: `1 ${t('glass')}`, sub: fmtMl(glassMl) },
    { ml: glassMl * 2, label: `2 ${t('glasses')}`, sub: fmtMl(glassMl * 2) },
    { ml: 500, label: '500 ml', sub: '' },
    { ml: 1000, label: '1 L', sub: '' },
  ]
  const shown = unit === 'glass' ? data.ml / glassMl : unit === 'l' ? data.ml / 1000 : data.ml
  const toMl = (v: number) => Math.round(unit === 'glass' ? v * glassMl : unit === 'l' ? v * 1000 : v)
  return (
    <>
      <div className="quick-grid">
        {quick.map((q) => (
          <button key={q.label} type="button" className={'quick' + (data.ml === q.ml ? ' on' : '')}
            onClick={() => set({ ml: q.ml })}>
            <strong>{q.label}</strong>{q.sub && <small>{q.sub}</small>}
          </button>
        ))}
      </div>
      <div className="field">
        <span>{t('amount')}</span>
        <div className="row">
          <NumberInput value={Number.isFinite(shown) ? Math.round(shown * 100) / 100 : undefined}
            onChange={(v) => set({ ml: v ? toMl(v) : 0 })} />
          <div className="segmented">
            {(['glass', 'ml', 'l'] as const).map((u) => (
              <button key={u} type="button" className={unit === u ? 'on' : ''} onClick={() => setUnit(u)}>
                {u === 'glass' ? t('unitGlasses') : u === 'ml' ? 'ml' : 'L'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="big-value" style={{ color: 'var(--c)' }}>{fmtMl(data.ml || 0)}</p>
    </>
  )
}

// ── Meal ──

function MealForm({ data, set }: { data: MealData; set: SetData }) {
  const { t } = useI18n()
  const [open, setOpen] = useState<number | null>(null)
  const items = data.items
  const update = (i: number, patch: Partial<FoodItem>) =>
    set({ ...data, items: items.map((it, j) => (j === i ? { ...it, ...patch } : it)) })
  const tot = mealTotals(items)
  const hasTotals = tot.kcal || tot.protein || tot.carbs || tot.fat || tot.fiber
  const lastRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <Chips label={t('mealKind')} value={data.meal} onChange={(v) => set({ ...data, meal: v })}
        options={MEAL_KINDS.map((k) => ({ value: k, label: t(`meal_${k}` as TKey) }))} />

      <div className="field">
        <span>{t('foods')}</span>
        <div className="food-list">
          {items.map((it, i) => (
            <div key={i} className="food">
              <div className="food-row">
                <input ref={i === items.length - 1 ? lastRef : undefined} className="food-name"
                  placeholder={t('foodName')} value={it.name} onChange={(e) => update(i, { name: e.target.value })} />
                <NumberInput value={it.qty} placeholder={t('qty')} onChange={(v) => update(i, { qty: v })} />
                <select value={it.unit ?? 'g'} onChange={(e) => update(i, { unit: e.target.value as FoodItem['unit'] })}>
                  <option value="g">g</option><option value="ml">ml</option><option value="u">u</option>
                </select>
                {items.length > 1 && (
                  <button type="button" className="icon-btn small" aria-label={t('delete')}
                    onClick={() => set({ ...data, items: items.filter((_, j) => j !== i) })}><CloseIcon size={16} /></button>
                )}
              </div>
              <button type="button" className="link-btn" onClick={() => setOpen(open === i ? null : i)}>
                {open === i ? '▾' : '▸'} {t('nutritionHint')}
              </button>
              {open === i && (
                <div className="macro-grid">
                  {(['kcal', 'protein', 'carbs', 'fat', 'fiber'] as const).map((k) => (
                    <label key={k}>
                      <small>{t(k)}</small>
                      <NumberInput value={it[k]} onChange={(v) => update(i, { [k]: v })} />
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <button type="button" className="btn ghost add-row" onClick={() => {
          set({ ...data, items: [...items, { name: '', unit: 'g' }] })
          setTimeout(() => lastRef.current?.focus(), 30)
        }}><PlusIcon size={18} /> {t('addFood')}</button>
      </div>

      {hasTotals ? (
        <div className="summary-box">
          <strong>{t('mealSummary')}</strong>
          <div className="macro-sum">
            <span><b>{Math.round(tot.kcal)}</b> kcal</span>
            <span><b>{+tot.protein.toFixed(1)}</b> g {t('protein')}</span>
            <span><b>{+tot.carbs.toFixed(1)}</b> g {t('carbs')}</span>
            <span><b>{+tot.fat.toFixed(1)}</b> g {t('fat')}</span>
            {tot.fiber ? <span><b>{+tot.fiber.toFixed(1)}</b> g {t('fiber')}</span> : null}
          </div>
        </div>
      ) : null}
    </>
  )
}

// ── Symptom ──

function intensityColor(n: number) {
  if (n <= 3) return '#16a34a'
  if (n <= 6) return '#d97706'
  return '#dc2626'
}

function SymptomForm({ data, set, categories }: { data: SymptomData; set: SetData; categories: string[] }) {
  const { t, symptomLabel } = useI18n()
  return (
    <>
      <Chips label={t('category')} value={data.category} onChange={(v) => set({ ...data, category: v })}
        options={categories.map((c) => ({ value: c, label: symptomLabel(c) }))} />
      <div className="field">
        <span>{t('intensity')}</span>
        <div className="slider-row">
          <input type="range" min={0} max={10} step={1} value={data.intensity}
            style={{ accentColor: intensityColor(data.intensity) }}
            onChange={(e) => set({ ...data, intensity: Number(e.target.value) })} />
          <b className="slider-val" style={{ color: intensityColor(data.intensity) }}>{data.intensity}</b>
        </div>
        <div className="scale-labels"><small>0</small><small>5</small><small>10</small></div>
      </div>
      <label className="field">
        <span>{t('duration')} ({t('optional')})</span>
        <NumberInput value={data.durationMin} step="1" suffix={t('minutes')} onChange={(v) => set({ ...data, durationMin: v })} />
      </label>
    </>
  )
}

// ── Bowel ──

function BowelForm({ data, set }: { data: BowelData; set: SetData }) {
  const { t } = useI18n()
  return (
    <>
      <div className="field">
        <span>{t('bristol')}</span>
        <div className="bristol-grid">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button key={n} type="button" className={'bristol' + (data.bristol === n ? ' on' : '')}
              onClick={() => set({ ...data, bristol: n })} aria-pressed={data.bristol === n}>
              <span className="bristol-n">{n}</span>
              <BristolIcon n={n} size={50} />
              <small>{t(`bristol${n}` as TKey)}</small>
            </button>
          ))}
        </div>
      </div>
      <Chips label={t('blood')} value={data.blood} onChange={(v) => set({ ...data, blood: v })}
        options={(['none', 'little', 'lot'] as const).map((b) => ({ value: b, label: t(`blood_${b}` as TKey) }))} />
      <Chips label={t('effort')} value={data.effort} onChange={(v) => set({ ...data, effort: v })}
        options={[0, 1, 2, 3].map((n) => ({ value: n, label: t(`effort${n}` as TKey) }))} />
      <label className="field">
        <span>{t('duration')} ({t('optional')})</span>
        <NumberInput value={data.durationMin} step="1" suffix={t('minutes')} onChange={(v) => set({ ...data, durationMin: v })} />
      </label>
      <div className="toggles">
        <label className="toggle"><input type="checkbox" checked={!!data.urgency}
          onChange={(e) => set({ ...data, urgency: e.target.checked })} /> {t('urgency')}</label>
        <label className="toggle"><input type="checkbox" checked={!!data.pain}
          onChange={(e) => set({ ...data, pain: e.target.checked })} /> {t('pain')}</label>
      </div>
    </>
  )
}

// ── Gas ──

function GasForm({ data, set }: { data: GasData; set: SetData }) {
  const { t } = useI18n()
  return (
    <div className="field">
      <span>{t('gasHint')}</span>
      <div className="gas-grid">
        {GAS_LABELS.map((l, i) => (
          <button key={i} type="button" className={'gas-btn' + (data.level === i ? ' on' : '')}
            onClick={() => set({ ...data, level: i })} aria-pressed={data.level === i}>
            <span className="gas-bars">{[0, 1, 2].map((b) => <i key={b} className={b < i ? 'on' : ''} />)}</span>
            <strong>{l}</strong>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Medication ──

function MedicationForm({ data, set }: { data: MedicationData; set: SetData }) {
  const { t } = useI18n()
  const { config } = useConfig()
  return (
    <>
      {config.medications.length > 0 && (
        <div className="field">
          <span>{t('usualMeds')}</span>
          <div className="chips">
            {config.medications.map((m, i) => {
              const on = data.name === m.name && data.dose === m.dose && data.unit === m.unit
              return (
                <button key={i} type="button" className={'chip' + (on ? ' on' : '')}
                  onClick={() => set({ ...data, name: m.name, dose: m.dose, unit: m.unit })}>
                  {m.name}{m.dose ? ` · ${m.dose} ${m.unit}` : ''}
                </button>
              )
            })}
          </div>
        </div>
      )}
      <label className="field">
        <span>{t('medication')}</span>
        <input value={data.name} placeholder={config.medications.length ? t('otherMed') : t('medication')}
          onChange={(e) => set({ ...data, name: e.target.value })} />
      </label>
      <div className="row">
        <label className="field grow"><span>{t('dose')}</span>
          <input inputMode="decimal" value={data.dose ?? ''} onChange={(e) => set({ ...data, dose: e.target.value })} /></label>
        <label className="field grow"><span>{t('unit')}</span>
          <input value={data.unit ?? ''} placeholder="mg, ml, comp." onChange={(e) => set({ ...data, unit: e.target.value })} /></label>
      </div>
    </>
  )
}

// ── Document ──

function DocumentForm({ data, set, pending, setPending }: {
  data: DocumentData; set: SetData; pending: File[]; setPending: (f: File[]) => void
}) {
  const { t } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)
  const camRef = useRef<HTMLInputElement>(null)
  const add = (list: FileList | null) => { if (list) setPending([...pending, ...Array.from(list)]) }
  const openStored = async (f: StoredFile) => {
    const w = window.open('', '_blank')
    try { const u = await fileUrl(f.path); if (w) w.location.href = u; else window.location.href = u }
    catch { w?.close(); toast(t('errorGeneric'), 'error') }
  }
  return (
    <>
      <Chips label={t('docKind')} value={data.kind} onChange={(v) => set({ ...data, kind: v })}
        options={DOC_KINDS.map((k) => ({ value: k, label: t(`doc_${k}` as TKey) }))} />
      <label className="field">
        <span>{t('title')}</span>
        <input value={data.title} onChange={(e) => set({ ...data, title: e.target.value })} />
      </label>
      <div className="field">
        <span>{t('files')}</span>
        <ul className="file-list">
          {data.files.map((f, i) => (
            <li key={f.path}>
              <FileIcon size={18} />
              <button type="button" className="link-btn" onClick={() => openStored(f)}>{f.name}</button>
              <button type="button" className="icon-btn small" aria-label={t('delete')}
                onClick={() => set({ ...data, files: data.files.filter((_, j) => j !== i) })}><CloseIcon size={16} /></button>
            </li>
          ))}
          {pending.map((f, i) => (
            <li key={'p' + i} className="pending">
              <FileIcon size={18} /><span>{f.name}</span>
              <button type="button" className="icon-btn small" aria-label={t('delete')}
                onClick={() => setPending(pending.filter((_, j) => j !== i))}><CloseIcon size={16} /></button>
            </li>
          ))}
        </ul>
        <div className="row">
          <button type="button" className="btn ghost grow" onClick={() => fileRef.current?.click()}>
            <PlusIcon size={18} /> {t('addFiles')}
          </button>
          <button type="button" className="btn ghost" onClick={() => camRef.current?.click()} aria-label={t('takePhoto')}>
            <CameraIcon size={18} />
          </button>
        </div>
        <input ref={fileRef} type="file" hidden multiple accept="image/*,application/pdf"
          onChange={(e) => { add(e.target.files); e.target.value = '' }} />
        <input ref={camRef} type="file" hidden accept="image/*" capture="environment"
          onChange={(e) => { add(e.target.files); e.target.value = '' }} />
      </div>
    </>
  )
}
