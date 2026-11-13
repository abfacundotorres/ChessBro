import { tryMove, type MoveInput } from './game'
import { uciToMove, type PuzzleState } from './puzzle'
import type { Puzzle } from './puzzle'

/**
 * Ejercicio de una lección. Juega el usuario (el bando que mueve en `fen`).
 * - `line`: línea principal en UCI, empieza con la jugada del usuario y alterna con la
 *   respuesta del rival. Se muestra al terminar.
 * - `accept`: TODAS las primeras jugadas buenas. Un test las verifica con Stockfish: si el
 *   motor encuentra otra jugada igual de buena, el test falla y hay que agregarla (o cambiar
 *   la posición para que sea más clara).
 */
export interface Exercise {
  id: string
  fen: string
  goal: ExerciseGoal
  line: string[]
  accept: string[]
  /** Qué hay que ver. Se muestra tras resolver. */
  why: string
  /** La versión larga de `why` («Explicame más»): 3 a 5 frases con el porqué y qué mirar la próxima vez. */
  more?: string
  /** 'lichess': viene de la base de puzzles (verificada por Lichess); 'engine' o ausente: la verifica un test. */
  source?: 'engine' | 'lichess'
}

export type ExerciseGoal =
  | { kind: 'mate'; in: number } // mate en n jugadas del usuario
  | { kind: 'win' } // ganar material / posición ganada
  | { kind: 'hold' } // salvar la posición (tablas)

/** Arranca un ejercicio: a diferencia de un puzzle de Lichess, mueve primero el usuario. */
export function startExercise(ex: Exercise): PuzzleState {
  const puzzle: Puzzle = { id: ex.id, fen: ex.fen, moves: ex.line, rating: 0, rd: 0, themes: 0 }
  const solver = ex.fen.split(' ')[1] === 'b' ? 'b' : 'w'
  return { puzzle, ply: 0, played: [], solver, solved: false, failed: false }
}

/** Intenta la jugada del usuario. Si es una de las aceptadas, devuelve la línea completa aplicada. */
export function tryExercise(
  ex: Exercise,
  state: PuzzleState,
  move: MoveInput,
): { ok: boolean; state: PuzzleState } {
  const fen = state.played.at(-1)?.fen ?? ex.fen
  const played = tryMove(fen, move)
  if (!played) return { ok: false, state: { ...state, failed: true } }
  const uci = `${played.from}${played.to}${played.promotion ?? ''}`
  const isStart = state.played.length === 0
  const expected = isStart ? ex.accept : [ex.line[state.played.length] ?? '']
  if (!expected.includes(uci) && !played.san.endsWith('#')) return { ok: false, state: { ...state, failed: true } }
  const played1 = [...state.played, played]
  // Si jugó una alternativa aceptada distinta de la línea principal, termina ahí.
  const onLine = uci === ex.line[state.played.length]
  const next = ex.line[played1.length]
  if (!onLine || next === undefined || played.san.endsWith('#')) {
    return { ok: true, state: { ...state, played: played1, ply: played1.length, solved: true } }
  }
  const reply = tryMove(played.fen, uciToMove(next))
  if (!reply) throw new Error(`Ejercicio ${ex.id}: respuesta inválida`)
  const all = [...played1, reply]
  const last = ex.line.length === all.length
  return { ok: true, state: { ...state, played: all, ply: all.length, solved: last } }
}
