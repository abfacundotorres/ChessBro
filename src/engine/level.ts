/**
 * Punto de partida del usuario. Lo elige al empezar y define el rating inicial de puzzles y desde qué banda del
 * currículo se evalúa. Los números de Elo son orientativos (cada sitio mide distinto).
 */
export type Level = 'cero' | 'bajo' | 'medio' | 'alto'

export interface LevelInfo {
  id: Level
  label: string
  detail: string
  /** Rating inicial de puzzles (provisional: se ajusta solo con los primeros puzzles). */
  rating: number
  /** Índice de la banda del currículo desde la que se evalúa (0 = la primera). */
  startBand: number
  /** Primera lección que sugiere el plan (las anteriores siguen disponibles en Lecciones). */
  startLesson: string
}

export const LEVELS: readonly LevelInfo[] = [
  { id: 'cero', label: 'Recién empiezo', detail: 'Todavía no me siento seguro con las reglas y cómo se mueven las piezas.', rating: 600, startBand: 0, startLesson: 'piezas-mov' },
  { id: 'bajo', label: 'Hasta 800 de Elo', detail: 'Conozco las reglas y juego online, pero regalo piezas seguido (por ejemplo, 500–600 en Chess.com).', rating: 800, startBand: 0, startLesson: 'seguridad' },
  { id: 'medio', label: 'Entre 800 y 1200', detail: 'Ya cuido mis piezas y veo tácticas simples.', rating: 1100, startBand: 1, startLesson: 'mate2' },
  { id: 'alto', label: 'Más de 1200', detail: 'Juego con cierta solidez y quiero llegar a 1800.', rating: 1400, startBand: 2, startLesson: 'peones' },
]

export const DEFAULT_LEVEL: Level = 'bajo'

export function parseLevel(v: string | null | undefined): Level | null {
  return LEVELS.some((l) => l.id === v) ? (v as Level) : null
}

export function levelInfo(level: Level | null | undefined): LevelInfo {
  return LEVELS.find((l) => l.id === level) ?? LEVELS.find((l) => l.id === DEFAULT_LEVEL)!
}
