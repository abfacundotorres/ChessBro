import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { ChessBroDB } from '../db'
import { parseLichessGame, parseNdjson } from '../lichess'
import { saveAnalysis, saveImported, summarize, getSetting, setSetting } from '../games'
import { exportBackup, importBackup } from '../backup'
import type { PositionEval } from '../../engine/analysis'
import { isGoodAlternative } from '../../engine/gameCards'
import { winPercent } from '../../engine/analysis'

const ev = (score: PositionEval['score'], pv: string[] = []): PositionEval => ({ score, best: pv[0] ?? null, pv })

// Partida con el mismo formato que la API de Lichess (ndjson, jugadas en SAN).
const RAW = {
  id: 'abcd1234',
  rated: true,
  variant: 'standard',
  speed: 'rapid',
  perf: 'rapid',
  createdAt: 1_794_000_000_000,
  lastMoveAt: 1_794_000_600_000,
  status: 'mate',
  players: {
    white: { user: { name: 'Rival', id: 'rival' }, rating: 1150 },
    black: { user: { name: 'Facu', id: 'facu' }, rating: 1100 },
  },
  winner: 'white',
  opening: { eco: 'C20', name: "King's Pawn Game", ply: 2 },
  moves: 'e4 e5 Bc4 Nc6 Qh5 Nf6 Qxf7#',
}

let n = 0
let db: ChessBroDB
beforeEach(() => {
  db = new ChessBroDB(`games-${n++}`)
})

describe('importación de Lichess', () => {
  it('normaliza la partida y detecta el bando del usuario', () => {
    const g = parseLichessGame(RAW, 'Facu')
    expect(g).toMatchObject({ id: 'abcd1234', me: 'b', winner: 'white', opening: "King's Pawn Game" })
    expect(g?.moves).toEqual(['e2e4', 'e7e5', 'f1c4', 'b8c6', 'd1h5', 'g8f6', 'h5f7'])
    expect(g?.white).toEqual({ name: 'Rival', rating: 1150 })
  })

  it('descarta variantes, partidas abortadas, ajenas o inválidas', () => {
    expect(parseLichessGame({ ...RAW, variant: 'chess960' }, 'facu')).toBeNull()
    expect(parseLichessGame({ ...RAW, status: 'aborted' }, 'facu')).toBeNull()
    expect(parseLichessGame(RAW, 'otro')).toBeNull()
    expect(parseLichessGame({ ...RAW, moves: 'e4 e5 Ke3 Ke6 Kxe6' }, 'facu')).toBeNull()
    expect(parseNdjson(`${JSON.stringify(RAW)}\nbasura\n\n${JSON.stringify({ ...RAW, id: 'x2' })}\n`, 'facu').map((g) => g.id)).toEqual([
      'abcd1234',
      'x2',
    ])
  })
})

describe('partidas en la base', () => {
  it('no duplica partidas ya importadas', async () => {
    const g = parseLichessGame(RAW, 'facu')!
    expect(await saveImported([g], 1, db)).toBe(1)
    expect(await saveImported([g, { ...g, id: 'otra' }], 2, db)).toBe(1)
    expect(await db.games.count()).toBe(2)
  })

  it('guardar el análisis crea el ejercicio del error grave, para hoy', async () => {
    await saveImported([parseLichessGame(RAW, 'facu')!], 1, db)
    const evals = [
      ev({ cp: 30 }, ['e2e4']),
      ev({ cp: -30 }, ['e7e5']),
      ev({ cp: 30 }, ['g1f3']),
      ev({ cp: -30 }, ['g8f6']),
      ev({ cp: 30 }, ['g1f3']),
      ev({ cp: -20 }, ['g7g6', 'h5f3']),
      ev({ mate: 1 }, ['h5f7']),
      ev({ mate: 0 }),
    ]
    const r = await saveAnalysis('abcd1234', evals, 14, '2026-11-09', 5, db)
    expect(r.cards).toBe(1)
    const card = await db.reviews.get('g:abcd1234:5')
    expect(card).toMatchObject({ due: '2026-11-09', box: 0, origin: { kind: 'allowedMate', played: 'Nf6' } })
    expect(card?.puzzle.moves).toEqual(['d1h5', 'g7g6'])
    expect(card?.puzzle.rating).toBe(1100)
    // Reanalizar no duplica tarjetas.
    expect((await saveAnalysis('abcd1234', evals, 14, '2026-11-10', 6, db)).cards).toBe(0)

    const s = summarize(await db.games.toArray())
    expect(s).toMatchObject({ analyzed: 1, blundersPerGame: 1, kinds: { allowedMate: 1 } })

    await setSetting('lichessUser', 'facu', db)
    const other = new ChessBroDB(`games-${n++}`)
    const res = await importBackup(JSON.parse(JSON.stringify(await exportBackup(db))), other)
    expect(res.games).toBe(1)
    expect(await getSetting('lichessUser', other)).toBe('facu')
    expect((await other.games.get('abcd1234'))?.analysis?.summary.counts.blunder).toBe(1)
  })
})

describe('alternativas en ejercicios de partidas', () => {
  it('acepta jugadas casi tan buenas como la del motor', () => {
    expect(isGoodAlternative(300, { cp: -280 }, winPercent)).toBe(true)
    expect(isGoodAlternative(300, { cp: 100 }, winPercent)).toBe(false)
    expect(isGoodAlternative(9990, { mate: -2 }, winPercent)).toBe(true)
  })
})

describe('recálculo de análisis', () => {
  it('recalcula una sola vez con las evaluaciones guardadas', async () => {
    const { refreshAnalyses } = await import('../games')
    const g = parseLichessGame(RAW, 'Facu')!
    await saveImported([g], 1, db)
    const evals: PositionEval[] = [ev({ cp: 30 }), ev({ cp: -30 }), ev({ cp: 30 }), ev({ cp: -30 }), ev({ cp: 30 }), ev({ cp: -20 }), ev({ mate: 1 }), ev({ mate: 0 })]
    await saveAnalysis(g.id, evals, 14, '2026-11-09', 5, db)
    await setSetting('analysisRules', null, db)
    expect(await refreshAnalyses('2026-11-09', db)).toBe(1)
    expect((await db.games.get(g.id))!.analysis!.analyzedAt).toBe(5)
    expect(await refreshAnalyses('2026-11-09', db)).toBe(0)
  })
})
