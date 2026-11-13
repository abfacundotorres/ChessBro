import { describe, expect, it } from 'vitest'
import { dailyOpeningId, greetingFor, hashString, pickDailyPuzzle } from '../daily'
import type { Puzzle } from '../puzzle'

const mk = (id: string, rating: number): Puzzle => ({ id, fen: '', moves: [], rating, rd: 50, themes: 0 })
const pool = Array.from({ length: 200 }, (_, i) => mk(`p${String(i).padStart(3, '0')}`, 500 + i * 10))

describe('puzzle del día', () => {
  it('es el mismo todo el día, aunque cambie el orden del pool o el rating dentro de la misma centena', () => {
    const a = pickDailyPuzzle(pool, 1040, '2026-11-13', new Set())
    const b = pickDailyPuzzle([...pool].reverse(), 1000, '2026-11-13', new Set())
    expect(a?.id).toBe(b?.id)
  })
  it('cambia de un día a otro y respeta la ventana de rating', () => {
    const ids = new Set(Array.from({ length: 30 }, (_, i) => pickDailyPuzzle(pool, 1000, `2026-11-${String(i + 1).padStart(2, '0')}`, new Set())?.id))
    expect(ids.size).toBeGreaterThan(10)
    for (const id of ids) {
      const r = pool.find((p) => p.id === id)!.rating
      expect(r).toBeGreaterThanOrEqual(900)
      expect(r).toBeLessThanOrEqual(1200)
    }
  })
  it('prefiere los que no viste y, si ya viste todos, igual devuelve uno', () => {
    const near = pool.filter((p) => p.rating >= 900 && p.rating <= 1200)
    const seen = new Set(near.slice(1).map((p) => p.id))
    expect(pickDailyPuzzle(pool, 1000, '2026-11-13', seen)?.id).toBe(near[0]!.id)
    expect(pickDailyPuzzle(pool, 1000, '2026-11-13', new Set(pool.map((p) => p.id)))).not.toBeNull()
  })
  it('amplía la ventana si no hay candidatos y devuelve null con el pool vacío', () => {
    expect(pickDailyPuzzle([mk('x', 2200)], 600, '2026-11-13', new Set())?.id).toBe('x')
    expect(pickDailyPuzzle([], 600, '2026-11-13', new Set())).toBeNull()
  })
})

describe('apertura del día', () => {
  const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
  it('recorre todas las aperturas, una por día, sin repetir hasta completar la vuelta', () => {
    const days = Array.from({ length: ids.length }, (_, i) => dailyOpeningId(ids, `2026-11-${String(10 + i).padStart(2, '0')}`))
    expect(new Set(days).size).toBe(ids.length)
    expect(dailyOpeningId(ids, '2026-11-10')).toBe(dailyOpeningId(ids, '2026-11-17'))
  })
  it('no depende del orden de la lista y maneja la lista vacía', () => {
    expect(dailyOpeningId(ids, '2026-11-13')).toBe(dailyOpeningId([...ids].reverse(), '2026-11-13'))
    expect(dailyOpeningId([], '2026-11-13')).toBeNull()
  })
})

describe('utilidades', () => {
  it('el hash es estable', () => expect(hashString('chessbro')).toBe(hashString('chessbro')))
  it('el saludo cambia con la hora', () => {
    expect(greetingFor(3)).toMatch(/madrugador/)
    expect(greetingFor(9)).toMatch(/Buen día/)
    expect(greetingFor(15)).toMatch(/tardes/)
    expect(greetingFor(22)).toMatch(/noches/)
  })
})
