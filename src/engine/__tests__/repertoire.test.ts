import { describe, expect, it } from 'vitest'
import { buildCards, cardId, cardsOfLine, lineSteps, positionKey, type RepLine } from '../repertoire'
import { START_FEN } from '../game'

const line = (id: string, color: 'w' | 'b', moves: string[]): RepLine => ({ id, color, group: 'g', name: id, moves, idea: '', plan: [] })

describe('repertorio: tarjetas', () => {
  it('una tarjeta por cada posición en la que mueve el usuario', () => {
    const { cards, conflicts } = buildCards([line('a', 'w', ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'])])
    expect(conflicts).toEqual([])
    expect(cards.map((c) => c.san)).toEqual(['e4', 'Nf3', 'Bc4'])
    expect(cards[0]).toMatchObject({ prev: null, history: [], uci: 'e2e4' })
    expect(cards[1]).toMatchObject({ prev: { from: 'e7', to: 'e5', san: 'e5' }, history: ['e4', 'e5'] })
  })

  it('con negras, las tarjetas son las jugadas del segundo jugador', () => {
    const { cards } = buildCards([line('b', 'b', ['e4', 'e5', 'Nf3', 'Nc6'])])
    expect(cards.map((c) => c.san)).toEqual(['e5', 'Nc6'])
    expect(cards[0]!.prev).toMatchObject({ san: 'e4' })
  })

  it('las líneas que comparten posición comparten la tarjeta', () => {
    const a = line('a', 'w', ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'])
    const b = line('b', 'w', ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6'])
    const { cards, conflicts } = buildCards([a, b])
    expect(conflicts).toEqual([])
    expect(cards).toHaveLength(3)
    expect(cards.find((c) => c.san === 'Bc4')?.lineIds).toEqual(['a', 'b'])
    expect(cardsOfLine(cards, 'b')).toHaveLength(3)
  })

  it('las transposiciones también comparten tarjeta (misma posición, distinto orden)', () => {
    const a = line('a', 'w', ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3'])
    const b = line('b', 'w', ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'd3', 'Bc5', 'c3'])
    const { cards } = buildCards([a, b])
    // Después de 4.c3 Cf6 le toca a las blancas jugar d3 (línea a); en b, tras 4.d3 Ac5 juegan c3: posiciones distintas.
    expect(cards.map((c) => c.san).sort()).toEqual(['Bc4', 'Nf3', 'c3', 'c3', 'd3', 'd3', 'e4'].sort())
    const last = (id: string) => buildCards([id === 'a' ? a : b]).cards.at(-1)!
    // Ninguna de las dos deja de ser consistente consigo misma.
    expect(last('a').san).toBe('d3')
  })

  it('detecta conflictos: dos jugadas distintas en la misma posición', () => {
    const { conflicts } = buildCards([line('a', 'w', ['e4', 'e5']), line('b', 'w', ['d4', 'd5'])])
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]!.moves.map((m) => m.san).sort()).toEqual(['d4', 'e4'])
    expect(conflicts[0]!.id).toBe(cardId('w', START_FEN))
  })

  it('positionKey ignora los contadores', () => {
    expect(positionKey('8/8/8/8/8/8/8/K6k w - - 5 40')).toBe(positionKey('8/8/8/8/8/8/8/K6k w - - 0 1'))
  })
})

describe('lineSteps', () => {
  it('posiciones antes y después, y quién mueve', () => {
    const steps = lineSteps(line('a', 'b', ['e4', 'e5']))
    expect(steps.map((s) => [s.san, s.mine])).toEqual([['e4', false], ['e5', true]])
    expect(steps[0]!.fenBefore).toBe(START_FEN)
    expect(steps[1]!.fenBefore).toBe(steps[0]!.fenAfter)
    expect(steps[1]).toMatchObject({ from: 'e7', to: 'e5', uci: 'e7e5' })
  })
})
