import type { PetSpecies } from '../lib/types'

/**
 * The ten pets. Every one is a 120×100 drawing facing right, built from the
 * same named parts (p-tail, p-leg-*, p-body, p-head, p-ear, p-eye-open,
 * p-eye-closed, p-blush, p-tongue, p-shadow) so the shared mood animations
 * move all of them; species-specific CSS (sp-<species>) then gives each its own
 * walk, signature move and quirks.
 */

const INK = '#2b1a12'

function Eyes({ x, y, r = 2.6, color = INK }: { x: number; y: number; r?: number; color?: string }) {
  return (
    <>
      <g className="p-eye-open"><circle cx={x} cy={y} r={r} fill={color} /><circle cx={x + 0.8} cy={y - 0.8} r={r * 0.3} fill="#fff" /></g>
      <path className="p-eye-closed" d={`M${x - 3} ${y + 1} q3 2.4 6 0`} stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </>
  )
}
const Shadow = ({ rx = 34 }: { rx?: number }) => <ellipse className="p-shadow" cx="60" cy="93" rx={rx} ry="4" fill="rgba(21,128,61,.18)" />
const Svg = ({ sp, children }: { sp: PetSpecies; children: React.ReactNode }) => (
  <svg className={`poodle sp-${sp}`} viewBox="0 0 120 100" width="104" height="87">{children}</svg>
)

export function PoodleSvg() {
  const fur = '#f2c48d'
  const furDark = '#e2a96b'
  return (
    <Svg sp="poodle">
      <Shadow />
      <g className="p-tail">
        <path d="M30 52 Q22 44 22 34" stroke={furDark} strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="22" cy="31" r="7" fill={fur} />
      </g>
      <g className="p-leg p-leg-bl"><rect x="37" y="60" width="7" height="24" rx="3.5" fill={furDark} /><circle cx="40.5" cy="86" r="5.5" fill={furDark} /></g>
      <g className="p-leg p-leg-fl"><rect x="75" y="60" width="7" height="24" rx="3.5" fill={furDark} /><circle cx="78.5" cy="86" r="5.5" fill={furDark} /></g>
      <g className="p-body">
        <circle cx="42" cy="54" r="15" fill={fur} /><circle cx="58" cy="50" r="17" fill={fur} /><circle cx="74" cy="53" r="15" fill={fur} />
        <circle cx="50" cy="62" r="11" fill={fur} /><circle cx="68" cy="63" r="11" fill={fur} />
      </g>
      <g className="p-leg p-leg-br"><rect x="45" y="62" width="8" height="23" rx="4" fill={fur} /><circle cx="49" cy="86" r="6" fill={fur} /></g>
      <g className="p-leg p-leg-fr"><rect x="83" y="62" width="8" height="23" rx="4" fill={fur} /><circle cx="87" cy="86" r="6" fill={fur} /></g>
      <g className="p-head">
        <circle cx="88" cy="38" r="13" fill={fur} /><circle cx="86" cy="22" r="9" fill={fur} /><circle cx="94" cy="25" r="7" fill={fur} />
        <ellipse cx="102" cy="42" rx="10" ry="7" fill={fur} />
        <circle cx="111" cy="40" r="3" fill={INK} />
        <path d="M104 47 q3 2 6 0" stroke={INK} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <Eyes x={95} y={34} />
        <ellipse className="p-blush" cx="98" cy="40" rx="3" ry="1.8" fill="#f9a8a8" opacity=".7" />
        <g className="p-ear"><ellipse cx="80" cy="42" rx="7" ry="12" fill={furDark} /><circle cx="79" cy="52" r="5.5" fill={furDark} /></g>
        <path className="p-tongue" d="M106 47 q2 6 5 0z" fill="#f87171" />
      </g>
    </Svg>
  )
}

