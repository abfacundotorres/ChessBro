import { stars as starsFor, bestStars } from '../engine/score'
import { toDateStr } from '../engine/dates'
import { db as defaultDb, type ChessBroDB, type EndgameResult, type LessonProgress } from './db'
import { touchActivity } from './activity'

export async function getProgress(db: ChessBroDB = defaultDb): Promise<Map<string, LessonProgress>> {
  const all = await db.lessons.toArray()
  return new Map(all.map((p) => [p.id, p]))
}

/** Marca un ejercicio como resuelto. Si ya estaban todos, marca la lección como terminada. */
export async function markExercise(
  lessonId: string,
  exerciseId: string,
  totalExercises: number,
  now = Date.now(),
  db: ChessBroDB = defaultDb,
): Promise<LessonProgress> {
  return db.transaction('rw', db.lessons, db.activity, async () => {
    await touchActivity(toDateStr(new Date(now)), db)
    const cur = (await db.lessons.get(lessonId)) ?? { id: lessonId, exercises: [] }
    const exercises = cur.exercises.includes(exerciseId) ? cur.exercises : [...cur.exercises, exerciseId]
    const doneAt = cur.doneAt ?? (totalExercises > 0 && exercises.length >= totalExercises ? now : undefined)
    const next: LessonProgress = { ...cur, id: lessonId, exercises, ...(doneAt !== undefined ? { doneAt } : {}) }
    await db.lessons.put(next)
    return next
  })
}

/** Marca una lección como terminada (las que no tienen ejercicios, o al terminar de leer). */
export async function markLessonDone(lessonId: string, now = Date.now(), db: ChessBroDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.lessons, async () => {
    const cur = (await db.lessons.get(lessonId)) ?? { id: lessonId, exercises: [] }
    if (cur.doneAt === undefined) await db.lessons.put({ ...cur, doneAt: now })
  })
}

/**
 * Cierra una pasada completa de la lección: marca como terminada y guarda las estrellas
 * (la mejor de todas las pasadas). `items` = desafíos + ejercicios de la lección.
 */
export async function finishLesson(
  lessonId: string,
  mistakes: number,
  items: number,
  now = Date.now(),
  db: ChessBroDB = defaultDb,
): Promise<{ stars: 1 | 2 | 3; best: number }> {
  return db.transaction('rw', db.lessons, db.activity, async () => {
    await touchActivity(toDateStr(new Date(now)), db)
    const cur = (await db.lessons.get(lessonId)) ?? { id: lessonId, exercises: [] }
    const got = starsFor(mistakes, items)
    const best = bestStars(cur.stars, got)
    await db.lessons.put({ ...cur, doneAt: cur.doneAt ?? now, stars: best })
    return { stars: got, best }
  })
}

/** Cuenta una respuesta correcta de un desafío como práctica del día (para la racha). */
export async function touchPractice(now = Date.now(), db: ChessBroDB = defaultDb): Promise<void> {
  await touchActivity(toDateStr(new Date(now)), db)
}

export async function resetLesson(lessonId: string, db: ChessBroDB = defaultDb): Promise<void> {
  await db.lessons.delete(lessonId)
}

export async function saveEndgameResult(r: Omit<EndgameResult, 'id'>, db: ChessBroDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.endgames, db.activity, async () => {
    await touchActivity(r.date, db)
    await db.endgames.add(r)
  })
}

export interface EndgameStats {
  attempts: number
  wins: number
  /** Menor cantidad de jugadas en una victoria sin pistas; null si no hay. */
  bestClean: number | null
}

export async function endgameStats(db: ChessBroDB = defaultDb): Promise<Map<string, EndgameStats>> {
  const out = new Map<string, EndgameStats>()
  for (const r of await db.endgames.toArray()) {
    const s = out.get(r.endgameId) ?? { attempts: 0, wins: 0, bestClean: null }
    s.attempts++
    if (r.success) {
      s.wins++
      if (r.hints === 0 && (s.bestClean === null || r.moves < s.bestClean)) s.bestClean = r.moves
    }
    out.set(r.endgameId, s)
  }
  return out
}
