import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { ChessBroDB } from '../db'
import { dueRepCards, markLinePracticed, repStats, resetRepertoire, reviewRepCard } from '../repertoire'
import { exportBackup, importBackup } from '../backup'
import { currentStreak } from '../activity'
import { buildCards, type RepLine } from '../../engine/repertoire'

const A: RepLine = { id: 'a', color: 'w', group: 'g', name: 'A', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'], idea: '', plan: [] }
const B: RepLine = { id: 'b', color: 'w', group: 'g', name: 'B', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6'], idea: '', plan: [] }
const { cards } = buildCards([A, B])

let n = 0
let db: ChessBroDB
beforeEach(() => {
  db = new ChessBroDB(`rep-${n++}`)
})

describe('repertorio: datos', () => {
  it('practicar una línea crea sus tarjetas para mañana, y la segunda comparte las que ya existen', async () => {
    expect(await markLinePracticed(A, cards, '2026-11-09', db)).toEqual({ newCards: 3 })
    expect(await dueRepCards('2026-11-09', db)).toHaveLength(0)
    expect(await dueRepCards('2026-11-10', db)).toHaveLength(3)
    // B comparte las 3 posiciones (e4, Nf3, Bc4) con A: no hay tarjetas nuevas.
    expect(await markLinePracticed(B, cards, '2026-11-09', db)).toEqual({ newCards: 0 })
    expect(await db.repcards.count()).toBe(3)
    expect((await db.replines.get('a'))?.practiced).toBe(1)
    await markLinePracticed(A, cards, '2026-11-12', db)
    expect(await db.replines.get('a')).toMatchObject({ practiced: 2, firstDate: '2026-11-09', lastDate: '2026-11-12' })
  })

  it('acertar sube de caja (1, 3, 7, 16, 35 días) y se queda en la última; fallar vuelve a la primera', async () => {
    await markLinePracticed(A, cards, '2026-11-01', db)
    const id = cards[0]!.id
    const days = [3, 7, 16, 35, 35, 35]
    let today = '2026-11-02'
    for (const d of days) {
      const c = await reviewRepCard(id, true, today, db)
      const due = new Date(`${today}T12:00:00Z`)
      due.setUTCDate(due.getUTCDate() + d)
      expect(c.due, `tras acertar con intervalo ${d}`).toBe(due.toISOString().slice(0, 10))
      today = c.due
    }
    expect((await db.repcards.get(id))?.box).toBe(4)
    const failed = await reviewRepCard(id, false, today, db)
    expect(failed).toMatchObject({ box: 0, lapses: 1 })
  })

  it('estadísticas por línea y racha', async () => {
    await markLinePracticed(A, cards, '2026-11-09', db)
    for (let i = 0; i < 4; i++) await reviewRepCard(cards[0]!.id, true, `2026-11-${10 + i * 5}`, db)
    const stats = await repStats([A, B], cards, '2026-11-30', db)
    expect(stats.get('a')).toMatchObject({ practiced: true, cards: 3 })
    expect(stats.get('a')!.solid).toBe(1)
    expect(stats.get('b')).toMatchObject({ practiced: false, cards: 3 })
    expect((await currentStreak('2026-11-09', db)).current).toBe(1)
  })

  it('el backup v5 conserva el repertorio y acepta backups viejos', async () => {
    await markLinePracticed(A, cards, '2026-11-09', db)
    const backup = JSON.parse(JSON.stringify(await exportBackup(db)))
    expect(backup.version).toBe(5)
    const other = new ChessBroDB(`rep-${n++}`)
    await importBackup(backup, other)
    expect(await other.repcards.count()).toBe(3)
    expect((await other.replines.get('a'))?.practiced).toBe(1)
    const old = { app: 'chessbro', version: 4, exportedAt: 'x', profile: null, attempts: [], reviews: [], games: [], settings: [], lessons: [], endgames: [], activity: [] }
    expect(await importBackup(old, new ChessBroDB(`rep-${n++}`))).toMatchObject({ games: 0 })
    await resetRepertoire(db)
    expect(await db.repcards.count()).toBe(0)
  })
})