function CatSvg() {
  const fur = '#9aa3b2', dark = '#6b7385', light = '#e5e8ee'
  return (
    <Svg sp="cat">
      <Shadow />
      <g className="p-tail"><path d="M32 62 Q10 58 16 34 Q18 26 24 28" stroke={dark} strokeWidth="6" fill="none" strokeLinecap="round" /><path d="M20 30 q2-3 5-1" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" opacity=".0" /></g>
      <g className="p-leg p-leg-bl"><rect x="38" y="64" width="7" height="22" rx="3.5" fill={dark} /><ellipse cx="41" cy="87" rx="6" ry="4" fill={dark} /></g>
      <g className="p-leg p-leg-fl"><rect x="76" y="64" width="7" height="22" rx="3.5" fill={dark} /><ellipse cx="80" cy="87" rx="6" ry="4" fill={dark} /></g>
      <g className="p-body">
        <ellipse cx="58" cy="60" rx="29" ry="18" fill={fur} />
        <path d="M44 46 q4 8 0 14M56 44 q4 8 0 16M68 46 q4 8 0 14" stroke={dark} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <ellipse cx="70" cy="68" rx="14" ry="9" fill={light} opacity=".85" />
      </g>
      <g className="p-leg p-leg-br"><rect x="46" y="66" width="8" height="21" rx="4" fill={fur} /><ellipse cx="50" cy="87" rx="6.5" ry="4" fill={light} /></g>
      <g className="p-leg p-leg-fr"><rect x="84" y="66" width="8" height="21" rx="4" fill={fur} /><ellipse cx="88" cy="87" rx="6.5" ry="4" fill={light} /></g>
      <g className="p-head">
        <path d="M80 30 L83 12 L94 24z" fill={fur} /><path d="M82 27 L84 17 L90 24z" fill="#f4b6c2" />
        <g className="p-ear"><path d="M96 24 L106 12 L108 32z" fill={fur} /><path d="M98 26 L105 17 L106 30z" fill="#f4b6c2" /></g>
        <circle cx="93" cy="40" r="15" fill={fur} />
        <path d="M88 27 v6M94 26 v6M100 27 v6" stroke={dark} strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="102" cy="46" rx="6.5" ry="5" fill={light} />
        <path d="M100 43 l3 0 -1.5 2z" fill="#e87d93" />
        <path d="M101.5 45.5 q-2 3-4 2M101.5 45.5 q2 3 4 2" stroke={INK} strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M104 44 l11-3M104 46 l11 1M104 47 l10 4" stroke="#fff" strokeWidth=".9" strokeLinecap="round" opacity=".9" />
        <Eyes x={98} y={37} color="#1f2937" />
        <ellipse className="p-blush" cx="96" cy="44" rx="3" ry="1.8" fill="#f4a5b4" opacity=".7" />
        <path className="p-tongue" d="M101 49 q1 5 3 0z" fill="#f87171" />
      </g>
    </Svg>
  )
}

function RabbitSvg() {
  const fur = '#f3ede4', dark = '#d9cdbd', pink = '#f5b5c1'
  return (
    <Svg sp="rabbit">
      <Shadow />
      <g className="p-tail"><circle cx="30" cy="60" r="8" fill="#fff" stroke={dark} strokeWidth="1" /></g>
      <g className="p-leg p-leg-bl"><ellipse cx="42" cy="84" rx="12" ry="5.5" fill={dark} /></g>
      <g className="p-leg p-leg-fl"><rect x="76" y="66" width="6" height="19" rx="3" fill={dark} /><ellipse cx="80" cy="86" rx="6" ry="4" fill={dark} /></g>
      <g className="p-body">
        <ellipse cx="56" cy="64" rx="27" ry="20" fill={fur} />
        <ellipse cx="68" cy="70" rx="14" ry="10" fill="#fff" opacity=".8" />
      </g>
      <g className="p-leg p-leg-br"><ellipse cx="50" cy="85" rx="11" ry="5" fill={fur} stroke={dark} strokeWidth=".8" /></g>
      <g className="p-leg p-leg-fr"><rect x="84" y="67" width="7" height="18" rx="3.5" fill={fur} /><ellipse cx="88" cy="86" rx="6" ry="4" fill={fur} stroke={dark} strokeWidth=".8" /></g>
      <g className="p-head">
        <ellipse cx="80" cy="14" rx="5.5" ry="16" fill={fur} stroke={dark} strokeWidth=".8" transform="rotate(-8 80 30)" /><ellipse cx="80" cy="16" rx="2.6" ry="11" fill={pink} transform="rotate(-8 80 30)" />
        <g className="p-ear"><ellipse cx="92" cy="14" rx="5.5" ry="16" fill={fur} stroke={dark} strokeWidth=".8" transform="rotate(10 92 30)" /><ellipse cx="92" cy="16" rx="2.6" ry="11" fill={pink} transform="rotate(10 92 30)" /></g>
        <circle cx="90" cy="46" r="15" fill={fur} />
        <ellipse cx="102" cy="52" rx="7.5" ry="6" fill="#fff" />
        <path d="M105 48 l3.5 0 -1.8 2.6z" fill="#e87d93" />
        <path d="M106.5 51 q-2 3-4 1.5M106.5 51 q2 3 4 1.5" stroke={INK} strokeWidth="1" fill="none" strokeLinecap="round" />
        <Eyes x={96} y={43} />
        <ellipse className="p-blush" cx="94" cy="51" rx="3.2" ry="2" fill={pink} opacity=".8" />
        <path className="p-tongue" d="M105 56 q1 5 3 0z" fill="#f87171" />
      </g>
    </Svg>
  )
}

