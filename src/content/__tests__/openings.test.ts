import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { OPENINGS, openingFamily, openingById } from '../openings'
import { repLineById } from '../repertoire'

function play(moves: readonly string[]): Chess {
  const c = new Chess()
  for (const m of moves) c.move(m) // lanza si es ilegal
  return c
}

describe('biblioteca de aperturas', () => {
  it('los ids son únicos', () => {
    expect(new Set(OPENINGS.map((o) => o.id)).size).toBe(OPENINGS.length)
  })

  it.each(OPENINGS.map((o) => [o.id, o] as const))('%s: jugadas legales y textos completos', (_id, o) => {
    expect(() => play(o.moves)).not.toThrow()
    expect(o.idea.length).toBeGreaterThan(30)
    expect(o.plans.length).toBeGreaterThan(0)
    expect(o.mistakes.length).toBeGreaterThan(0)
    expect(o.match.length).toBeGreaterThan(0)
    for (const id of o.repLines) expect(repLineById(id), id).toBeDefined()
  })

  it.each(OPENINGS.filter((o) => o.trap).map((o) => [o.id, o] as const))('%s: la trampa es legal', (_id, o) => {
    const t = o.trap!
    const c = play(t.moves)
    if (t.mate) expect(c.isCheckmate()).toBe(true)
  })

  it('el Elefante deja a las negras con una pieza por un peón (+2 de material)', () => {
    const c = play(openingById('gambito-dama')!.trap!.moves)
    const val = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
    const mat = (color: 'w' | 'b') => c.board().flat().reduce((t, p) => (p && p.color === color ? t + val[p.type] : t), 0)
    expect(mat('b') - mat('w')).toBe(2)
  })

  it('cada línea del repertorio está en alguna apertura', () => {
    const linked = new Set(OPENINGS.flatMap((o) => o.repLines))
    for (const id of ['w-italiana-c3', 'b-ruy', 'b-qgd', 'w-caro', 'w-petroff', 'b-london']) expect(linked.has(id)).toBe(true)
  })

  it('reconoce los nombres que usan Chess.com y Lichess', () => {
    const id = (n: string) => openingFamily(n)?.id
    expect(id('Italian Game: Giuoco Piano')).toBe('italiana')
    expect(id('Italian Game Evans Gambit Accepted')).toBe('evans')
    expect(id('Four Knights Game: Italian Variation')).toBe('cuatro-caballos')
    expect(id("Queen's Gambit Declined: Orthodox Defense")).toBe('gambito-dama')
    expect(id('Queens Gambit Accepted')).toBe('gambito-dama')
    expect(id('Caro Kann Defense Exchange Variation')).toBe('caro-kann')
    expect(id('Caro-Kann Defense: Advance Variation')).toBe('caro-kann')
    expect(id('Sicilian Defense Alapin Variation')).toBe('siciliana')
    expect(id("King's Gambit Accepted")).toBe('gambito-rey')
    expect(id("King's Indian Defense: Fianchetto")).toBe('india-rey')
    expect(id('Queens Pawn Opening Accelerated London System')).toBe('london')
    expect(id('Russian Game: Classical Attack')).toBe('petroff')
    expect(id('Ruy Lopez: Morphy Defense')).toBe('ruy')
    expect(id("Bishop's Opening")).toBe('alfil')
    expect(id('Nimzo-Indian Defense')).toBe('peon-dama')
    expect(id("Queen's Pawn Game")).toBe('peon-dama')
    expect(id('Zzz inventada')).toBeUndefined()
    expect(openingFamily(null)).toBeNull()
  })
})
