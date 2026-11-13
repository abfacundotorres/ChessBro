import type { Puzzle } from '../engine/puzzle'
import { pickDailyPuzzle } from '../engine/daily'
import { getSetting, setSetting } from './games'
import { getProfile, seenPuzzleIds } from './tactics'
import { loadPoolFor } from './puzzles'

const KEY = 'dailyPuzzle'

export type DailyOutcome = 'solved' | 'failed' | null

export interface DailyState {
  /** 'YYYY-MM-DD' del día al que pertenece. */
  date: string
  puzzle: Puzzle
  outcome: DailyOutcome
}

function parse(raw: string | null): DailyState | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as Partial<DailyState>
    const p = v.puzzle
    if (typeof v.date !== 'string' || !p || typeof p.id !== 'string' || typeof p.fen !== 'string' || !Array.isArray(p.moves) || typeof p.rating !== 'number' || typeof p.themes !== 'number') return null
    return { date: v.date, puzzle: p, outcome: v.outcome === 'solved' || v.outcome === 'failed' ? v.outcome : null }
  } catch {
    return null
  }
}

/** El puzzle de hoy: el guardado si es del mismo día; si no, elige uno nuevo y lo guarda (así no cambia durante el día). */
export async function getDaily(today: string): Promise<DailyState | null> {
  const saved = parse(await getSetting(KEY))
  if (saved && saved.date === today) return saved
  const profile = await getProfile()
  const [pool, seen] = await Promise.all([loadPoolFor(profile.rating), seenPuzzleIds()])
  const puzzle = pickDailyPuzzle(pool, profile.rating, today, seen)
  if (!puzzle) return null
  const state: DailyState = { date: today, puzzle, outcome: null }
  await setSetting(KEY, JSON.stringify(state))
  return state
}

export async function saveDailyOutcome(today: string, outcome: Exclude<DailyOutcome, null>): Promise<void> {
  const saved = parse(await getSetting(KEY))
  if (!saved || saved.date !== today) return
  await setSetting(KEY, JSON.stringify({ ...saved, outcome }))
}
