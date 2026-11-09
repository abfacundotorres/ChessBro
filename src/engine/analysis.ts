import { Chess } from 'chess.js'
import type { Color } from './game'

/**
 * Clasificación de errores de una partida a partir de evaluaciones del motor.
 * Todo es puro: el motor (Stockfish) solo provee `PositionEval` por posición.
 */

/** Evaluación desde el punto de vista del bando que mueve en esa posición. */
export type Score = { cp: number } | { mate: number }

export interface PositionEval {
  score: Score
  /** Mejor jugada en UCI; null si no hay jugadas (mate/ahogado). */
  best: string | null
  /** Línea principal en UCI (empieza con `best`). */
  pv: string[]
}

export type Severity = 'inaccuracy' | 'mistake' | 'blunder'

export type ErrorKind =
  | 'allowedMate' // después de tu jugada, el rival tiene mate forzado
  | 'missedMate' // tenías mate forzado y lo dejaste pasar
  | 'hanging' // dejaste material en el aire: el rival lo gana enseguida
  | 'missedTactic' // había una jugada forzada (jaque/captura) que ganaba
  | 'opening' // imprecisión de apertura sin táctica de por medio
  | 'endgame' // error en el final
  | 'positional' // el resto

export interface MoveError {
  /** Índice de la jugada (0 = primera jugada de la partida). */
  ply: number
  san: string
  /** Mejor jugada según el motor, en UCI y SAN. */
  bestUci: string
  bestSan: string
  severity: Severity
  kind: ErrorKind
  /** Puntos de probabilidad de ganar perdidos (0–100). */
  winLoss: number
  /** Posición antes de tu jugada (la del ejercicio). */
  fenBefore: string
  /** Jugada previa del rival en UCI (para mostrarla animada en el ejercicio), si existe. */
  prevUci: string | null
  /** Posición antes de la jugada previa del rival. */
  fenBeforePrev: string | null
}

const MATE_CP = 10_000

/** Convierte el score a centipeones acotados (mate = ±10000 menos distancia). */
export function toCp(s: Score): number {
  if ('cp' in s) return s.cp
  if (s.mate > 0) return MATE_CP - s.mate
  if (s.mate < 0) return -MATE_CP - s.mate
  return -MATE_CP // mate 0: el que mueve está mateado
}

/** Probabilidad de ganar (0–100) según la fórmula que usa Lichess. */
export function winPercent(cp: number): number {
  const c = Math.max(-1000, Math.min(1000, cp))
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * c)) - 1)
}

/**
 * Umbrales en puntos de probabilidad de ganar perdidos: 5 / 10 / 20, como las bandas de "puntos esperados" de Chess.com
 * (los de Lichess, 10 / 20 / 30, dejaban pasar demasiado en partidas de nivel bajo).
 */
export function severityOf(winLoss: number): Severity | null {
  if (winLoss >= 20) return 'blunder'
  if (winLoss >= 10) return 'mistake'
  if (winLoss >= 5) return 'inaccuracy'
  return null
}

const VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

function material(chess: Chess, color: Color): number {
  let sum = 0
  for (const row of chess.board()) for (const c of row) if (c && c.color === color) sum += VALUES[c.type] ?? 0
  return sum
}

function nonPawnMaterial(chess: Chess): number {
  let sum = 0
  for (const row of chess.board()) for (const c of row) if (c && c.type !== 'p') sum += VALUES[c.type] ?? 0
  return sum
}

function applyUci(chess: Chess, uci: string): boolean {
  try {
    chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    return true
  } catch {
    return false
  }
}

/** Diferencia de material (yo − rival) desde la perspectiva de `me`. */
function balance(chess: Chess, me: Color): number {
  return material(chess, me) - material(chess, me === 'w' ? 'b' : 'w')
}

function uciToSan(fen: string, uci: string): string {
  const c = new Chess(fen)
  return applyUci(c, uci) ? (c.history().at(-1) ?? uci) : uci
}

