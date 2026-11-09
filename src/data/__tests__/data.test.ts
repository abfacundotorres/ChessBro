import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { ChessBroDB } from '../db'
import { dueReviews, getProfile, recordAttempt, seenPuzzleIds, tacticsStats } from '../tactics'
import { exportBackup, importBackup } from '../backup'
import type { Puzzle } from '../../engine/puzzle'

const P: Puzzle = { id: 'p1', fen: '8/8/8/8/8/8/8/8 w - - 0 1', moves: ['a1a2'], rating: 1300, rd: 75, themes: 3 }
let n = 0
let db: ChessBroDB
beforeEach(() => {
  db = new ChessBroDB(`test-${n++}`)
})

describe('táctica: datos', () => {
  it('perfil inicial por defecto', async () => {
    // Sin elegir nivel se usa el de "hasta 800" (ver engine/level.ts).
    expect((await getProfile(db)).rating).toBe(800)
  })

  it('acertar un puzzle nuevo sube el rating y no crea repaso', async () => {
    const r = await recordAttempt({ puzzle: P, solved: true, mode: 'new', today: '2026-11-08' }, db)
    expect(r.ratingAfter).toBeGreaterThan(r.ratingBefore)
    expect((await getProfile(db)).ratedCount).toBe(1)
    expect(await db.reviews.count()).toBe(0)
    expect(await seenPuzzleIds(db)).toEqual(new Set(['p1']))
  })

  it('fallar crea repaso para mañana; el repaso no toca el rating', async () => {
    await recordAttempt({ puzzle: P, solved: false, mode: 'new', today: '2026-11-08' }, db)
    expect(await dueReviews('2026-11-08', db)).toHaveLength(0)
    const due = await dueReviews('2026-11-09', db)
    expect(due.map((c) => c.puzzleId)).toEqual(['p1'])
    expect(due[0]?.puzzle.fen).toBe(P.fen)

    const before = (await getProfile(db)).rating
    await recordAttempt({ puzzle: P, solved: true, mode: 'review', today: '2026-11-09' }, db)
    expect((await getProfile(db)).rating).toBe(before)
    expect((await db.reviews.get('p1'))?.box).toBe(1)
  })

  it('estadísticas de hoy y de la semana', async () => {
    await recordAttempt({ puzzle: P, solved: true, mode: 'new', today: '2026-11-02' }, db)
    await recordAttempt({ puzzle: { ...P, id: 'p2' }, solved: false, mode: 'new', today: '2026-11-08' }, db)
    expect(await tacticsStats('2026-11-08', '2026-11-02', db)).toEqual({
      today: { solved: 0, total: 1 },
      last7: { solved: 1, total: 2 },
    })
  })
})

describe('backup', () => {
  it('ida y vuelta conserva todo', async () => {
    await recordAttempt({ puzzle: P, solved: false, mode: 'new', today: '2026-11-08' }, db)
    const backup = JSON.parse(JSON.stringify(await exportBackup(db)))
    const other = new ChessBroDB(`test-${n++}`)
    expect(await importBackup(backup, other)).toEqual({ attempts: 1, reviews: 1, games: 0, lessons: 0 })
    expect(await getProfile(other)).toEqual(await getProfile(db))
    expect(await other.reviews.toArray()).toEqual(await db.reviews.toArray())
  })

  it('rechaza archivos inválidos sin borrar datos', async () => {
    await recordAttempt({ puzzle: P, solved: true, mode: 'new', today: '2026-11-08' }, db)
    await expect(importBackup({ app: 'otra' }, db)).rejects.toThrow(/no es un backup/)
    expect(await db.attempts.count()).toBe(1)
  })
})