function PenguinSvg() {
  const black = '#2f3a4a', belly = '#fbfaf7', orange = '#f59e0b'
  return (
    <Svg sp="penguin">
      <Shadow rx={26} />
      <g className="p-tail"><path d="M36 76 L24 86 L42 84z" fill={black} /></g>
      <g className="p-leg p-leg-bl"><path d="M44 84 q-6 8 2 8 q8 0 6 -8z" fill={orange} /></g>
      <g className="p-leg p-leg-fl"><path d="M64 84 q-6 8 2 8 q8 0 6 -8z" fill={orange} /></g>
      <g className="p-body">
        <ellipse cx="58" cy="58" rx="24" ry="32" fill={black} />
        <ellipse cx="64" cy="64" rx="16" ry="24" fill={belly} />
      </g>
      <g className="p-leg p-leg-br"><path d="M52 84 q-6 8 2 8 q8 0 6 -8z" fill="#fbbf24" /></g>
      <g className="p-leg p-leg-fr"><path d="M72 84 q-6 8 2 8 q8 0 6 -8z" fill="#fbbf24" /></g>
      <g className="p-head">
        <circle cx="64" cy="30" r="15" fill={black} />
        <ellipse cx="70" cy="33" rx="9" ry="8" fill={belly} />
        <path d="M74 30 L90 34 L74 38z" fill={orange} />
        <Eyes x={68} y={26} r={2.4} />
        <ellipse className="p-blush" cx="72" cy="35" rx="3" ry="1.8" fill="#f9a8a8" opacity=".8" />
        <g className="p-ear"><path d="M48 48 Q36 62 46 76 Q54 64 54 50z" fill={black} /></g>
        <path className="p-tongue" d="M78 38 q1 4 3 0z" fill="#f87171" />
      </g>
    </Svg>
  )
}

function FoxSvg() {
  const fur = '#ea7a2c', dark = '#3a2a22', cream = '#fff3e0'
  return (
    <Svg sp="fox">
      <Shadow />
      <g className="p-tail"><path d="M34 60 Q8 62 12 36 Q14 26 22 32 Q26 46 36 52z" fill={fur} /><path d="M12 36 Q14 26 22 32 Q20 38 14 40z" fill={cream} /></g>
      <g className="p-leg p-leg-bl"><rect x="38" y="64" width="7" height="22" rx="3.5" fill={dark} /><circle cx="41.5" cy="86" r="5" fill={dark} /></g>
      <g className="p-leg p-leg-fl"><rect x="76" y="64" width="7" height="22" rx="3.5" fill={dark} /><circle cx="79.5" cy="86" r="5" fill={dark} /></g>
      <g className="p-body"><ellipse cx="58" cy="60" rx="28" ry="17" fill={fur} /><ellipse cx="70" cy="68" rx="14" ry="8" fill={cream} /></g>
      <g className="p-leg p-leg-br"><rect x="46" y="66" width="8" height="20" rx="4" fill={fur} /><circle cx="50" cy="86" r="5.5" fill={dark} /></g>
      <g className="p-leg p-leg-fr"><rect x="84" y="66" width="8" height="20" rx="4" fill={fur} /><circle cx="88" cy="86" r="5.5" fill={dark} /></g>
      <g className="p-head">
        <path d="M80 34 L82 10 L94 28z" fill={fur} /><path d="M83 28 L84 16 L90 27z" fill={dark} />
        <g className="p-ear"><path d="M94 28 L106 10 L108 34z" fill={fur} /><path d="M97 29 L105 17 L106 31z" fill={dark} /></g>
        <circle cx="92" cy="42" r="14" fill={fur} />
        <path d="M96 50 Q104 38 116 48 Q108 58 96 56z" fill={cream} />
        <circle cx="115" cy="48" r="3" fill={INK} />
        <Eyes x={96} y={39} />
        <ellipse className="p-blush" cx="98" cy="48" rx="3" ry="1.8" fill="#f5a3a3" opacity=".7" />
        <path className="p-tongue" d="M106 54 q1 5 4 0z" fill="#f87171" />
      </g>
    </Svg>
  )
}

