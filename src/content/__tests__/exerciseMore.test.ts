import { Chess, type Square } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { LESSONS } from '../lessons'
import { HAND_MORE } from '../exerciseMore'
import { THEME_MORE, THEME_BLURBS } from '../themeBlurbs'

const exercise = (id: string) => LESSONS.flatMap((l) => l.exercises).find((e) => e.id === id)!
const play = (id: string, uci: string) => {
  const e = exercise(id)
  const c = new Chess(e.fen)
  c.move({ from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square })
  return c
}
const attackers = (fen: string, sq: Square, color: 'w' | 'b') => new Chess(fen).attackers(sq, color).sort()
const sentences = (t: string) => t.split(/(?<=[.?!])\s+/).filter(Boolean).length

describe('«Explicame más»: largo y cobertura', () => {
  it('cada tema con explicación corta tiene la larga, de 3 a 5 frases', () => {
    expect(Object.keys(THEME_MORE).sort()).toEqual(Object.keys(THEME_BLURBS).sort())
    for (const [k, t] of Object.entries(THEME_MORE)) {
      expect(sentences(t), k).toBeGreaterThanOrEqual(3)
      expect(sentences(t), k).toBeLessThanOrEqual(5)
      expect(t.length, k).toBeLessThan(560)
    }
  })
  it('los 14 ejercicios a mano tienen la suya, de 3 a 5 frases, y todos los ids existen', () => {
    const hand = LESSONS.flatMap((l) => l.exercises).filter((e) => e.source !== 'lichess')
    expect(hand.length).toBe(Object.keys(HAND_MORE).length)
    for (const e of hand) {
      expect(e.more, e.id).toBeTruthy()
      expect(sentences(e.more!), e.id).toBeGreaterThanOrEqual(3)
      expect(sentences(e.more!), e.id).toBeLessThanOrEqual(5)
    }
  })
  it('los de Lichess heredan la del tema (salvo temas sin explicación general)', () => {
    const li = LESSONS.flatMap((l) => l.exercises).filter((e) => e.source === 'lichess')
    const sin = li.filter((e) => !e.more)
    expect(li.length - sin.length).toBeGreaterThan(40)
    expect(sin.length).toBeLessThan(8)
  })
})

