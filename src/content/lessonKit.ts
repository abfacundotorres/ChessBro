import { Chess } from 'chess.js'
import type { Challenge, ChoiceChallenge, TapChallenge } from '../engine/challenge'
import type { Exercise } from '../engine/lesson'
import { tapAnswer } from '../engine/structure'
import PUZZLES from './lessonPuzzles.json'

/** Herramientas para escribir lecciones. */

type RawPuzzle = { id: string; fen: string; line: string[]; rating: number }

/**
 * Ejercicios a partir de puzzles de Lichess de un tema. `skip` salta los primeros (los que ya usa
 * otra lección del mismo tema), así dos lecciones no repiten un puzzle.
 */
export function lichess(theme: string, why: string, take = 4, skip = 0): Exercise[] {
  const list = ((PUZZLES as Record<string, RawPuzzle[]>)[theme] ?? []).slice(skip, skip + take)
  return list.map((p) => ({
    id: `li-${p.id}`,
    fen: p.fen,
    goal: { kind: 'win' as const },
    line: p.line,
    accept: [p.line[0]!],
    why,
    source: 'lichess' as const,
  }))
}

/** Ejercicio escrito a mano de finales (win/hold). La respuesta del rival es solo ilustrativa. */
export function pos(id: string, fen: string, goal: 'win' | 'hold', line: [string, string], accept: string[], why: string): Exercise {
  return { id, fen, goal: { kind: goal }, line, accept, why }
}

export function mate1(id: string, fen: string, line: string, accept: string[], why: string): Exercise {
  return { id, fen, goal: { kind: 'mate', in: 1 }, line: [line], accept, why }
}

/** Opción múltiple. `answer` es el índice (0-based) de la correcta; `fact` lo verifica un test contra `fen`. */
export function choice(question: string, options: string[], answer: number, why: string, fen?: string, fact?: ChoiceChallenge['fact']): Challenge {
  return { kind: 'choice', question, options, answer, why, ...(fen ? { fen } : {}), ...(fact ? { fact } : {}) }
}

/** FEN después de una serie de jugadas (SAN) desde la posición inicial. Lanza si alguna es ilegal. */
export function fenAfter(sans: readonly string[]): string {
  const c = new Chess()
  for (const san of sans) c.move(san)
  return c.fen()
}

/** Elegir una jugada; las opciones y la respuesta van en UCI. Un test las verifica con Stockfish. */
export function pick(prompt: string, fen: string, options: string[], answer: string, why: string): Challenge {
  return { kind: 'move', prompt, fen, options, answer, why }
}

/**
 * Tocar casillas. Con `answer` explícito, un test lo contrasta con la regla; sin él, se calcula
 * con la regla (útil cuando son muchas casillas, como las de una columna abierta).
 */
export function tap(
  prompt: string,
  fen: string,
  rule: TapChallenge['rule'],
  side: TapChallenge['side'],
  mode: TapChallenge['mode'],
  why: string,
  answer?: string[],
  orientation?: 'white' | 'black',
  /** Casilla de la pieza (regla 'moves'). */
  square?: string,
): TapChallenge {
  return {
    kind: 'tap',
    prompt,
    fen,
    rule,
    side,
    mode,
    answer: answer ?? tapAnswer(rule, fen, side, square),
    why,
    ...(orientation ? { orientation } : {}),
    ...(square ? { square } : {}),
  }
}
