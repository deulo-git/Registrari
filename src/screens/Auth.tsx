import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { createProfile } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { DEFAULT_PET, type PetProfile } from '../lib/types'
import { PetSetup } from '../components/PetSetup'
import { PetArt } from '../components/PetSvgs'
import { toast } from '../components/Toast'

function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.600 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.900-5.8l-7.500-5.8c-2.100 1.400-4.800 2.300-8.400 2.300-6.300 0-11.600-4.100-13.500-9.800l-7.9 6.1C6.500 42.600 14.600 48 24 48z" />
    </svg>
  )
}

/** Signed-out screen: Google is the only way in. */
export function SignIn() {
  const { signIn, guestSignIn } = useAuth()
  const { L, lang, setLang } = useI18n()
  const [busy, setBusy] = useState(false)
  const [guest, setGuest] = useState(false)
  const [email, setEmail] = useState('')
  const okEmail = /^\S+@\S+\.\S+$/.test(email.trim())
  const enterAsGuest = async () => {
    if (!okEmail || busy) return
    setBusy(true)
    try {
      if (!(await guestSignIn(email))) {
        toast(L('Aquest correu no té cap invitació', 'Este correo no tiene ninguna invitación'), 'error')
        setBusy(false)
      }
    } catch { toast(L('No s’ha pogut entrar', 'No se pudo entrar'), 'error'); setBusy(false) }
  }
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-pets" aria-hidden="true">
          {(['poodle', 'cat', 'panda'] as const).map((s) => <span key={s} className={`auth-pet sp-${s} mood-sit`}><PetArt species={s} /></span>)}
        </div>
        <h1>Registrari</h1>
        <p className="muted">{L('El teu diari digestiu, amb una mascota que t’acompanya.', 'Tu diario digestivo, con una mascota que te acompaña.')}</p>
        <button type="button" className="btn google" disabled={busy}
          onClick={async () => { setBusy(true); try { await signIn() } catch { toast(L('No s’ha pogut iniciar sessió', 'No se pudo iniciar sesión'), 'error'); setBusy(false) } }}>
          <GoogleG /> {L('Continua amb Google', 'Continuar con Google')}
        </button>
        {guest ? (
          <form className="guest-form" onSubmit={(e) => { e.preventDefault(); enterAsGuest() }}>
            <label className="field">
              <span>{L('Correu amb què t’han convidat', 'Correo con el que te han invitado')}</span>
              <input type="email" inputMode="email" autoComplete="email" autoFocus placeholder="correu@gmail.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <button type="submit" className="btn primary" disabled={!okEmail || busy}>{L('Entrar', 'Entrar')}</button>
          </form>
        ) : (
          <button type="button" className="btn ghost" onClick={() => setGuest(true)}>{L('Entra com a convidat', 'Entrar como invitado')}</button>
        )}
        {guest && <p className="muted small-print">{L('Sense compte: només veuràs les dades que t’hagin compartit.', 'Sin cuenta: solo verás los datos que te hayan compartido.')}</p>}
        <div className="segmented wide auth-lang">
          {(['ca', 'es'] as const).map((l) => <button key={l} type="button" className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>{l === 'ca' ? 'Català' : 'Castellano'}</button>)}
        </div>
      </div>
    </div>
  )
}

/** First sign-in: who you are, then your pet. */
export function Onboarding() {
  const { user, refresh, signOut } = useAuth()
  const { L } = useI18n()
  const meta = (user?.user_metadata ?? {}) as { full_name?: string; name?: string; given_name?: string; family_name?: string }
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [f, setF] = useState(() => {
    const full = (meta.full_name ?? meta.name ?? '').trim()
    return {
      first: meta.given_name ?? full.split(' ')[0] ?? '',
      last: meta.family_name ?? full.split(' ').slice(1).join(' '),
      birth: '', weight: '', height: '',
    }
  })
  const [pet, setPet] = useState<PetProfile>({ ...DEFAULT_PET, sliders: { ...DEFAULT_PET.sliders } })
  const okMe = f.first.trim() && f.last.trim() && f.birth && Number(f.weight) > 0 && Number(f.height) > 0
  const okPet = pet.name.trim().length > 0

  const finish = async () => {
    if (!user || !okMe || !okPet || busy) return
    setBusy(true)
    try {
      await createProfile(user.id, {
        email: user.email ?? null, first_name: f.first.trim(), last_name: f.last.trim(), birth_date: f.birth,
        weight_kg: Number(f.weight), height_cm: Number(f.height), pet: { ...pet, name: pet.name.trim() },
      })
      await refresh()
    } catch { toast(L('No s’ha pogut desar', 'No se pudo guardar'), 'error'); setBusy(false) }
  }

  return (
    <div className="auth-screen onboarding">
      <div className="auth-card wide">
        <div className="steps" aria-hidden="true"><i className={step >= 0 ? 'on' : ''} /><i className={step >= 1 ? 'on' : ''} /></div>
        {step === 0 ? (
          <>
            <h1>{L('Benvingut/da!', '¡Bienvenido/a!')}</h1>
            <p className="muted">{L('Primer de tot, explica’ns qui ets.', 'Primero, cuéntanos quién eres.')}</p>
            <div className="row">
              <label className="field grow"><span>{L('Nom', 'Nombre')}</span><input value={f.first} onChange={(e) => setF({ ...f, first: e.target.value })} autoComplete="given-name" /></label>
              <label className="field grow"><span>{L('Cognoms', 'Apellidos')}</span><input value={f.last} onChange={(e) => setF({ ...f, last: e.target.value })} autoComplete="family-name" /></label>
            </div>
            <label className="field"><span>{L('Data de naixement', 'Fecha de nacimiento')}</span>
              <input type="date" value={f.birth} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setF({ ...f, birth: e.target.value })} /></label>
            <div className="row">
              <label className="field grow"><span>{L('Pes (kg)', 'Peso (kg)')}</span>
                <input type="number" inputMode="decimal" min={1} step="0.1" value={f.weight} onChange={(e) => setF({ ...f, weight: e.target.value })} /></label>
              <label className="field grow"><span>{L('Alçada (cm)', 'Altura (cm)')}</span>
                <input type="number" inputMode="numeric" min={30} value={f.height} onChange={(e) => setF({ ...f, height: e.target.value })} /></label>
            </div>
            <div className="auth-actions">
              <button type="button" className="btn ghost" onClick={signOut}>{L('Sortir', 'Salir')}</button>
              <button type="button" className="btn primary grow" disabled={!okMe} onClick={() => setStep(1)}>{L('Següent', 'Siguiente')}</button>
            </div>
          </>
        ) : (
          <>
            <h1>{L('La teva mascota', 'Tu mascota')}</h1>
            <PetSetup value={pet} onChange={setPet} />
            <div className="auth-actions">
              <button type="button" className="btn ghost" onClick={() => setStep(0)}>{L('Enrere', 'Atrás')}</button>
              <button type="button" className="btn primary grow" disabled={!okPet || busy} onClick={finish}>{L('Començar', 'Empezar')}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
