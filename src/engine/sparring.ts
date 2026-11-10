import { Chess } from 'chess.js'
import type { RepLine } from './repertoire'
import type { Color } from './game'

/**
 * Práctica contra el rival: las líneas de una apertura forman un árbol (comparten el comienzo y se separan en jugadas
 * del rival). En cada turno del rival se sortea entre las ramas conocidas; en tu turno solo hay una jugada del libro.
 */

export interface Choice {
  san: string
  uci: string
  /** Líneas que siguen por esta jugada. */
  lineIds: string[]
}

function startsWith(moves: readonly string[], prefix: readonly string[]): boolean {
  return prefix.every((m, i) => moves[i] === m)
}

/** Jugadas posibles después de `played`, entre las líneas que coinciden con lo jugado hasta ahora. */
export function choices(lines: readonly RepLine[], played: readonly string[]): Choice[] {
  const out = new Map<string, Choice>()
  const chess = new Chess()
  for (const m of played) chess.move(m)
  for (const l of lines) {
    if (!startsWith(l.moves, played)) continue
    const san = l.moves[played.length]
    if (!san) continue
    const found = out.get(san)
    if (found) found.lineIds.push(l.id)
    else {
      const c = new Chess(chess.fen())
      const mv = c.move(san)
      out.set(san, { san, uci: `${mv.from}${mv.to}${mv.promotion ?? ''}`, lineIds: [l.id] })
    }
  }
  return [...out.values()]
}

/** ¿Le toca mover al usuario después de `played`? */
export function isMyTurn(color: Color, played: readonly string[]): boolean {
  return (played.length % 2 === 0) === (color === 'w')
}

/** Línea que describe lo jugado hasta ahora (la primera que coincide; sirve para elegir qué nota mostrar). */
export function lineFor(lines: readonly RepLine[], played: readonly string[]): RepLine | undefined {
  return lines.find((l) => startsWith(l.moves, played))
}

/** Nota de la última jugada de `played`. */
export function noteOf(lines: readonly RepLine[], played: readonly string[]): string | undefined {
  if (played.length === 0) return undefined
  return lineFor(lines, played)?.notes?.[played.length - 1]
}

/** Elige una rama del rival. `rng` devuelve un número en [0, 1): en los tests se fija para que sea repetible. */
export function pickRival(options: readonly Choice[], rng: () => number = Math.random, avoid?: string): Choice | null {
  if (options.length === 0) return null
  // Si se puede, evita repetir la misma rama que la vez anterior: la gracia es que cambie.
  const pool = options.length > 1 && avoid ? options.filter((o) => o.san !== avoid) : options
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))]!
}

/** Cantidad de ramas distintas del rival en toda la apertura (cuántas desviaciones puede encontrarse). */
export function rivalBranches(lines: readonly RepLine[], color: Color): number {
  const seen = new Set<string>()
  for (const l of lines) {
    for (let i = 0; i < l.moves.length; i++) {
      if (isMyTurn(color, l.moves.slice(0, i))) continue
      seen.add(l.moves.slice(0, i + 1).join(' '))
    }
  }
  return seen.size
}
