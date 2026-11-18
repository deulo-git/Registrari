import { useEffect, useState } from 'react'
import { useConfig } from '../lib/data'
import { useI18n, type Lang } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { deleteShare, saveShare, updateProfile } from '../lib/api'
import { ENTRY_TYPES, SHARE_LEVELS, TYPE_COLOR, type Config, type EntryType, type MedicationPreset, type PetProfile, type ShareLevel } from '../lib/types'
import { ChevronLeft, CloseIcon, LockIcon, PlusIcon, TypeIcon } from '../components/Icons'
import { PetSetup } from '../components/PetSetup'
import { toast } from '../components/Toast'
import { confirmDialog } from '../components/Confirm'

const LEVEL_TEXT: Record<ShareLevel, { ca: [string, string]; es: [string, string] }> = {
  full: { ca: ['Accés il·limitat', 'Pot fer tot el que fas tu, excepte gestionar ajudants.'], es: ['Acceso ilimitado', 'Puede hacer todo lo que haces tú, salvo gestionar ayudantes.'] },
  edit: { ca: ['Consulta, edició i eliminació', 'Pot veure, afegir, editar i esborrar registres. No toca la configuració.'], es: ['Consulta, edición y eliminación', 'Puede ver, añadir, editar y borrar registros. No toca la configuración.'] },
  limited: { ca: ['Accés limitat', 'Només pot consultar els tipus de registre que triïs.'], es: ['Acceso limitado', 'Solo puede consultar los tipos de registro que elijas.'] },
}

