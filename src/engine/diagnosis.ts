/**
 * Diagnóstico: en qué banda del currículo está el usuario y qué le falta para avanzar.
 * Es la banda más baja cuyos criterios medibles no se cumplen todavía.
 */

export type Criterion =
  | { kind: 'puzzle'; min: number }
  | { kind: 'blunders'; max: number }
  | { kind: 'endgame'; id: string; max: number; label: string; /** Basta con haberlo logrado una vez, sin pistas. */ binary?: boolean }
  | { kind: 'pending'; label: string; milestone: string }

export interface DiagnosisInput {
  puzzleRating: number
  puzzleProvisional: boolean
  /** Errores graves por partida en las últimas analizadas; null sin datos. */
  blundersPerGame: number | null
  analyzedGames: number
  /** Menor cantidad de jugadas en un final ganado sin pistas, por id de final. */
  endgameBest: Readonly<Record<string, number | null>>
}

export type CheckState = 'ok' | 'todo' | 'nodata' | 'pending'

export interface Check {
  label: string
  state: CheckState
  detail: string
}

/** Mínimo de partidas analizadas para confiar en el promedio de errores graves. */
export const MIN_GAMES = 5

export function checkCriterion(c: Criterion, x: DiagnosisInput): Check {
  switch (c.kind) {
    case 'puzzle': {
      const label = `Puzzles ≥ ${c.min}`
      if (x.puzzleProvisional) return { label, state: 'nodata', detail: 'rating provisional: seguí resolviendo' }
      const r = Math.round(x.puzzleRating)
      return { label, state: r >= c.min ? 'ok' : 'todo', detail: `hoy ${r}` }
    }
    case 'blunders': {
      const label = `Errores graves por partida < ${String(c.max).replace('.', ',')}`
      if (x.blundersPerGame === null || x.analyzedGames < MIN_GAMES)
        return { label, state: 'nodata', detail: `analizá al menos ${MIN_GAMES} partidas; van ${x.analyzedGames}` }
      return {
        label,
        state: x.blundersPerGame < c.max ? 'ok' : 'todo',
        detail: `hoy ${x.blundersPerGame.toFixed(1).replace('.', ',')}`,
      }
    }
    case 'endgame': {
      const best = x.endgameBest[c.id] ?? null
      if (best === null) return { label: c.label, state: 'todo', detail: 'jugalo en Lecciones, sin pistas' }
      return { label: c.label, state: best <= c.max ? 'ok' : 'todo', detail: c.binary ? 'logrado sin pistas' : `tu mejor: ${best} jugadas` }
    }
    case 'pending':
      return { label: c.label, state: 'pending', detail: `se mide desde ${c.milestone}` }
  }
}

/** Índice de la banda actual y el estado de sus criterios. */
export function currentBand(bands: readonly { criteria: readonly Criterion[] }[], x: DiagnosisInput): { index: number; checks: Check[] } {
  for (let i = 0; i < bands.length; i++) {
    const checks = bands[i]!.criteria.map((c) => checkCriterion(c, x))
    // Un criterio todavía no medible por la app (pendiente) no bloquea; la falta de datos sí.
    const passed = checks.every((ch) => ch.state === 'ok' || ch.state === 'pending')
    if (!passed) return { index: i, checks }
  }
  const last = bands.length - 1
  return { index: last, checks: bands[last]!.criteria.map((c) => checkCriterion(c, x)) }
}
