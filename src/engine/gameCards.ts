import { toCp, KIND_TRAINING, type ErrorKind, type MoveError, type PositionEval } from './analysis'
import type { Puzzle } from './puzzle'

/** Origen de una tarjeta creada a partir de un error en una partida propia. */
export interface CardOrigin {
  gameId: string
  ply: number
  kind: ErrorKind
  /** Lo que jugaste (SAN). */
  played: string
  /** Eval de la mejor jugada (cp, perspectiva de quien mueve), para aceptar alternativas. */
  bestCp: number
}

/** Solo los errores tácticos graves se convierten en ejercicios: tienen una respuesta clara. */
export const CARD_KINDS: ReadonlySet<ErrorKind> = new Set(['allowedMate', 'missedMate', 'hanging', 'missedTactic'])

export function shouldCard(e: MoveError): boolean {
  return e.severity !== 'inaccuracy' && CARD_KINDS.has(e.kind) && e.prevUci !== null && e.fenBeforePrev !== null
}

export function cardId(gameId: string, ply: number): string {
  return `g:${gameId}:${ply}`
}

/**
 * Ejercicio en formato puzzle: se muestra la jugada previa del rival y el usuario tiene
 * que encontrar la mejor. `themeBit` es el bit del tema de entrenamiento asociado.
 */
export function errorToCard(
  gameId: string,
  e: MoveError,
  before: PositionEval,
  rating: number,
  themeBit: (key: string) => number,
): { puzzle: Puzzle; origin: CardOrigin } | null {
  if (!shouldCard(e) || !e.prevUci || !e.fenBeforePrev) return null
  const key = KIND_TRAINING[e.kind]
  return {
    puzzle: {
      id: cardId(gameId, e.ply),
      fen: e.fenBeforePrev,
      moves: [e.prevUci, e.bestUci],
      rating: Math.round(rating),
      rd: 100,
      themes: key ? themeBit(key) : 0,
    },
    origin: { gameId, ply: e.ply, kind: e.kind, played: e.san, bestCp: toCp(before.score) },
  }
}

/**
 * ¿Una jugada distinta de la del motor también sirve? Sí si pierde menos de 10 puntos de
 * probabilidad de ganar respecto de la mejor (o si conserva un mate).
 */
export function isGoodAlternative(bestCp: number, afterOpponentScore: PositionEval['score'], winPct: (cp: number) => number): boolean {
  const cp = -toCp(afterOpponentScore)
  return winPct(bestCp) - winPct(cp) < 10
}
