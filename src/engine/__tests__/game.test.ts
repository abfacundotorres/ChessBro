import { describe, expect, it } from 'vitest'
import {
  START_FEN,
  legalTargets,
  needsPromotion,
  pairMoves,
  pieceColorAt,
  replay,
  sanToFigurine,
  tryMove,
  validateFen,
  type MoveInput,
} from '../game'

const mv = (s: string): MoveInput => ({ from: s.slice(0, 2), to: s.slice(2, 4) })

describe('replay', () => {
  it('posición inicial', () => {
    const g = replay(START_FEN, [])
    expect(g.turn).toBe('w')
    expect(g.status).toEqual({ kind: 'playing' })
    expect(g.lastMove).toBeNull()
    expect(g.checkSquare).toBeNull()
  })

  it('mate pastor: detecta jaque mate, ganador y casilla del rey', () => {
    const g = replay(START_FEN, ['e2e4', 'e7e5', 'f1c4', 'b8c6', 'd1h5', 'g8f6', 'h5f7'].map(mv))
    expect(g.status).toEqual({ kind: 'checkmate', winner: 'w' })
    expect(g.checkSquare).toBe('e8')
    expect(g.moves.at(-1)?.san).toBe('Qxf7#')
    expect(g.lastMove).toEqual({ from: 'h5', to: 'f7' })
  })

  it('lanza ante una jugada ilegal', () => {
    expect(() => replay(START_FEN, [mv('e2e5')])).toThrow(/ilegal #1/)
  })

  it('ahogado', () => {
    // Rey negro en a8; Dc7 le quita a7, b7 y b8 sin dar jaque.
    const g = replay('k7/8/1Q6/8/8/8/8/7K w - - 0 1', [mv('b6c7')])
    expect(g.status).toEqual({ kind: 'stalemate' })
  })

  it('tablas por material insuficiente', () => {
    const g = replay('8/8/8/8/8/2k5/2n5/K7 b - - 0 1', [])
    expect(g.status).toEqual({ kind: 'draw', reason: 'insufficient' })
  })

  it('tablas por triple repetición', () => {
    const shuffle = ['g1f3', 'g8f6', 'f3g1', 'f6g8', 'g1f3', 'g8f6', 'f3g1', 'f6g8'].map(mv)
    expect(replay(START_FEN, shuffle).status).toEqual({ kind: 'draw', reason: 'threefold' })
  })

  it('enroque y captura al paso', () => {
    const castle = replay('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', [mv('e1g1')])
    expect(castle.moves[0]?.san).toBe('O-O')
    const ep = replay('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', [mv('e5d6')])
    expect(ep.moves[0]?.san).toBe('exd6')
    expect(pieceColorAt(ep.fen, 'd5')).toBeNull()
  })
})

describe('tryMove / legalTargets / needsPromotion', () => {
  it('jugada legal devuelve SAN y FEN posterior', () => {
    const m = tryMove(START_FEN, mv('g1f3'))
    expect(m?.san).toBe('Nf3')
    expect(m?.fen.split(' ')[1]).toBe('b')
  })

  it('jugada ilegal o casilla inválida devuelve null', () => {
    expect(tryMove(START_FEN, mv('e2e5'))).toBeNull()
    expect(tryMove(START_FEN, { from: 'z9', to: 'e4' })).toBeNull()
  })

  it('destinos legales del caballo inicial; nada si no es el turno', () => {
    expect(legalTargets(START_FEN, 'g1').sort()).toEqual(['f3', 'h3'])
    expect(legalTargets(START_FEN, 'g8')).toEqual([])
    expect(legalTargets(START_FEN, 'e4')).toEqual([])
  })

  it('coronación', () => {
    const fen = '8/P6k/8/8/8/8/8/K7 w - - 0 1'
    expect(needsPromotion(fen, 'a7', 'a8')).toBe(true)
    expect(needsPromotion(fen, 'a1', 'a2')).toBe(false)
    expect(tryMove(fen, { from: 'a7', to: 'a8', promotion: 'n' })?.san).toBe('a8=N')
  })
})

describe('notación', () => {
  it('figurinas', () => {
    expect(sanToFigurine('Nf3')).toBe('♘f3')
    expect(sanToFigurine('exd8=Q+')).toBe('exd8=♕+')
    expect(sanToFigurine('O-O')).toBe('O-O')
    expect(sanToFigurine('Kxb7')).toBe('♔xb7')
  })

  it('pares de jugadas desde blancas y desde negras', () => {
    const g = replay(START_FEN, ['e2e4', 'e7e5', 'g1f3'].map(mv))
    expect(pairMoves(START_FEN, g.moves).map((p) => [p.number, p.white?.san ?? null, p.black?.san ?? null])).toEqual([
      [1, 'e4', 'e5'],
      [2, 'Nf3', null],
    ])
    const fenB = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
    const gb = replay(fenB, ['e7e5', 'g1f3'].map(mv))
    expect(pairMoves(fenB, gb.moves).map((p) => [p.number, p.white?.san ?? null, p.black?.san ?? null])).toEqual([
      [1, null, 'e5'],
      [2, 'Nf3', null],
    ])
  })

  it('validateFen', () => {
    expect(validateFen(START_FEN)).toBeNull()
    expect(validateFen('esto no es un fen')).not.toBeNull()
  })
})
