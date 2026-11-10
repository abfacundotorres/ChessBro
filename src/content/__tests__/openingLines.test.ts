import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { DEEP_CARDS, DEEP_LINES, deepConflicts, deepLinesOf } from '../openingLines'
import { OPENINGS, openingById } from '../openings'
import { REPERTOIRE } from '../repertoire'
import { ALL_CARDS, REP_CARDS, anyLineById } from '../repertoireCards'
import { drillItems } from '../../engine/repertoire'

describe('líneas de la biblioteca de aperturas', () => {
  it('cubre las 10 aperturas principales con 3 o 4 líneas cada una', () => {
    const ids = [...new Set(DEEP_LINES.map((l) => l.opening))]
    expect(ids.sort()).toEqual(['caro-kann', 'escandinava', 'escocesa', 'francesa', 'gambito-dama', 'india-rey', 'italiana', 'london', 'ruy', 'siciliana'].sort())
    for (const id of ids) expect(deepLinesOf(id!).length, id).toBeGreaterThanOrEqual(3)
    expect(DEEP_LINES.length).toBeGreaterThanOrEqual(39)
  })

  it('los ids son únicos y no chocan con el repertorio', () => {
    const ids = DEEP_LINES.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
    const rep = new Set(REPERTOIRE.map((l) => l.id))
    for (const id of ids) expect(rep.has(id), id).toBe(false)
  })

  it.each(DEEP_LINES.map((l) => [l.id, l] as const))('%s: jugadas legales, una nota por jugada y bando correcto', (_id, l) => {
    const c = new Chess()
    for (const m of l.moves) expect(() => c.move(m), m).not.toThrow()
    expect(l.moves.length).toBeGreaterThanOrEqual(12)
    for (let i = 0; i < l.moves.length; i++) expect(l.notes?.[i]?.length ?? 0, `${l.id} nota ${i}`).toBeGreaterThan(15)
    const o = openingById(l.opening!)!
    expect(l.color).toBe(o.side === 'blancas' ? 'w' : 'b')
    expect(l.idea.length).toBeGreaterThan(60)
    expect(l.plan.length).toBeGreaterThanOrEqual(2)
    expect(l.quiz?.length ?? 0).toBeGreaterThanOrEqual(1)
    for (const qz of l.quiz ?? []) {
      expect(qz.options.length).toBeGreaterThanOrEqual(3)
      expect(qz.answer).toBeGreaterThanOrEqual(0)
      expect(qz.answer).toBeLessThan(qz.options.length)
      expect(new Set(qz.options).size).toBe(qz.options.length)
      expect(qz.why.length).toBeGreaterThan(20)
    }
  })

  it('dentro de una apertura las líneas no se contradicen (una jugada propia por posición)', () => {
    expect(deepConflicts()).toEqual([])
  })

  it('las tarjetas no chocan con las del repertorio y se encuentran por id', () => {
    const rep = new Set(REP_CARDS.map((c) => c.id))
    for (const c of DEEP_CARDS) expect(rep.has(c.id)).toBe(false)
    expect(ALL_CARDS.length).toBe(REP_CARDS.length + DEEP_CARDS.length)
    expect(anyLineById('ruy-cerrada')?.opening).toBe('ruy')
    expect(anyLineById('w-petroff')).toBeDefined()
  })

  it('las posiciones de ejercicio son de tu bando, no se repiten y traen su explicación', () => {
    for (const o of OPENINGS) {
      const items = drillItems(deepLinesOf(o.id), `${o.id}:`)
      const ids = items.map((i) => i.cardId)
      expect(new Set(ids).size).toBe(ids.length)
      for (const it of items) {
        expect(new Chess(it.fen).turn()).toBe(it.color)
        expect(it.why.length).toBeGreaterThan(15)
      }
    }
    expect(drillItems(deepLinesOf('ruy'), 'ruy:').length).toBeGreaterThan(10)
  })
})
