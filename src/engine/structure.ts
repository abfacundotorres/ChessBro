import { Chess, type Square } from 'chess.js'
import type { Color } from './game'

/**
 * Conceptos de estructura y actividad, calculados por código a partir de un FEN.
 * Los usan los mini-juegos de "tocá en el tablero" de las lecciones: así la respuesta correcta
 * no depende de lo que yo escriba, y un test la contrasta con la que declara cada lección.
 */

export type TapRule = 'isolated' | 'doubled' | 'passed' | 'hanging' | 'outpost' | 'openFile' | 'badBishop' | 'undeveloped'

const FILES = 'abcdefgh'
const VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 }

interface Piece {
  square: string
  type: string
  color: Color
  file: number
  rank: number
}

function pieces(fen: string): Piece[] {
  const out: Piece[] = []
  for (const row of new Chess(fen).board())
    for (const c of row)
      if (c) out.push({ square: c.square, type: c.type, color: c.color, file: FILES.indexOf(c.square[0]!), rank: Number(c.square[1]) })
  return out
}

const sq = (file: number, rank: number) => `${FILES[file]}${rank}`
const sides = (side: Color | 'both'): Color[] => (side === 'both' ? ['w', 'b'] : [side])

/** Peones sin peones propios en las columnas vecinas. */
export function isolatedPawns(fen: string, side: Color | 'both'): string[] {
  const ps = pieces(fen).filter((p) => p.type === 'p')
  return ps
    .filter((p) => sides(side).includes(p.color) && !ps.some((q) => q.color === p.color && Math.abs(q.file - p.file) === 1))
    .map((p) => p.square)
}

/** Peones que comparten columna con otro peón propio. */
export function doubledPawns(fen: string, side: Color | 'both'): string[] {
  const ps = pieces(fen).filter((p) => p.type === 'p')
  return ps
    .filter((p) => sides(side).includes(p.color) && ps.some((q) => q !== p && q.color === p.color && q.file === p.file))
    .map((p) => p.square)
}

/** Peones sin peones rivales delante, ni en su columna ni en las vecinas. */
export function passedPawns(fen: string, side: Color | 'both'): string[] {
  const ps = pieces(fen).filter((p) => p.type === 'p')
  return ps
    .filter((p) => {
      if (!sides(side).includes(p.color)) return false
      const dir = p.color === 'w' ? 1 : -1
      return !ps.some((q) => q.color !== p.color && Math.abs(q.file - p.file) <= 1 && (q.rank - p.rank) * dir > 0)
    })
    .map((p) => p.square)
}

/**
 * Piezas (no reyes) en peligro inmediato: atacadas y sin defensa, o atacadas por una pieza de
 * menor valor. Simplificación pensada para posiciones de lección (sin clavadas ni rayos X).
 */
export function hangingPieces(fen: string, side: Color | 'both'): string[] {
  const chess = new Chess(fen)
  const out: string[] = []
  for (const p of pieces(fen)) {
    if (!sides(side).includes(p.color) || p.type === 'k') continue
    const enemy: Color = p.color === 'w' ? 'b' : 'w'
    const attackers = chess.attackers(p.square as Square, enemy)
    if (attackers.length === 0) continue
    const defenders = chess.attackers(p.square as Square, p.color)
    const cheapest = Math.min(...attackers.map((a) => VALUE[chess.get(a)!.type] ?? 99))
    if (defenders.length === 0 || cheapest < (VALUE[p.type] ?? 0)) out.push(p.square)
  }
  return out
}

/**
 * Avanzadas (outposts): casillas vacías en el campo rival (4ª a 6ª fila desde cada bando),
 * defendidas por un peón propio y que ningún peón rival puede atacar jamás.
 */
