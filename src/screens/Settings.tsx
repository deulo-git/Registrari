import { useEffect, useState } from 'react'
import { useConfig } from '../lib/data'
import { useI18n, type Lang } from '../lib/i18n'
import { usePin } from '../lib/pin'
import { getStoredPin, setPin, storePin } from '../lib/api'
import type { Config, MedicationPreset } from '../lib/types'
import { CloseIcon, LockIcon, PlusIcon } from '../components/Icons'
import { toast } from '../components/Toast'

export function Settings() {
  const { t, lang, setLang, symptomLabel } = useI18n()
  const { config, updateConfig } = useConfig()
  const { withPin } = usePin()
  const [draft, setDraft] = useState<Config>(config)
  const [newCat, setNewCat] = useState('')
  const [newMed, setNewMed] = useState<MedicationPreset>({ name: '', dose: '', unit: '' })
  const [remembered, setRemembered] = useState(!!getStoredPin())
  const [changing, setChanging] = useState(false)
  const [pins, setPins] = useState({ old: '', next: '' })

  useEffect(() => { setDraft(config) }, [config])
  const dirty = JSON.stringify(draft) !== JSON.stringify(config)

  const save = async () => {
    const ok = await updateConfig(draft).catch(() => false)
    if (ok) { toast(t('saved')); setRemembered(!!getStoredPin()) }
  }

  const changePin = async () => {
    if (!/^\d{4}$/.test(pins.old) || !/^\d{4}$/.test(pins.next)) return
    try {
      await setPin(pins.old, pins.next)
      storePin(pins.next)
      setRemembered(true)
      setChanging(false)
      setPins({ old: '', next: '' })
      toast(t('pinChanged'))
    } catch (e) {
      const code = (e as { code?: string }).code
      toast(code === 'locked' ? t('pinLocked') : code === 'bad_pin' ? t('pinWrong') : t('errorGeneric'), 'error')
    }
  }

  return (
    <div className="screen settings">
      <div className="screen-head"><h1>{t('settings')}</h1></div>

      <section className="card">
        <div className="field">
          <span>{t('language')}</span>
          <div className="segmented wide">
            {(['ca', 'es'] as Lang[]).map((l) => (
              <button key={l} type="button" className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>
                {l === 'ca' ? 'Català' : 'Castellano'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <label className="field">
          <span>{t('patientName')}</span>
          <input value={draft.patientName} onChange={(e) => setDraft({ ...draft, patientName: e.target.value })} />
          <small className="muted">{t('patientNameHint')}</small>
        </label>
        <div className="row">
          <label className="field grow"><span>{t('glassSize')}</span>
            <input type="number" inputMode="numeric" min={50} value={draft.glassMl}
              onChange={(e) => setDraft({ ...draft, glassMl: Number(e.target.value) || 0 })} /></label>
          <label className="field grow"><span>{t('waterGoalMl')}</span>
            <input type="number" inputMode="numeric" min={0} step={100} value={draft.waterGoalMl}
              onChange={(e) => setDraft({ ...draft, waterGoalMl: Number(e.target.value) || 0 })} /></label>
        </div>
      </section>

      <section className="card">
        <div className="field">
          <span>{t('symptomCategories')}</span>
          <div className="chips">
            {draft.symptomCategories.map((c) => (
              <span key={c} className="chip removable">
                {symptomLabel(c)}
                <button type="button" aria-label={t('delete')}
                  onClick={() => setDraft({ ...draft, symptomCategories: draft.symptomCategories.filter((x) => x !== c) })}>
                  <CloseIcon size={13} />
                </button>
              </span>
            ))}
          </div>
          <div className="row">
            <input className="grow" value={newCat} placeholder={t('addCategory')} onChange={(e) => setNewCat(e.target.value)} />
            <button type="button" className="btn ghost" disabled={!newCat.trim()} onClick={() => {
              const v = newCat.trim()
              if (v && !draft.symptomCategories.includes(v)) setDraft({ ...draft, symptomCategories: [...draft.symptomCategories, v] })
              setNewCat('')
            }}><PlusIcon size={18} /></button>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="field">
          <span>{t('usualMedications')}</span>
          <ul className="med-list">
            {draft.medications.map((m, i) => (
              <li key={i}>
                <span><strong>{m.name}</strong> {m.dose} {m.unit}</span>
                <button type="button" className="icon-btn small" aria-label={t('delete')}
                  onClick={() => setDraft({ ...draft, medications: draft.medications.filter((_, j) => j !== i) })}>
                  <CloseIcon size={16} />
                </button>
              </li>
            ))}
          </ul>
          <div className="row med-add">
            <input className="grow" placeholder={t('medication')} value={newMed.name} onChange={(e) => setNewMed({ ...newMed, name: e.target.value })} />
            <input className="short" placeholder={t('dose')} value={newMed.dose} onChange={(e) => setNewMed({ ...newMed, dose: e.target.value })} />
            <input className="short" placeholder="mg" value={newMed.unit} onChange={(e) => setNewMed({ ...newMed, unit: e.target.value })} />
            <button type="button" className="btn ghost" disabled={!newMed.name.trim()} onClick={() => {
              setDraft({ ...draft, medications: [...draft.medications, { ...newMed, name: newMed.name.trim() }] })
              setNewMed({ name: '', dose: '', unit: '' })
            }}><PlusIcon size={18} /></button>
          </div>
        </div>
      </section>

      {dirty && (
        <div className="save-bar">
          <button type="button" className="btn ghost" onClick={() => setDraft(config)}>{t('cancel')}</button>
          <button type="button" className="btn primary" onClick={save}>{t('save')}</button>
        </div>
      )}

      <section className="card">
        <div className="field">
          <span>{t('security')}</span>
          <p className="pin-state"><LockIcon size={16} /> {remembered ? t('pinRemembered') : t('pinNotRemembered')}</p>
        </div>
        {changing ? (
          <div className="row">
            <input className="grow" type="password" inputMode="numeric" maxLength={4} placeholder={t('pinCurrent')}
              value={pins.old} onChange={(e) => setPins({ ...pins, old: e.target.value.replace(/\D/g, '') })} />
            <input className="grow" type="password" inputMode="numeric" maxLength={4} placeholder={t('pinNew')}
              value={pins.next} onChange={(e) => setPins({ ...pins, next: e.target.value.replace(/\D/g, '') })} />
            <button type="button" className="btn primary" onClick={changePin}>{t('save')}</button>
          </div>
        ) : (
          <div className="row">
            <button type="button" className="btn ghost grow" onClick={() => setChanging(true)}>{t('changePin')}</button>
            {remembered ? (
              <button type="button" className="btn ghost grow" onClick={() => { storePin(null); setRemembered(false) }}>{t('forgetPin')}</button>
            ) : (
              <button type="button" className="btn ghost grow" onClick={async () => {
                await withPin(async () => true).catch(() => {}); setRemembered(!!getStoredPin())
              }}>{t('pinEnter')}</button>
            )}
          </div>
        )}
      </section>

      <p className="muted small-print">{t('installHint')}</p>
      <p className="muted small-print">{t('version')} {__APP_VERSION__}</p>
    </div>
  )
}
