import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { ChessBroDB } from '../db'
import { endgameStats, getProgress, markExercise, markLessonDone, resetLesson, saveEndgameResult } from '../lessons'
import { exportBackup, importBackup } from '../backup'

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

describe('backup v3', () => {
  it('conserva lecciones y finales, y acepta backups viejos sin esos campos', async () => {
    await markExercise('mate1', 'm1-pasillo', 5, 1, db)
    await saveEndgameResult({ endgameId: 'krk', ts: 1, date: '2026-11-09', success: true, moves: 20, hints: 0 }, db)
    const backup = JSON.parse(JSON.stringify(await exportBackup(db)))
    expect(backup.version).toBe(3)
    const other = new ChessBroDB(`lessons-${n++}`)
    expect(await importBackup(backup, other)).toMatchObject({ lessons: 1 })
    expect((await endgameStats(other)).get('krk')?.bestClean).toBe(20)

    const old = { app: 'chessbro', version: 2, exportedAt: 'x', profile: null, attempts: [], reviews: [], games: [], settings: [] }
    const third = new ChessBroDB(`lessons-${n++}`)
    expect(await importBackup(old, third)).toMatchObject({ lessons: 0 })
  })
})