export function outposts(fen: string, side: Color | 'both'): string[] {
  const ps = pieces(fen).filter((p) => p.type === 'p')
  const occupied = new Set(pieces(fen).map((p) => p.square))
  const out: string[] = []
  for (const color of sides(side)) {
    const dir = color === 'w' ? 1 : -1
    const ranks = color === 'w' ? [4, 5, 6] : [5, 4, 3]
    for (let file = 0; file < 8; file++)
      for (const rank of ranks) {
        if (occupied.has(sq(file, rank))) continue
        const supported = ps.some((p) => p.color === color && Math.abs(p.file - file) === 1 && p.rank === rank - dir)
        const attackable = ps.some((p) => p.color !== color && Math.abs(p.file - file) === 1 && (p.rank - rank) * dir > 0)
        if (supported && !attackable) out.push(sq(file, rank))
      }
  }
  return out
}

/** Columnas (a–h) sin ningún peón. */
export function openFiles(fen: string): string[] {
  const ps = pieces(fen).filter((p) => p.type === 'p')
  return [...FILES].filter((_, f) => !ps.some((p) => p.file === f))
}

/** Casillas de las columnas abiertas que están vacías. */
export function openFileSquares(fen: string): string[] {
  const open = new Set(openFiles(fen))
  const occ = new Set(pieces(fen).map((p) => p.square))
  const out: string[] = []
  for (const f of open) for (let r = 1; r <= 8; r++) if (!occ.has(`${f}${r}`)) out.push(`${f}${r}`)
  return out
}

/** Cantidad de peones propios en casillas del color del alfil. */
export function pawnsOnBishopColor(fen: string, bishopSquare: string): number {
  const color = (s: string) => (FILES.indexOf(s[0]!) + Number(s[1])) % 2
  const b = pieces(fen).find((p) => p.square === bishopSquare && p.type === 'b')
  if (!b) return 0
  return pieces(fen).filter((p) => p.type === 'p' && p.color === b.color && color(p.square) === color(b.square)).length
}

/** Jugadas posibles del alfil, ignorando jaques (movilidad). */
export function bishopMobility(fen: string, bishopSquare: string): number {
  const b = pieces(fen).find((p) => p.square === bishopSquare && p.type === 'b')
  if (!b) return 0
  const parts = fen.split(' ')
  parts[1] = b.color
  parts[3] = '-'
  try {
    return new Chess(parts.join(' ')).moves({ square: bishopSquare as Square }).length
  } catch {
    return 0
  }
}

/** Regla práctica de la lección: 4+ peones propios en el color del alfil y pocas jugadas (≤ 5). */
export function badBishops(fen: string, side: Color | 'both'): string[] {
  return pieces(fen)
    .filter((p) => p.type === 'b' && sides(side).includes(p.color))
    .filter((p) => pawnsOnBishopColor(fen, p.square) >= 4 && bishopMobility(fen, p.square) <= 5)
    .map((p) => p.square)
}

const HOME: Record<Color, string[]> = { w: ['b1', 'g1', 'c1', 'f1'], b: ['b8', 'g8', 'c8', 'f8'] }

/** Caballos y alfiles que todavía están en su casilla inicial. */
export function undevelopedPieces(fen: string, side: Color | 'both'): string[] {
  return pieces(fen)
    .filter((p) => (p.type === 'n' || p.type === 'b') && sides(side).includes(p.color) && HOME[p.color].includes(p.square))
    .map((p) => p.square)
}

/** Respuesta correcta de un mini-juego de tocar el tablero, según la regla. */
export function tapAnswer(rule: TapRule, fen: string, side: Color | 'both'): string[] {
  switch (rule) {
    case 'isolated':
      return isolatedPawns(fen, side)
    case 'doubled':
      return doubledPawns(fen, side)
    case 'passed':
      return passedPawns(fen, side)
    case 'hanging':
      return hangingPieces(fen, side)
    case 'outpost':
      return outposts(fen, side)
    case 'openFile':
      return openFileSquares(fen)
    case 'badBishop':
      return badBishops(fen, side)
    case 'undeveloped':
      return undevelopedPieces(fen, side)
  }
}
