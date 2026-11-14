import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../lib/i18n'
import { PIPA, nextMove, phrase, type Mood, type PhraseList } from '../lib/pipa'

/**
 * "Pipa", the toy poodle that lives next to the big button.
 *
 * What she does and says comes from src/data/pipa.json (weights per move and
 * per phrase). She walks, runs, sniffs, plays, chases her tail, rolls over,
 * stretches, scratches, begs, digs, drinks from the button (whose water is
 * today's water), sleeps — mostly at night — and sometimes leaves the screen.
 * Tapping the empty space while she is away calls her back ("M'has cridat?").
 * Now and then she poops; tapping the poop picks it up (it fades out).
 *
 * Movement is CSS: this component only sets a target x and a mood class.
 */

export const PET_EVENT = 'registrari:pet'
/** Make the pet react from anywhere (e.g. after saving an entry). */
export function cheerPet() { window.dispatchEvent(new CustomEvent(PET_EVENT, { detail: 'happy' })) }
/** Call her back if she is off screen (Today screen taps). */
export function callPet() { window.dispatchEvent(new CustomEvent(PET_EVENT, { detail: 'call' })) }

const rand = (a: number, b: number) => a + Math.random() * (b - a)

/** Half the dog's width in px: keeps her fully on screen. */
const HALF = 52
/** Button radius: where her nose reaches the water when drinking. */
const BUTTON_R = 78
/** Moods that just last a while in place (a tap can interrupt them). */
const IN_PLACE: Mood[] = ['sit', 'lie', 'sniff', 'play', 'chase', 'roll', 'stretch', 'scratch', 'beg', 'dig', 'drink']

