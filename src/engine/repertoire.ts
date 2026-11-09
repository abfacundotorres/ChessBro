import { Chess } from 'chess.js'
import type { Color } from './game'

/**
 * Repertorio de aperturas: una lista de líneas (secuencias de jugadas en SAN desde la posición
 * inicial). De cada línea salen tarjetas de repaso: una por cada posición en la que le toca mover
 * al usuario. Si dos líneas llegan a la misma posición (transposición), comparten la tarjeta.
 */
export interface RepLine {
  id: string
  color: Color
  /** Para agrupar en pantalla ("Contra 1.e4 e5", "Siciliana"…). */
  group: string
  name: string
  moves: string[]
  /** La idea de la línea, en 2–3 frases. */
  idea: string
  plan: string[]
  /** Notas sobre jugadas concretas: índice en `moves` → texto. */
  notes?: Record<number, string>
  /** Línea "para empezar": simple, útil desde el primer día. Se estudia primero. */
  starter?: boolean
}

export interface RepCardSpec {
  /** `${color}|${posición}`: la posición sin los contadores de jugadas. */
  id: string
  color: Color
  /** Posición antes de la jugada del usuario. */
  fen: string
  /** Jugada correcta (UCI) y su SAN. */
  uci: string
  san: string
  /** Última jugada del rival (para mostrarla), si hubo. */
  prev: { from: string; to: string; san: string } | null
  /** Líneas que pasan por esta posición. */
  lineIds: string[]
  /** Jugadas hasta acá, en SAN, de la primera línea que la contiene. */
  history: string[]
}

export interface RepConflict {
  id: string
  fen: string
  moves: { lineId: string; san: string }[]
}

/** Clave de posición: tablero, turno, enroques y al paso (sin contadores). */
export function positionKey(fen: string): string {
  return fen.split(' ').slice(0, 4).join(' ')
}

export function cardId(color: Color, fen: string): string {
  return `${color}|${positionKey(fen)}`
}

/** Tarjetas de repaso de un conjunto de líneas, más los conflictos (misma posición, dos jugadas distintas). */
export function buildCards(lines: readonly RepLine[]): { cards: RepCardSpec[]; conflicts: RepConflict[] } {
  const byId = new Map<string, RepCardSpec>()
  const seen = new Map<string, { lineId: string; san: string; uci: string }[]>()
  for (const line of lines) {
    const chess = new Chess()
    const history: string[] = []
    let prev: RepCardSpec['prev'] = null
    for (const san of line.moves) {
      const fen = chess.fen()
      const mine = chess.turn() === line.color
      const m = chess.move(san)
      const uci = `${m.from}${m.to}${m.promotion ?? ''}`
      if (mine) {
        const id = cardId(line.color, fen)
        const list = seen.get(id) ?? []
        list.push({ lineId: line.id, san: m.san, uci })
        seen.set(id, list)
        const existing = byId.get(id)
        if (existing) {
          if (!existing.lineIds.includes(line.id)) existing.lineIds.push(line.id)
        } else {
          byId.set(id, { id, color: line.color, fen, uci, san: m.san, prev, lineIds: [line.id], history: [...history] })
        }
      }
      history.push(m.san)
      prev = { from: m.from, to: m.to, san: m.san }
    }
  }
  const conflicts: RepConflict[] = []
  for (const [id, list] of seen) {
    if (new Set(list.map((x) => x.uci)).size > 1) {
      conflicts.push({ id, fen: byId.get(id)!.fen, moves: list.map((x) => ({ lineId: x.lineId, san: x.san })) })
    }
  }
  return { cards: [...byId.values()], conflicts }
}

/** Tarjetas de una línea. */
export function cardsOfLine(cards: readonly RepCardSpec[], lineId: string): RepCardSpec[] {
  return cards.filter((c) => c.lineIds.includes(lineId))
}

export interface LineStep {
  ply: number
  san: string
  uci: string
  /** ¿La juega el usuario? */
  mine: boolean
  /** Posición antes y después de la jugada. */
  fenBefore: string
  fenAfter: string
  from: string
  to: string
}

/** Jugadas de la línea con sus posiciones, para estudiarla o practicarla. */
export function lineSteps(line: RepLine): LineStep[] {
  const chess = new Chess()
  const out: LineStep[] = []
  line.moves.forEach((san, ply) => {
    const fenBefore = chess.fen()
    const mine = chess.turn() === line.color
    const m = chess.move(san)
    out.push({ ply, san: m.san, uci: `${m.from}${m.to}${m.promotion ?? ''}`, mine, fenBefore, fenAfter: chess.fen(), from: m.from, to: m.to })
  })
  return out
}