function PandaSvg() {
  const white = '#fbfbf9', black = '#2a2f36'
  return (
    <Svg sp="panda">
      <Shadow />
      <g className="p-tail"><circle cx="30" cy="62" r="6" fill={white} stroke="#dcdcd8" strokeWidth="1" /></g>
      <g className="p-leg p-leg-bl"><rect x="36" y="62" width="10" height="24" rx="5" fill={black} /></g>
      <g className="p-leg p-leg-fl"><rect x="74" y="62" width="10" height="24" rx="5" fill={black} /></g>
      <g className="p-body"><ellipse cx="58" cy="60" rx="29" ry="20" fill={white} stroke="#e6e6e2" strokeWidth="1" /><path d="M40 52 Q58 40 76 52 L76 58 Q58 48 40 58z" fill={black} /></g>
      <g className="p-leg p-leg-br"><rect x="46" y="64" width="10" height="23" rx="5" fill={black} /></g>
      <g className="p-leg p-leg-fr"><rect x="82" y="64" width="10" height="23" rx="5" fill={black} /></g>
      <g className="p-head">
        <circle cx="82" cy="24" r="7" fill={black} />
        <g className="p-ear"><circle cx="104" cy="26" r="7" fill={black} /></g>
        <circle cx="93" cy="42" r="19" fill={white} stroke="#e6e6e2" strokeWidth="1" />
        <ellipse cx="86" cy="40" rx="5.5" ry="7" fill={black} transform="rotate(20 86 40)" /><ellipse cx="102" cy="40" rx="5.5" ry="7" fill={black} transform="rotate(-20 102 40)" />
        <Eyes x={86} y={40} r={2.2} color="#fff" />
        <ellipse cx="99" cy="50" rx="6" ry="4.6" fill="#e9e6df" />
        <ellipse cx="102" cy="48" rx="3" ry="2.2" fill={black} />
        <path d="M99 52 q3 2.4 6 0" stroke={black} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <ellipse className="p-blush" cx="95" cy="50" rx="3" ry="1.8" fill="#f9a8a8" opacity=".8" />
        <path className="p-tongue" d="M100 54 q1 5 4 0z" fill="#f87171" />
      </g>
    </Svg>
  )
}

function TurtleSvg() {
  const shell = '#4d9a58', shellDark = '#2f6f3d', skin = '#a3c97a'
  return (
    <Svg sp="turtle">
      <Shadow />
      <g className="p-tail"><path d="M28 74 L18 78 L30 80z" fill={skin} /></g>
      <g className="p-leg p-leg-bl"><rect x="34" y="70" width="12" height="16" rx="5" fill={skin} /></g>
      <g className="p-leg p-leg-fl"><rect x="72" y="70" width="12" height="16" rx="5" fill={skin} /></g>
      <g className="p-body">
        <path d="M26 74 Q28 30 62 30 Q96 30 98 74z" fill={shell} />
        <path d="M44 74 L48 46 L62 38 L76 46 L80 74M48 46 L76 46M62 38 L62 74" stroke={shellDark} strokeWidth="2.4" fill="none" strokeLinejoin="round" />
        <path d="M26 74 H98" stroke={shellDark} strokeWidth="5" strokeLinecap="round" />
      </g>
      <g className="p-leg p-leg-br"><rect x="46" y="72" width="12" height="15" rx="5" fill="#93b96a" /></g>
      <g className="p-leg p-leg-fr"><rect x="84" y="72" width="12" height="15" rx="5" fill="#93b96a" /></g>
      <g className="p-head">
        <rect x="90" y="52" width="12" height="16" rx="6" fill={skin} transform="rotate(-20 96 60)" />
        <circle cx="106" cy="52" r="11" fill={skin} />
        <Eyes x={109} y={49} r={2.4} />
        <path d="M108 57 q3 2.4 6 0" stroke={INK} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <ellipse className="p-blush" cx="106" cy="55" rx="3" ry="1.8" fill="#f4a8a8" opacity=".7" />
        <g className="p-ear"><circle cx="102" cy="44" r="0.1" fill="none" /></g>
        <path className="p-tongue" d="M110 58 q1 4 3 0z" fill="#f87171" />
      </g>
    </Svg>
  )
}

