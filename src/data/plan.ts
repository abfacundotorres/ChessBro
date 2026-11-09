import { LESSONS } from '../content/lessons'
import { REPERTOIRE } from '../content/repertoire'
import { goalsFor, weekStart, type Goals, type TaskInput, DEFAULT_HOURS, clampHours } from '../engine/plan'
import { db as defaultDb, type ChessBroDB } from './db'
import { getSetting } from './games'

export const WEEKLY_HOURS = 'weeklyHours'

export async function getWeeklyHours(db: ChessBroDB = defaultDb): Promise<number> {
  const v = Number(await getSetting(WEEKLY_HOURS, db))
  return Number.isFinite(v) && v > 0 ? clampHours(v) : DEFAULT_HOURS
}

export interface PlanSnapshot {
  goals: Goals
  weekStart: string
  input: TaskInput
}

/** Todo lo que el plan necesita saber del estado actual, en una sola lectura. */
export async function planSnapshot(today: string, db: ChessBroDB = defaultDb): Promise<PlanSnapshot> {
  const ws = weekStart(today)
  const wsTs = new Date(`${ws}T00:00:00`).getTime()
  const goals = goalsFor(await getWeeklyHours(db))
  const [attempts, lessons, replines, repcards, games, reviews] = await Promise.all([
    db.attempts.where('date').aboveOrEqual(ws).toArray(),
    db.lessons.toArray(),
    db.replines.toArray(),
    db.repcards.toArray(),
    db.games.toArray(),
    db.reviews.where('due').belowOrEqual(today).count(),
  ])
  const doneLessons = new Set(lessons.filter((l) => l.doneAt !== undefined).map((l) => l.id))
  const practiced = new Set(replines.map((p) => p.id))
  // La próxima línea es del color del que menos tenga practicado (para avanzar parejo).
  const count = (c: 'w' | 'b') => REPERTOIRE.filter((l) => l.color === c && practiced.has(l.id)).length
  const color: 'w' | 'b' = count('b') < count('w') ? 'b' : 'w'
  const nextLine = REPERTOIRE.find((l) => l.color === color && !practiced.has(l.id)) ?? REPERTOIRE.find((l) => !practiced.has(l.id)) ?? null
  const nextLesson = LESSONS.find((l) => !doneLessons.has(l.id)) ?? null

  const input: TaskInput = {
    goals,
    counts: {
      puzzles: attempts.length,
      lessons: lessons.filter((l) => l.doneAt !== undefined && l.doneAt >= wsTs).length,
      newLines: replines.filter((p) => p.firstDate >= ws).length,
      games: games.filter((g) => g.analysis !== undefined && g.analysis.analyzedAt >= wsTs).length,
      repReviews: repcards.filter((c) => c.last !== undefined && c.last >= ws).length,
    },
    dueRep: repcards.filter((c) => c.due <= today).length,
    duePuzzles: reviews,
    puzzlesToday: attempts.filter((a) => a.date === today).length,
    gamesPending: games.filter((g) => g.analysis === undefined).length,
    nextLesson: nextLesson ? { id: nextLesson.id, title: nextLesson.title } : null,
    nextLine: nextLine ? { id: nextLine.id, name: nextLine.name } : null,
  }
  return { goals, weekStart: ws, input }
}
