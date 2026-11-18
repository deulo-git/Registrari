import { useI18n } from '../lib/i18n'
import { QUESTIONS, SPECIES } from '../lib/pets'
import { PET_SPECIES, type PetProfile, type PetSliders } from '../lib/types'
import { PetArt } from './PetSvgs'

/** The four sliders: ends of each describe the two extremes of that trait. */
const SLIDERS: { key: keyof PetSliders; ca: [string, string, string]; es: [string, string, string] }[] = [
  { key: 'energy', ca: ['Energia', 'Tranquil·la', 'Incansable'], es: ['Energía', 'Tranquila', 'Incansable'] },
  { key: 'affection', ca: ['Afecte', 'Independent', 'Molt mimosa'], es: ['Cariño', 'Independiente', 'Muy mimosa'] },
  { key: 'mischief', ca: ['Entremaliadura', 'Assenyada', 'Trapella'], es: ['Travesura', 'Formal', 'Traviesa'] },
  { key: 'chatty', ca: ['Xerrameca', 'Callada', 'Xerraire'], es: ['Charla', 'Callada', 'Parlanchina'] },
]

/** Picks the species, name, "personalised experience", the four sliders and the questions. */
export function PetSetup({ value, onChange }: { value: PetProfile; onChange: (p: PetProfile) => void }) {
  const { lang, L } = useI18n()
  const set = (patch: Partial<PetProfile>) => onChange({ ...value, ...patch })
  const sp = SPECIES[value.species]
  return (
    <div className="pet-setup">
      <div className="field">
        <span>{L('Tria la teva mascota', 'Elige tu mascota')}</span>
        <div className="pet-grid" role="radiogroup">
          {PET_SPECIES.map((id) => {
            const def = SPECIES[id]
            const on = value.species === id
            return (
              <button key={id} type="button" role="radio" aria-checked={on} className={'pet-card' + (on ? ' on' : '')}
                onClick={() => onChange({ ...value, species: id, sliders: { ...def.sliders } })}>
                <span className={`pet-card-art sp-${id} mood-sit`}><PetArt species={id} /></span>
                <strong>{def[lang].name}</strong>
              </button>
            )
          })}
        </div>
        <small className="muted">{sp[lang].desc}</small>
      </div>

      <label className="field">
        <span>{L('Nom de la mascota', 'Nombre de la mascota')}</span>
        <input value={value.name} maxLength={24} onChange={(e) => set({ name: e.target.value })} placeholder="Pipa" />
      </label>

      <div className="field">
        <span>{L('Personalitat', 'Personalidad')}</span>
        {SLIDERS.map((s) => {
          const [label, lo, hi] = s[lang]
          return (
            <div key={s.key} className="pers-row">
              <div className="pers-head"><b>{label}</b><small>{value.sliders[s.key]}</small></div>
              <input type="range" min={0} max={100} step={5} value={value.sliders[s.key]} aria-label={label}
                onChange={(e) => set({ sliders: { ...value.sliders, [s.key]: Number(e.target.value) } })} />
              <div className="pers-ends"><span>{lo}</span><span>{hi}</span></div>
            </div>
          )
        })}
        <small className="muted">{L('Aquests quatre valors fan que la teva mascota sigui única: com es mou, quant parla i com és.', 'Estos cuatro valores hacen que tu mascota sea única: cómo se mueve, cuánto habla y cómo es.')}</small>
      </div>

      <label className="toggle personalise">
        <input type="checkbox" checked={value.personalized} onChange={(e) => set({ personalized: e.target.checked })} />
        <span>
          <b>{L('Experiència personalitzada', 'Experiencia personalizada')}</b>
          <small>{L('La mascota farà servir el que li expliquis (parella, veïns, sèries…) en el que diu.', 'La mascota usará lo que le cuentes (pareja, vecinos, series…) en lo que dice.')}</small>
        </span>
      </label>

      {value.personalized && (
        <div className="field personal">
          <span>{L('Explica-li coses de tu (tot opcional)', 'Cuéntale cosas de ti (todo opcional)')}</span>
          {QUESTIONS.map((q) => (
            <label key={q.key} className="field">
              <small>{lang === 'ca' ? q.ca : q.es}</small>
              <input value={value.answers[q.key] ?? ''} maxLength={60}
                placeholder={lang === 'ca' ? q.phCa : q.phEs}
                onChange={(e) => set({ answers: { ...value.answers, [q.key]: e.target.value } })} />
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