function OwlSvg() {
  const fur = '#a0714a', dark = '#6e4a2e', light = '#e8cfa6'
  return (
    <Svg sp="owl">
      <Shadow rx={26} />
      <g className="p-tail"><path d="M40 74 L30 90 L48 86z" fill={dark} /></g>
      <g className="p-leg p-leg-bl"><path d="M50 82 v8 m-4 0 h8" stroke="#f59e0b" strokeWidth="3.4" strokeLinecap="round" fill="none" /></g>
      <g className="p-leg p-leg-fl"><path d="M68 82 v8 m-4 0 h8" stroke="#f59e0b" strokeWidth="3.4" strokeLinecap="round" fill="none" /></g>
      <g className="p-body">
        <ellipse cx="60" cy="58" rx="27" ry="30" fill={fur} />
        <ellipse cx="62" cy="66" rx="17" ry="20" fill={light} />
        <path d="M52 56 q4 4 8 0M60 64 q4 4 8 0M52 72 q4 4 8 0M66 56 q4 4 8 0" stroke={dark} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </g>
      <g className="p-leg p-leg-br"><path d="M56 82 v8 m-4 0 h8" stroke="#fbbf24" strokeWidth="3.4" strokeLinecap="round" fill="none" /></g>
      <g className="p-leg p-leg-fr"><path d="M74 82 v8 m-4 0 h8" stroke="#fbbf24" strokeWidth="3.4" strokeLinecap="round" fill="none" /></g>
      <g className="p-head">
        <path d="M44 26 L48 8 L58 22z" fill={fur} /><g className="p-ear"><path d="M66 22 L76 8 L80 28z" fill={fur} /></g>
        <ellipse cx="62" cy="34" rx="22" ry="17" fill={fur} />
        <circle cx="54" cy="34" r="10" fill={light} /><circle cx="72" cy="34" r="10" fill={light} />
        <Eyes x={56} y={34} r={4.4} color="#1f2937" /><Eyes x={74} y={34} r={4.4} color="#1f2937" />
        <path d="M60 38 L66 38 L63 46z" fill="#f59e0b" />
        <ellipse className="p-blush" cx="50" cy="42" rx="3" ry="1.8" fill="#f4a8a8" opacity=".7" />
        <path className="p-tongue" d="M62 46 q1 4 3 0z" fill="#f87171" />
      </g>
      <g className="p-wing"><path d="M36 50 Q26 66 38 80 Q46 68 46 52z" fill={dark} /></g>
    </Svg>
  )
}

function FrogSvg() {
  const skin = '#5fbf5a', dark = '#3e9a45', belly = '#d9f2b4'
  return (
    <Svg sp="frog">
      <Shadow />
      <g className="p-tail"><circle cx="24" cy="72" r="0.1" fill="none" /></g>
      <g className="p-leg p-leg-bl"><path d="M34 78 Q26 70 40 62 Q52 70 46 86 L30 88z" fill={dark} /><path d="M26 88 h10 M30 88 l-6 3 M34 88 l-3 4" stroke={dark} strokeWidth="3" strokeLinecap="round" /></g>
      <g className="p-leg p-leg-fl"><rect x="76" y="68" width="6" height="18" rx="3" fill={dark} /><path d="M74 87 h12" stroke={dark} strokeWidth="3.4" strokeLinecap="round" /></g>
      <g className="p-body"><ellipse cx="58" cy="66" rx="28" ry="19" fill={skin} /><ellipse cx="68" cy="74" rx="15" ry="9" fill={belly} /></g>
      <g className="p-leg p-leg-br"><path d="M44 80 Q36 72 50 64 Q62 72 56 86 L42 88z" fill={skin} /><path d="M36 88 h12 M42 88 l-6 3" stroke={skin} strokeWidth="3" strokeLinecap="round" /></g>
      <g className="p-leg p-leg-fr"><rect x="84" y="69" width="7" height="17" rx="3.5" fill={skin} /><path d="M82 87 h14" stroke={skin} strokeWidth="3.4" strokeLinecap="round" /></g>
      <g className="p-head">
        <ellipse cx="90" cy="50" rx="20" ry="14" fill={skin} />
        <circle cx="82" cy="36" r="9" fill={skin} /><g className="p-ear"><circle cx="98" cy="36" r="9" fill={skin} /></g>
        <circle cx="82" cy="36" r="6" fill="#fff" /><circle cx="98" cy="36" r="6" fill="#fff" />
        <Eyes x={84} y={36} r={3.2} /><Eyes x={100} y={36} r={3.2} />
        <path d="M76 54 Q96 66 112 52" stroke="#2c6e32" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="106" cy="46" r="1.2" fill="#2c6e32" />
        <ellipse className="p-blush" cx="94" cy="55" rx="4" ry="2.2" fill="#f4a8a8" opacity=".8" />
        <path className="p-tongue" d="M104 56 q2 9 6 0z" fill="#f87171" />
      </g>
    </Svg>
  )
}

