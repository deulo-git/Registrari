import { TYPE_COLOR, type Entry } from '../lib/types'
import { useI18n, type TKey } from '../lib/i18n'
import { describe, fmtTime } from '../lib/format'
import { TypeIcon } from './Icons'

/** Chronological list of entries, each tinted with its type colour. */
export function Timeline({ entries, onSelect, empty }: {
  entries: Entry[]; onSelect: (e: Entry) => void; empty?: string
}) {
  const { t, symptomLabel, liquidLabel, locale } = useI18n()
  if (!entries.length) return <p className="empty">{empty ?? t('nothingToday')}</p>
  return (
    <ol className="timeline">
      {entries.map((e) => (
        <li key={e.id}>
          <button type="button" className="tl-item" style={{ '--c': TYPE_COLOR[e.type] } as React.CSSProperties}
            onClick={() => onSelect(e)}>
            <time>{fmtTime(e.occurred_at, locale)}</time>
            <span className="tl-dot"><TypeIcon type={e.type} size={18} color="#fff" /></span>
            <span className="tl-text">
              <strong>{t(`type_${e.type}` as TKey)}</strong>
              <span>{describe(e, t, { symptomLabel, liquidLabel })}</span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  )
}
