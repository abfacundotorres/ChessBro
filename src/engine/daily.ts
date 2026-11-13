import type { Puzzle } from './puzzle'
import { daysBetween } from './dates'

/** Hash FNV-1a de 32 bits: estable entre dispositivos (no depende de Math.random ni del navegador). */
export function hashString(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Ventanas de rating (relativas al rating redondeado) para el puzzle del día: de a poco más anchas. */
const DAILY_WINDOWS: ReadonlyArray<readonly [number, number]> = [
  [-100, 200],
  [-250, 350],
  [-600, 700],
  [-Infinity, Infinity],
]

/**
 * Puzzle del día: depende solo de la fecha, del rating (redondeado a 100, así no se mueve por resolver uno)
 * y de la base de puzzles. Prefiere los que todavía no hiciste; si no queda ninguno, elige entre todos.
 */
export function pickDailyPuzzle(pool: readonly Puzzle[], rating: number, date: string, seen: ReadonlySet<string>): Puzzle | null {
  const base = Math.round(rating / 100) * 100
  for (const [lo, hi] of DAILY_WINDOWS) {
    const all = pool.filter((p) => p.rating >= base + lo && p.rating <= base + hi)
    const fresh = all.filter((p) => !seen.has(p.id))
    const cands = [...(fresh.length > 0 ? fresh : all)].sort((a, b) => (a.id < b.id ? -1 : 1))
    if (cands.length > 0) return cands[hashString(date) % cands.length] ?? null
  }
  return null
}

/**
 * Apertura del día: las aperturas se ordenan con un hash fijo (para que no salgan en orden alfabético) y se recorren
 * de a una por día, así en `ids.length` días aparecen todas exactamente una vez.
 */
export function dailyOpeningId(ids: readonly string[], date: string): string | null {
  if (ids.length === 0) return null
  const order = [...ids].sort((a, b) => hashString(`apertura:${a}`) - hashString(`apertura:${b}`) || (a < b ? -1 : 1))
  const day = daysBetween('2026-01-01', date)
  return order[((day % order.length) + order.length) % order.length] ?? null
}

/** Saludo según la hora (0–23). */
export function greetingFor(hour: number): string {
  if (hour < 6) return '¡Qué madrugador!'
  if (hour < 12) return '¡Buen día!'
  if (hour < 20) return '¡Buenas tardes!'
  return '¡Buenas noches!'
}