describe('afirmaciones de los textos largos, comprobadas con chess.js', () => {
  it('mate del pasillo: peones f7, g7, h7 delante del rey y la columna d vacía', () => {
    const e = exercise('m1-pasillo')
    const c = new Chess(e.fen)
    for (const s of ['f7', 'g7', 'h7']) expect(c.get(s as Square)).toMatchObject({ type: 'p', color: 'b' })
    expect(c.get('g8')).toMatchObject({ type: 'k', color: 'b' })
    for (const r of [2, 3, 4, 5, 6, 7]) expect(c.get(`d${r}` as Square)).toBeFalsy()
    expect(play('m1-pasillo', 'd1d8').isCheckmate()).toBe(true)
  })
  it('mate del pastor: f7 lo atacan dama y alfil y solo lo defiende el rey', () => {
    const e = exercise('m1-pastor')
    expect(attackers(e.fen, 'f7', 'w')).toEqual(['c4', 'h5'])
    expect(attackers(e.fen, 'f7', 'b')).toEqual(['e8'])
    expect(play('m1-pastor', 'h5f7').isCheckmate()).toBe(true)
  })
  it('escalera: la torre de h7 cubre la fila 7 y la de g8 da jaque; el rey de a8 no tiene salida', () => {
    const c = play('m1-escalera', 'g1g8')
    expect(c.isCheckmate()).toBe(true)
    const e = new Chess(exercise('m1-escalera').fen)
    for (const s of ['a7', 'b7']) expect(e.attackers(s as Square, 'w')).toContain('h7')
  })
  it('dama y rey: el rey en f7 protege a la dama; Dg6 es ahogado', () => {
    const e = exercise('m1-dama')
    expect(new Chess(e.fen).get('f7')).toMatchObject({ type: 'k', color: 'w' })
    for (const m of e.accept) expect(play('m1-dama', m).isCheckmate(), m).toBe(true)
    const c = play('m1-dama', 'g1g6')
    expect(c.isStalemate()).toBe(true)
    expect(c.inCheck()).toBe(false)
  })
  it('mate de la coz: rey h8, torre g8 y peones g7 y h7; nada negro puede capturar el caballo en f7', () => {
    const e = exercise('m1-coz')
    const c = new Chess(e.fen)
    expect(c.get('h8')).toMatchObject({ type: 'k', color: 'b' })
    expect(c.get('g8')).toMatchObject({ type: 'r', color: 'b' })
    for (const s of ['g7', 'h7']) expect(c.get(s as Square)).toMatchObject({ type: 'p', color: 'b' })
    const after = play('m1-coz', 'g5f7')
    expect(after.isCheckmate()).toBe(true)
    expect(after.attackers('f7', 'b')).toEqual([])
  })
  it('regla del cuadrado: el cuadrado del peón, lo aceptado entra y alejarse deja al rey afuera', () => {
    // El peón negro baja por su columna; el cuadrado tiene de lado las jugadas que le faltan y se extiende hacia el rey.
    const inside = (pawn: string, toward: 'a' | 'h', sq: string) => {
      const side = Number(pawn[1]) - 1
      const df = (sq.charCodeAt(0) - pawn.charCodeAt(0)) * (toward === 'h' ? 1 : -1)
      const rank = Number(sq[1])
      return df >= 0 && df <= side && rank >= 1 && rank <= Number(pawn[1])
    }
    // sq-1: peón a4 (le faltan 3: cuadrado a–d × 1–4). El rey de e1 empieza afuera.
    expect(inside('a4', 'h', 'e1')).toBe(false)
    for (const m of exercise('sq-1').accept) expect(inside('a4', 'h', m.slice(2)), m).toBe(true)
    // sq-3: peón a3 (faltan 2: a–c × 1–3). El rey de d1 empieza afuera.
    expect(inside('a3', 'h', 'd1')).toBe(false)
    for (const m of exercise('sq-3').accept) expect(inside('a3', 'h', m.slice(2)), m).toBe(true)
    // sq-7: peón g3 (faltan 2: e–g × 1–3). El rey de e1 ya está en el borde; alejarse (d2) lo deja afuera.
    expect(inside('g3', 'a', 'e1')).toBe(true)
    for (const m of exercise('sq-7').accept) expect(inside('g3', 'a', m.slice(2)), m).toBe(true)
    expect(inside('g3', 'a', 'd2')).toBe(false)
  })
  it('finales de peones: las casillas que el texto dice que controla el rey', () => {
    const king = (id: string, uci: string, sq: string) => expect(play(id, uci).attackers(sq as Square, 'w'), `${id} ${sq}`).toContain(uci.slice(2, 4))
    king('op-1', 'c5d6', 'e6')
    king('op-1', 'c5d6', 'e7')
    king('op-2', 'g7f6', 'e6')
    king('op-2', 'g7f6', 'e7')
    king('op-2', 'g7f6', 'e5') // protege al peón
    king('op-3', 'c4d5', 'e5')
    king('op-3', 'c4d5', 'e6')
    king('op-3', 'c4d5', 'e4') // protege al peón
    const black = (id: string, uci: string, sq: string) => expect(play(id, uci).attackers(sq as Square, 'b'), `${id} ${sq}`).toContain(uci.slice(2, 4))
    black('hd-1', 'g5f6', 'e5')
    black('hd-1', 'g5f6', 'e6')
    for (const s of ['e6', 'e7', 'e8']) {
      black('hd-2', 'g6f7', s)
      black('hd-3', 'c6d7', s)
    }
    // El rey negro de d5 ataca al peón de e5 en op-2 (el texto lo dice); g6 no toca la columna e en hd-2.
    expect(attackers(exercise('op-2').fen, 'e5', 'b')).toContain('d5')
    expect(new Chess(exercise('hd-2').fen).attackers('e6', 'b')).not.toContain('g6')
  })
})
