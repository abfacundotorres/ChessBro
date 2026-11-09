import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { ChessBroDB } from '../db'
import { endgameStats, finishLesson, getProgress, markExercise, markLessonDone, resetLesson, saveEndgameResult } from '../lessons'
import { currentStreak } from '../activity'
import { recordAttempt } from '../tactics'
import { exportBackup, importBackup } from '../backup'

const day = (iso: string) => new Date(`${iso}T12:00:00`).getTime()
let n = 0
let db: ChessBroDB
beforeEach(() => {
  db = new ChessBroDB(`lessons-${n++}`)
})

describe('progreso de lecciones', () => {
  it('marca ejercicios sin duplicar y termina la lección al resolver todos', async () => {
    await markExercise('horquilla', 'a', 2, 1, db)
    let p = await markExercise('horquilla', 'a', 2, 2, db)
    expect(p).toEqual({ id: 'horquilla', exercises: ['a'] })
    p = await markExercise('horquilla', 'b', 2, 3, db)
    expect(p).toEqual({ id: 'horquilla', exercises: ['a', 'b'], doneAt: 3 })
    // Resolver otra vez no cambia cuándo se terminó.
    expect((await markExercise('horquilla', 'a', 2, 99, db)).doneAt).toBe(3)
    expect((await getProgress(db)).get('horquilla')?.doneAt).toBe(3)
  })

  it('lecciones sin ejercicios: se marcan a mano, y se pueden reiniciar', async () => {
    await markLessonDone('apertura', 5, db)
    expect((await db.lessons.get('apertura'))?.doneAt).toBe(5)
    await resetLesson('apertura', db)
    expect(await db.lessons.get('apertura')).toBeUndefined()
  })
})

describe('estrellas y racha', () => {
  it('guarda la mejor pasada y no baja las estrellas al repetir peor', async () => {
    expect((await finishLesson('peones', 0, 6, day('2026-11-08'), db)).stars).toBe(3)
    const worse = await finishLesson('peones', 5, 6, day('2026-11-09'), db)
    expect(worse).toEqual({ stars: 1, best: 3 })
    const p = await db.lessons.get('peones')
    expect(p?.stars).toBe(3)
    expect(p?.doneAt).toBe(day('2026-11-08'))
  })

  it('todo lo que se practica suma a la racha: lecciones, puzzles y finales', async () => {
    await markExercise('mate1', 'a', 5, day('2026-11-07'), db)
    await recordAttempt({ puzzle: { id: 'p', fen: '8/8/8/8/8/8/8/8 w - - 0 1', moves: ['a1a2'], rating: 1300, rd: 75, themes: 0 }, solved: true, mode: 'new', today: '2026-11-08' }, db)
    await saveEndgameResult({ endgameId: 'krk', ts: 1, date: '2026-11-09', success: true, moves: 20, hints: 0 }, db)
    expect(await currentStreak('2026-11-09', db)).toEqual({ current: 3, best: 3, activeToday: true })
    expect((await currentStreak('2026-11-12', db)).current).toBe(0)
  })
})

describe('finales', () => {
  it('estadísticas: la mejor marca solo cuenta sin pistas', async () => {
    const base = { endgameId: 'krk', date: '2026-11-09' }
    await saveEndgameResult({ ...base, ts: 1, success: true, moves: 25, hints: 2 }, db)
    await saveEndgameResult({ ...base, ts: 2, success: true, moves: 28, hints: 0 }, db)
    await saveEndgameResult({ ...base, ts: 3, success: false, moves: 29, hints: 0 }, db)
    await saveEndgameResult({ ...base, ts: 4, success: true, moves: 21, hints: 0 }, db)
    expect((await endgameStats(db)).get('krk')).toEqual({ attempts: 4, wins: 3, bestClean: 21 })
  })
})

describe('backup v4', () => {
  it('conserva lecciones, estrellas, finales y racha, y acepta backups viejos', async () => {
    await markExercise('mate1', 'm1-pasillo', 5, 1, db)
    await saveEndgameResult({ endgameId: 'krk', ts: 1, date: '2026-11-09', success: true, moves: 20, hints: 0 }, db)
    const backup = JSON.parse(JSON.stringify(await exportBackup(db)))
    expect(backup.version).toBe(4)
    const other = new ChessBroDB(`lessons-${n++}`)
    expect(await importBackup(backup, other)).toMatchObject({ lessons: 1 })
    expect((await endgameStats(other)).get('krk')?.bestClean).toBe(20)
    expect(await other.activity.count()).toBeGreaterThan(0)

    await finishLesson('peones', 0, 4, day('2026-11-09'), db)
    expect((await importBackup(JSON.parse(JSON.stringify(await exportBackup(db))), new ChessBroDB(`lessons-${n++}`))).lessons).toBe(2)

    const old = { app: 'chessbro', version: 2, exportedAt: 'x', profile: null, attempts: [], reviews: [], games: [], settings: [] }
    const third = new ChessBroDB(`lessons-${n++}`)
    expect(await importBackup(old, third)).toMatchObject({ lessons: 0 })
  })
})
