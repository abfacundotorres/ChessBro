import { addDays } from './dates'

/**
 * Repaso espaciado tipo Leitner para puzzles fallados.
 * Fallar (o volver a fallar) → caja 0, vuelve mañana.
 * Acertar → sube de caja; al acertar en la última caja, el puzzle se da por aprendido.
 */

export const INTERVALS = [1, 3, 7, 16, 35] as const

export interface ReviewCard {
  puzzleId: string
  box: number
  /** Fecha 'YYYY-MM-DD' desde la que está pendiente. */
  due: string
  lapses: number
}

export type ReviewOutcome = { kind: 'scheduled'; card: ReviewCard } | { kind: 'learned' }

/** Crea la tarjeta de un puzzle recién fallado. */
export function newCard(puzzleId: string, today: string): ReviewCard {
  return { puzzleId, box: 0, due: addDays(today, INTERVALS[0]), lapses: 1 }
}

export function review(card: ReviewCard, solved: boolean, today: string): ReviewOutcome {
  if (!solved) {
    return { kind: 'scheduled', card: { ...card, box: 0, due: addDays(today, INTERVALS[0]), lapses: card.lapses + 1 } }
  }
  const box = card.box + 1
  const interval = INTERVALS[box]
  if (interval === undefined) return { kind: 'learned' }
  return { kind: 'scheduled', card: { ...card, box, due: addDays(today, interval) } }
}

export function isDue(card: ReviewCard, today: string): boolean {
  return card.due <= today
}
