import { KIND_LABELS, type ErrorKind, type GameAnalysis } from './analysis'

/** Patrones de error en tus últimas partidas analizadas, y qué entrenar para corregirlos. */

export const MIN_GAMES = 3
export const RECENT_GAMES = 10

export interface Focus {
  /** Tema de táctica (claves de content/themes.json) o null si no hay un tema que lo entrene. */
  theme: string | null
  /** Lección que lo trabaja (id de content/lessons.ts) o null. */
  lessonId: string | null
  /** Ruta alternativa cuando el entrenamiento no es táctica ni lección (por ejemplo, las aperturas). */
  to: string | null
  /** Consejo corto, en español. */
  advice: string
}

export const FOCUS: Record<ErrorKind, Focus> = {
  hanging: { theme: 'hangingPiece', lessonId: 'seguridad', to: null, advice: 'Antes de cada jugada, mirá qué ataca el rival y si tus piezas están defendidas.' },
  allowedMate: { theme: 'mateIn2', lessonId: 'refugio', to: null, advice: 'Antes de mover, repasá los jaques del rival y las casillas libres de tu rey.' },
  missedMate: { theme: 'mateIn2', lessonId: 'mate2', to: null, advice: 'Buscá primero todos los jaques propios: a veces el mate está en el menos obvio.' },
  missedTactic: { theme: 'fork', lessonId: 'horquilla', to: null, advice: 'En cada jugada buscá jaques, capturas y amenazas, en ese orden.' },
  opening: { theme: null, lessonId: 'apertura', to: '/aperturas', advice: 'Seguí los principios: centro, desarrollo y enroque, y repasá tus aperturas.' },
  endgame: { theme: 'endgame', lessonId: 'oposicion', to: null, advice: 'En el final activá el rey y contá los tiempos de los peones.' },
  positional: { theme: null, lessonId: 'profilaxis', to: null, advice: 'Comparé dos o tres jugadas candidatas antes de elegir; mejorá tu pieza peor ubicada.' },
}

export interface KindStat {
  kind: ErrorKind
  label: string
  count: number
  perGame: number
}

export interface Patterns {
  games: number
  blundersPerGame: number
  /** Errores y errores graves por tipo, de mayor a menor. */
  kinds: KindStat[]
  /** Lo que más conviene entrenar (null si hay pocas partidas o no hay nada claro). */
  weakness: KindStat | null
}

/** Errores graves y errores (no imprecisiones) de las últimas partidas, agrupados por tipo. */
export function patterns(analyses: readonly GameAnalysis[]): Patterns {
  const games = analyses.length
  const counts = new Map<ErrorKind, number>()
  let blunders = 0
  for (const a of analyses) {
    blunders += a.counts.blunder
    for (const e of a.errors) if (e.severity !== 'inaccuracy') counts.set(e.kind, (counts.get(e.kind) ?? 0) + 1)
  }
  const kinds: KindStat[] = [...counts.entries()]
    .map(([kind, count]) => ({ kind, label: KIND_LABELS[kind], count, perGame: games ? count / games : 0 }))
    .sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind))
  // Lo posicional no tiene un ejercicio claro: solo se elige como punto débil si no hay otra cosa.
  const candidates = kinds.filter((k) => k.kind !== 'positional' && k.perGame >= 0.3)
  const weakness = games >= MIN_GAMES ? (candidates[0] ?? null) : null
  return { games, blundersPerGame: games ? blunders / games : 0, kinds, weakness }
}
