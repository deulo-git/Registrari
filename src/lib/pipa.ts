import data from '../data/pipa.json'
import type { Lang } from './i18n'
import { PERSONAL, SPECIES, type Say } from './pets'
import { DEFAULT_PET, type PetProfile } from './types'

/**
 * Typed access to src/data/pipa.json — Pipa's phrases (with weights, in both
 * languages) and how often she does each thing. The JSON is meant to be
 * edited by hand; the app picks it up on the next build/deploy.
 */

export type Mood =
  | 'walk' | 'run' | 'sit' | 'lie' | 'sniff' | 'play' | 'chase' | 'roll'
  | 'stretch' | 'scratch' | 'beg' | 'dig' | 'drink' | 'sleep' | 'poop' | 'leave'
  | 'dance' | 'shake' | 'bow' | 'hop' | 'butterfly' | 'bone' | 'sneeze' | 'wave' | 'howl' | 'tummy'
  | 'rub' | 'happy' | 'away' | 'special'

/** Catalan names used in the JSON → internal mood ids. */
const MOVE_IDS: Record<string, Mood> = {
  'caminar': 'walk',
  'correr': 'run',
  'seure': 'sit',
  'estirar-se': 'lie',
  'ensumar': 'sniff',
  'jugar': 'play',
  'perseguir-se la cua': 'chase',
  'rebolcar-se': 'roll',
  'estirar-se i badallar': 'stretch',
  'gratar-se': 'scratch',
  'fer el sant': 'beg',
  'cavar': 'dig',
  'beure': 'drink',
  'dormir': 'sleep',
  'fer caca': 'poop',
  'marxar': 'leave',
  'ballar': 'dance',
  'sacsejar-se': 'shake',
  'fer reverència': 'bow',
  'saltar': 'hop',
  'perseguir una papallona': 'butterfly',
  'rosegar un os': 'bone',
  'esternudar': 'sneeze',
  'saludar amb la pota': 'wave',
  'udolar': 'howl',
  'panxa enlaire': 'tummy',
  'especial': 'special',
}

export type PhraseList =
  | 'tocar' | 'tocarDormint' | 'sola' | 'set' | 'desar' | 'aiguaPlena' | 'cridada' | 'caca' | 'cacaRecollida'
  | 'benvinguda' | 'enfadada' | 'rascar'

interface Phrase { pes?: number; ca?: string; es?: string; propi?: boolean; sp?: string }

const cfg = data as unknown as {
  parlar: { cadaSegons: [number, number]; duradaSegons: number; probabilitatSetSiPocaAigua: number }
  fora: { segons: [number, number] }
  caca: { maximALaVegada: number }
  enfadar: { despresDeTocs: number; finestraSegons: number; probabilitat: number }
  carrega: { minimSegons: number }
  moviments: { dia: Record<string, number>; nit: Record<string, number> }
  frases: Record<PhraseList, Phrase[]>
}

export const PIPA = {
  talkEverySec: (cfg.parlar?.cadaSegons ?? [28, 50]) as [number, number],
  talkDurationMs: (cfg.parlar?.duradaSegons ?? 3.2) * 1000,
  thirstyChance: cfg.parlar?.probabilitatSetSiPocaAigua ?? 0.5,
  awaySec: cfg.fora?.segons ?? [25, 70],
  maxPoops: cfg.caca?.maximALaVegada ?? 2,
  annoyAfterTaps: cfg.enfadar?.despresDeTocs ?? 5,
  annoyWindowMs: (cfg.enfadar?.finestraSegons ?? 20) * 1000,
  annoyChance: cfg.enfadar?.probabilitat ?? 0.1,
  splashMinMs: (cfg.carrega?.minimSegons ?? 1.8) * 1000,
}

function weighted<T>(items: [T, number][]): T | undefined {
  const valid = items.filter(([, w]) => w > 0)
  const total = valid.reduce((s, [, w]) => s + w, 0)
  if (!total) return undefined
  let r = Math.random() * total
  for (const [v, w] of valid) { if ((r -= w) <= 0) return v }
  return valid[valid.length - 1][0]
}

// ── Who the pet is: species, sliders and what it knows about the user ──

interface Ctx { pet: PetProfile; userName: string; legacy: boolean }
let ctx: Ctx = { pet: DEFAULT_PET, userName: '', legacy: true }
export function setPetContext(c: Ctx) { ctx = c }
export const petContext = () => ctx

