import data from '../data/pipa.json'
import type { Lang } from './i18n'

/**
 * Typed access to src/data/pipa.json — Pipa's phrases (with weights, in both
 * languages) and how often she does each thing. The JSON is meant to be
 * edited by hand; the app picks it up on the next build/deploy.
 */

export type Mood =
  | 'walk' | 'run' | 'sit' | 'lie' | 'sniff' | 'play' | 'chase' | 'roll'
  | 'stretch' | 'scratch' | 'beg' | 'dig' | 'drink' | 'sleep' | 'poop' | 'leave'
  | 'happy' | 'away'

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
}

export type PhraseList =
  | 'tocar' | 'tocarDormint' | 'sola' | 'set' | 'desar' | 'aiguaPlena' | 'cridada' | 'caca' | 'cacaRecollida'

interface Phrase { pes?: number; ca?: string; es?: string }

const cfg = data as unknown as {
  parlar: { cadaSegons: [number, number]; duradaSegons: number; probabilitatSetSiPocaAigua: number }
  fora: { segons: [number, number] }
  caca: { maximALaVegada: number }
  moviments: { dia: Record<string, number>; nit: Record<string, number> }
  frases: Record<PhraseList, Phrase[]>
}

export const PIPA = {
  talkEverySec: cfg.parlar?.cadaSegons ?? [28, 50],
  talkDurationMs: (cfg.parlar?.duradaSegons ?? 3.2) * 1000,
  thirstyChance: cfg.parlar?.probabilitatSetSiPocaAigua ?? 0.5,
  awaySec: cfg.fora?.segons ?? [25, 70],
  maxPoops: cfg.caca?.maximALaVegada ?? 2,
}

function weighted<T>(items: [T, number][]): T | undefined {
  const valid = items.filter(([, w]) => w > 0)
  const total = valid.reduce((s, [, w]) => s + w, 0)
  if (!total) return undefined
  let r = Math.random() * total
  for (const [v, w] of valid) { if ((r -= w) <= 0) return v }
  return valid[valid.length - 1][0]
}

/** A random phrase from a list, honouring weights; falls back to the other language. */
export function phrase(list: PhraseList, lang: Lang): string {
  const items = (cfg.frases[list] ?? [])
    .map((p) => [p[lang] ?? p.ca ?? p.es ?? '', p.pes ?? 1] as [string, number])
    .filter(([text]) => text)
  return weighted(items) ?? ''
}

/** Next thing to do, by the day/night weights in the JSON. */
export function nextMove(night: boolean): Mood {
  const table = night ? cfg.moviments.nit : cfg.moviments.dia
  const items = Object.entries(table)
    .map(([name, w]) => [MOVE_IDS[name], w] as [Mood | undefined, number])
    .filter((x): x is [Mood, number] => !!x[0])
  return weighted(items) ?? 'sit'
}
