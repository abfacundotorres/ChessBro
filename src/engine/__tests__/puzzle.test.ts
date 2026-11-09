import { describe, expect, it } from 'vitest'
import { currentFen, hint, playMove, revealSolution, solverMoveCount, startPuzzle, uciToMove, type Puzzle } from '../puzzle'
import { chunksFor, pickPuzzle } from '../selection'

// Puzzle real de Lichess (0000D): las blancas cambian damas y las negras ganan pieza.
const P: Puzzle = {
  id: '0000D',
  fen: '5rk1/1p3ppp/pq3b2/8/8/1P1Q1N2/P4PPP/3R2K1 w - - 2 27',
  moves: ['d3d6', 'f8d8', 'd6d8', 'f6d8'],
  rating: 1433,
  rd: 75,
  themes: 0,
}

// Dos mates en 1 posibles (Rb8# es la "oficial", Ra8# también vale).
const TWO_MATES: Puzzle = {
  id: 'mate',
  fen: '6k1/5ppp/8/8/2p5/8/1R6/R5K1 b - - 0 1',
  moves: ['c4c3', 'b2b8'],
  rating: 600,
  rd: 75,
  themes: 0,
}

describe('puzzle', () => {
  it('arranca aplicando la jugada del rival y resuelve el bando correcto', () => {
    const s = startPuzzle(P)
    expect(s.solver).toBe('b')
    expect(s.played[0]?.san).toBe('Qd6')
    expect(solverMoveCount(P)).toBe(2)
  })

  it('camino correcto completo con respuesta automática del rival', () => {
    let s = startPuzzle(P)
    const r1 = playMove(s, uciToMove('f8d8'))
    expect(r1.result).toEqual({ kind: 'correct', reply: expect.objectContaining({ san: 'Qxd8+' }) })
    s = r1.state
    const r2 = playMove(s, uciToMove('f6d8'))
    expect(r2.result.kind).toBe('solved')
    expect(r2.state.solved).toBe(true)
    expect(r2.state.failed).toBe(false)
  })

  it('jugada legal pero incorrecta: falla, la posición no cambia y se puede seguir', () => {
    const s = startPuzzle(P)
    const r = playMove(s, uciToMove('b6b3'))
    expect(r.result.kind).toBe('wrong')
    expect(r.state.failed).toBe(true)
    expect(currentFen(r.state)).toBe(currentFen(s))
    const r2 = playMove(r.state, uciToMove('f8d8'))
    expect(r2.result.kind).toBe('correct')
    expect(r2.state.failed).toBe(true)
  })

  it('acepta un mate alternativo', () => {
    const s = startPuzzle(TWO_MATES)
    expect(playMove(s, uciToMove('a1a8')).result.kind).toBe('solved')
    expect(playMove(s, uciToMove('b2b8')).result.kind).toBe('solved')
  })

  it('pista y solución marcan como fallado', () => {
    const s = startPuzzle(P)
    const h = hint(s)
    expect(h.square).toBe('f8')
    expect(h.state.failed).toBe(true)
    const sol = revealSolution(s)
    expect(sol.solved && sol.failed).toBe(true)
    expect(sol.played.map((m) => m.san)).toEqual(['Qd6', 'Rd8', 'Qxd8+', 'Bxd8'])
  })
})

describe('selección', () => {
  const pool: Puzzle[] = [900, 1000, 1100, 1250, 1350, 1600, 2000].map((r, i) => ({ ...P, id: `p${i}`, rating: r, themes: i % 2 ? 1 : 2 }))
  const first = () => 0

  it('elige dentro de la ventana objetivo', () => {
    const p = pickPuzzle({ pool, rating: 1200, themeBit: null, seen: new Set(), random: first })
    expect(p?.rating).toBeGreaterThanOrEqual(1125)
    expect(p?.rating).toBeLessThanOrEqual(1350)
  })

  it('respeta tema y vistos, y agranda la ventana si hace falta', () => {
    const p = pickPuzzle({ pool, rating: 1200, themeBit: 1, seen: new Set(['p3']), random: first })
    expect((p?.themes ?? 0) & 1).toBe(1)
    expect(p?.id).not.toBe('p3')
    expect(pickPuzzle({ pool, rating: 3000, themeBit: null, seen: new Set(), random: first })).not.toBeNull()
    expect(pickPuzzle({ pool, rating: 1200, themeBit: null, seen: new Set(pool.map((x) => x.id)), random: first })).toBeNull()
  })

  it('chunks cercanos al rating', () => {
    const chunks = [400, 600, 800, 1000, 1200, 1400, 1600].map((min) => ({ min, max: min + 200 }))
    expect(chunksFor(chunks, 1100).map((c) => c.min)).toEqual([800, 1000, 1200, 1400])
    expect(chunksFor(chunks, 5000).map((c) => c.min)).toEqual([1600])
  })
})