const lin = (v: number, lo: number, hi: number) => lo + (hi - lo) * (v / 100)

/** Multiplier for a slider (0-100): 0 → `lo`, 50 → 1, 100 → `hi`. */
const slide = (v: number, lo: number, hi: number) => (v <= 50 ? lin(v * 2, lo, 1) : lin((v - 50) * 2, 1, hi))

/** How often she talks on her own: chatty 0 → rarely, 100 → very often. */
export function talkEverySec(): [number, number] {
  const f = 1 / slide(ctx.pet.sliders.chatty, 0.35, 3)
  return [PIPA.talkEverySec[0] * f, PIPA.talkEverySec[1] * f]
}
/** Chance (0-1) that a tap makes her cross: mischief raises it. */
export const annoyChance = () => PIPA.annoyChance * slide(ctx.pet.sliders.mischief, 0.2, 4)

const fill = (text: string) =>
  text.replace(/\{nom\}/g, ctx.pet.name || 'Pipa').replace(/\{usuari\}/g, ctx.userName)

/** A random phrase from a list, honouring weights, the species and (if on) what she knows about you. */
export function phrase(list: PhraseList, lang: Lang, exclude?: RegExp): string {
  const { species, sliders, personalized, answers } = ctx.pet
  const sp = SPECIES[species]
  const aff = slide(sliders.affection, 0.3, 2.2)
  const mis = slide(sliders.mischief, 0.3, 2.2)
  const tag = (t?: Say['t']) => (t === 'a' ? aff : t === 'm' ? mis : 1)

  const items: [string, number][] = []
  for (const p of cfg.frases[list] ?? []) {
    if (p.sp && p.sp !== species) continue
    if (p.propi && !ctx.legacy) continue
    const text = p[lang] ?? p.ca ?? p.es ?? ''
    if (text) items.push([text, p.pes ?? 1])
  }
  // Species flavour for what she says when touched or on her own.
  const extra = list === 'tocar' ? sp.tocar : list === 'sola' ? sp.sola : []
  for (const x of extra) items.push([x[lang] ?? x.ca, 3 * tag(x.t)])
  // What she knows about you: a good share of her chatter when switched on.
  if (personalized && (list === 'tocar' || list === 'sola' || list === 'benvinguda')) {
    const mine = PERSONAL.filter((q) => answers[q.key]?.trim())
    const base = items.reduce((n, [, w]) => n + w, 0) || 1
    for (const q of mine) items.push([(q[lang] ?? q.ca).replace('{v}', answers[q.key]!.trim()), (base * 0.45 / mine.length) * tag(q.t)])
  }
  const ok = items.filter(([text]) => !(exclude && exclude.test(text)))
  return fill(weighted(ok.map(([text, w]) => [text, w] as [string, number])) ?? '')
}

/** Next thing to do, by the day/night weights in the JSON, the species and the four sliders. */
export function nextMove(night: boolean): Mood {
  const { species, sliders } = ctx.pet
  const sp = SPECIES[species]
  const table = night ? cfg.moviments.nit : cfg.moviments.dia
  const energy = (m: Mood) => {
    const lively: Mood[] = ['run', 'play', 'chase', 'hop', 'dance', 'butterfly', 'roll', 'shake']
    const calm: Mood[] = ['sleep', 'lie', 'sit', 'stretch']
    return lively.includes(m) ? slide(sliders.energy, 0.25, 2.4) : calm.includes(m) ? slide(100 - sliders.energy, 0.4, 2.2) : 1
  }
  const affection = (m: Mood) => (['beg', 'wave', 'bow', 'tummy', 'happy'].includes(m) ? slide(sliders.affection, 0.3, 2.2) : 1)
  const mischief = (m: Mood) => (['dig', 'sneeze', 'leave', 'bone', 'sniff', 'special'].includes(m) ? slide(sliders.mischief, 0.4, 2) : 1)
  const items = Object.entries(table)
    .map(([name, w]) => {
      const m = MOVE_IDS[name]
      if (!m || sp.skip.includes(m)) return [undefined, 0] as [Mood | undefined, number]
      return [m, w * (sp.bias[m] ?? 1) * energy(m) * affection(m) * mischief(m)] as [Mood | undefined, number]
    })
    .filter((x): x is [Mood, number] => !!x[0])
  return weighted(items) ?? 'sit'
}
