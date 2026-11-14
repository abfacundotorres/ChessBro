import { Chess, type Square } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { deepLinesOf } from '../openingLines'

const line = (id: string) => deepLinesOf('escandinava').find((l) => l.id === id)!
/** Posición después de la jugada `i` (0 = primera de las blancas). */
const at = (moves: string[], i: number) => {
  const c = new Chess()
  for (let k = 0; k <= i; k++) c.move(moves[k]!)
  return c
}
const att = (c: Chess, sq: string, by: 'w' | 'b') => c.attackers(sq as Square, by)
const last = (c: Chess) => c.history({ verbose: true }).at(-1)!
const mat = (c: Chess) => c.board().flat().reduce((t, p) => (p ? t + ({ p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }[p.type] ?? 0) * (p.color === 'w' ? 1 : -1) : t), 0)

describe('ramas nuevas del rival en la Escandinava: lo que dicen las notas', () => {
  it('3.c4', () => {
    const l = line('esca-c4')
    const g = (i: number) => at(l.moves, i)
    expect(att(g(4), 'd5', 'w')).toContain('c4') // c4 ataca la dama
    expect(g(5).inCheck()).toBe(true)
    expect(att(g(5), 'c4', 'b')).toContain('e4') // …De4+ ataca c4 y b1
    expect(att(g(5), 'b1', 'b')).toContain('e4')
    expect(last(g(6)).san).toBe('Ne2') // el caballo tapa el jaque
    expect(last(g(7))).toMatchObject({ captured: 'p', piece: 'q', to: 'c4' })
    expect(mat(g(7))).toBe(-1) // un peón arriba para las negras
    expect(att(g(8), 'h6', 'w')).toContain('c1') // d4 abre la diagonal del alfil de c1
    expect(att(g(9), 'e4', 'b')).toContain('f6')
    expect(att(g(9), 'd5', 'b')).toContain('f6')
    expect(att(g(10), 'd5', 'w')).toContain('c3')
    expect(att(g(10), 'e4', 'w')).toContain('c3')
    expect(att(g(11), 'd5', 'b')).toContain('e6')
    expect(att(g(11), 'a3', 'b')).toContain('f8') // diagonal f8–a3 abierta
    expect(att(g(12), 'e6', 'w')).toContain('f4')
    expect(att(g(12), 'e6', 'b').length).toBeGreaterThan(0) // protegido
    expect(g(13).moves({ square: 'c3' })).toEqual([]) // el caballo de c3 está clavado
    expect(att(g(14), 'b4', 'w')).toContain('a3')
    for (const sq of ['d4', 'f4', 'a3']) expect(att(g(15), sq, 'b'), sq).toContain('d6')
    expect(att(g(16), 'e6', 'w')).toContain('c4')
    expect(att(g(17), 'f6', 'b')).toContain('d7')
    expect(mat(g(17))).toBe(-1) // el peón de ventaja sigue
    // la trampa del quiz: 3…Dxc4? pierde la dama
    const t = new Chess()
    for (const m of ['e4', 'd5', 'exd5', 'Qxd5', 'c4', 'Qxc4']) t.move(m)
    expect(att(t, 'c4', 'w')).toContain('f1')
  })

  it('4.b4 (gambito)', () => {
    const l = line('esca-b4')
    const g = (i: number) => at(l.moves, i)
    expect(att(g(6), 'a5', 'w')).toContain('b4')
    expect(att(g(6), 'b4', 'b')).toContain('a5') // el peón se puede capturar
    expect(last(g(7))).toMatchObject({ captured: 'p', piece: 'q', to: 'b4' })
    expect(att(g(7), 'c3', 'b')).toContain('b4')
    expect(att(g(8), 'b4', 'w')).toContain('b1')
    expect(att(g(8), 'b4', 'b')).toEqual([]) // la dama sin protección
    expect(att(g(9), 'd2', 'b')).toContain('d6')
    expect(att(g(9), 'h2', 'b')).toContain('d6')
    expect(att(g(11), 'e4', 'b')).toContain('f6')
    expect(att(g(11), 'd5', 'b')).toContain('f6')
    expect(att(g(13), 'b5', 'b')).toContain('a6')
    expect(att(g(13), 'b5', 'w')).toContain('c3') // el caballo de c3 podía ir a b5
    expect(att(g(15), 'd5', 'b')).toContain('e6')
    expect(g(15).get('e7' as Square)).toBeFalsy() // e7 libre para el alfil
    expect(att(g(15), 'e7', 'b')).toContain('f8')
    expect(att(g(17), 'd4', 'b')).toContain('c6')
    expect(mat(g(17))).toBeLessThanOrEqual(-1) // las negras siguen con el peón
  })

  it('3.Cf3 Ag4 4.Ae2', () => {
    const l = line('esca-be2')
    const g = (i: number) => at(l.moves, i)
    expect(att(g(6), 'f3', 'w')).toContain('e2')
    expect(att(g(6), 'f3', 'b')).toContain('g4')
    expect(att(g(7), 'd4', 'b')).toContain('c6')
    expect(att(g(7), 'b4', 'b')).toContain('c6')
    expect(att(g(8), 'd4', 'b')).toContain('c6')
    expect(last(g(9)).san).toBe('O-O-O')
    expect(g(9).get('c8' as Square)).toMatchObject({ type: 'k', color: 'b' })
    expect(g(9).get('d8' as Square)).toMatchObject({ type: 'r', color: 'b' })
    expect(att(g(10), 'd5', 'w')).toContain('c4')
    expect(att(g(11), 'f3', 'b')).toContain('f5')
    expect(att(g(11), 'b1', 'b')).toContain('f5')
    expect(att(g(12), 'd4', 'w')).toContain('e3')
    expect(att(g(12), 'd4', 'w')).toContain('f3') // el caballo de f3 defendía d4
    expect(last(g(13))).toMatchObject({ captured: 'n', piece: 'b', to: 'f3' })
  })

  it('cada rama parte de la Escandinava y no contradice las jugadas propias de las otras líneas', () => {
    for (const id of ['esca-c4', 'esca-b4', 'esca-be2']) {
      const l = line(id)
      expect(l.color).toBe('b')
      expect(l.moves.slice(0, 4)).toEqual(['e4', 'd5', 'exd5', 'Qxd5'])
    }
  })
})
