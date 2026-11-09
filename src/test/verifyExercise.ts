import { Chess } from 'chess.js'
import { toCp, winPercent } from '../engine/analysis'
import type { Exercise } from '../engine/lesson'
import { nodeEngine } from './stockfishNode'

export interface Verdict {
  id: string
  best: number
  good: string[]
  /** Evaluación (cp, perspectiva del usuario) de cada jugada legal. */
  all: Record<string, number>
  /** Línea principal del motor tras la mejor jugada (UCI). */
  bestLine: string[]
  problems: string[]
}

const DEPTH = 12
const TOLERANCE = 8 // puntos de probabilidad de ganar

function uciOf(m: { from: string; to: string; promotion?: string }) {
  return `${m.from}${m.to}${m.promotion ?? ''}`
}

/** Evalúa cada jugada legal con Stockfish y compara con lo que declara el ejercicio. */
export async function verifyExercise(ex: Exercise): Promise<Verdict> {
  const sf = await nodeEngine()
  const chess = new Chess(ex.fen)
  const moves = chess.moves({ verbose: true })
  const all: Record<string, number> = {}
  const mateIn: Record<string, number | null> = {}
  const lines: Record<string, string[]> = {}
  for (const m of moves) {
    const c = new Chess(ex.fen)
    c.move(m)
    const uci = uciOf(m)
    if (c.isCheckmate()) {
      all[uci] = 10_000
      mateIn[uci] = 1
      continue
    }
    if (c.isDraw()) {
      all[uci] = 0
      mateIn[uci] = null
      continue
    }
    const e = await sf.evaluate(c.fen(), DEPTH)
    all[uci] = -toCp(e.score)
    lines[uci] = e.pv
    mateIn[uci] = 'mate' in e.score && e.score.mate < 0 ? 1 + -e.score.mate : null
  }
  const best = Math.max(...Object.values(all))
  const problems: string[] = []
  let good: string[]
  if (ex.goal.kind === 'mate') {
    const n = ex.goal.in
    good = Object.keys(all).filter((u) => mateIn[u] !== null && mateIn[u]! <= n)
    if (good.length === 0) problems.push(`no hay mate en ${n}`)
  } else {
    good = Object.keys(all).filter((u) => winPercent(best) - winPercent(all[u]!) < TOLERANCE)
    if (ex.goal.kind === 'win' && best < 200) problems.push(`no es ganadora (mejor: ${best} cp)`)
    if (ex.goal.kind === 'hold') {
      if (best < -80) problems.push(`no se salva (mejor: ${best} cp)`)
      if (!Object.values(all).some((v) => v <= -200)) problems.push('ninguna jugada pierde: ejercicio trivial')
    }
  }
  const sortedAccept = [...ex.accept].sort()
  const sortedGood = [...good].sort()
  const multi = ex.goal.kind === 'mate' && ex.goal.in >= 2
  if (multi) {
    if (good.length !== 1) problems.push(`mate en ${ex.goal.kind === 'mate' ? ex.goal.in : ''} con ${good.length} claves: ${sortedGood.join(' ')}`)
    else if (ex.accept.length !== 1 || ex.accept[0] !== good[0]) problems.push(`accept debería ser [${good[0]}]`)
  } else if (JSON.stringify(sortedAccept) !== JSON.stringify(sortedGood)) {
    problems.push(`accept=[${sortedAccept.join(' ')}] pero el motor acepta [${sortedGood.join(' ')}]`)
  }
  if (ex.line[0] !== undefined && !ex.accept.includes(ex.line[0])) problems.push('la línea principal no empieza con una jugada aceptada')
  // La línea debe ser legal y, si es de mate, terminar en mate.
  const c = new Chess(ex.fen)
  for (const uci of ex.line) {
    try {
      c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    } catch {
      problems.push(`jugada ilegal en la línea: ${uci}`)
      break
    }
  }
  if (ex.goal.kind === 'mate' && !c.isCheckmate()) problems.push('la línea no termina en mate')
  const bestMove = Object.keys(all).find((u) => all[u] === best) ?? ''
  return { id: ex.id, best, good, all, bestLine: [bestMove, ...(lines[bestMove] ?? [])].slice(0, 6), problems }
}


export interface ChallengeVerdict {
  /** Evaluación (cp, perspectiva de quien mueve) de cada jugada legal. */
  all: Record<string, number>
  best: number
  problems: string[]
}

/**
 * Verifica una adivinanza de jugadas: la respuesta es una buena jugada (a menos de 10 puntos de
 * probabilidad de ganar de la mejor) y cada distractor es claramente peor (12 puntos o más).
 */
export async function verifyMoveChallenge(fen: string, options: string[], answer: string): Promise<ChallengeVerdict> {
  const sf = await nodeEngine()
  const chess = new Chess(fen)
  const all: Record<string, number> = {}
  for (const m of chess.moves({ verbose: true })) {
    const c = new Chess(fen)
    c.move(m)
    const uci = `${m.from}${m.to}${m.promotion ?? ''}`
    if (c.isCheckmate()) all[uci] = 10_000
    else if (c.isDraw()) all[uci] = 0
    else all[uci] = -toCp((await sf.evaluate(c.fen(), DEPTH)).score)
  }
  const best = Math.max(...Object.values(all))
  const problems: string[] = []
  for (const o of options) if (!(o in all)) problems.push(`jugada ilegal: ${o}`)
  if (!options.includes(answer)) problems.push('la respuesta no está entre las opciones')
  if (answer in all && winPercent(best) - winPercent(all[answer]!) >= 10) problems.push(`la respuesta no es buena (${all[answer]} cp vs mejor ${best})`)
  for (const o of options)
    if (o !== answer && o in all && answer in all && winPercent(all[answer]!) - winPercent(all[o]!) < 12)
      problems.push(`el distractor ${o} no es claramente peor (${all[o]} cp vs ${all[answer]})`)
  return { all, best, problems }
}
