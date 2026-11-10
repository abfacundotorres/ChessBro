import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { EXTRAS, modelOf, puzzlesOf, toPuzzle } from '../openingExtras'
import { deepLinesOf } from '../openingLines'
import { openingById } from '../openings'

const ids = Object.keys(EXTRAS)

describe('planes, errores del rival y partidas de ejemplo', () => {
  it('hay contenido para las aperturas con líneas a fondo', () => {
    expect(ids.length).toBeGreaterThanOrEqual(10)
    for (const id of ids) {
      expect(openingById(id), id).toBeDefined()
      expect(deepLinesOf(id).length, id).toBeGreaterThan(0)
    }
  })

  it('los ids de ejercicios son únicos', () => {
    const all = ids.flatMap((id) => EXTRAS[id]!.items.map((i) => i.id))
    expect(new Set(all).size).toBe(all.length)
  })

  it.each(ids.map((id) => [id] as const))('%s: ejercicios legales, del bando correcto y con explicación', (id) => {
    const color = deepLinesOf(id)[0]!.color
    const items = EXTRAS[id]!.items
    expect(items.some((i) => i.kind === 'plan'), 'al menos un plan').toBe(true)
    for (const it of items) {
      const p = toPuzzle(it) // lanza si algo es ilegal
      expect(p.color, `${it.id} bando`).toBe(color)
      expect(new Chess(p.fen).isGameOver(), it.id).toBe(false)
      expect(it.title.length).toBeGreaterThan(8)
      expect(it.prompt.length).toBeGreaterThan(8)
      expect(it.why.length, `${it.id} explicación`).toBeGreaterThan(50)
      expect(p.alt).not.toContain(p.uci)
      if (it.kind === 'punish') expect(it.moves.length, it.id).toBeGreaterThan(2)
    }
  })

  it.each(ids.filter((id) => modelOf(id)).map((id) => [id] as const))('%s: partida de ejemplo legal, comentada y con el bando correcto', (id) => {
    const g = modelOf(id)!
    const c = new Chess()
    for (const m of g.moves) expect(() => c.move(m), m).not.toThrow()
    expect(g.color).toBe(deepLinesOf(id)[0]!.color)
    expect(g.moves.length).toBeGreaterThanOrEqual(24)
    const keys = Object.keys(g.notes).map(Number)
    expect(keys.length).toBeGreaterThanOrEqual(5)
    for (const k of keys) {
      expect(k).toBeGreaterThanOrEqual(0)
      expect(k).toBeLessThan(g.moves.length)
      expect(g.notes[k]!.length).toBeGreaterThan(30)
    }
    expect(g.summary.length).toBeGreaterThan(40)
  })

  it('puzzlesOf filtra por tipo', () => {
    const id = ids[0]!
    expect(puzzlesOf(id).length).toBe(EXTRAS[id]!.items.length)
    expect(puzzlesOf(id, 'plan').every((p) => p.kind === 'plan')).toBe(true)
  })
})