export interface ClassifyInput {
  /** FEN antes de la jugada. */
  fenBefore: string
  /** Jugada hecha (UCI). */
  played: string
  /** Eval antes de la jugada (perspectiva de quien mueve). */
  before: PositionEval
  /** Eval después de la jugada (perspectiva del rival, que mueve). */
  after: PositionEval
  /** Número de jugada completa (1, 2, …). */
  moveNumber: number
}

export function classify({ fenBefore, played, before, after, moveNumber }: ClassifyInput): { kind: ErrorKind; winLoss: number } | null {
  const me: Color = fenBefore.split(' ')[1] === 'b' ? 'b' : 'w'
  const cpBefore = toCp(before.score)
  const cpAfter = -toCp(after.score)
  const winLoss = Math.max(0, winPercent(cpBefore) - winPercent(cpAfter))

  const hadMate = 'mate' in before.score && before.score.mate > 0
  const stillMate = 'mate' in after.score && after.score.mate < 0
  const allowsMate = 'mate' in after.score && after.score.mate > 0
  const wasMated = 'mate' in before.score && before.score.mate < 0

  if (allowsMate && !wasMated) return { kind: 'allowedMate', winLoss: Math.max(winLoss, 30) }
  if (hadMate && !stillMate) {
    // Perder un mate cuando igual queda una posición ganadísima no es grave.
    if (cpAfter >= 500) return null
    return { kind: 'missedMate', winLoss: Math.max(winLoss, 30) }
  }
  if (severityOf(winLoss) === null) return null

  // ¿El rival gana material enseguida? Material tras: mi jugada + 3 de la PV del rival.
  const chess = new Chess(fenBefore)
  const start = balance(chess, me)
  if (applyUci(chess, played)) {
    for (const uci of after.pv.slice(0, 3)) if (!applyUci(chess, uci)) break
    const lost = start - balance(chess, me)
    const replyIsCapture = after.best !== null && isCapture(fenBefore, played, after.best)
    if (lost >= 2 && replyIsCapture) return { kind: 'hanging', winLoss }
  }

  // ¿Había una jugada forzada (jaque o captura) que ganaba material?
  if (before.best && isForcing(fenBefore, before.best)) {
    const c = new Chess(fenBefore)
    for (const uci of before.pv.slice(0, 4)) if (!applyUci(c, uci)) break
    if (balance(c, me) - start >= 2 || toCp(before.score) >= 300) return { kind: 'missedTactic', winLoss }
  }

  if (moveNumber <= 12) return { kind: 'opening', winLoss }
  if (nonPawnMaterial(new Chess(fenBefore)) <= 26) return { kind: 'endgame', winLoss }
  return { kind: 'positional', winLoss }
}

function isCapture(fenBefore: string, played: string, reply: string): boolean {
  const c = new Chess(fenBefore)
  if (!applyUci(c, played)) return false
  try {
    const m = c.move({ from: reply.slice(0, 2), to: reply.slice(2, 4), promotion: reply[4] })
    return m.captured !== undefined
  } catch {
    return false
  }
}

function isForcing(fen: string, uci: string): boolean {
  const c = new Chess(fen)
  try {
    const m = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    return m.captured !== undefined || c.inCheck()
  } catch {
    return false
  }
}

export interface GameAnalysisInput {
  startFen: string
  /** Jugadas en UCI. */
  moves: string[]
  /** Evaluaciones de cada posición: evals[i] = antes de la jugada i; evals[moves.length] = final. */
  evals: PositionEval[]
  /** Bando del usuario. */
  me: Color
}

export interface GameAnalysis {
  errors: MoveError[]
  /** Pérdida media de probabilidad de ganar por jugada propia (menor = mejor). */
  avgWinLoss: number
  /** Precisión estilo Lichess (0–100), aproximada. */
  accuracy: number
  counts: Record<Severity, number>
}

/** Precisión por jugada según Lichess: 103.1668·e^(−0.04354·pérdida) − 3.1669. */
function moveAccuracy(winLoss: number): number {
  return Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * winLoss) - 3.1669))
}

