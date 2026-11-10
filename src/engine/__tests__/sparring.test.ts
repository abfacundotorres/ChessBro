import { describe, expect, it } from 'vitest'
import { choices, isMyTurn, lineFor, noteOf, pickRival, rivalBranches } from '../sparring'
import { DEEP_LINES, deepLinesOf } from '../../content/openingLines'

const ruy = deepLinesOf('ruy')
const ids = (cs: { lineIds: string[] }[]) => cs.map((c) => c.lineIds.sort())

describe('práctica contra el rival', () => {
  it('en el comienzo todas las líneas comparten la jugada y el rival se desvía después', () => {
    expect(choices(ruy, []).map((c) => c.san)).toEqual(['e4'])
    expect(choices(ruy, ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5']).map((c) => c.san).sort()).toEqual(['Nf6', 'Nge7', 'a6', 'd6'])
  })
  it('en tu turno hay una sola jugada del libro, en todas las aperturas', () => {
    for (const o of new Set(DEEP_LINES.map((l) => l.opening!))) {
      const ls = deepLinesOf(o)
      const color = ls[0]!.color
      for (const l of ls) {
        for (let i = 0; i < l.moves.length; i++) {
          const played = l.moves.slice(0, i)
          if (isMyTurn(color, played)) expect(choices(ls, played).length, `${l.id} ${i}`).toBe(1)
        }
      }
    }
  })
  it('sigue la rama elegida', () => {
    const c = choices(ruy, ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'd6'])
    expect(c.map((x) => x.san)).toEqual(['d4'])
    expect(ids(c)).toEqual([['ruy-steinitz']])
  })
  it('devuelve la nota y la línea de lo jugado', () => {
    const played = ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'd6']
    expect(lineFor(ruy, played)?.id).toBe('ruy-steinitz')
    expect(noteOf(ruy, played)).toContain('Steinitz')
    expect(noteOf(ruy, [])).toBeUndefined()
  })
  it('sortea entre ramas y evita repetir la anterior si puede', () => {
    const opts = choices(ruy, ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'])
    expect(pickRival(opts, () => 0)!.san).toBe(opts[0]!.san)
    expect(pickRival(opts, () => 0.99)!.san).toBe(opts.at(-1)!.san)
    expect(pickRival(opts, () => 0, opts[0]!.san)!.san).not.toBe(opts[0]!.san)
    expect(pickRival([], () => 0)).toBeNull()
  })
  it('cuenta las ramas del rival', () => {
    expect(rivalBranches(ruy, 'w')).toBeGreaterThan(3)
  })
})