export function Settings({ onBack }: { onBack: () => void }) {
  const { t, lang, setLang, symptomLabel, L } = useI18n()
  const { config, updateConfig } = useConfig()
  const { me, active, access, can, myShares, switchOwner, refresh, signOut, user } = useAuth()
  const [draft, setDraft] = useState<Config>(config)
  const [newCat, setNewCat] = useState('')
  const [newMed, setNewMed] = useState<MedicationPreset>({ name: '', dose: '', unit: '' })
  const [petDraft, setPetDraft] = useState<PetProfile | undefined>(active?.profile.pet)
  const [mine, setMine] = useState({
    first_name: me?.first_name ?? '', last_name: me?.last_name ?? '', birth_date: me?.birth_date ?? '',
    weight_kg: String(me?.weight_kg ?? ''), height_cm: String(me?.height_cm ?? ''),
  })
  const [invite, setInvite] = useState<{ email: string; level: ShareLevel; types: EntryType[] }>({ email: '', level: 'edit', types: [...ENTRY_TYPES] })

  useEffect(() => { setDraft(config) }, [config])
  useEffect(() => { setPetDraft(active?.profile.pet) }, [active])
  const dirty = JSON.stringify(draft) !== JSON.stringify(config)
  const petDirty = !!petDraft && JSON.stringify(petDraft) !== JSON.stringify(active?.profile.pet)
  const mineDirty = !!me && (mine.first_name !== me.first_name || mine.last_name !== me.last_name || mine.birth_date !== (me.birth_date ?? '')
    || mine.weight_kg !== String(me.weight_kg ?? '') || mine.height_cm !== String(me.height_cm ?? ''))

  const save = async () => {
    const ok = await updateConfig(draft)
    if (ok) toast(t('saved')); else toast(t('errorGeneric'), 'error')
  }
  const savePet = async () => {
    if (!active || !petDraft) return
    try { await updateProfile(active.ownerId, { pet: { ...petDraft, name: petDraft.name.trim() || 'Pipa' } }); await refresh(); toast(t('saved')) }
    catch { toast(t('errorGeneric'), 'error') }
  }
  const saveMine = async () => {
    if (!me) return
    try {
      await updateProfile(me.id, {
        first_name: mine.first_name.trim(), last_name: mine.last_name.trim(), birth_date: mine.birth_date || null,
        weight_kg: Number(mine.weight_kg) || null, height_cm: Number(mine.height_cm) || null,
      })
      await refresh(); toast(t('saved'))
    } catch { toast(t('errorGeneric'), 'error') }
  }
  const addHelper = async () => {
    if (!me || !/^\S+@\S+\.\S+$/.test(invite.email.trim())) { toast(L('Escriu un correu vàlid', 'Escribe un correo válido'), 'error'); return }
    try {
      await saveShare({ owner_id: me.id, helper_email: invite.email, level: invite.level, types: invite.level === 'limited' ? invite.types : [] })
      setInvite({ ...invite, email: '' }); await refresh(); toast(t('saved'))
    } catch { toast(t('errorGeneric'), 'error') }
  }

  return (
    <div className="screen settings">
      <div className="screen-head">
        <button type="button" className="icon-btn" onClick={onBack} aria-label={t('back')}><ChevronLeft size={24} /></button>
        <h1>{t('settings')}</h1>
        <span className="icon-btn" aria-hidden="true" />
      </div>

      {access.length > 1 && (
        <section className="card">
          <div className="field">
            <span>{L('Dades que veus', 'Datos que ves')}</span>
            <div className="level-list" role="radiogroup">
              {access.map((a) => (
                <button key={a.ownerId} type="button" role="radio" aria-checked={a.ownerId === active?.ownerId}
                  className={'level' + (a.ownerId === active?.ownerId ? ' on' : '')} onClick={() => switchOwner(a.ownerId)}>
                  <b>{a.level === 'owner' ? L('Les meves dades', 'Mis datos') : `${a.profile.first_name} ${a.profile.last_name}`}</b>
                  {a.level !== 'owner' && <small>{LEVEL_TEXT[a.level as ShareLevel][lang][0]}</small>}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

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

      {me && (
        <section className="card">
          <div className="field"><span>{L('El meu perfil', 'Mi perfil')}</span></div>
          <div className="row">
            <label className="field grow"><span>{L('Nom', 'Nombre')}</span><input value={mine.first_name} onChange={(e) => setMine({ ...mine, first_name: e.target.value })} /></label>
            <label className="field grow"><span>{L('Cognoms', 'Apellidos')}</span><input value={mine.last_name} onChange={(e) => setMine({ ...mine, last_name: e.target.value })} /></label>
          </div>
          <label className="field"><span>{L('Data de naixement', 'Fecha de nacimiento')}</span>
            <input type="date" value={mine.birth_date} onChange={(e) => setMine({ ...mine, birth_date: e.target.value })} /></label>
          <div className="row">
            <label className="field grow"><span>{L('Pes (kg)', 'Peso (kg)')}</span>
              <input type="number" inputMode="decimal" step="0.1" value={mine.weight_kg} onChange={(e) => setMine({ ...mine, weight_kg: e.target.value })} /></label>
            <label className="field grow"><span>{L('Alçada (cm)', 'Altura (cm)')}</span>
              <input type="number" inputMode="numeric" value={mine.height_cm} onChange={(e) => setMine({ ...mine, height_cm: e.target.value })} /></label>
          </div>
          {mineDirty && <button type="button" className="btn primary" onClick={saveMine}>{t('save')}</button>}
        </section>
      )}

      {petDraft && can.admin && (
        <section className="card">
          <div className="field"><span>{L('Mascota', 'Mascota')}</span></div>
          <PetSetup value={petDraft} onChange={setPetDraft} />
          {petDirty && (
            <div className="row">
              <button type="button" className="btn ghost" onClick={() => setPetDraft(active?.profile.pet)}>{t('cancel')}</button>
              <button type="button" className="btn primary grow" onClick={savePet}>{t('save')}</button>
            </div>
          )}
        </section>
      )}

      {!can.admin && <p className="muted small-print">{L('Només el propietari (o un ajudant amb accés il·limitat) pot canviar la configuració.', 'Solo el propietario (o un ayudante con acceso ilimitado) puede cambiar la configuración.')}</p>}
      <fieldset className="plain" disabled={!can.admin}>

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

      </fieldset>

      {dirty && can.admin && (
        <div className="save-bar">
          <button type="button" className="btn ghost" onClick={() => setDraft(config)}>{t('cancel')}</button>
          <button type="button" className="btn primary" onClick={save}>{t('save')}</button>
        </div>
      )}

      {can.share && me && (
        <section className="card helpers">
          <div className="field">
            <span>{L('Ajudants de gestió', 'Ayudantes de gestión')}</span>
            <small className="muted">{L('Dona accés a una altra persona (amb el seu compte de Google) perquè t’ajudi a gestionar les dades.', 'Da acceso a otra persona (con su cuenta de Google) para que te ayude a gestionar los datos.')}</small>
          </div>
          <ul className="share-list">
            {myShares.map((sh) => (
              <li key={sh.id}>
                <div className="grow">
                  <strong>{sh.helper_email}</strong>
                  <small>{LEVEL_TEXT[sh.level][lang][0]}{sh.level === 'limited' ? ` · ${sh.types.length} ${L('tipus', 'tipos')}` : ''}{sh.helper_id ? '' : ` · ${L('pendent', 'pendiente')}`}</small>
                </div>
                <button type="button" className="icon-btn small" aria-label={t('delete')} onClick={async () => {
                  const yes = await confirmDialog({ title: t('confirmTitle'), message: L('Treure l’accés a aquesta persona?', '¿Quitar el acceso a esta persona?'), confirmLabel: t('delete'), cancelLabel: t('cancel'), danger: true })
                  if (!yes) return
                  try { await deleteShare(sh.id); await refresh() } catch { toast(t('errorGeneric'), 'error') }
                }}><CloseIcon size={16} /></button>
              </li>
            ))}
          </ul>
          <div className="field">
            <input type="email" inputMode="email" placeholder="correu@gmail.com" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
            <div className="level-list" role="radiogroup">
              {SHARE_LEVELS.map((lv) => (
                <button key={lv} type="button" role="radio" aria-checked={invite.level === lv} className={'level' + (invite.level === lv ? ' on' : '')}
                  onClick={() => setInvite({ ...invite, level: lv })}>
                  <b>{LEVEL_TEXT[lv][lang][0]}</b><small>{LEVEL_TEXT[lv][lang][1]}</small>
                </button>
              ))}
            </div>
            {invite.level === 'limited' && (
              <div className="chips">
                {ENTRY_TYPES.map((ty) => {
                  const on = invite.types.includes(ty)
                  return (
                    <button key={ty} type="button" aria-pressed={on} className={'chip' + (on ? ' on' : '')} style={{ '--c': TYPE_COLOR[ty] } as React.CSSProperties}
                      onClick={() => setInvite({ ...invite, types: on ? invite.types.filter((x) => x !== ty) : [...invite.types, ty] })}>
                      <TypeIcon type={ty} size={14} color={on ? '#fff' : TYPE_COLOR[ty]} /> {t(`type_${ty}`)}
                    </button>
                  )
                })}
              </div>
            )}
            <button type="button" className="btn primary" onClick={addHelper}><PlusIcon size={18} /> {L('Convidar', 'Invitar')}</button>
          </div>
        </section>
      )}

      <section className="card">
        <div className="field">
          <span>{L('Compte', 'Cuenta')}</span>
          <p className="pin-state"><LockIcon size={16} /> {user?.email}</p>
        </div>
        <button type="button" className="btn ghost" onClick={signOut}>{L('Tancar sessió', 'Cerrar sesión')}</button>
      </section>

      <p className="muted small-print">{t('installHint')}</p>
      <p className="muted small-print">{t('version')} {__APP_VERSION__}</p>
    </div>
  )
}
