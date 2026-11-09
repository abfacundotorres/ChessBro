import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { ChessBroDB } from '../db'
import { planSnapshot } from '../plan'
import type { ErrorKind, MoveError } from '../../engine/analysis'

let n = 0
let db: ChessBroDB
beforeEach(() => {
  db = new ChessBroDB(`plan-${n++}`)
})

const err = (kind: ErrorKind): MoveError => ({ ply: 1, san: 'e4', bestUci: 'e2e4', bestSan: 'e4', severity: 'mistake', kind, winLoss: 15, fenBefore: '', prevUci: null, fenBeforePrev: null })

async function addGame(i: number, errors: MoveError[]) {
  await db.games.put({
    id: `g${i}`, createdAt: 1_000 + i, speed: 'blitz', rated: true, status: 'mate', white: { name: 'a', rating: 500 }, black: { name: 'b', rating: 500 },
    winner: null, me: 'w', startFen: 'x', moves: [], opening: null, importedAt: 1,
    analysis: { depth: 14, evals: [], analyzedAt: 2_000 + i, summary: { errors, avgWinLoss: 0, accuracy: 70, counts: { inaccuracy: 0, mistake: errors.length, blunder: 0 } } },
  })
}

describe('plan según tus partidas', () => {
  it('sin partidas analizadas no hay punto débil', async () => {
    const s = await planSnapshot('2026-11-09', db)
    expect(s.input.weakness).toBeNull()
  })

  it('con 3 partidas con piezas colgadas, el plan lo marca y pone la lección que lo trabaja', async () => {
    for (let i = 0; i < 3; i++) await addGame(i, [err('hanging'), err('hanging')])
    const s = await planSnapshot('2026-11-09', db)
    expect(s.input.weakness).toMatchObject({ label: 'Pieza colgada', theme: 'hangingPiece' })
    expect(s.input.nextLesson).toMatchObject({ id: 'seguridad', forWeakness: true })
    expect(s.patterns.games).toBe(3)
  })
})

describe('lección del punto débil según el nivel', () => {
  it('no propone una lección de dos bandas por encima del nivel de partida', async () => {
    for (let i = 0; i < 3; i++) await addGame(i, [err('endgame'), err('endgame')])
    const s = await planSnapshot('2026-11-09', db)
    expect(s.input.weakness?.label).toBe('Final')
    // Oposición es de la banda 2; con nivel de partida bajo, no es la sugerida
    expect(s.input.nextLesson?.id).not.toBe('oposicion')
  })
})
