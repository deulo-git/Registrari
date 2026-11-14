import { useEffect, useRef, useState } from 'react'
import { useI18n, type TKey } from '../lib/i18n'

/**
 * "Pipa", the toy poodle that lives next to the big button.
 *
 * A small state machine picks what she does next (walk, run, sniff, play
 * with her ball, chase her tail, roll over, stretch, scratch, beg, dig, lie
 * down, sleep, or go and drink from the button — whose water is today's
 * water). At night she mostly sleeps. Now and then she says something; when
 * tapped she answers (grumpily if she was asleep). When something is saved
 * she jumps with hearts.
 *
 * Movement is CSS: this component only sets a target x and a mood class.
 */
type Mood =
  | 'walk' | 'run' | 'sit' | 'lie' | 'sniff' | 'play' | 'chase' | 'roll'
  | 'stretch' | 'scratch' | 'beg' | 'dig' | 'drink' | 'sleep' | 'happy'

const MOODS_WITH_TIME: Mood[] = ['sit', 'lie', 'sniff', 'play', 'chase', 'roll', 'stretch', 'scratch', 'beg', 'dig']

export const PET_EVENT = 'registrari:pet'
/** Make the pet react from anywhere (e.g. after saving an entry). */
export function cheerPet() { window.dispatchEvent(new CustomEvent(PET_EVENT, { detail: 'happy' })) }

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const pickW = <T,>(xs: [T, number][]): T => {
  const total = xs.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * total
  for (const [v, w] of xs) { if ((r -= w) <= 0) return v }
  return xs[0][0]
}
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]

/** Half the dog's width in px: keeps her fully on screen. */
const HALF = 52
/** Button radius + a bit: where her nose reaches the water when drinking. */
const BUTTON_R = 78

interface Props {
  hidden?: boolean
  /** 0..1, today's water (the same water as in the button). */
  water: number
}

export function Pet({ hidden, water }: Props) {
  const { t } = useI18n()
  const track = useRef<HTMLDivElement>(null)
  const [mood, setMood] = useState<Mood>('sit')
  const [x, setX] = useState(0.8)
  const [facing, setFacing] = useState<1 | -1>(-1)
  const [moveMs, setMoveMs] = useState(0)
  const [speech, setSpeech] = useState<{ text: string; id: number } | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const sayTimer = useRef<number | undefined>(undefined)
  const s = useRef({ x, mood, water, t })
  s.current = { x, mood, water, t }

  const phrases = (k: TKey) => s.current.t(k).split('|')

  const say = (text: string) => {
    window.clearTimeout(sayTimer.current)
    setSpeech({ text, id: Date.now() })
    sayTimer.current = window.setTimeout(() => setSpeech(null), 3200)
  }

  const schedule = (fn: () => void, ms: number) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(fn, ms)
  }

  /** Track-relative limits so she never leaves the screen. */
  const bounds = () => {
    const w = track.current?.offsetWidth || 340
    return { w, min: HALF / w, max: 1 - HALF / w }
  }

  /** Walk (or run) to x, then do `after`. */
  const moveTo = (target: number, fast: boolean, after: () => void) => {
    const { w, min, max } = bounds()
    const tx = Math.max(min, Math.min(max, target))
    const px = Math.abs(tx - s.current.x) * w
    const ms = Math.round(px * (fast ? 4 : 11)) + 300
    setFacing(tx > s.current.x ? 1 : -1)
    setMoveMs(ms)
    setMood(fast ? 'run' : 'walk')
    setX(tx)
    schedule(after, ms)
  }

  const next = () => {
    const h = new Date().getHours()
    const night = h >= 23 || h < 7
    const m = pickW<Mood>(night
      ? [['sleep', 10], ['lie', 2], ['stretch', 1], ['walk', 1]]
      : [
          ['walk', 4], ['sit', 2], ['play', 2], ['sniff', 1.5], ['run', 1], ['chase', 1], ['roll', 1],
          ['stretch', 1], ['scratch', 1], ['beg', 1], ['dig', 1], ['drink', 1.6], ['lie', 1], ['sleep', 0.6],
        ])
    const { w, min, max } = bounds()
    setMoveMs(0)

    if (m === 'walk' || m === 'run') {
      // Usually cross to the other side of the button (she passes behind it).
      const target = s.current.x > 0.5 ? rand(min, 0.3) : rand(0.7, max)
      moveTo(target, m === 'run', () => { setMood('sit'); schedule(next, rand(1500, 3000)) })
      return
    }
    if (m === 'drink') {
      // Go to the side of the button and put her nose in its water.
      const left = s.current.x < 0.5
      const nose = HALF - 8
      const target = left ? (w / 2 - BUTTON_R - nose) / w : (w / 2 + BUTTON_R + nose) / w
      moveTo(target, false, () => {
        setFacing(left ? 1 : -1)
        setMood('drink')
        if (s.current.water < 0.08) say(pick(phrases('petThirsty')))
        schedule(() => { setMood('sit'); schedule(next, rand(1500, 2500)) }, rand(4000, 6000))
      })
      return
    }
    setMood(m)
    if (m === 'sleep') schedule(next, rand(14000, 24000))
    else if (m === 'chase' || m === 'roll') schedule(next, rand(2600, 3400))
    else schedule(next, rand(4000, 7500))
    void max
  }

  // Something to say now and then while awake.
  const chatter = () => {
    const cur = s.current
    if (cur.mood !== 'sleep' && !hiddenRef.current) {
      const h = new Date().getHours()
      const thirsty = cur.water < 0.3 && h >= 12
      say(thirsty && Math.random() < 0.5 ? pick(phrases('petThirsty')) : pick(phrases('petIdle')))
    }
    chatterTimer.current = window.setTimeout(chatter, rand(28000, 50000))
  }
  const chatterTimer = useRef<number | undefined>(undefined)
  const hiddenRef = useRef(hidden)
  hiddenRef.current = hidden

  useEffect(() => {
    schedule(next, 1600)
    chatterTimer.current = window.setTimeout(chatter, rand(9000, 16000))
    const onEvt = (e: Event) => {
      if ((e as CustomEvent).detail !== 'happy') return
      setMoveMs(0)
      setMood('happy')
      say(pick(phrases(s.current.water >= 1 ? 'petFull' : 'petSaved')))
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
    if (s.current.mood === 'sleep') {
      say(pick(phrases('petSleepTap')))
      return // she stays asleep, just grumbles
    }
    say(pick(phrases('petTap')))
    if (MOODS_WITH_TIME.includes(s.current.mood) || s.current.mood === 'drink') {
      setMood('happy')
      schedule(next, 1800)
    }
  }

  return (
    <>
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
        <div className="pet-say-anchor" style={{ left: `${x * 100}%`, transitionDuration: `${moveMs}ms` }}>
          <span key={speech.id} className={'pet-say ' + (x < 0.5 ? 'l' : 'r')}>{speech.text}</span>
        </div>
      </div>
    )}
    </>
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
