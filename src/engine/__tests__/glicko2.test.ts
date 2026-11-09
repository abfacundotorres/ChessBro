import { describe, expect, it } from 'vitest'
import { INITIAL_RATING, RD_MIN, isProvisional, ratePuzzle, updateRating } from '../glicko2'

describe('Glicko-2', () => {
  it('reproduce el ejemplo del paper de Glickman', () => {
    const r = updateRating({ rating: 1500, rd: 200, vol: 0.06 }, [
      { rating: 1400, rd: 30, score: 1 },
      { rating: 1550, rd: 100, score: 0 },
      { rating: 1700, rd: 300, score: 0 },
    ])
    expect(r.rating).toBeCloseTo(1464.06, 1)
    expect(r.rd).toBeCloseTo(151.52, 1)
    expect(r.vol).toBeCloseTo(0.05999, 4)
  })

  it('sin partidas solo crece el RD', () => {
    const r = updateRating({ rating: 1500, rd: 200, vol: 0.06 }, [])
    expect(r.rating).toBe(1500)
    expect(r.rd).toBeGreaterThan(200)
  })

  it('resolver sube, fallar baja; más cambio contra puzzles más difíciles', () => {
    const p = INITIAL_RATING
    expect(ratePuzzle(p, { rating: 1300, rd: 75 }, true).rating).toBeGreaterThan(p.rating)
    expect(ratePuzzle(p, { rating: 1300, rd: 75 }, false).rating).toBeLessThan(p.rating)
    const easy = ratePuzzle(p, { rating: 1000, rd: 75 }, true).rating - p.rating
    const hard = ratePuzzle(p, { rating: 1700, rd: 75 }, true).rating - p.rating
    expect(hard).toBeGreaterThan(easy)
  })

  it('el RD no baja de RD_MIN y deja de ser provisional', () => {
    let r = INITIAL_RATING
    expect(isProvisional(r)).toBe(true)
    for (let i = 0; i < 200; i++) r = ratePuzzle(r, { rating: r.rating, rd: 75 }, i % 2 === 0)
    expect(r.rd).toBeGreaterThanOrEqual(RD_MIN)
    expect(isProvisional(r)).toBe(false)
  })
})
