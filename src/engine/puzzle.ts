import { replay, tryMove, type Color, type MoveInput, type PlayedMove, type PromoPiece } from './game'

/**
 * Formato Lichess: `fen` es la posición ANTES de la jugada del rival; `moves[0]` es esa
 * jugada (se muestra animada) y desde ahí el usuario juega moves[1], moves[3], …
 */
export interface Puzzle {
  id: string
  fen: string
  /** Jugadas en UCI (e2e4, e7e8q). */
  moves: string[]
  rating: number
  rd: number
  /** Máscara de bits sobre la lista de temas (ver content/themes.json). */
  themes: number
}

export interface PuzzleState {
  puzzle: Puzzle
  /** Índice de la próxima jugada esperada en `puzzle.moves`. */
  ply: number
  /** Jugadas aplicadas desde `puzzle.fen` (incluye la del rival inicial). */
  played: PlayedMove[]
  /** Bando que resuelve. */
  solver: Color
  solved: boolean
  /** Se marca al primer error o al pedir pista/solución y no se borra. */
  failed: boolean
}

export type MoveResult =
  | { kind: 'wrong' }
  | { kind: 'correct'; reply: PlayedMove | null }
  | { kind: 'solved' }

export function uciToMove(uci: string): MoveInput {
  const promo = uci[4]
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    ...(promo ? { promotion: promo as PromoPiece } : {}),
  }
}

export function moveToUci(m: MoveInput): string {
  return `${m.from}${m.to}${m.promotion ?? ''}`
}

export function currentFen(s: PuzzleState): string {
  return s.played.at(-1)?.fen ?? s.puzzle.fen
}

export function startPuzzle(puzzle: Puzzle): PuzzleState {
  const first = puzzle.moves[0]
  const opening = first ? tryMove(puzzle.fen, uciToMove(first)) : null
  if (!opening) throw new Error(`Puzzle ${puzzle.id}: jugada inicial inválida`)
  const solver: Color = opening.fen.split(' ')[1] === 'b' ? 'b' : 'w'
  return { puzzle, ply: 1, played: [opening], solver, solved: false, failed: false }
}

/** Cantidad de jugadas que tiene que hacer el usuario. */
export function solverMoveCount(p: Puzzle): number {
  return Math.floor(p.moves.length / 2)
}

/**
 * Evalúa la jugada del usuario. Es correcta si coincide con la solución o, como en
 * Lichess, si da jaque mate (puede haber más de un mate válido).
 */
export function playMove(s: PuzzleState, move: MoveInput): { state: PuzzleState; result: MoveResult } {
  if (s.solved) return { state: s, result: { kind: 'solved' } }
  const fen = currentFen(s)
  const played = tryMove(fen, move)
  const expected = s.puzzle.moves[s.ply]
  if (!played || expected === undefined) return { state: { ...s, failed: true }, result: { kind: 'wrong' } }

  const matches = moveToUci(played) === expected
  const mates = played.san.endsWith('#')
  if (!matches && !mates) return { state: { ...s, failed: true }, result: { kind: 'wrong' } }

  const afterUser = [...s.played, played]
  const nextPly = s.ply + 1
  const replyUci = s.puzzle.moves[nextPly]
  if (mates || replyUci === undefined) {
    return { state: { ...s, played: afterUser, ply: s.puzzle.moves.length, solved: true }, result: { kind: 'solved' } }
  }
  const reply = tryMove(played.fen, uciToMove(replyUci))
  if (!reply) throw new Error(`Puzzle ${s.puzzle.id}: respuesta inválida`)
  return {
    state: { ...s, played: [...afterUser, reply], ply: nextPly + 1 },
    result: { kind: 'correct', reply },
  }
}

/** Pista: casilla de origen de la jugada esperada. Marca el puzzle como fallado. */
export function hint(s: PuzzleState): { state: PuzzleState; square: string | null } {
  const expected = s.puzzle.moves[s.ply]
  if (s.solved || !expected) return { state: s, square: null }
  return { state: { ...s, failed: true }, square: expected.slice(0, 2) }
}

/** Aplica el resto de la solución. Marca el puzzle como fallado. */
export function revealSolution(s: PuzzleState): PuzzleState {
  if (s.solved) return s
  const rest = s.puzzle.moves.slice(s.ply).map(uciToMove)
  const view = replay(currentFen(s), rest)
  return { ...s, played: [...s.played, ...view.moves], ply: s.puzzle.moves.length, solved: true, failed: true }
}
