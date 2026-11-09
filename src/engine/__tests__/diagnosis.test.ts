import { describe, expect, it } from 'vitest'
import { currentBand, type Criterion } from '../diagnosis'

const bands: { criteria: Criterion[] }[] = [
  { criteria: [{ kind: 'puzzle', min: 1200 }, { kind: 'blunders', max: 1 }] },
  { criteria: [{ kind: 'puzzle', min: 1450 }, { kind: 'pending', label: 'x', milestone: 'H5' }, { kind: 'endgame', id: 'krk', max: 29, label: 'Torre' }] },
  { criteria: [{ kind: 'puzzle', min: 1900 }] },
]
const base = { puzzleRating: 1300, puzzleProvisional: false, blundersPerGame: 0.5, analyzedGames: 10, endgameBest: {} }

describe('diagnóstico', () => {
  it('sin datos suficientes se queda en la primera banda', () => {
    const r = currentBand(bands, { ...base, puzzleProvisional: true, blundersPerGame: null, analyzedGames: 0 })
    expect(r.index).toBe(0)
    expect(r.checks.map((c) => c.state)).toEqual(['nodata', 'nodata'])
  })

  it('cumple la banda 1 y le falta rating para la 2', () => {
    const r = currentBand(bands, base)
    expect(r.index).toBe(1)
    expect(r.checks.map((c) => c.state)).toEqual(['todo', 'pending', 'todo'])
  })

  it('la banda de partida salta las anteriores', () => {
    // Sin datos, empezando en la banda 1 nunca se cae a la 0.
    const r = currentBand(bands, { ...base, puzzleProvisional: true, blundersPerGame: null, analyzedGames: 0 }, 1)
    expect(r.index).toBe(1)
    expect(currentBand(bands, base, 99).index).toBe(2)
  })

  it('los criterios pendientes no bloquean, pero un final sin hacer sí', () => {
    expect(currentBand(bands, { ...base, puzzleRating: 1500 }).index).toBe(1)
    expect(currentBand(bands, { ...base, puzzleRating: 1500, endgameBest: { krk: 31 } }).index).toBe(1)
    expect(currentBand(bands, { ...base, puzzleRating: 1500, endgameBest: { krk: 22 } }).index).toBe(2)
  })

  it('un final de tipo "una vez alcanza" se cumple con cualquier victoria sin pistas', () => {
    const b = [{ criteria: [{ kind: 'endgame' as const, id: 'lucena', max: Infinity, label: 'Lucena', binary: true }] }, { criteria: [] }]
    expect(currentBand(b, { ...base, endgameBest: {} }).index).toBe(0)
    const r = currentBand(b, { ...base, endgameBest: { lucena: 23 } })
    expect(r.index).toBe(1)
    expect(currentBand([b[0]!], { ...base, endgameBest: { lucena: 23 } }).checks[0]).toMatchObject({ state: 'ok', detail: 'logrado sin pistas' })
  })

  it('muchos errores graves frenan aunque el rating alcance', () => {
    const r = currentBand(bands, { ...base, blundersPerGame: 1.4 })
    expect(r.index).toBe(0)
    expect(r.checks[1]).toMatchObject({ state: 'todo', detail: 'hoy 1,4' })
  })
})