interface Poop { id: number; x: number; gone?: boolean }
const POOP_KEY = 'registrari.poops'
function readPoops(): Poop[] {
  try {
    const v = JSON.parse(localStorage.getItem(POOP_KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((p) => typeof p?.x === 'number') : []
  } catch { return [] }
}
function writePoops(p: Poop[]) {
  try { localStorage.setItem(POOP_KEY, JSON.stringify(p.filter((x) => !x.gone))) } catch { /* ignore */ }
}

interface Props {
  hidden?: boolean
  /** 0..1, today's water (the same water as in the button). */
  water: number
}

export function Pet({ hidden, water }: Props) {
  const { lang } = useI18n()
  const track = useRef<HTMLDivElement>(null)
  const [mood, setMood] = useState<Mood>('sit')
  const [x, setX] = useState(0.82)
  const [facing, setFacing] = useState<1 | -1>(-1)
  const [moveMs, setMoveMs] = useState(0)
  const [speech, setSpeech] = useState<{ text: string; id: number } | null>(null)
  const [poops, setPoops] = useState<Poop[]>(readPoops)
  const timer = useRef<number | undefined>(undefined)
  const sayTimer = useRef<number | undefined>(undefined)
  const chatterTimer = useRef<number | undefined>(undefined)
  const s = useRef({ x, mood, water, lang, hidden, facing, poops })
  s.current = { x, mood, water, lang, hidden, facing, poops }

  const say = (list: PhraseList) => {
    const text = phrase(list, s.current.lang)
    if (!text) return
    window.clearTimeout(sayTimer.current)
    setSpeech({ text, id: Date.now() })
    sayTimer.current = window.setTimeout(() => setSpeech(null), PIPA.talkDurationMs)
  }

  const schedule = (fn: () => void, ms: number) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(fn, ms)
  }

  const bounds = () => {
    const w = track.current?.offsetWidth || 340
    return { w, min: HALF / w, max: 1 - HALF / w }
  }

  /** Walk (or run) to x (clamped on screen unless `offscreen`), then `after`. */
  const moveTo = (target: number, fast: boolean, after: () => void, offscreen = false) => {
    const { w, min, max } = bounds()
    const tx = offscreen ? target : Math.max(min, Math.min(max, target))
    const ms = Math.round(Math.abs(tx - s.current.x) * w * (fast ? 4 : 11)) + 300
    setFacing(tx > s.current.x ? 1 : -1)
    setMoveMs(ms)
    setMood(fast ? 'run' : 'walk')
    setX(tx)
    schedule(after, ms)
  }

  const rest = (ms = rand(1500, 3000)) => { setMood('sit'); schedule(next, ms) }

  /** Somewhere to the side of the button (she poops/drinks where we can see her). */
  const sideSpot = () => {
    const { min, max } = bounds()
    return s.current.x < 0.5 ? rand(min, 0.24) : rand(0.76, max)
  }

  const next = () => {
    const h = new Date().getHours()
    const night = h >= 23 || h < 7
    let m = nextMove(night)
    if (m === 'poop' && s.current.poops.filter((p) => !p.gone).length >= PIPA.maxPoops) m = 'sniff'
    const { w, min, max } = bounds()
    setMoveMs(0)

    switch (m) {
      case 'walk':
      case 'run': {
        // Usually cross to the other side of the button (she passes behind it).
        const target = s.current.x > 0.5 ? rand(min, 0.3) : rand(0.7, max)
        moveTo(target, m === 'run', () => rest())
        return
      }
      case 'drink': {
        const left = s.current.x < 0.5
        const nose = HALF - 8
        const target = left ? (w / 2 - BUTTON_R - nose) / w : (w / 2 + BUTTON_R + nose) / w
        moveTo(target, false, () => {
          setFacing(left ? 1 : -1)
          setMood('drink')
          if (s.current.water < 0.08) say('set')
          schedule(() => rest(), rand(4000, 6000))
        })
        return
      }
      case 'poop': {
        moveTo(sideSpot(), false, () => {
          setMood('poop')
          schedule(() => {
            // The poop lands just behind her.
            const back = (-s.current.facing * 34) / bounds().w
            const p = { id: Date.now(), x: Math.max(0.03, Math.min(0.97, s.current.x + back)) }
            setPoops((ps) => { const n = [...ps.filter((q) => !q.gone), p]; writePoops(n); return n })
            schedule(() => { say('caca'); rest(3500) }, 700)
          }, 2200)
        })
        return
      }
      case 'leave': {
        const out = s.current.x < 0.5 ? -0.35 : 1.35
        moveTo(out, Math.random() < 0.5, () => {
          setMood('away')
          schedule(comeBack, rand(PIPA.awaySec[0], PIPA.awaySec[1]) * 1000)
        }, true)
        return
      }
      default:
        setMood(m)
        if (m === 'sleep') schedule(next, rand(14000, 24000))
        else if (m === 'chase' || m === 'roll') schedule(next, rand(2600, 3400))
        else schedule(next, rand(4000, 7500))
    }
  }

  /** Walk back in from the edge she left by. */
  const comeBack = (called = false) => {
    const fromLeft = s.current.x < 0.5
    const target = fromLeft ? rand(0.12, 0.25) : rand(0.75, 0.88)
    moveTo(target, called, () => {
      if (called) { setMood('happy'); schedule(next, 2400) } else rest()
    })
    if (called) say('cridada')
  }

  const chatter = () => {
    const cur = s.current
    if (cur.mood !== 'sleep' && cur.mood !== 'away' && cur.mood !== 'leave' && !cur.hidden) {
      const thirsty = cur.water < 0.3 && new Date().getHours() >= 12
      say(thirsty && Math.random() < PIPA.thirstyChance ? 'set' : 'sola')
    }
    chatterTimer.current = window.setTimeout(chatter, rand(PIPA.talkEverySec[0], PIPA.talkEverySec[1]) * 1000)
  }

  useEffect(() => {
    schedule(next, 1600)
    chatterTimer.current = window.setTimeout(chatter, rand(9000, 16000))
    // A poop left from before is the first thing she mentions.
    if (s.current.poops.length) window.setTimeout(() => say('caca'), 1800)
    const onEvt = (e: Event) => {
      const what = (e as CustomEvent).detail
      if (what === 'call') {
        if (s.current.mood === 'away') comeBack(true)
        return
      }
      if (what !== 'happy' || s.current.mood === 'away') return
      setMoveMs(0)
      setMood('happy')
      say(s.current.water >= 1 ? 'aiguaPlena' : 'desar')
      schedule(next, 2600)
    }
    window.addEventListener(PET_EVENT, onEvt)
    return () => {
      window.clearTimeout(timer.current)
      window.clearTimeout(sayTimer.current)
      window.clearTimeout(chatterTimer.current)
      window.removeEventListener(PET_EVENT, onEvt)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const poke = () => {
    if (s.current.mood === 'sleep') { say('tocarDormint'); return }
    say('tocar')
    if (IN_PLACE.includes(s.current.mood)) {
      setMood('happy')
      schedule(next, 1800)
    }
  }

  const pickUp = (id: number) => {
    setPoops((ps) => ps.map((p) => (p.id === id ? { ...p, gone: true } : p)))
    window.setTimeout(() => setPoops((ps) => { const n = ps.filter((p) => p.id !== id); writePoops(n); return n }), 700)
    if (s.current.mood !== 'away' && s.current.mood !== 'sleep') say('cacaRecollida')
  }

  return (
    <>
      <div className="poop-track" aria-hidden={hidden}>
        {poops.map((p) => (
          <button key={p.id} type="button" className={'poop' + (p.gone ? ' gone' : '') + (hidden ? ' hidden' : '')}
            style={{ left: `${p.x * 100}%` }} onClick={() => pickUp(p.id)} aria-label="💩">
            <PoopSvg />
          </button>
        ))}
      </div>
      <div ref={track} className={'pet-track' + (hidden ? ' hidden' : '')}>
        <div className={`pet mood-${mood}`}
          style={{ left: `${x * 100}%`, transitionDuration: `${moveMs}ms` }}
          onClick={poke} role="button" aria-label="Pipa">
          <div className="pet-flip" style={{ transform: `scaleX(${facing})` }}>
            <PoodleSvg />
            {mood === 'play' && <span className="pet-ball" />}
            {mood === 'dig' && <span className="pet-dirt"><i /><i /><i /></span>}
            {mood === 'drink' && water > 0.02 && <span className="pet-drops"><i /><i /><i /></span>}
          </div>
          {mood === 'sleep' && <span className="pet-z"><i>z</i><i>z</i><i>Z</i></span>}
          {mood === 'happy' && <span className="pet-hearts"><i>♥</i><i>♥</i><i>♥</i></span>}
        </div>
      </div>
      {/* Speech lives in its own layer above the button (Pipa walks behind it). */}
      {speech && !hidden && (
        <div className="pet-say-track">
          <div className="pet-say-anchor" style={{ left: `${Math.max(0.1, Math.min(0.9, x)) * 100}%`, transitionDuration: `${moveMs}ms` }}>
            <span key={speech.id} className={'pet-say ' + (x < 0.5 ? 'l' : 'r')}>{speech.text}</span>
          </div>
        </div>
      )}
    </>
  )
}

function PoopSvg() {
  return (
    <svg viewBox="0 0 40 34" width="38" height="32" aria-hidden="true">
      <ellipse cx="20" cy="31" rx="15" ry="2.5" fill="rgba(0,0,0,.12)" />
      <path d="M6 29c-3 0-4-5 0-6-2-4 2-7 5-6 0-5 5-7 8-5 1-5 7-6 8-1 4 0 6 4 3 6 4 1 4 6 1 7 2 3-1 5-4 5H6z" fill="#8b5a2b" />
      <path d="M11 17c3 1 9 1 13-1M8 23c5 2 15 2 21-1" stroke="#6b4220" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <circle cx="16" cy="24" r="1.6" fill="#fff" /><circle cx="24" cy="24" r="1.6" fill="#fff" />
      <circle cx="16.3" cy="24.3" r=".8" fill="#222" /><circle cx="24.3" cy="24.3" r=".8" fill="#222" />
    </svg>
  )
}

/** Apricot toy poodle facing right. Parts have classes so CSS can animate them. */
function PoodleSvg() {
  const fur = '#f2c48d'
  const furDark = '#e2a96b'
  return (
    <svg className="poodle" viewBox="0 0 120 100" width="104" height="87">
      <ellipse className="p-shadow" cx="62" cy="93" rx="34" ry="4" fill="rgba(21,128,61,.18)" />
      <g className="p-tail">
        <path d="M30 52 Q22 44 22 34" stroke={furDark} strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="22" cy="31" r="7" fill={fur} />
      </g>
      <g className="p-leg p-leg-bl"><rect x="37" y="60" width="7" height="24" rx="3.5" fill={furDark} /><circle cx="40.5" cy="86" r="5.5" fill={furDark} /></g>
      <g className="p-leg p-leg-fl"><rect x="75" y="60" width="7" height="24" rx="3.5" fill={furDark} /><circle cx="78.5" cy="86" r="5.5" fill={furDark} /></g>
      <g className="p-body">
        <circle cx="42" cy="54" r="15" fill={fur} />
        <circle cx="58" cy="50" r="17" fill={fur} />
        <circle cx="74" cy="53" r="15" fill={fur} />
        <circle cx="50" cy="62" r="11" fill={fur} />
        <circle cx="68" cy="63" r="11" fill={fur} />
      </g>
      <g className="p-leg p-leg-br"><rect x="45" y="62" width="8" height="23" rx="4" fill={fur} /><circle cx="49" cy="86" r="6" fill={fur} /></g>
      <g className="p-leg p-leg-fr"><rect x="83" y="62" width="8" height="23" rx="4" fill={fur} /><circle cx="87" cy="86" r="6" fill={fur} /></g>
      <g className="p-head">
        <circle cx="88" cy="38" r="13" fill={fur} />
        <circle cx="86" cy="22" r="9" fill={fur} />
        <circle cx="94" cy="25" r="7" fill={fur} />
        <ellipse cx="102" cy="42" rx="10" ry="7" fill={fur} />
        <circle cx="111" cy="40" r="3" fill="#3b2314" />
        <path d="M104 47 q3 2 6 0" stroke="#3b2314" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <g className="p-eye-open"><circle cx="95" cy="34" r="2.6" fill="#3b2314" /><circle cx="95.8" cy="33.2" r=".8" fill="#fff" /></g>
        <path className="p-eye-closed" d="M92 35 q3 2 6 0" stroke="#3b2314" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <ellipse className="p-blush" cx="98" cy="40" rx="3" ry="1.8" fill="#f9a8a8" opacity=".7" />
        <g className="p-ear">
          <ellipse cx="80" cy="42" rx="7" ry="12" fill={furDark} />
          <circle cx="79" cy="52" r="5.5" fill={furDark} />
        </g>
        <path className="p-tongue" d="M106 47 q2 6 5 0z" fill="#f87171" />
      </g>
    </svg>
  )
}
