import { describe, expect, it } from 'vitest'
import { checkChallenge, type Challenge } from '../challenge'
import { bestStars, stars } from '../score'
import { computeStreak } from '../streak'

const tapAll: Challenge = { kind: 'tap', prompt: '', fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1', rule: 'isolated', side: 'w', mode: 'all', answer: ['a2', 'd4'], why: '' }
const tapAny: Challenge = { ...tapAll, mode: 'any' } as Challenge

describe('checkChallenge', () => {
  it('opción múltiple', () => {
    const c: Challenge = { kind: 'choice', question: '', options: ['a', 'b'], answer: 1, why: '' }
    expect(checkChallenge(c, { kind: 'choice', index: 1 })).toBe(true)
    expect(checkChallenge(c, { kind: 'choice', index: 0 })).toBe(false)
  })

  it('tocar todas: exactamente el conjunto, sin faltantes ni sobrantes', () => {
    expect(checkChallenge(tapAll, { kind: 'tap', squares: ['d4', 'a2'] })).toBe(true)
    expect(checkChallenge(tapAll, { kind: 'tap', squares: ['a2'] })).toBe(false)
    expect(checkChallenge(tapAll, { kind: 'tap', squares: ['a2', 'd4', 'h7'] })).toBe(false)
    expect(checkChallenge(tapAll, { kind: 'tap', squares: [] })).toBe(false)
  })

  it('tocar una: basta una casilla correcta', () => {
    expect(checkChallenge(tapAny, { kind: 'tap', squares: ['d4'] })).toBe(true)
    expect(checkChallenge(tapAny, { kind: 'tap', squares: ['h7'] })).toBe(false)
    expect(checkChallenge(tapAny, { kind: 'tap', squares: ['a2', 'd4'] })).toBe(false)
  })

  it('elegir jugada', () => {
    const c: Challenge = { kind: 'move', prompt: '', fen: '', options: ['e2e4', 'a2a3'], answer: 'e2e4', why: '' }
    expect(checkChallenge(c, { kind: 'move', uci: 'e2e4' })).toBe(true)
    expect(checkChallenge(c, { kind: 'move', uci: 'a2a3' })).toBe(false)
  })
})

describe('estrellas', () => {
  it('3 sin errores, 2 con pocos, 1 con muchos', () => {
    expect(stars(0, 8)).toBe(3)
    expect(stars(1, 4)).toBe(2)
    expect(stars(2, 8)).toBe(2)
    expect(stars(3, 8)).toBe(1)
    expect(bestStars(2, 1)).toBe(2)
    expect(bestStars(undefined, 1)).toBe(1)
  })
})

describe('racha', () => {
  it('cuenta días seguidos hasta hoy', () => {
    expect(computeStreak(['2026-11-07', '2026-11-08', '2026-11-09'], '2026-11-09')).toEqual({ current: 3, best: 3, activeToday: true })
  })

  it('sigue viva si practicaste ayer; se corta si pasó un día entero', () => {
    expect(computeStreak(['2026-11-07', '2026-11-08'], '2026-11-09')).toMatchObject({ current: 2, activeToday: false })
    expect(computeStreak(['2026-11-06', '2026-11-07'], '2026-11-09')).toMatchObject({ current: 0, best: 2 })
  })

  it('guarda la mejor racha histórica y cruza meses', () => {
    const d = ['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-08']
    expect(computeStreak(d, '2026-11-08')).toEqual({ current: 1, best: 4, activeToday: true })
    expect(computeStreak([], '2026-11-08')).toEqual({ current: 0, best: 0, activeToday: false })
  })
})
