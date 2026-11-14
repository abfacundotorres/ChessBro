import { Chess, type Square } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { lintNote } from '../../test/noteLint'
import { EXTRAS } from '../openingExtras'
import { MORE_MODELS } from '../modelGames'
import { DEEP_LINES } from '../openingLines'

const model = (id: string) => EXTRAS[id]!.model!
const at = (moves: string[], i: number) => {
  const c = new Chess()
  for (let k = 0; k <= i; k++) c.move(moves[k]!)
  return c
}
const att = (c: Chess, sq: string, by: 'w' | 'b') => c.attackers(sq as Square, by)

describe('notas de jugadas: afirmaciones comprobables', () => {
  it('ninguna nota de las 21 partidas antiguas, las 29 nuevas y las líneas a fondo afirma algo falso (patrones)', () => {
    const all: [string, string[], Record<number, string>][] = []
    for (const [id, x] of Object.entries(EXTRAS)) if (x.model) all.push([`${id} (antigua)`, x.model.moves, x.model.notes])
    for (const [id, list] of Object.entries(MORE_MODELS)) list.forEach((g, i) => all.push([`${id}#${i}`, g.moves, g.notes]))
    for (const l of DEEP_LINES) all.push([`${l.id} (línea)`, l.moves, l.notes ?? {}])
    const problems: string[] = []
    let n = 0
    for (const [id, moves, notes] of all) {
      for (const [k, t] of Object.entries(notes)) {
        n++
        for (const p of lintNote(moves, Number(k), t)) problems.push(`${id} jugada ${k} (${moves[Number(k)]}): ${p} — «${t}»`)
      }
    }
    expect(n).toBeGreaterThan(2000)
    expect(problems).toEqual([])
  })

  it('el detector detecta lo que tiene que detectar', () => {
    const m = ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6']
    expect(lintNote(m, 4, 'Bc4 ataca el peón de f7.')).toEqual([]) // el alfil de c4 ataca f7
    expect(lintNote(m, 4, 'Bc4 ataca el peón de h7.').length).toBe(1) // no lo ataca
    expect(lintNote(m, 4, 'Bc4 ataca el caballo de f7.').length).toBe(1) // en f7 hay un peón
    expect(lintNote(m, 2, 'Enrocás: torres conectadas.').length).toBe(1) // las torres no están en la misma fila
  })
})

describe('notas antiguas que se corrigieron: lo que dicen ahora es cierto', () => {
  it('Gambito de Dama: el alfil que captura en f6 sale de h4 (no de g5)', () => {
    const g = model('gambito-dama')
    expect(g.notes[16]).toContain('h4')
    expect(g.moves[16]).toBe('Bxf6')
    expect(at(g.moves, 15).get('h4' as Square)).toMatchObject({ type: 'b', color: 'w' })
    expect(at(g.moves, 15).get('g5' as Square)).toBeFalsy()
    // el caballo de f6 defendía d5
    expect(att(at(g.moves, 15), 'd5', 'b')).toContain('f6')
  })
  it('Gambito de Dama: g3 prepara el fianchetto (el alfil todavía está en f1)', () => {
    const g = model('gambito-dama')
    expect(g.moves[20]).toBe('g3')
    expect(at(g.moves, 20).get('f1' as Square)).toMatchObject({ type: 'b', color: 'w' })
  })
  it('Caro-Kann: …Da5+ es jaque y al caballo de g8 todavía le falta salir al alfil de f8', () => {
    const g = model('caro-kann')
    expect(at(g.moves, 21).inCheck()).toBe(true)
    expect(at(g.moves, 25).get('f8' as Square)).toMatchObject({ type: 'b', color: 'b' }) // 13…Cgf6: el alfil sigue en f8
    expect(g.notes[25]).toContain('alfil de f8')
  })
  it('Philidor: la torre de e8 está detrás del alfil de e7 y no presiona e4', () => {
    const g = model('philidor')
    const c = at(g.moves, 17)
    expect(c.get('e7' as Square)).toMatchObject({ type: 'b', color: 'b' })
    expect(c.get('e8' as Square)).toMatchObject({ type: 'r', color: 'b' })
    expect(att(c, 'e4', 'b')).not.toContain('e8')
  })
  it('Pirc: …Ag4 presiona f3, pero el alfil de e2 lo protege: no hay clavada contra la dama', () => {
    const g = model('pirc-moderna')
    const c = at(g.moves, 11)
    expect(att(c, 'f3', 'b')).toContain('g4')
    expect(att(c, 'f3', 'w')).toContain('e2')
    expect(c.get('e2' as Square)).toMatchObject({ type: 'b', color: 'w' })
  })
  it('Vienesa: f4 ataca e5 y el peón de f4 no tiene protección (es un gambito)', () => {
    const g = model('viena')
    const c = at(g.moves, 4)
    expect(att(c, 'e5', 'w')).toContain('f4')
    expect(att(c, 'f4', 'w')).toEqual([])
  })
  it('India de Rey: con …Rh7 el rey queda detrás de los peones de f5 y g6', () => {
    const g = model('india-rey')
    const c = at(g.moves, 31)
    expect(c.get('h7' as Square)).toMatchObject({ type: 'k', color: 'b' })
    expect(c.get('f5' as Square)).toMatchObject({ type: 'p', color: 'b' })
    expect(c.get('g6' as Square)).toMatchObject({ type: 'p', color: 'b' })
  })
  it('Cuatro Caballos: el caballo de e6 atacaba el alfil de g5, que se retira a c1', () => {
    const g = model('cuatro-caballos')
    expect(at(g.moves, 19).get('g5' as Square)).toMatchObject({ type: 'b', color: 'w' })
    expect(att(at(g.moves, 19), 'g5', 'b')).toContain('e6')
    expect(g.moves[20]).toBe('Bc1')
  })
})
