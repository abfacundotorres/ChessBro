import { Chess, DEFAULT_POSITION, type Square } from 'chess.js'

export const START_FEN = DEFAULT_POSITION

export type Color = 'w' | 'b'
export type PromoPiece = 'q' | 'r' | 'b' | 'n'

export interface MoveInput {
  from: string
  to: string
  promotion?: PromoPiece
}

export interface PlayedMove extends MoveInput {
  san: string
  /** FEN después de la jugada. */
  fen: string
}

export type GameStatus =
  | { kind: 'playing' }
  | { kind: 'checkmate'; winner: Color }
  | { kind: 'stalemate' }
  | { kind: 'draw'; reason: 'insufficient' | 'threefold' | 'fifty-moves' }

export interface GameView {
  startFen: string
  fen: string
  turn: Color
  moves: PlayedMove[]
  status: GameStatus
  /** Casilla del rey en jaque, si hay jaque. */
  checkSquare: string | null
  lastMove: { from: string; to: string } | null
}

const SQUARE_RE = /^[a-h][1-8]$/

function asSquare(s: string): Square | null {
  return SQUARE_RE.test(s) ? (s as Square) : null
}

function load(fen: string): Chess {
  return new Chess(fen)
}

function statusOf(chess: Chess): GameStatus {
  if (chess.isCheckmate()) return { kind: 'checkmate', winner: chess.turn() === 'w' ? 'b' : 'w' }
  if (chess.isStalemate()) return { kind: 'stalemate' }
  if (chess.isInsufficientMaterial()) return { kind: 'draw', reason: 'insufficient' }
  if (chess.isThreefoldRepetition()) return { kind: 'draw', reason: 'threefold' }
  if (chess.isDrawByFiftyMoves()) return { kind: 'draw', reason: 'fifty-moves' }
  return { kind: 'playing' }
}

function kingSquare(chess: Chess, color: Color): string | null {
  for (const row of chess.board()) {
    for (const cell of row) {
      if (cell && cell.type === 'k' && cell.color === color) return cell.square
    }
  }
  return null
}

/** Intenta una jugada sobre una instancia; devuelve null si es ilegal (sin lanzar). */
function play(chess: Chess, move: MoveInput): PlayedMove | null {
  const from = asSquare(move.from)
  const to = asSquare(move.to)
  if (!from || !to) return null
  try {
    const m = chess.move({ from, to, promotion: move.promotion })
    return { from: m.from, to: m.to, promotion: m.promotion as PromoPiece | undefined, san: m.san, fen: m.after }
  } catch {
    return null
  }
}

/**
 * Reproduce una partida desde `startFen`. Lanza si alguna jugada es ilegal:
 * el estado guardado debería ser siempre válido.
 */
export function replay(startFen: string, moves: readonly MoveInput[]): GameView {
  const chess = load(startFen)
  const played: PlayedMove[] = []
  for (const [i, mv] of moves.entries()) {
    const p = play(chess, mv)
    if (!p) throw new Error(`Jugada ilegal #${i + 1}: ${mv.from}${mv.to}`)
    played.push(p)
  }
  const last = played.at(-1)
  return {
    startFen,
    fen: chess.fen(),
    turn: chess.turn(),
    moves: played,
    status: statusOf(chess),
    checkSquare: chess.inCheck() ? kingSquare(chess, chess.turn()) : null,
    lastMove: last ? { from: last.from, to: last.to } : null,
  }
}

/** Valida una jugada en la posición `fen`. Devuelve la jugada jugada o null. */
export function tryMove(fen: string, move: MoveInput): PlayedMove | null {
  return play(load(fen), move)
}

/** Casillas destino legales para la pieza en `from` (vacío si no hay pieza del bando que mueve). */
export function legalTargets(fen: string, from: string): string[] {
  const sq = asSquare(from)
  if (!sq) return []
  return load(fen)
    .moves({ square: sq, verbose: true })
    .map((m) => m.to)
}

/** ¿La jugada from→to es una coronación legal? (para mostrar el selector de pieza) */
export function needsPromotion(fen: string, from: string, to: string): boolean {
  const sq = asSquare(from)
  if (!sq) return false
  return load(fen)
    .moves({ square: sq, verbose: true })
    .some((m) => m.to === to && m.promotion !== undefined)
}

/** Casilla del rey en jaque en la posición, o null. */
export function checkSquareOf(fen: string): string | null {
  const chess = load(fen)
  return chess.inCheck() ? kingSquare(chess, chess.turn()) : null
}

/** Color de la pieza en una casilla, o null. */
export function pieceColorAt(fen: string, square: string): Color | null {
  const sq = asSquare(square)
  if (!sq) return null
  return load(fen).get(sq)?.color ?? null
}

const FIGURINES: Record<string, string> = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘' }

/** Notación figurativa: "Nf3" → "♘f3", "exd8=Q+" → "exd8=♕+". Independiente del idioma. */
export function sanToFigurine(san: string): string {
  return san.replace(/[KQRBN]/g, (c) => FIGURINES[c] ?? c)
}

export interface MovePair {
  number: number
  white: PlayedMove | null
  black: PlayedMove | null
}

/** Agrupa jugadas en pares numerados, respetando si la posición inicial arranca con negras. */
export function pairMoves(startFen: string, moves: readonly PlayedMove[]): MovePair[] {
  const [, turn = 'w', , , , full = '1'] = startFen.split(' ')
  let number = Number.parseInt(full, 10) || 1
  const pairs: MovePair[] = []
  let i = 0
  if (turn === 'b' && moves.length > 0) {
    pairs.push({ number, white: null, black: moves[0] ?? null })
    i = 1
    number++
  }
  for (; i < moves.length; i += 2) {
    pairs.push({ number, white: moves[i] ?? null, black: moves[i + 1] ?? null })
    number++
  }
  return pairs
}

/** Valida un FEN; devuelve null si es válido o el mensaje de error. */
export function validateFen(fen: string): string | null {
  try {
    new Chess(fen)
    return null
  } catch (e) {
    return e instanceof Error ? e.message : 'FEN inválido'
  }
}
