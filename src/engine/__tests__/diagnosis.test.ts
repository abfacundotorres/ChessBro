import { describe, expect, it } from 'vitest'
import { currentBand, type Criterion } from '../diagnosis'

const bands: { criteria: Criterion[] }[] = [
  { criteria: [{ kind: 'puzzle', min: 1200 }, { kind: 'blunders', max: 1 }] },
  { criteria: [{ kind: 'puzzle', min: 1450 }, { kind: 'pending', label: 'x', milestone: 'H3' }] },
  { criteria: [{ kind: 'puzzle', min: 1900 }] },
]
const base = { puzzleRating: 1300, puzzleProvisional: false, blundersPerGame: 0.5, analyzedGames: 10 }

describe('diagnóstico', () => {
  it('sin datos suficientes se queda en la primera banda', () => {
    const r = currentBand(bands, { ...base, puzzleProvisional: true, blundersPerGame: null, analyzedGames: 0 })
    expect(r.index).toBe(0)
    expect(r.checks.map((c) => c.state)).toEqual(['nodata', 'nodata'])
  })

  it('cumple la banda 1 y le falta rating para la 2', () => {
    const r = currentBand(bands, base)
    expect(r.index).toBe(1)
    expect(r.checks.map((c) => c.state)).toEqual(['todo', 'pending'])
  })

  it('los criterios pendientes no bloquean', () => {
    expect(currentBand(bands, { ...base, puzzleRating: 1500 }).index).toBe(2)
  })

  it('muchos errores graves frenan aunque el rating alcance', () => {
    const r = currentBand(bands, { ...base, blundersPerGame: 1.4 })
    expect(r.index).toBe(0)
    expect(r.checks[1]).toMatchObject({ state: 'todo', detail: 'hoy 1,4' })
  })
})
