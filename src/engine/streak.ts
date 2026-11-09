import { addDays } from './dates'

export interface Streak {
  /** Días seguidos con práctica, contando hasta hoy (o hasta ayer si hoy todavía no practicaste). */
  current: number
  best: number
  activeToday: boolean
}

/** Calcula la racha a partir de las fechas ('YYYY-MM-DD') con actividad. */
export function computeStreak(dates: Iterable<string>, today: string): Streak {
  const days = new Set(dates)
  const activeToday = days.has(today)
  // La racha sigue viva si practicaste hoy o ayer.
  let cursor = activeToday ? today : addDays(today, -1)
  let current = 0
  while (days.has(cursor)) {
    current++
    cursor = addDays(cursor, -1)
  }
  // Mejor racha histórica.
  const sorted = [...days].sort()
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const d of sorted) {
    run = prev !== null && addDays(prev, 1) === d ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return { current, best: Math.max(best, current), activeToday }
}
