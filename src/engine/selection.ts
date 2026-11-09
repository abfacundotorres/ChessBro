import type { Puzzle } from './puzzle'

export interface SelectionInput {
  pool: readonly Puzzle[]
  rating: number
  /** Bit del tema elegido; null = mezcla. */
  themeBit: number | null
  seen: ReadonlySet<string>
  /** Número en [0, 1). Inyectado para que sea determinístico en tests. */
  random: () => number
}

/**
 * Ventana objetivo: un poco por encima del rating actual (aprendizaje con desafío), y se
 * agranda si no hay candidatos. Devuelve null si no queda ningún puzzle sin ver.
 */
export const WINDOWS: ReadonlyArray<readonly [number, number]> = [
  [-75, 150],
  [-150, 250],
  [-300, 400],
  [-600, 700],
  [-Infinity, Infinity],
]

export function pickPuzzle({ pool, rating, themeBit, seen, random }: SelectionInput): Puzzle | null {
  const eligible = pool.filter((p) => !seen.has(p.id) && (themeBit === null || (p.themes & themeBit) !== 0))
  for (const [lo, hi] of WINDOWS) {
    const cands = eligible.filter((p) => p.rating >= rating + lo && p.rating <= rating + hi)
    if (cands.length > 0) return cands[Math.floor(random() * cands.length)] ?? null
  }
  return null
}

/** Rangos de rating (de los archivos) que conviene tener cargados para un rating dado. */
export function chunksFor<T extends { min: number; max: number }>(chunks: readonly T[], rating: number): T[] {
  const lo = rating - 300
  const hi = rating + 400
  const near = chunks.filter((c) => c.max > lo && c.min <= hi)
  if (near.length > 0) return near
  // Rating fuera de la base: el chunk más cercano.
  const sorted = [...chunks].sort(
    (a, b) => Math.abs((a.min + a.max) / 2 - rating) - Math.abs((b.min + b.max) / 2 - rating),
  )
  return sorted.slice(0, 1)
}
