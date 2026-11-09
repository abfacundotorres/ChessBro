/** Estadísticas de tus partidas por apertura (puro: no sabe de la base de datos). */

export interface StatGame {
  opening: string | null
  me: 'w' | 'b'
  winner: 'white' | 'black' | null
  /** Errores de las primeras jugadas, si la partida está analizada; null si no. */
  openingErrors: number | null
}

export interface OpeningStat {
  key: string
  me: 'w' | 'b'
  games: number
  wins: number
  draws: number
  losses: number
  analyzed: number
  /** Errores y errores graves cometidos en las primeras jugadas, sobre las partidas analizadas. */
  errors: number
}

/** Cantidad de jugadas propias que se consideran "la apertura" para contar errores. */
export const OPENING_PLIES = 20

/**
 * Agrupa por apertura (según `keyOf`) y bando. Orden: las más jugadas primero.
 */
export function openingStats(games: readonly StatGame[], keyOf: (name: string | null) => string): OpeningStat[] {
  const map = new Map<string, OpeningStat>()
  for (const g of games) {
    const key = keyOf(g.opening)
    const id = `${key}|${g.me}`
    const s = map.get(id) ?? { key, me: g.me, games: 0, wins: 0, draws: 0, losses: 0, analyzed: 0, errors: 0 }
    s.games++
    if (!g.winner) s.draws++
    else if ((g.winner === 'white') === (g.me === 'w')) s.wins++
    else s.losses++
    if (g.openingErrors !== null) {
      s.analyzed++
      s.errors += g.openingErrors
    }
    map.set(id, s)
  }
  return [...map.values()].sort((a, b) => b.games - a.games || a.key.localeCompare(b.key))
}
