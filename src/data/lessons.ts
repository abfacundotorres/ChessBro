import { db as defaultDb, type ChessBroDB, type EndgameResult, type LessonProgress } from './db'

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
  return db.transaction('rw', db.lessons, async () => {
    const cur = (await db.lessons.get(lessonId)) ?? { id: lessonId, exercises: [] }
    const exercises = cur.exercises.includes(exerciseId) ? cur.exercises : [...cur.exercises, exerciseId]
    const doneAt = cur.doneAt ?? (totalExercises > 0 && exercises.length >= totalExercises ? now : undefined)
    const next: LessonProgress = { id: lessonId, exercises, ...(doneAt !== undefined ? { doneAt } : {}) }
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

export async function resetLesson(lessonId: string, db: ChessBroDB = defaultDb): Promise<void> {
  await db.lessons.delete(lessonId)
}

export async function saveEndgameResult(r: Omit<EndgameResult, 'id'>, db: ChessBroDB = defaultDb): Promise<void> {
  await db.endgames.add(r)
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
