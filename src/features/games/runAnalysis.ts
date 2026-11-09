import { Chess } from 'chess.js'
import type { PositionEval } from '../../engine/analysis'
import { getEngine } from '../../lib/stockfish'
import { saveAnalysis } from '../../data/games'
import type { GameRecord } from '../../data/db'
import { toDateStr } from '../../engine/dates'

/** Profundidad del análisis: ~0,2 s por posición en desktop, ~1 s en un celular medio. */
export const ANALYSIS_DEPTH = 14

function terminalEval(chess: Chess): PositionEval | null {
  if (chess.isCheckmate()) return { score: { mate: 0 }, best: null, pv: [] }
  if (chess.isStalemate() || chess.isInsufficientMaterial()) return { score: { cp: 0 }, best: null, pv: [] }
  return null
}

export async function runAnalysis(
  game: GameRecord,
  onProgress: (done: number, total: number) => void,
  signal: AbortSignal,
): Promise<{ cards: number; game: GameRecord }> {
  const engine = getEngine()
  await engine.newGame()
  const chess = new Chess(game.startFen)
  const fens = [chess.fen()]
  for (const uci of game.moves) {
    chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    fens.push(chess.fen())
  }
  const total = fens.length
  const evals: PositionEval[] = []
  for (let i = 0; i < total; i++) {
    const fen = fens[i]!
    const terminal = i === total - 1 ? terminalEval(new Chess(fen)) : null
    evals.push(terminal ?? (await engine.evaluate(fen, ANALYSIS_DEPTH, signal)))
    onProgress(i + 1, total)
  }
  return saveAnalysis(game.id, evals, ANALYSIS_DEPTH, toDateStr(new Date()))
}