function DragonSvg() {
  const skin = '#8b5cf6', dark = '#6d3fd6', belly = '#f5d98a', spike = '#fbbf24'
  return (
    <Svg sp="dragon">
      <Shadow />
      <g className="p-tail"><path d="M34 62 Q8 66 12 40 Q14 34 18 38" stroke={skin} strokeWidth="7" fill="none" strokeLinecap="round" /><path d="M18 30 L12 40 L24 38z" fill={spike} /></g>
      <g className="p-wing"><path d="M52 50 Q44 18 24 14 Q30 34 36 48z" fill="#c4b5fd" stroke={dark} strokeWidth="1.2" /></g>
      <g className="p-leg p-leg-bl"><rect x="38" y="64" width="8" height="22" rx="4" fill={dark} /><path d="M36 88 h12" stroke={spike} strokeWidth="3" strokeLinecap="round" /></g>
      <g className="p-leg p-leg-fl"><rect x="76" y="64" width="8" height="22" rx="4" fill={dark} /><path d="M74 88 h12" stroke={spike} strokeWidth="3" strokeLinecap="round" /></g>
      <g className="p-body">
        <ellipse cx="58" cy="60" rx="29" ry="18" fill={skin} />
        <ellipse cx="68" cy="68" rx="15" ry="9" fill={belly} />
        <path d="M40 44 l4 -8 4 8M52 41 l4 -8 4 8M64 42 l4 -8 4 8" fill={spike} />
      </g>
      <g className="p-leg p-leg-br"><rect x="46" y="66" width="9" height="21" rx="4.5" fill={skin} /><path d="M44 88 h13" stroke={spike} strokeWidth="3" strokeLinecap="round" /></g>
      <g className="p-leg p-leg-fr"><rect x="84" y="66" width="9" height="21" rx="4.5" fill={skin} /><path d="M82 88 h13" stroke={spike} strokeWidth="3" strokeLinecap="round" /></g>
      <g className="p-head">
        <path d="M82 28 L84 10 L92 24z" fill={spike} /><g className="p-ear"><path d="M92 24 L100 8 L102 28z" fill={spike} /></g>
        <circle cx="92" cy="40" r="15" fill={skin} />
        <ellipse cx="104" cy="46" rx="11" ry="7.5" fill={skin} />
        <circle cx="109" cy="43" r="1.4" fill={INK} /><circle cx="113" cy="45" r="1.4" fill={INK} />
        <path d="M100 50 q6 3 12 0" stroke={INK} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <Eyes x={97} y={36} r={2.8} color="#1f1147" />
        <ellipse className="p-blush" cx="98" cy="45" rx="3" ry="1.8" fill="#f9a8d4" opacity=".7" />
        <path className="p-tongue" d="M106 51 q2 5 5 0z" fill="#f87171" />
      </g>
    </Svg>
  )
}

const ART: Record<PetSpecies, () => React.JSX.Element> = {
  poodle: PoodleSvg, cat: CatSvg, rabbit: RabbitSvg, penguin: PenguinSvg, fox: FoxSvg,
  panda: PandaSvg, turtle: TurtleSvg, owl: OwlSvg, frog: FrogSvg, dragon: DragonSvg,
}

export function PetArt({ species }: { species: PetSpecies }) {
  const C = ART[species] ?? PoodleSvg
  return <C />
}
