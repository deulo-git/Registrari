import { useEffect, useRef, useState } from 'react'

/**
 * "Pipa", the toy poodle that lives next to the big button.
 *
 * A tiny state machine picks what she does next (walk somewhere, sit and wag,
 * play with her ball, sleep…). At night she mostly sleeps. When something is
 * saved she jumps with hearts; tapping her makes her bark. Movement is CSS:
 * this component only sets a target x and a mood class.
 */
type Mood = 'walk' | 'sit' | 'play' | 'sleep' | 'happy' | 'sniff'

export const PET_EVENT = 'registrari:pet'
/** Make the pet react from anywhere (e.g. after saving an entry). */
export function cheerPet() { window.dispatchEvent(new CustomEvent(PET_EVENT, { detail: 'happy' })) }

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const pick = <T,>(xs: [T, number][]): T => {
  const total = xs.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * total
  for (const [v, w] of xs) { if ((r -= w) <= 0) return v }
  return xs[0][0]
}

/** x positions are a fraction (0..1) of the track width. */
export function Pet({ hidden }: { hidden?: boolean }) {
  const [mood, setMood] = useState<Mood>('sit')
  const [x, setX] = useState(0.82)
  const [facing, setFacing] = useState<1 | -1>(-1)
  const [walkMs, setWalkMs] = useState(0)
  const [bark, setBark] = useState(0)
  const timer = useRef<number | undefined>(undefined)
  const xRef = useRef(x)
  xRef.current = x

  const schedule = (fn: () => void, ms: number) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(fn, ms)
  }

  const next = () => {
    const h = new Date().getHours()
    const night = h >= 23 || h < 7
    const m = pick<Mood>(night
      ? [['sleep', 8], ['sit', 1], ['walk', 1]]
      : [['walk', 4], ['sit', 3], ['play', 2], ['sniff', 2], ['sleep', 1]])
    if (m === 'walk') {
      // Pick a spot on the other side often, so she crosses in front of the button.
      const cur = xRef.current
      const target = cur > 0.5 ? rand(0.02, 0.35) : rand(0.65, 0.98)
      const ms = Math.round(Math.abs(target - cur) * 7000) + 600
      setFacing(target > cur ? 1 : -1)
      setWalkMs(ms)
      setMood('walk')
      setX(target)
      schedule(() => { setMood('sit'); schedule(next, rand(1500, 3000)) }, ms)
      return
    }
    setWalkMs(0)
    setMood(m)
    schedule(next, m === 'sleep' ? rand(12000, 22000) : m === 'play' ? rand(6000, 9000) : rand(4000, 7000))
  }

  useEffect(() => {
    schedule(next, 1800)
    const onEvt = (e: Event) => {
      if ((e as CustomEvent).detail !== 'happy') return
      setWalkMs(0)
      setMood('happy')
      schedule(next, 2600)
    }
    window.addEventListener(PET_EVENT, onEvt)
    return () => { window.clearTimeout(timer.current); window.removeEventListener(PET_EVENT, onEvt) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const poke = () => {
    if (mood === 'sleep') { setMood('sit'); schedule(next, 3000) }
    setBark((b) => b + 1)
  }

  return (
    <div className={'pet-track' + (hidden ? ' hidden' : '')} aria-hidden="true">
      <div className={`pet mood-${mood}`}
        style={{ left: `${x * 100}%`, transitionDuration: `${walkMs}ms` }}
        onClick={poke}>
        <div className="pet-flip" style={{ transform: `scaleX(${facing})` }}>
          <PoodleSvg />
          {mood === 'play' && <span className="pet-ball" />}
        </div>
        {mood === 'sleep' && <span className="pet-z"><i>z</i><i>z</i><i>Z</i></span>}
        {mood === 'happy' && <span className="pet-hearts"><i>♥</i><i>♥</i><i>♥</i></span>}
        {bark > 0 && <span key={bark} className="pet-bark">Guau!</span>}
      </div>
    </div>
  )
}

/** Apricot toy poodle facing right. Parts have classes so CSS can animate them. */
function PoodleSvg() {
  const fur = '#f2c48d'
  const furDark = '#e2a96b'
  return (
    <svg className="poodle" viewBox="0 0 120 100" width="104" height="87">
      <ellipse className="p-shadow" cx="62" cy="93" rx="34" ry="4" fill="rgba(21,128,61,.18)" />
      {/* tail */}
      <g className="p-tail">
        <path d="M30 52 Q22 44 22 34" stroke={furDark} strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="22" cy="31" r="7" fill={fur} />
      </g>
      {/* far legs (darker) */}
      <g className="p-leg p-leg-bl"><rect x="37" y="60" width="7" height="24" rx="3.5" fill={furDark} /><circle cx="40.5" cy="86" r="5.5" fill={furDark} /></g>
      <g className="p-leg p-leg-fl"><rect x="75" y="60" width="7" height="24" rx="3.5" fill={furDark} /><circle cx="78.5" cy="86" r="5.5" fill={furDark} /></g>
      {/* body */}
      <g className="p-body">
        <circle cx="42" cy="54" r="15" fill={fur} />
        <circle cx="58" cy="50" r="17" fill={fur} />
        <circle cx="74" cy="53" r="15" fill={fur} />
        <circle cx="50" cy="62" r="11" fill={fur} />
        <circle cx="68" cy="63" r="11" fill={fur} />
      </g>
      {/* near legs */}
      <g className="p-leg p-leg-br"><rect x="45" y="62" width="8" height="23" rx="4" fill={fur} /><circle cx="49" cy="86" r="6" fill={fur} /></g>
      <g className="p-leg p-leg-fr"><rect x="83" y="62" width="8" height="23" rx="4" fill={fur} /><circle cx="87" cy="86" r="6" fill={fur} /></g>
      {/* head */}
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
