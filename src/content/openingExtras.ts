import { Chess } from 'chess.js'
import type { Color } from '../engine/game'
import type { MoveItem, ModelGame, OpeningExtras } from './deep/kit'
import { MORE_MODELS } from './modelGames'
import { EXTRAS_E4E5 } from './deep/extras-e4e5'
import { EXTRAS_E4 } from './deep/extras-e4'
import { EXTRAS_D4 } from './deep/extras-d4'
import { EXTRAS2 } from './deep/extras2'

/** Planes del medio juego, errores del rival y partidas modelo, por apertura. */
export const EXTRAS: Record<string, OpeningExtras> = { ...EXTRAS_E4E5, ...EXTRAS_E4, ...EXTRAS_D4, ...EXTRAS2 }

export function extrasOf(openingId: string): OpeningExtras | undefined {
  return EXTRAS[openingId]
}

/** Ejercicio listo para mostrar en el tablero. */
export interface PuzzleItem {
  id: string
  kind: MoveItem['kind']
  title: string
  prompt: string
  fen: string
  color: Color
  uci: string
  san: string
  /** UCI de las jugadas alternativas que también valen. */
  alt: string[]
  why: string
  /** Última jugada (la del rival) para mostrarla, si hubo. */
  prev: { from: string; to: string; san: string } | null
}

export function toPuzzle(item: MoveItem): PuzzleItem {
  const c = new Chess()
  let prev: PuzzleItem['prev'] = null
  for (const m of item.moves) {
    const mv = c.move(m)
    prev = { from: mv.from, to: mv.to, san: mv.san }
  }
  const fen = c.fen()
  const color = c.turn() as Color
  const alt = (item.alt ?? []).map((a) => {
    const t = new Chess(fen)
    const m = t.move(a)
    return `${m.from}${m.to}${m.promotion ?? ''}`
  })
  const mv = c.move(item.answer)
  return { id: item.id, kind: item.kind, title: item.title, prompt: item.prompt, fen, color, uci: `${mv.from}${mv.to}${mv.promotion ?? ''}`, san: mv.san, alt, why: item.why, prev }
}

export function puzzlesOf(openingId: string, kind?: MoveItem['kind']): PuzzleItem[] {
  return (extrasOf(openingId)?.items ?? []).filter((i) => !kind || i.kind === kind).map(toPuzzle)
}

export function modelOf(openingId: string): ModelGame | undefined {
  return extrasOf(openingId)?.model
}

/** Todas las partidas de ejemplo de una apertura: la de siempre y las que armó el motor. */
export function modelsOf(openingId: string): ModelGame[] {
  const first = modelOf(openingId)
  return [...(first ? [first] : []), ...(MORE_MODELS[openingId] ?? [])]
}
