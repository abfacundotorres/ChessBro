import { Chess, type PieceSymbol, type Square } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { deepLinesOf } from '../openingLines'
import { ENGINE_GAME_SOURCES, MORE_MODELS } from '../modelGames'
import { OPENINGS } from '../openings'

/** Posición después de la jugada `i` (0 = primera jugada de las blancas). */
const at = (moves: string[], i: number) => {
  const c = new Chess()
  for (let k = 0; k <= i; k++) c.move(moves[k]!)
  return c
}
const att = (c: Chess, sq: string, by: 'w' | 'b') => c.attackers(sq as Square, by)
const has = (c: Chess, sq: string, type: PieceSymbol, color: 'w' | 'b') => expect(c.get(sq as Square), sq).toMatchObject({ type, color })

type Claims = (g: (i: number) => Chess) => void

/**
 * Lo que afirman las notas sobre el tablero, jugada por jugada (índice de la jugada en la partida).
 * Una afirmación por nota que diga algo comprobable: quién ataca o defiende qué, qué hay en una casilla, qué se capturó.
 */
const CLAIMS: Record<string, Claims[]> = {
  'evans#0': [
    (g) => {
      expect(att(g(14), 'b6', 'w')).toContain('a5') // a5 ataca al alfil de b6
      has(g(14), 'b6', 'b', 'b')
    },
    (g) => {
      has(g(15), 'a7', 'b', 'b') // el alfil retrocede a a7
      expect(att(g(15), 'f2', 'b')).toContain('a7') // y sigue apuntando a f2
      expect(att(g(15), 'b6', 'w')).toContain('a5') // pero b6 sigue controlada por a5
    },
    (g) => {
      expect(att(g(14), 'b4', 'b')).toContain('c6') // el caballo de c6 ataca b4...
      expect(att(g(16), 'b4', 'w')).toContain('b1') // ...y Rb1 lo protege
    },
    (g) => expect(att(g(18), 'g4', 'w')).toContain('h3'), // h3 controla g4
    (g) => {
      expect(g(20).get('g1')).toMatchObject({ type: 'k' })
      has(g(20), 'f1', 'r', 'w')
    },
    (g) => expect(att(g(21), 'c4', 'b')).toContain('e6'), // el alfil negro ataca el de c4
    (g) => expect(att(g(22), 'a7', 'w')).toContain('e3'), // Be3 ataca a7
    (g) => expect(g(24).history({ verbose: true }).at(-1)!.captured).toBe('b'), // Bxa7 captura un alfil
    (g) => {
      expect(att(g(26), 'h6', 'w')).toContain('d2') // Qd2 apunta a h6
      for (const s of ['c1', 'd1', 'e1']) expect(g(26).get(s as Square), s).toBeFalsy()
      has(g(26), 'b1', 'r', 'w')
      has(g(26), 'f1', 'r', 'w') // torres conectadas
    },
    (g) => {
      expect(att(g(28), 'e6', 'w')).toContain('b3') // Bb3 sigue enfrentando al alfil de e6
      expect(att(g(29), 'b3', 'w')).toContain('b1') // y la torre de b1 puede recapturar en b3
    },
    (g) => {
      has(g(30), 'b3', 'r', 'w')
      expect(att(g(30), 'b4', 'w')).toContain('b3') // la torre protege b4
    },
  ],
  'cuatro-caballos#0': [
    (g) => {
      has(g(10), 'e5', 'n', 'w')
      expect(att(g(10), 'e5', 'b')).toContain('c6') // el caballo queda ofrecido
    },
    (g) => expect(g(11).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'n', color: 'b' }), // las negras toman el caballo
    (g) => {
      expect(att(g(12), 'c5', 'w')).toContain('d4') // d4 ataca el alfil de c5...
      expect(att(g(12), 'e5', 'w')).toContain('d4') // ...y el caballo de e5
    },
    (g) => {
      has(g(13), 'd6', 'b', 'b')
      expect(att(g(13), 'e5', 'b')).toContain('d6') // protege al caballo
    },
    (g) => expect(att(g(14), 'e5', 'w')).toContain('f4'), // f4 ataca e5
    (g) => {
      has(g(15), 'c6', 'n', 'b')
      expect(att(g(15), 'd4', 'b')).toContain('c6')
    },
    (g) => {
      expect(att(g(16), 'd6', 'w')).toContain('e5')
      expect(att(g(16), 'f6', 'w')).toContain('e5')
    },
    (g) => expect(att(g(18), 'c6', 'w')).toContain('d5'),
    (g) => {
      expect(g(19).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'p', piece: 'n', to: 'd5' })
      expect(att(g(19), 'f4', 'b')).toContain('d5')
      expect(att(g(19), 'c3', 'b')).toContain('d5')
    },
    (g) => {
      expect(att(g(20), 'c7', 'w')).toContain('d5')
      expect(att(g(20), 'e7', 'w')).toContain('d5')
    },
    (g) => expect(att(g(21), 'e5', 'b')).toContain('d6'), // el peón de d6 ataca e5
    (g) => {
      expect(att(g(22), 'e5', 'w')).toEqual([]) // f5 deja e5 sin protección
      expect(g(22).history({ verbose: true }).at(-1)!.to).toBe('f5')
    },
    (g) => {
      expect(att(g(24), 'e7', 'w')).toContain('f6')
      expect(att(g(24), 'g7', 'w')).toContain('f6')
    },
    (g) => {
      const last = g(26).history({ verbose: true }).at(-1)!
      expect(last.captured).toBe('b')
      expect(g(26).inCheck()).toBe(true)
      has(g(27), 'f6', 'p', 'b') // peones del enroque rotos: f7, f6 y h7, sin peón en g
      has(g(27), 'f7', 'p', 'b')
      expect(g(27).get('g7' as Square)).toBeFalsy()
    },
    (g) => expect(att(g(28), 'f8', 'w')).toContain('h6'),
    (g) => {
      expect(g(29).inCheck()).toBe(true)
      expect(att(g(29), 'b2', 'b')).toContain('d4')
    },
  ],
  'italiana#0': [
    (g) => expect(att(g(13), 'c4', 'b')).toContain('a5'), // el caballo de a5 ataca el alfil de c4
    (g) => {
      has(g(14), 'b5', 'b', 'w')
      has(g(14), 'a5', 'n', 'b') // el caballo queda en el borde
    },
    (g) => {
      has(g(16), 'a4', 'b', 'w')
      expect(att(g(16), 'e8', 'w')).toContain('a4') // la diagonal a4–e8 está abierta
    },
    (g) => {
      expect(att(g(18), 'c5', 'w')).toContain('d4')
      expect(att(g(18), 'e5', 'w')).toContain('d4')
    },
    (g) => {
      has(g(20), 'd4', 'p', 'w')
      has(g(20), 'e4', 'p', 'w')
      expect(att(g(20), 'e5', 'w')).toContain('d4')
    },
    (g) => expect(att(g(21), 'a4', 'b')).toContain('b5'),
    (g) => {
      expect(att(g(22), 'e4', 'w')).toContain('c2') // Bc2 protege e4 por la diagonal
      expect(g(22).get('d3' as Square)).toBeFalsy()
    },
    (g) => {
      expect(att(g(23), 'f3', 'b')).toContain('g4')
      has(g(23), 'd1', 'q', 'w') // la dama queda detrás del caballo
      expect(g(23).get('e2' as Square)).toBeFalsy()
    },
    (g) => {
      has(g(24), 'd5', 'p', 'w')
      expect(att(g(24), 'c6', 'w')).toContain('d5')
      expect(att(g(24), 'e6', 'w')).toContain('d5')
    },
    (g) => {
      expect(att(g(26), 'b5', 'w')).toContain('d3')
      expect(att(g(26), 'b5', 'b')).toContain('a6')
    },
    (g) => {
      expect(att(g(28), 'a5', 'w')).toContain('b4')
      expect(att(g(28), 'c5', 'w')).toContain('b4')
    },
    (g) => {
      expect(att(g(29), 'b4', 'b')).toContain('a5')
      expect(att(g(29), 'b4', 'w')).toEqual([]) // b4 sin protección
    },
    (g) => {
      expect(att(g(30), 'b4', 'w')).toContain('d2')
      has(g(30), 'd2', 'b', 'w')
    },
  ],
  'italiana#1': [
    (g) => {
      has(g(18), 'f1', 'n', 'w')
      expect(att(g(18), 'e3', 'w')).toContain('f1') // el caballo mira e3 y g3
      expect(att(g(18), 'g3', 'w')).toContain('f1')
    },
    (g) => expect(att(g(19), 'b3', 'b')).toContain('e6'),
    (g) => expect(att(g(20), 'a7', 'w')).toContain('e3'),
    (g) => expect(g(21).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'b', color: 'b' }),
    (g) => {
      has(g(22), 'e3', 'n', 'w')
      expect(g(22).history({ verbose: true }).at(-1)!.captured).toBe('b')
    },
    (g) => expect(g(23).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'b', color: 'b' }),
    (g) => {
      expect(att(g(24), 'b7', 'w')).toContain('b3')
      expect(att(g(24), 'b7', 'b')).toEqual([]) // b7 sin protección
    },
    (g) => expect(att(g(26), 'b5', 'w')).toContain('a4'),
    (g) => expect(att(g(28), 'b6', 'w')).toContain('a5'),
    (g) => expect(att(g(30), 'g4', 'w')).toContain('h3'),
    (g) => {
      has(g(31), 'h5', 'n', 'b')
      expect(att(g(31), 'f4', 'b')).toContain('h5')
      expect(att(g(31), 'g3', 'b')).toContain('h5')
    },
    (g) => {
      has(g(32), 'd1', 'r', 'w')
      has(g(32), 'd3', 'p', 'w')
      expect(g(32).get('d2' as Square)).toBeFalsy()
    },
  ],
  'ruy#0': [
    (g) => expect(att(g(16), 'd4', 'w')).toContain('c3'),
    (g) => {
      expect(att(g(18), 'e4', 'w')).toContain('d2')
      has(g(18), 'd2', 'n', 'w')
      has(g(18), 'e4', 'n', 'b')
      expect(att(g(18), 'e4', 'b')).toContain('d5') // el caballo de e4 lo protege el peón de d5
    },
    (g) => expect(att(g(19), 'b3', 'b')).toContain('c5'),
    (g) => {
      expect(att(g(20), 'h7', 'w')).toContain('c2') // diagonal abierta hasta h7
      expect(g(20).get('e4' as Square)).toBeFalsy()
    },
    (g) => expect(att(g(21), 'c3', 'b')).toContain('d4'),
    (g) => {
      expect(g(22).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'p', piece: 'n', to: 'd4' })
      expect(att(g(22), 'c6', 'w')).toContain('d4')
      expect(att(g(22), 'c6', 'b')).toEqual([]) // el caballo de c6 sin protección
    },
    (g) => expect(att(g(24), 'c5', 'w')).toContain('d4'),
    (g) => {
      has(g(25), 'd4', 'q', 'b')
      expect(att(g(25), 'e5', 'b')).toContain('d4')
      expect(att(g(25), 'e5', 'w')).toEqual([])
    },
    (g) => {
      expect(att(g(26), 'd4', 'w')).toContain('f3')
      expect(att(g(26), 'e5', 'w')).toContain('f3')
    },
    (g) => expect(g(27).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'q', piece: 'q', color: 'b' }),
    (g) => {
      has(g(28), 'd1', 'r', 'w')
      expect(g(28).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'q', piece: 'r', color: 'w' })
      // sin damas en el tablero
      for (const row of g(28).board()) for (const p of row) expect(p?.type, 'sin damas').not.toBe('q')
    },
    (g) => {
      expect(att(g(30), 'e6', 'w')).toContain('g5')
      expect(att(g(30), 'f7', 'w')).toContain('g5')
      expect(att(g(30), 'h7', 'w')).toContain('g5')
    },
    (g) => {
      const c = g(32)
      const bishops = (color: 'w' | 'b') => c.board().flat().filter((p) => p && p.type === 'b' && p.color === color).length
      expect(bishops('w')).toBe(2) // pareja de alfiles blanca
      expect(bishops('b')).toBe(1)
      expect(c.history({ verbose: true }).at(-1)).toMatchObject({ captured: 'b', piece: 'b', to: 'g5' })
    },
  ],
  'ruy#1': [
    (g) => {
      has(g(15), 'd8', 'k', 'b')
      expect(g(15).fen().split(' ')[2]).not.toMatch(/[kq]/) // las negras ya no pueden enrocar
    },
    (g) => has(g(16), 'c3', 'n', 'w'),
    (g) => expect(att(g(18), 'b5', 'w')).toContain('a4'),
    (g) => {
      expect(g(20).inCheck()).toBe(true)
      for (const r of [2, 3, 4, 5, 6, 7]) expect(g(20).get(`d${r}` as Square), `d${r}`).toBeFalsy() // columna d abierta
    },
    (g) => {
      // cuatro peones blancos contra tres negros en el flanco de rey (columnas e a h)
      const count = (c: Chess, color: 'w' | 'b') => c.board().flat().filter((p) => p && p.type === 'p' && p.color === color && 'efgh'.includes(p.square[0]!)).length
      expect(count(g(22), 'w')).toBe(4)
      expect(count(g(22), 'b')).toBe(3)
    },
    (g) => {
      has(g(23), 'f5', 'n', 'b')
      expect(att(g(24), 'f5', 'w')).toContain('g4')
    },
    (g) => {
      has(g(26), 'd4', 'n', 'w')
      expect(att(g(26), 'c6', 'w')).toContain('d4')
      expect(att(g(26), 'e6', 'w')).toContain('d4')
    },
    (g) => expect(att(g(28), 'e5', 'w')).toContain('e1'),
    (g) => {
      expect(att(g(30), 'a5', 'w')).toContain('b3')
      expect(att(g(30), 'a5', 'b')).toEqual([])
    },
    (g) => {
      expect(att(g(31), 'g4', 'b')).toContain('h5') // el peón de h5 ataca g4
      expect(att(g(32), 'g4', 'w')).toContain('f3')
    },
    (g) => {
      // las negras tienen los peones de c doblados
      const cPawns = g(15).board().flat().filter((p) => p && p.type === 'p' && p.color === 'b' && p.square[0] === 'c').length
      expect(cPawns).toBe(2)
    },
  ],
  'escocesa#0': [
    (g) => {
      expect(att(g(15), 'e4', 'b')).toContain('g6')
      expect(att(g(15), 'g2', 'b')).toContain('g6')
    },
    (g) => {
      has(g(16), 'g1', 'k', 'w')
      expect(att(g(16), 'g2', 'w')).toContain('g1') // el rey protege g2
      expect(g(16).history({ verbose: true }).at(-1)!.san).toBe('O-O')
    },
    (g) => expect(att(g(17), 'e4', 'b')).toContain('d5'),
    (g) => expect(att(g(18), 'g6', 'w')).toContain('h5'),
    (g) => {
      expect(g(19).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'p', piece: 'q', to: 'e4' })
      expect(att(g(19), 'd4', 'b')).toContain('e4')
      expect(att(g(19), 'e3', 'b')).toContain('e4')
    },
    (g) => {
      has(g(20), 'd2', 'n', 'w')
      expect(att(g(20), 'e4', 'w')).toContain('d2')
    },
    (g) => {
      expect(att(g(22), 'e5', 'w')).toContain('f3')
      expect(att(g(22), 'e5', 'b')).toEqual([])
    },
    (g) => {
      expect(g(24).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'n', piece: 'n', to: 'e5' })
      expect(att(g(24), 'd3', 'w')).toContain('e5')
      expect(att(g(24), 'd3', 'b')).toEqual([])
    },
    (g) => {
      expect(att(g(26), 'e7', 'w')).toContain('c5')
      expect(att(g(26), 'a7', 'w')).toContain('c5')
    },
    (g) => {
      has(g(29), 'd6', 'p', 'b')
      has(g(29), 'd5', 'p', 'b') // peones doblados en la columna d
      expect(g(28).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'b', piece: 'b' })
    },
    (g) => {
      has(g(30), 'e1', 'r', 'w')
      expect(att(g(30), 'e7', 'w')).toContain('e1')
    },
  ],
  'alfil#0': [
    (g) => {
      expect(g(12).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'p', piece: 'p', to: 'd5' })
      expect(att(g(12), 'c6', 'w')).toContain('d5')
    },
    (g) => has(g(13), 'd5', 'n', 'b'),
    (g) => {
      expect(att(g(14), 'e5', 'w')).toContain('e1')
      expect(att(g(14), 'e5', 'b')).toContain('d6') // lo protege el alfil de d6
    },
    (g) => expect(att(g(16), 'd8', 'w')).toContain('g5'),
    (g) => expect(att(g(17), 'g5', 'b')).toContain('f6'),
    (g) => {
      expect(att(g(18), 'd5', 'w')).toContain('c4')
      has(g(18), 'g5', 'b', 'w') // el alfil sigue en g5, atacado por f6
    },
    (g) => {
      expect(g(19).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'b', piece: 'p', color: 'b' })
      expect(att(g(19), 'd5', 'w')).toContain('c4') // el peón de c4 sigue atacando d5
    },
    (g) => {
      expect(g(20).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'n', piece: 'p', to: 'd5' })
      expect(att(g(20), 'c6', 'w')).toContain('d5')
    },
    (g) => expect(att(g(21), 'f3', 'b')).toContain('g4'),
    (g) => {
      expect(g(22).inCheck()).toBe(true)
      expect(att(g(22), 'g8', 'w')).toContain('b3') // jaque del alfil de b3, descubierto
      expect(g(22).history({ verbose: true }).at(-1)).toMatchObject({ piece: 'p', captured: 'p', to: 'c6' })
    },
    (g) => {
      expect(att(g(24), 'a8', 'w')).toContain('b7')
      expect(att(g(24), 'a8', 'b')).toEqual([])
    },
    (g) => {
      has(g(26), 'd2', 'n', 'w')
      expect(att(g(25), 'f3', 'b')).toContain('g4') // el caballo estaba atacado por g4
    },
    (g) => {
      expect(g(28).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'p', piece: 'q', to: 'g4' })
      expect(att(g(28), 'g7', 'w')).toContain('g4')
    },
  ],
  'viena#0': [
    (g) => {
      expect(att(g(14), 'c5', 'w')).toContain('a4')
      expect(att(g(14), 'f2', 'b')).toContain('c5')
    },
    (g) => expect(att(g(15), 'f2', 'b')).toContain('b6'),
    (g) => expect(g(16).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'b', piece: 'n', to: 'b6' }),
    (g) => {
      has(g(17), 'b6', 'p', 'b')
      has(g(17), 'b7', 'p', 'b') // peones doblados en la columna b
      for (const r of [1, 2, 3, 4, 5, 6, 7, 8]) expect(g(17).get(`a${r}` as Square)?.color === 'b' && g(17).get(`a${r}` as Square)?.type === 'p', `a${r}`).toBe(false)
    },
    (g) => expect(att(g(18), 'e5', 'w')).toContain('f4'),
    (g) => expect(att(g(19), 'e2', 'b')).toContain('g4'),
    (g) => expect(att(g(20), 'g4', 'w')).toContain('h3'),
    (g) => expect(g(21).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'n', piece: 'b', color: 'b' }),
    (g) => {
      expect(g(22).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'b', piece: 'q', to: 'e2' })
      expect(att(g(22), 'd3', 'w')).toContain('e2')
    },
    (g) => {
      expect(att(g(24), 'f4', 'w')).toContain('f2')
      expect(att(g(24), 'a7', 'w')).toContain('f2')
    },
    (g) => expect(att(g(26), 'f5', 'w')).toContain('g4'),
    (g) => {
      expect(att(g(28), 'e6', 'w')).toContain('f5')
      expect(att(g(28), 'g6', 'w')).toContain('f5')
    },
    (g) => {
      has(g(29), 'b3', 'p', 'b')
      expect(att(g(29), 'b3', 'w')).toContain('c2') // ofrecido: c2 lo puede capturar
    },
    (g) => {
      expect(g(30).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'p', piece: 'p', to: 'b3' })
      expect(att(g(29), 'a2', 'b')).toContain('b3')
      expect(att(g(29), 'c2', 'b')).toContain('b3')
    },
    (g) => {
      expect(att(g(31), 'd3', 'b')).toContain('b4')
      expect(att(g(31), 'd3', 'w')).toEqual([])
    },
    (g) => expect(att(g(32), 'd3', 'w')).toContain('e2'),
    (g) => {
      expect(g(33).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'p', piece: 'r', color: 'b', to: 'a2' })
      expect(att(g(33), 'a1', 'b')).toContain('a2')
    },
    (g) => expect(g(34).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'r', piece: 'r', color: 'w' }),
    (g) => {
      has(g(36), 'e3', 'b', 'w')
      expect(att(g(36), 'b6', 'w')).toContain('e3')
    },
  ],
  'gambito-rey#0': [
    (g) => {
      expect(att(g(13), 'c4', 'b')).toContain('d5')
      expect(att(g(13), 'c4', 'w')).toEqual([])
    },
    (g) => {
      const last = g(14).history({ verbose: true }).at(-1)!
      expect(last.flags).toContain('e') // captura al paso
      expect(att(g(14), 'c4', 'b')).toEqual([]) // el alfil ya no está atacado
      expect(att(g(14), 'c7', 'w')).toContain('d6')
      expect(att(g(14), 'e7', 'w')).toContain('d6')
    },
    (g) => has(g(16), 'c3', 'n', 'w'),
    (g) => {
      expect(att(g(18), 'e7', 'w')).toContain('d5')
      expect(att(g(18), 'c7', 'w')).toContain('d5')
    },
    (g) => expect(att(g(20), 'g4', 'w')).toContain('h3'),
    (g) => {
      expect(g(22).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'b', piece: 'n', to: 'e7' })
      expect(g(22).inCheck()).toBe(true)
    },
    (g) => expect(att(g(24), 'g5', 'w')).toContain('h4'),
    (g) => expect(att(g(25), 'f3', 'b')).toContain('g4'),
    (g) => {
      expect(att(g(26), 'h6', 'w')).toContain('g5')
      expect(att(g(26), 'h6', 'b')).toEqual([])
    },
    (g) => expect(att(g(28), 'd4', 'w')).toContain('c3'),
    (g) => {
      expect(att(g(29), 'c4', 'b')).toContain('e5')
      expect(att(g(29), 'f3', 'b')).toContain('e5')
    },
    (g) => expect(g(30).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'n', piece: 'p', to: 'e5' }),
    (g) => {
      expect(g(31).inCheck()).toBe(true)
      expect(att(g(31), 'c4', 'b')).toContain('c5')
    },
    (g) => {
      has(g(32), 'f2', 'r', 'w')
      expect(att(g(32), 'c4', 'b')).toContain('c5')
      expect(att(g(32), 'c4', 'w')).toEqual([])
    },
    (g) => expect(g(33).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'b', piece: 'q', color: 'b' }),
    (g) => {
      expect(att(g(34), 'c4', 'w')).toContain('d2')
      expect(att(g(34), 'c4', 'b')).toEqual([])
      expect(att(g(34), 'd1', 'b')).toContain('g4')
    },
    (g) => expect(g(36).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'q', piece: 'n', to: 'c4' }),
  ],
  'petroff#0': [
    (g) => expect(att(g(17), 'e4', 'b')).toContain('d5'),
    (g) => {
      expect(att(g(18), 'e4', 'w')).toContain('c3')
      expect(att(g(18), 'd5', 'w')).toContain('c3')
      expect(att(g(18), 'd5', 'b')).toEqual([]) // d5 sin protección
    },
    (g) => {
      expect(g(19).history({ verbose: true }).at(-1)!.san).toBe('O-O')
      expect(att(g(19), 'd5', 'b')).toEqual([])
    },
    (g) => expect(g(20).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'p', piece: 'n', to: 'd5', color: 'w' }),
    (g) => {
      has(g(21), 'e8', 'r', 'b')
      has(g(21), 'e4', 'n', 'b')
      expect(att(g(21), 'e4', 'b')).toContain('e8')
    },
    (g) => {
      expect(att(g(23), 'd5', 'b')).toContain('c6')
      expect(att(g(23), 'd5', 'w')).toEqual([])
    },
    (g) => expect(att(g(24), 'e4', 'w')).toContain('c3'),
    (g) => expect(g(25).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'n', piece: 'n', color: 'b', to: 'c3' }),
    (g) => {
      expect(att(g(27), 'a4', 'b')).toContain('b5')
      expect(att(g(27), 'c4', 'b')).toContain('b5')
    },
    (g) => {
      // material: +1 blanco antes (peón de d5), parejo después de bxa4
      const mat = (c: Chess) => c.board().flat().reduce((t, p) => (p ? t + ({ p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }[p.type] ?? 0) * (p.color === 'w' ? 1 : -1) : t), 0)
      expect(mat(g(27))).toBe(1)
      expect(mat(g(29))).toBe(0)
      expect(g(29).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'p', piece: 'p', to: 'a4' })
    },
    (g) => {
      has(g(31), 'b8', 'r', 'b')
      for (const r of [1, 2, 3, 4, 5, 6, 7]) expect(g(31).get(`b${r}` as Square), `b${r}`).toBeFalsy() // columna b abierta
    },
  ],
  'philidor#0': [
    (g) => {
      expect(att(g(14), 'd6', 'w')).toContain('f4')
      expect(att(g(14), 'd6', 'b')).toEqual(expect.arrayContaining(['d8', 'e7'])) // la dama y el alfil lo protegen
    },
    (g) => {
      expect(att(g(15), 'e5', 'b')).toContain('d7')
      expect(att(g(15), 'c5', 'b')).toContain('d7')
      expect(g(15).get('f6' as Square)).toBeFalsy()
    },
    (g) => {
      expect(att(g(16), 'e7', 'w')).toContain('d5')
      expect(att(g(16), 'c7', 'w')).toContain('d5')
    },
    (g) => expect(g(17).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'n', piece: 'n', color: 'b', to: 'd4' }),
    (g) => expect(att(g(19), 'f2', 'b')).toContain('h4'),
    (g) => expect(att(g(21), 'e4', 'b')).toContain('e8'),
    (g) => {
      expect(att(g(23), 'd5', 'b')).toContain('b6')
      expect(att(g(23), 'c4', 'b')).toContain('b6')
    },
    (g) => expect(att(g(24), 'h4', 'w')).toContain('g3'),
    (g) => expect(g(25).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'b', piece: 'n', to: 'c4' }),
    (g) => expect(att(g(26), 'c7', 'w')).toContain('c4'),
    (g) => expect(att(g(27), 'd5', 'b')).toContain('c6'),
    (g) => {
      has(g(29), 'e7', 'b', 'b')
      expect(att(g(28), 'h4', 'w')).toContain('g3')
    },
    (g) => {
      expect(att(g(31), 'c4', 'b')).toContain('e6')
      has(g(31), 'e6', 'b', 'b')
    },
  ],
  'siciliana#0': [
    (g) => expect(g(17).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'n', piece: 'n', color: 'b' }),
    (g) => {
      for (const sq of ['a7', 'd6', 'f6']) expect(att(g(18), sq, 'w'), sq).toContain('d4')
    },
    (g) => has(g(19), 'g7', 'b', 'b'),
    (g) => {
      has(g(21), 'g8', 'k', 'b')
      has(g(21), 'g7', 'b', 'b')
    },
    (g) => {
      expect(att(g(23), 'c4', 'b')).toContain('c6')
      expect(att(g(23), 'e4', 'b')).toContain('c6')
    },
    (g) => expect(att(g(25), 'b5', 'b')).toContain('a6'),
    (g) => {
      expect(att(g(26), 'e7', 'w')).toContain('d5')
      expect(att(g(26), 'f6', 'w')).toContain('d5')
    },
    (g) => expect(att(g(27), 'e7', 'b')).toContain('e8'),
    (g) => expect(att(g(28), 'f6', 'w')).toContain('g5'),
    (g) => expect(g(29).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'n', to: 'd5', color: 'b' }),
    (g) => expect(att(g(30), 'c6', 'w')).toContain('d5'),
    (g) => {
      for (const sq of ['d5', 'c4', 'f2']) expect(att(g(31), sq, 'b'), sq).toContain('c5')
    },
  ],
  'siciliana#1': [
    (g) => expect(att(g(14), 'c5', 'w')).toContain('e3'),
    (g) => {
      has(g(15), 'b8', 'r', 'b')
      has(g(15), 'b7', 'p', 'b')
    },
    (g) => {
      has(g(17), 'g8', 'k', 'b')
      has(g(17), 'g7', 'b', 'b')
    },
    (g) => {
      expect(att(g(19), 'f3', 'b')).toContain('d4')
      expect(att(g(19), 'c2', 'b')).toContain('d4')
    },
    (g) => expect(att(g(20), 'd4', 'w')).toContain('f2'),
    (g) => {
      expect(g(21).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'n', color: 'b', to: 'f3' })
      expect(g(21).inCheck()).toBe(true)
    },
    (g) => expect(att(g(23), 'a6', 'b')).toContain('c8'),
    (g) => expect(att(g(25), 'd3', 'b')).toContain('a6'),
    (g) => {
      for (const sq of ['c8', 'd8', 'e8']) expect(g(27).get(sq as Square), sq).toBeFalsy()
      has(g(27), 'f8', 'r', 'b')
      has(g(27), 'b8', 'r', 'b')
      expect(att(g(27), 'a4', 'b')).toContain('d7')
    },
    (g) => {
      expect(att(g(29), 'e5', 'b')).toContain('c6')
      expect(att(g(29), 'd4', 'b')).toContain('c6')
    },
    (g) => expect(att(g(31), 'e4', 'b')).toContain('d5'),
  ],
  'francesa#0': [
    (g) => has(g(15), 'd7', 'b', 'b'),
    (g) => expect(att(g(17), 'e5', 'b')).toContain('c7'),
    (g) => expect(att(g(19), 'f5', 'b')).toContain('h6'),
    (g) => expect(att(g(21), 'd4', 'b')).toContain('f5'),
    (g) => expect(att(g(23), 'g5', 'b')).toContain('h6'),
    (g) => expect(att(g(25), 'a3', 'b')).toContain('e7'),
    (g) => {
      has(g(27), 'c8', 'k', 'b')
      has(g(27), 'd8', 'r', 'b')
      has(g(27), 'h8', 'r', 'b')
      for (const sq of ['e8', 'f8', 'g8']) expect(g(27).get(sq as Square), sq).toBeFalsy() // torres conectadas
    },
    (g) => expect(att(g(28), 'a5', 'w')).toContain('b4'),
    (g) => {
      expect(g(29).history({ verbose: true }).at(-1)!.flags).toContain('e') // al paso
      expect(att(g(29), 'c2', 'b')).toContain('b3')
    },
    (g) => expect(att(g(30), 'a5', 'w')).toContain('b3'),
    (g) => {
      expect(att(g(31), 'b3', 'b')).toContain('a4')
      expect(att(g(31), 'b3', 'b')).toContain('a5')
    },
  ],
  'francesa#1': [
    (g) => {
      expect(att(g(16), 'f6', 'b')).toContain('d7') // el caballo de d7
      expect(att(g(16), 'f6', 'b')).toContain('g7') // y el peón de g7 pueden recapturar
    },
    (g) => expect(att(g(17), 'e4', 'b')).toContain('f6'),
    (g) => expect(att(g(19), 'h2', 'b')).toContain('d6'),
    (g) => has(g(21), 'g8', 'k', 'b'),
    (g) => has(g(23), 'd7', 'b', 'b'),
    (g) => {
      expect(att(g(25), 'f4', 'b')).toContain('h5')
      expect(att(g(25), 'g3', 'b')).toContain('h5')
    },
    (g) => expect(att(g(26), 'd8', 'w')).toContain('g5'),
    (g) => {
      has(g(27), 'c7', 'q', 'b')
      has(g(27), 'd6', 'b', 'b')
      expect(att(g(27), 'h2', 'b')).toContain('d6')
    },
    (g) => expect(att(g(29), 'b5', 'b')).toContain('a6'),
    (g) => {
      for (const sq of ['d3', 'h3', 'g2']) expect(att(g(31), sq, 'b'), sq).toContain('f4')
    },
    (g) => {
      expect(g(33).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'b', piece: 'b', color: 'b', to: 'f4' })
      expect(att(g(33), 'c1', 'b')).toContain('f4')
    },
  ],
  'caro-kann#0': [
    (g) => {
      for (const sq of ['d7', 'g6', 'f7', 'c6']) expect(att(g(18), sq, 'w'), sq).toContain('e5')
    },
    (g) => {
      expect(att(g(19), 'c3', 'b')).toContain('d5')
      expect(att(g(19), 'f4', 'b')).toContain('d5')
    },
    (g) => expect(att(g(20), 'e5', 'w')).toContain('f4'),
    (g) => {
      expect(g(21).history({ verbose: true }).at(-1)!.san).toBe('O-O')
      has(g(21), 'g8', 'k', 'b')
    },
    (g) => expect(g(23).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'n', piece: 'n', to: 'e5', color: 'b' }),
    (g) => expect(att(g(24), 'd6', 'w')).toContain('e5'),
    (g) => has(g(25), 'e7', 'b', 'b'),
    (g) => {
      expect(att(g(27), 'd4', 'b')).toContain('c5')
      expect(att(g(27), 'd4', 'w')).toEqual([])
    },
    (g) => expect(g(28).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'p', piece: 'p', to: 'c5', color: 'w' }),
    (g) => expect(g(29).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'p', piece: 'b', to: 'c5', color: 'b' }),
    (g) => expect(g(30).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'b', piece: 'b', to: 'g6', color: 'w' }),
    (g) => {
      has(g(31), 'g6', 'p', 'b')
      has(g(31), 'g7', 'p', 'b') // peones doblados en g
      for (const r of [2, 3, 4, 5, 6, 7]) expect(g(31).get(`f${r}` as Square), `f${r}`).toBeFalsy() // columna f abierta
    },
    (g) => {
      expect(g(32).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'r', piece: 'r', color: 'w' })
      expect(g(32).inCheck()).toBe(true)
    },
    (g) => {
      has(g(33), 'f8', 'b', 'b')
      expect(g(33).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'r', piece: 'b', to: 'f8' })
    },
  ],
  'caro-kann#1': [
    (g) => {
      expect(att(g(15), 'd5', 'b')).toContain('e6')
      expect(att(g(15), 'a3', 'b')).toContain('f8') // diagonal f8–a3 abierta
    },
    (g) => expect(att(g(16), 'g4', 'w')).toContain('h3'),
    (g) => expect(att(g(17), 'f3', 'b')).toContain('h5'),
    (g) => {
      expect(att(g(19), 'f4', 'b')).toContain('d6')
      expect(att(g(19), 'f4', 'w')).toEqual([])
    },
    (g) => expect(g(21).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'b', piece: 'q', color: 'b' }),
    (g) => expect(g(23).history({ verbose: true }).at(-1)!.san).toBe('O-O'),
    (g) => has(g(25), 'c7', 'q', 'b'),
    (g) => {
      has(g(27), 'c8', 'r', 'b')
      const cPawns = g(27).board().flat().filter((p) => p && p.type === 'p' && p.color === 'b' && p.square[0] === 'c').length
      expect(cPawns).toBe(0) // sin peón negro en la columna c
    },
    (g) => expect(att(g(29), 'd3', 'b')).toContain('g6'),
    (g) => has(g(31), 'g6', 'p', 'b'),
    (g) => expect(att(g(32), 'g6', 'w')).toContain('d3'),
  ],
  'gambito-dama#0': [
    (g) => expect(att(g(14), 'f5', 'w')).toContain('h4'),
    (g) => has(g(15), 'g6', 'b', 'b'),
    (g) => {
      expect(g(16).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'b', piece: 'n', to: 'g6' })
      expect(att(g(16), 'h8', 'w')).toContain('g6')
    },
    (g) => {
      has(g(17), 'g6', 'p', 'b')
      const hPawns = g(17).board().flat().filter((p) => p && p.type === 'p' && p.color === 'b' && p.square[0] === 'h').length
      expect(hPawns).toBe(0)
    },
    (g) => expect(g(18).history({ verbose: true }).at(-1)!.san).toBe('O-O'),
    (g) => expect(att(g(19), 'd4', 'b')).toContain('c5'),
    (g) => expect(att(g(20), 'b4', 'w')).toContain('a2'),
    (g) => expect(att(g(22), 'g4', 'w')).toContain('h3'),
    (g) => expect(att(g(23), 'd4', 'b')).toContain('c6'),
    (g) => {
      expect(g(24).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'b', piece: 'n', to: 'b4' })
      expect(att(g(24), 'c6', 'w')).toContain('b4')
    },
    (g) => {
      has(g(25), 'b4', 'p', 'b')
      has(g(25), 'b7', 'p', 'b')
    },
    (g) => expect(att(g(26), 'c4', 'w')).toContain('e2'),
    (g) => expect(att(g(28), 'b4', 'w')).toContain('d2'),
    (g) => expect(att(g(30), 'c6', 'w')).toContain('b5'),
  ],
  'gambito-dama#1': [
    (g) => expect(g(16).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'p', piece: 'p', to: 'c5', color: 'w' }),
    (g) => expect(att(g(17), 'e3', 'b')).toContain('c5'),
    (g) => expect(g(18).history({ verbose: true }).at(-1)!.san).toBe('O-O'),
    (g) => {
      expect(att(g(19), 'c3', 'b')).toContain('d4')
      expect(att(g(19), 'e3', 'b')).toContain('d4')
    },
    (g) => {
      expect(att(g(20), 'c5', 'w')).toContain('d4')
      expect(att(g(20), 'c5', 'b')).toEqual([])
    },
    (g) => {
      expect(att(g(21), 'c3', 'b')).toContain('d4')
      expect(att(g(21), 'f2', 'b')).toContain('d4')
    },
    (g) => {
      expect(g(22).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'b', piece: 'n', to: 'd4' })
      expect(att(g(22), 'c6', 'w')).toContain('d4')
    },
    (g) => {
      expect(att(g(23), 'f4', 'b')).toContain('d4')
      expect(att(g(23), 'f4', 'w')).toEqual([])
    },
    (g) => expect(att(g(24), 'd4', 'w')).toContain('e3'),
    (g) => {
      expect(g(26).get('f2' as Square)).toBeFalsy()
      has(g(26), 'f3', 'p', 'w')
      has(g(26), 'f1', 'r', 'w')
    },
    (g) => {
      has(g(28), 'f2', 'r', 'w')
      expect(att(g(28), 'd2', 'w')).toContain('f2')
    },
    (g) => has(g(30), 'd2', 'r', 'w'),
    (g) => expect(att(g(32), 'c6', 'w')).toContain('b5'),
    (g) => expect(g(33).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'r', piece: 'r', color: 'b' }),
    (g) => expect(g(34).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'r', piece: 'q', color: 'w' }),
  ],
  'london#0': [
    (g) => expect(att(g(14), 'h7', 'w')).toContain('d3'),
    (g) => {
      expect(att(g(16), 'f7', 'w')).toContain('e5')
      expect(att(g(16), 'c6', 'w')).toContain('e5')
    },
    (g) => expect(att(g(17), 'e5', 'b')).toContain('d7'),
    (g) => {
      has(g(18), 'e5', 'n', 'w')
      has(g(18), 'f3', 'n', 'w')
      expect(att(g(18), 'e5', 'w')).toContain('f3')
    },
    (g) => {
      expect(att(g(20), 'a7', 'w')).toContain('c6')
      expect(att(g(20), 'e7', 'w')).toContain('c6')
    },
    (g) => {
      has(g(21), 'c6', 'p', 'b')
      has(g(21), 'c5', 'p', 'b') // peones doblados en c
    },
    (g) => expect(g(22).history({ verbose: true }).at(-1)!.san).toBe('O-O'),
    (g) => expect(att(g(23), 'd3', 'b')).toContain('c4'),
    (g) => {
      has(g(24), 'e2', 'b', 'w')
      expect(att(g(24), 'c4', 'w')).toContain('e2')
    },
    (g) => expect(att(g(25), 'd4', 'b')).toContain('e5'),
    (g) => {
      expect(g(26).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'p', piece: 'p', to: 'e5', color: 'w' })
      expect(att(g(26), 'd6', 'w')).toContain('e5')
    },
    (g) => expect(att(g(27), 'f3', 'b')).toContain('e5'),
    (g) => {
      expect(att(g(28), 'c4', 'w')).toContain('b3')
      expect(att(g(28), 'c4', 'b').length).toBeGreaterThan(0) // protegido
    },
    (g) => {
      expect(g(29).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'n', piece: 'n', to: 'f3', color: 'b' })
      expect(g(29).inCheck()).toBe(true)
    },
    (g) => {
      has(g(30), 'f3', 'b', 'w')
      expect(att(g(30), 'd5', 'w')).toContain('f3')
    },
  ],
  'london#1': [
    (g) => expect(att(g(14), 'f5', 'w')).toContain('h4'),
    (g) => {
      expect(g(16).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'b', piece: 'b', to: 'd6' })
      expect(att(g(16), 'c7', 'w')).toContain('d6')
      expect(att(g(16), 'e7', 'w')).toContain('d6')
    },
    (g) => expect(att(g(17), 'h2', 'b')).toContain('d6'),
    (g) => {
      expect(g(18).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'b', piece: 'n', to: 'f5' })
      for (const sq of ['d6', 'e7', 'g7']) expect(att(g(18), sq, 'w'), sq).toContain('f5')
    },
    (g) => expect(att(g(20), 'f4', 'w')).toContain('g3'),
    (g) => expect(att(g(22), 'f5', 'w')).toContain('c2'),
    (g) => expect(att(g(23), 'e3', 'b')).toContain('e6'),
    (g) => {
      expect(att(g(24), 'f5', 'w')).toContain('d3')
    },
    (g) => has(g(26), 'c1', 'r', 'w'),
    (g) => {
      has(g(27), 'e4', 'n', 'b')
      for (const sq of ['c3', 'g3', 'd2', 'f2']) expect(att(g(27), sq, 'b'), sq).toContain('e4')
    },
    (g) => {
      expect(att(g(27), 'd2', 'b')).toContain('e4') // el caballo de d2 estaba atacado
      has(g(28), 'f3', 'n', 'w')
    },
    (g) => {
      has(g(29), 'e1', 'k', 'w')
      has(g(30), 'f1', 'k', 'w')
      has(g(30), 'e8', 'r', 'b')
    },
  ],
  'india-rey#0': [
    (g) => expect(att(g(15), 'e5', 'b')).toContain('e8'),
    (g) => expect(g(17).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'p', piece: 'p', to: 'd4', color: 'b' }),
    (g) => expect(att(g(19), 'b4', 'b')).toContain('a5'),
    (g) => expect(att(g(21), 'e4', 'b')).toContain('c5'),
    (g) => {
      expect(att(g(22), 'c7', 'w')).toContain('b5')
      expect(att(g(22), 'd6', 'w')).toContain('b5')
    },
    (g) => {
      expect(att(g(23), 'b5', 'b')).toContain('d7')
      expect(att(g(23), 'h3', 'b')).toContain('d7')
    },
    (g) => expect(att(g(25), 'b3', 'b')).toContain('a4'),
    (g) => expect(att(g(27), 'g4', 'b')).toContain('h5'),
    (g) => expect(att(g(28), 'a4', 'w')).toContain('c2'),
    (g) => expect(g(29).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'n', piece: 'b', to: 'b5', color: 'b' }),
    (g) => {
      has(g(31), 'd7', 'n', 'b')
      has(g(31), 'c5', 'n', 'b')
      expect(att(g(31), 'c5', 'b')).toContain('d7')
    },
  ],
  'india-rey#1': [
    (g) => expect(att(g(9), 'e4', 'b')).toContain('d5'),
    (g) => {
      expect(att(g(11), 'c7', 'b')).toContain('a6')
      expect(att(g(11), 'b4', 'b')).toContain('a6')
    },
    (g) => expect(att(g(13), 'f2', 'b')).toContain('e4'),
    (g) => expect(att(g(15), 'b5', 'b')).toContain('c6'),
    (g) => expect(g(17).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'n', piece: 'p', to: 'e4', color: 'b' }),
    (g) => expect(att(g(19), 'd4', 'b')).toContain('c5'),
    (g) => expect(g(21).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'p', piece: 'p', to: 'd4', color: 'b' }),
    (g) => {
      expect(att(g(23), 'a2', 'b')).toContain('b4')
      expect(att(g(23), 'c2', 'b')).toContain('b4')
    },
    (g) => {
      expect(att(g(25), 'e4', 'b')).toContain('f5')
      expect(att(g(25), 'e4', 'w')).toEqual([])
    },
    (g) => {
      expect(att(g(27), 'f4', 'b')).toContain('d5')
      expect(att(g(27), 'f4', 'w')).toEqual([])
      expect(att(g(27), 'c3', 'b')).toContain('d5')
    },
    (g) => {
      expect(att(g(29), 'c3', 'b')).toContain('a5')
      expect(att(g(29), 'a2', 'b')).toContain('a5')
    },
    (g) => expect(att(g(30), 'f5', 'w')).toContain('g3'),
    (g) => {
      // material: las blancas iban un peón arriba (idx 29) y las negras lo recuperan con …Axd4
      const mat = (c: Chess) => c.board().flat().reduce((t, p) => (p ? t + ({ p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }[p.type] ?? 0) * (p.color === 'w' ? 1 : -1) : t), 0)
      expect(mat(g(29))).toBe(1)
      expect(mat(g(31))).toBe(0)
      expect(g(31).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'p', piece: 'b', to: 'd4' })
    },
    (g) => {
      expect(att(g(32), 'd4', 'w')).toContain('d2')
      expect(att(g(32), 'd4', 'b')).toEqual([])
    },
  ],
  'escandinava#0': [
    (g) => expect(att(g(17), 'c2', 'b')).toContain('g6'),
    (g) => expect(att(g(18), 'f6', 'w')).toContain('d5'),
    (g) => expect(att(g(19), 'f6', 'b')).toContain('d8'),
    (g) => expect(g(20).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'n', piece: 'n', color: 'w' }),
    (g) => {
      expect(g(21).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'n', piece: 'q', to: 'f6' })
      expect(att(g(21), 'd4', 'b')).toContain('f6')
      expect(att(g(21), 'h4', 'b')).toContain('f6')
      expect(att(g(21), 'h4', 'w')).toEqual([])
    },
    (g) => expect(g(22).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'b', piece: 'n', to: 'g6' }),
    (g) => {
      has(g(23), 'g6', 'p', 'b')
      const hPawns = g(23).board().flat().filter((p) => p && p.type === 'p' && p.color === 'b' && p.square[0] === 'h').length
      expect(hPawns).toBe(0)
      has(g(23), 'h8', 'r', 'b')
    },
    (g) => expect(att(g(25), 'h2', 'b')).toContain('d6'),
    (g) => expect(att(g(27), 'd2', 'b')).toContain('f4'),
    (g) => expect(g(29).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'b', piece: 'b', to: 'd2', color: 'b' }),
    (g) => expect(g(31).history({ verbose: true }).at(-1)!.san).toBe('O-O'),
  ],
  'pirc-moderna#0': [
    (g) => {
      expect(g(9).history({ verbose: true }).at(-1)!.san).toBe('O-O')
      has(g(9), 'g7', 'b', 'b')
    },
    (g) => expect(att(g(11), 'd4', 'b')).toContain('c6'),
    (g) => {
      for (const sq of ['d3', 'a2', 'c2']) expect(att(g(13), sq, 'b'), sq).toContain('b4')
    },
    (g) => {
      expect(g(15).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'b', piece: 'n', to: 'd3' })
      expect(g(15).inCheck()).toBe(true)
    },
    (g) => expect(att(g(17), 'd5', 'b')).toContain('c6'),
    (g) => expect(att(g(19), 'b4', 'b')).toContain('a5'),
    (g) => expect(att(g(21), 'e4', 'b')).toContain('d5'),
    (g) => expect(att(g(22), 'f6', 'w')).toContain('e5'),
    (g) => expect(att(g(23), 'c3', 'b')).toContain('e4'),
    (g) => expect(att(g(25), 'h3', 'b')).toContain('f5'),
    (g) => {
      expect(att(g(27), 'e5', 'b')).toContain('f6')
      expect(att(g(27), 'g5', 'b')).toContain('f6')
    },
    (g) => expect(att(g(28), 'f5', 'w')).toContain('g4'),
    (g) => {
      expect(att(g(29), 'e2', 'b')).toContain('c3')
      expect(att(g(29), 'd1', 'b')).toContain('c3')
    },
    (g) => {
      expect(att(g(31), 'f3', 'b')).toContain('e4')
      expect(att(g(31), 'c2', 'b')).toContain('e4')
    },
  ],
  'alekhine#0': [
    (g) => expect(att(g(15), 'f4', 'b')).toContain('e5'),
    (g) => {
      expect(g(16).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'q', piece: 'q', color: 'w' })
      expect(g(16).inCheck()).toBe(true)
    },
    (g) => {
      expect(g(17).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'q', piece: 'r', color: 'b' })
      for (const row of g(17).board()) for (const p of row) expect(p?.type, 'sin damas').not.toBe('q')
    },
    (g) => {
      expect(g(18).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'p', piece: 'n', to: 'e5' })
      expect(att(g(18), 'f7', 'w')).toContain('e5')
      expect(att(g(18), 'c6', 'w')).toContain('e5')
    },
    (g) => {
      expect(att(g(19), 'c2', 'b')).toContain('e4')
      expect(att(g(19), 'g2', 'b')).toContain('e4')
      expect(att(g(19), 'c2', 'w')).toEqual([])
      expect(att(g(19), 'g2', 'w')).toEqual([])
    },
    (g) => expect(att(g(21), 'b5', 'b')).toContain('a6'),
    (g) => expect(g(23).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'n', piece: 'b', to: 'c6', color: 'b' }),
    (g) => {
      has(g(25), 'c6', 'p', 'b')
      has(g(25), 'c7', 'p', 'b') // peones doblados en c
    },
    (g) => {
      expect(att(g(27), 'e5', 'b')).toContain('f6')
      expect(att(g(27), 'g5', 'b')).toContain('f6')
    },
    (g) => expect(g(28).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'p', piece: 'p', to: 'e6', color: 'w' }),
    (g) => {
      has(g(29), 'e6', 'p', 'w')
      expect(att(g(29), 'e6', 'b')).toContain('d6')
      expect(att(g(29), 'e6', 'w')).toEqual([])
    },
    (g) => expect(att(g(30), 'd6', 'w')).toContain('f4'),
    (g) => expect(g(31).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'p', piece: 'r', to: 'e6', color: 'b' }),
    (g) => expect(g(32).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'p', piece: 'b', to: 'c7', color: 'w' }),
    (g) => expect(g(33).inCheck()).toBe(true),
  ],
  'colle#0': [
    (g) => expect(att(g(16), 'd5', 'w')).toContain('e4'),
    (g) => expect(att(g(17), 'c3', 'b')).toContain('d4'),
    (g) => expect(att(g(18), 'f6', 'w')).toContain('e5'),
    (g) => expect(att(g(19), 'e5', 'b')).toContain('d7'),
    (g) => expect(g(20).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'p', piece: 'p', to: 'd4', color: 'w' }),
    (g) => {
      expect(att(g(21), 'd3', 'b')).toContain('b4')
      expect(att(g(21), 'a2', 'b')).toContain('b4')
    },
    (g) => expect(att(g(22), 'd7', 'w')).toContain('b5'),
    (g) => expect(att(g(24), 'd7', 'w')).toContain('a4'),
    (g) => {
      expect(att(g(25), 'a4', 'b')).toContain('b5') // el peón de b5 ataca el alfil de a4
      has(g(26), 'd1', 'b', 'w')
    },
    (g) => expect(att(g(28), 'b4', 'w')).toContain('a3'),
    (g) => expect(att(g(30), 'h7', 'w')).toContain('c2'),
  ],
  'inglesa#0': [
    (g) => expect(att(g(14), 'e5', 'w')).toContain('f3'),
    (g) => {
      expect(g(16).history({ verbose: true }).at(-1)!.san).toBe('O-O')
      has(g(16), 'f1', 'r', 'w')
    },
    (g) => expect(att(g(18), 'f5', 'w')).toContain('e4'),
    (g) => {
      expect(att(g(20), 'a5', 'w')).toContain('b4')
      has(g(20), 'b1', 'r', 'w')
    },
    (g) => {
      expect(att(g(22), 'a6', 'w')).toContain('b5')
      expect(att(g(22), 'c6', 'w')).toContain('b5')
    },
    (g) => {
      expect(g(24).history({ verbose: true }).at(-1)).toMatchObject({ captured: 'p', piece: 'p', to: 'f5' })
      expect(att(g(24), 'e6', 'w')).toContain('f5')
      expect(att(g(24), 'g6', 'w')).toContain('f5')
    },
    (g) => {
      expect(att(g(26), 'h7', 'w')).toContain('g5')
      expect(att(g(26), 'e6', 'w')).toContain('g5')
    },
    (g) => expect(att(g(28), 'd6', 'w')).toContain('e4'),
    (g) => expect(att(g(30), 'c7', 'w')).toContain('d5'),
  ],
}

