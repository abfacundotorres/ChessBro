import { describe, expect, it } from 'vitest'
import { countDone, labelSide, NODE_CY, nextInOrder, nodeX, ROW, segmentPath } from '../learnPath'

describe('camino de nodos', () => {
  it('los nodos serpentean y siempre quedan dentro del ancho', () => {
    const xs = Array.from({ length: 12 }, (_, i) => nodeX(i))
    for (const x of xs) {
      expect(x).toBeGreaterThanOrEqual(20)
      expect(x).toBeLessThanOrEqual(80)
    }
    // Nunca dos nodos seguidos en la misma columna.
    for (let i = 1; i < xs.length; i++) expect(xs[i]).not.toBe(xs[i - 1])
  })
  it('el trazo une un nodo con el siguiente', () => {
    expect(segmentPath(0).startsWith(`M${nodeX(0)} `)).toBe(true)
    expect(segmentPath(2).endsWith(`${nodeX(3)} ${3 * ROW + NODE_CY}`)).toBe(true)
  })
  it('la etiqueta va hacia el lado con más lugar', () => {
    expect(labelSide(1)).toBe('left')
    expect(labelSide(3)).toBe('right')
    expect(labelSide(0)).toBe('right')
  })
  it('el siguiente es el primero sin hacer desde el nivel de partida', () => {
    const ids = ['a', 'b', 'c', 'd']
    expect(nextInOrder(ids, new Set())).toBe('a')
    expect(nextInOrder(ids, new Set(['a']))).toBe('b')
    expect(nextInOrder(ids, new Set(), 'c')).toBe('c')
    expect(nextInOrder(ids, new Set(['c']), 'c')).toBe('d')
  })
  it('si no queda nada desde el nivel de partida, vuelve a lo que saltó; si está todo hecho, null', () => {
    const ids = ['a', 'b', 'c']
    expect(nextInOrder(ids, new Set(['c']), 'c')).toBe('a')
    expect(nextInOrder(ids, new Set(ids))).toBeNull()
    expect(nextInOrder([], new Set())).toBeNull()
  })
  it('un id de partida desconocido se ignora', () => {
    expect(nextInOrder(['a', 'b'], new Set(['a']), 'zzz')).toBe('b')
  })
  it('cuenta los hechos', () => {
    expect(countDone(['a', 'b', 'c'], new Set(['a', 'c', 'x']))).toBe(2)
  })
})