export function analyzeGame({ startFen, moves, evals, me }: GameAnalysisInput): GameAnalysis {
  if (evals.length !== moves.length + 1) throw new Error('Hace falta una evaluación por posición')
  const chess = new Chess(startFen)
  const fens = [chess.fen()]
  const sans: string[] = []
  for (const uci of moves) {
    if (!applyUci(chess, uci)) throw new Error(`Jugada ilegal: ${uci}`)
    fens.push(chess.fen())
    sans.push(chess.history().at(-1) ?? uci)
  }

  const errors: MoveError[] = []
  const counts: Record<Severity, number> = { inaccuracy: 0, mistake: 0, blunder: 0 }
  let lossSum = 0
  let invAccSum = 0
  let mine = 0
  const startNumber = Number.parseInt(startFen.split(' ')[5] ?? '1', 10) || 1
  const startsBlack = startFen.split(' ')[1] === 'b'

  for (let i = 0; i < moves.length; i++) {
    const fenBefore = fens[i]!
    const side: Color = fenBefore.split(' ')[1] === 'b' ? 'b' : 'w'
    if (side !== me) continue
    const before = evals[i]!
    const after = evals[i + 1]!
    const moveNumber = startNumber + Math.floor((i + (startsBlack ? 1 : 0)) / 2)
    const c = classify({ fenBefore, played: moves[i]!, before, after, moveNumber })
    const loss = Math.max(0, winPercent(toCp(before.score)) - winPercent(-toCp(after.score)))
    lossSum += loss
    invAccSum += 1 / Math.max(1, moveAccuracy(loss))
    mine++
    if (!c || !before.best) continue
    const severity = severityOf(c.winLoss)
    if (!severity) continue
    counts[severity]++
    errors.push({
      ply: i,
      san: sans[i]!,
      bestUci: before.best,
      bestSan: uciToSan(fenBefore, before.best),
      severity,
      kind: c.kind,
      winLoss: Math.round(c.winLoss),
      fenBefore,
      prevUci: i > 0 ? moves[i - 1]! : null,
      fenBeforePrev: i > 0 ? fens[i - 1]! : null,
    })
  }
  return {
    errors,
    avgWinLoss: mine ? lossSum / mine : 0,
    // Media armónica: un error grave pesa más que muchas jugadas buenas (el promedio simple daba 90 % hasta con blunders).
    accuracy: mine ? Math.round(mine / invAccSum) : 100,
    counts,
  }
}

/** Parser de líneas UCI "info ... score ... pv ..." → PositionEval parcial. */
export function parseInfo(line: string): { depth: number; score: Score; pv: string[] } | null {
  if (!line.startsWith('info ') || line.includes(' lowerbound') || line.includes(' upperbound')) return null
  const depth = /\bdepth (\d+)/.exec(line)
  const cp = /\bscore cp (-?\d+)/.exec(line)
  const mate = /\bscore mate (-?\d+)/.exec(line)
  const pv = /\bpv (.+)$/.exec(line)
  if (!depth || (!cp && !mate)) return null
  return {
    depth: Number(depth[1]),
    score: cp ? { cp: Number(cp[1]) } : { mate: Number(mate![1]) },
    pv: pv ? pv[1]!.trim().split(/\s+/) : [],
  }
}

export const KIND_LABELS: Record<ErrorKind, string> = {
  allowedMate: 'Permitiste mate',
  missedMate: 'Se te pasó un mate',
  hanging: 'Pieza colgada',
  missedTactic: 'Táctica no vista',
  opening: 'Apertura',
  endgame: 'Final',
  positional: 'Posicional',
}

/** Tema de táctica recomendado para cada tipo de error (claves de content/themes.json). */
export const KIND_TRAINING: Record<ErrorKind, string | null> = {
  allowedMate: 'mateIn2',
  missedMate: 'mateIn2',
  hanging: 'hangingPiece',
  missedTactic: 'fork',
  opening: 'opening',
  endgame: 'endgame',
  positional: null,
}
