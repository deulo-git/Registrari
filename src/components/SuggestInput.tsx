import { useState } from 'react'
import { useSuggestions } from '../lib/suggestions'
import { useI18n } from '../lib/i18n'

interface Props {
  value: string
  onChange: (v: string) => void
  /** Key of the text box in Suggestions.fields (what was typed here before). */
  field: string
  /** Extra values always offered (e.g. built-ins). */
  extra?: string[]
  placeholder?: string
  multiline?: boolean
  rows?: number
  inputMode?: 'text' | 'decimal' | 'numeric'
  autoFocus?: boolean
}

/**
 * Text box that drops down the values already used in that same box: tap it to
 * see them (most used first), type to narrow them down, tap one to fill it in.
 */
export function SuggestInput({ value, onChange, field, extra = [], placeholder, multiline, rows = 2, inputMode, autoFocus }: Props) {
  const { fields } = useSuggestions()
  const { t } = useI18n()
  const [focus, setFocus] = useState(false)
  const q = value.trim().toLocaleLowerCase()
  const seen = new Set<string>()
  const all = [...extra, ...(fields[field] ?? [])].filter((x) => {
    const k = x.toLocaleLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  const options = focus
    ? all.filter((x) => { const k = x.toLocaleLowerCase(); return k !== q && (!q || k.includes(q)) }).slice(0, 7)
    : []
  const common = {
    value, placeholder, autoFocus, inputMode,
    onFocus: () => setFocus(true),
    onBlur: () => window.setTimeout(() => setFocus(false), 120),
    'aria-autocomplete': 'list' as const,
  }
  return (
    <div className="sw">
      {multiline
        ? <textarea rows={rows} {...common} onChange={(e) => onChange(e.target.value)} />
        : <input {...common} onChange={(e) => onChange(e.target.value)} />}
      {options.length > 0 && (
        <ul className="sdrop" role="listbox" aria-label={t('suggestions')}>
          {options.map((o) => (
            <li key={o}>
              <button type="button" role="option" aria-selected={false}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => { onChange(o); setFocus(false) }}>{o}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Chips for a kind/type with an extra "Nou" chip: choosing it shows a text
 * box (with the earlier custom values) to write the new type.
 */
export function KindPicker({ label, builtins, value, onChange, field, extraReserved, fallback }: {
  label: string
  builtins: { value: string; label: string }[]
  value: string | undefined
  onChange: (v: string) => void
  /** Suggestions field with the custom values used before. */
  field: string
  /** Stored values that are not custom types (keys of built-ins, old values). */
  extraReserved?: string[]
  /** Value used while the new type is still empty. */
  fallback: string
}) {
  const { t } = useI18n()
  const { fields } = useSuggestions()
  const isBuiltin = (v?: string) => builtins.some((b) => b.value === v) || (extraReserved ?? []).includes(v ?? '')
  const customCurrent = value && !isBuiltin(value) ? value : ''
  const [creating, setCreating] = useState(false)
  const reserved = new Set([...builtins.map((b) => b.value), ...(extraReserved ?? [])])
  const customs = [...new Set([...(fields[field] ?? []), ...(customCurrent ? [customCurrent] : [])])]
    .filter((c) => !reserved.has(c) || c === customCurrent)
  const showInput = creating
  return (
    <div className="field">
      <span>{label}</span>
      <div className="chips" role="radiogroup">
        {builtins.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={value === o.value && !creating}
            className={'chip' + (value === o.value && !creating ? ' on' : '')}
            onClick={() => { setCreating(false); onChange(o.value) }}>{o.label}</button>
        ))}
        {customs.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={value === c && !creating}
            className={'chip' + (value === c && !creating ? ' on' : '')}
            onClick={() => { setCreating(false); onChange(c) }}>{c}</button>
        ))}
        <button type="button" className={'chip new' + (creating ? ' on' : '')} onClick={() => setCreating(true)}>+ {t('newKind')}</button>
      </div>
      {showInput && (
        <SuggestInput autoFocus field={field} placeholder={t('newKindName')}
          value={customCurrent} onChange={(v) => onChange(v.trim() ? v : fallback)} />
      )}
    </div>
  )
}