describe('partidas de ejemplo armadas con el motor', () => {
  const entries = Object.entries(MORE_MODELS).flatMap(([id, list]) => list.map((g, k) => ({ id, k, g })))

  it('hay partidas y cada una pertenece a una apertura que existe', () => {
    expect(entries.length).toBeGreaterThan(0)
    for (const { id } of entries) expect(OPENINGS.some((o) => o.id === id), id).toBe(true)
  })

  it.each(entries.map((e) => [`${e.id}#${e.k}`, e] as const))('%s: legal, parte de su línea y está comentada', (_key, { id, k, g }) => {
    const c = new Chess()
    for (const m of g.moves) expect(() => c.move(m), m).not.toThrow()
    expect(g.engine).toBe(true)
    expect(g.moves.length).toBeGreaterThanOrEqual(28)
    // Parte de una línea a fondo de la apertura (las primeras jugadas coinciden) y es una línea distinta de la partida clásica.
    const src = ENGINE_GAME_SOURCES[id]![k]!
    const line = deepLinesOf(id).find((l) => l.id === src.line)!
    expect(g.moves.slice(0, src.prefix)).toEqual(line.moves.slice(0, src.prefix))
    expect(g.color).toBe(line.color)
    // Todas tus jugadas tienen nota, más las del rival que cambian algo; ninguna es un renglón vacío ni un párrafo.
    const mineIdx = g.moves.map((_, i) => i).filter((i) => (i % 2 === 0) === (g.color === 'w'))
    for (const i of mineIdx) expect(g.notes[i], `${id}#${k} jugada ${i} (${g.moves[i]})`).toBeTruthy()
    const keys = Object.keys(g.notes).map(Number)
    expect(keys.length).toBeGreaterThanOrEqual(mineIdx.length)
    for (const i of keys) {
      expect(i).toBeLessThan(g.moves.length)
      expect(g.notes[i]!.length, `${id}#${k} jugada ${i}`).toBeGreaterThan(12)
      expect(g.notes[i]!.length, `${id}#${k} jugada ${i}`).toBeLessThan(230)
    }
    expect(g.summary.length).toBeGreaterThan(60)
  })

  it.each(entries.map((e) => [`${e.id}#${e.k}`, e] as const))('%s: lo que dicen las notas coincide con el tablero', (key, { g }) => {
    const claims = CLAIMS[key]
    expect(claims, `faltan las comprobaciones de ${key}`).toBeTruthy()
    const getPos = (i: number) => at(g.moves, i)
    for (const f of claims!) f(getPos)
  })
})
