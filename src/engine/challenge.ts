import type { TapRule } from './structure'
import type { Color } from './game'

/**
 * Desafíos cortos que se intercalan con la lectura de una lección ("adivinanzas" y mini-juegos).
 * - choice: pregunta de opción múltiple (de concepto; no la verifica el motor).
 * - tap: tocar en el tablero las casillas que cumplen una regla. La respuesta la calcula
 *   `tapAnswer` (engine/structure.ts) y un test la contrasta con `answer`.
 * - move: elegir la mejor entre varias jugadas. Un test con Stockfish verifica que la correcta es
 *   buena y que cada distractor es claramente peor.
 */
export type Challenge = ChoiceChallenge | TapChallenge | MoveChallenge

export interface ChoiceChallenge {
  kind: 'choice'
  question: string
  options: string[]
  /** Índice de la opción correcta. */
  answer: number
  why: string
  fen?: string
}

export interface TapChallenge {
  kind: 'tap'
  prompt: string
  fen: string
  rule: TapRule
  side: Color | 'both'
  /** 'all': hay que tocar exactamente esas casillas y confirmar. 'any': basta tocar una de ellas. */
  mode: 'all' | 'any'
  answer: string[]
  why: string
  /** Orientación del tablero; por defecto, blancas abajo. */
  orientation?: 'white' | 'black'
}

export interface MoveChallenge {
  kind: 'move'
  prompt: string
  fen: string
  /** Jugadas candidatas en UCI (2 a 4), una de ellas correcta. */
  options: string[]
  answer: string
  why: string
}

export type Response = { kind: 'choice'; index: number } | { kind: 'tap'; squares: string[] } | { kind: 'move'; uci: string }

/** ¿La respuesta es correcta? */
export function checkChallenge(ch: Challenge, r: Response): boolean {
  if (ch.kind === 'choice') return r.kind === 'choice' && r.index === ch.answer
  if (ch.kind === 'move') return r.kind === 'move' && r.uci === ch.answer
  if (r.kind !== 'tap' || r.squares.length === 0) return false
  const mine = new Set(r.squares)
  if (ch.mode === 'any') return mine.size === 1 && ch.answer.includes(r.squares[0]!)
  const want = new Set(ch.answer)
  return mine.size === want.size && [...mine].every((q) => want.has(q))
}
