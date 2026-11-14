import { useEffect, useState } from 'react'
import { useConfig } from '../lib/data'
import { useI18n } from '../lib/i18n'
import { PIPA, phrase } from '../lib/pipa'
import { PoodleSvg } from './Pet'

/**
 * Loading screen shown when the app opens: Pipa nodding with a welcome
 * message (src/data/pipa.json → frases.benvinguda) while the data loads.
 * Stays at least carrega.minimSegons, then fades out.
 */
export function Splash() {
  const { loaded } = useConfig()
  const { lang } = useI18n()
  const [text] = useState(() => phrase('benvinguda', lang))
  const [minDone, setMinDone] = useState(false)
  const [phase, setPhase] = useState<'in' | 'out' | 'gone'>('in')

  useEffect(() => {
    const h = window.setTimeout(() => setMinDone(true), PIPA.splashMinMs)
    return () => window.clearTimeout(h)
  }, [])
  useEffect(() => {
    if (!loaded || !minDone || phase !== 'in') return
    setPhase('out')
    const h = window.setTimeout(() => setPhase('gone'), 520)
    return () => window.clearTimeout(h)
  }, [loaded, minDone, phase])

  if (phase === 'gone') return null
  return (
    <div className={'splash' + (phase === 'out' ? ' out' : '')} aria-busy={phase === 'in'}>
      <div className="splash-inner">
        {text && <span className="splash-say">{text}</span>}
        <div className="splash-pet mood-sit"><PoodleSvg /></div>
        <strong className="splash-brand"><span className="brand-mark" />REGISTRARI</strong>
        <span className="splash-dots"><i /><i /><i /></span>
      </div>
    </div>
  )
}
