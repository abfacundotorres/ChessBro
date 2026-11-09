import { describe, expect, it } from 'vitest'
import { analyzeGame, classify, parseInfo, severityOf, toCp, winPercent, type PositionEval } from '../analysis'

const ev = (score: PositionEval['score'], pv: string[] = []): PositionEval => ({ score, best: pv[0] ?? null, pv })

describe('escalas', () => {
  it('probabilidad de ganar y severidad', () => {
    expect(winPercent(0)).toBe(50)
    expect(winPercent(300)).toBeGreaterThan(70)
    expect(winPercent(-5000)).toBeCloseTo(100 - winPercent(5000))
    expect(severityOf(4)).toBeNull()
    expect(severityOf(5)).toBe('inaccuracy')
    expect(severityOf(15)).toBe('mistake')
    expect(severityOf(20)).toBe('blunder')
  })

  it('mate a centipeones', () => {
    expect(toCp({ mate: 1 })).toBeGreaterThan(toCp({ mate: 3 }))
    expect(toCp({ mate: -1 })).toBeLessThan(toCp({ mate: -3 }))
    expect(toCp({ mate: 0 })).toBeLessThan(-9000)
  })
})

describe('classify', () => {
  it('pieza colgada: dama a una casilla atacada por un peón', () => {
    const r = classify({
      fenBefore: '4k3/8/8/3p4/Q7/8/8/4K3 w - - 0 30',
      played: 'a4c4',
      before: ev({ cp: 700 }, ['e1d2']),
      after: ev({ cp: 600 }, ['d5c4', 'e1d2']),
      moveNumber: 30,
    })
    expect(r?.kind).toBe('hanging')
    expect(severityOf(r!.winLoss)).toBe('blunder')
  })

  it('táctica no vista: horquilla de caballo', () => {
    const r = classify({
      fenBefore: 'r3k3/8/8/1N6/8/8/8/4K3 w - - 0 30',
      played: 'e1e2',
      before: ev({ cp: 500 }, ['b5c7', 'e8d7', 'c7a8']),
      after: ev({ cp: 0 }, ['a8a5']),
      moveNumber: 30,
    })
    expect(r?.kind).toBe('missedTactic')
  })

  it('mate perdido y mate permitido', () => {
    const base = { fenBefore: '4k3/8/8/8/8/8/8/R3K3 w - - 0 30', played: 'e1e2', moveNumber: 30 }
    expect(classify({ ...base, before: ev({ mate: 1 }, ['a1a8']), after: ev({ cp: -200 }) })?.kind).toBe('missedMate')
    expect(classify({ ...base, before: ev({ cp: 0 }, ['e1d1']), after: ev({ mate: 2 }) })?.kind).toBe('allowedMate')
  })

  it('jugada buena: sin error', () => {
    expect(
      classify({ fenBefore: '4k3/8/8/8/8/8/8/R3K3 w - - 0 30', played: 'e1e2', before: ev({ cp: 30 }, ['e1d2']), after: ev({ cp: -25 }), moveNumber: 30 }),
    ).toBeNull()
  })
})

describe('analyzeGame', () => {
  it('mate pastor desde el lado de negras: Cf6 permite mate', () => {
    const moves = ['e2e4', 'e7e5', 'f1c4', 'b8c6', 'd1h5', 'g8f6', 'h5f7']
    const evals: PositionEval[] = [
      ev({ cp: 30 }, ['e2e4']),
      ev({ cp: -30 }, ['e7e5']),
      ev({ cp: 30 }, ['g1f3']),
      ev({ cp: -30 }, ['g8f6']),
      ev({ cp: 30 }, ['g1f3']),
      ev({ cp: -20 }, ['g7g6', 'h5f3']),
      ev({ mate: 1 }, ['h5f7']),
      ev({ mate: 0 }),
    ]
    const a = analyzeGame({ startFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', moves, evals, me: 'b' })
    expect(a.errors).toHaveLength(1)
    expect(a.errors[0]).toMatchObject({ ply: 5, san: 'Nf6', bestSan: 'g6', kind: 'allowedMate', severity: 'blunder', prevUci: 'd1h5' })
    expect(a.counts.blunder).toBe(1)
    expect(a.accuracy).toBeLessThan(100)
  })
})

describe('precisión', () => {
  it('un error grave baja la precisión más que el promedio simple', () => {
    // 20 jugadas de las blancas, todas perfectas salvo una que pierde ~50 puntos de probabilidad
    const moves: string[] = []
    const evals: PositionEval[] = []
    const shuffle = ['g1f3', 'g8f6', 'f3g1', 'f6g8']
    for (let i = 0; i < 40; i++) moves.push(shuffle[i % 4]!)
    for (let i = 0; i <= 40; i++) evals.push(ev({ cp: i % 2 === 0 ? 20 : -20 }))
    evals[20] = ev({ cp: 20 }, ['g1f3'])
    evals[21] = ev({ cp: 500 }) // tras la jugada 20 (blancas), el rival (negras) está ganando por 500: error grande
    const a = analyzeGame({ startFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', moves, evals, me: 'w' })
    expect(a.counts.blunder).toBeGreaterThanOrEqual(1)
    expect(a.accuracy).toBeLessThan(90)
  })
})

describe('parseInfo', () => {
  it('lee depth, score y pv; ignora cotas', () => {
    expect(parseInfo('info depth 14 seldepth 20 multipv 1 score cp -35 nodes 1 nps 1 time 1 pv e7e5 g1f3')).toEqual({
      depth: 14,
      score: { cp: -35 },
      pv: ['e7e5', 'g1f3'],
    })
    expect(parseInfo('info depth 3 score mate -2 pv a1a2')?.score).toEqual({ mate: -2 })
    expect(parseInfo('info depth 9 score cp 10 lowerbound pv a2a3')).toBeNull()
    expect(parseInfo('info string hola')).toBeNull()
  })
})
