import { describe, expect, it } from 'vitest'
import {
  badBishops,
  bishopMobility,
  doubledPawns,
  hangingPieces,
  isolatedPawns,
  openFiles,
  outposts,
  passedPawns,
  pawnsOnBishopColor,
  undevelopedPieces,
} from '../structure'

const s = (xs: string[]) => [...xs].sort()

describe('estructura de peones', () => {
  const FEN = '4k3/pp3p1p/8/3P4/3P4/8/P4PP1/4K3 w - - 0 1'

  it('aislados', () => {
    // Blancas: a2 (sin b), d4 y d5 (sin c ni e) aislados; f2 y g2 se protegen entre sí.
    expect(s(isolatedPawns(FEN, 'w'))).toEqual(['a2', 'd4', 'd5'])
    // Negras: a7 y b7 se vecinan; f7 y h7 NO tienen peón en g → los dos aislados.
    expect(s(isolatedPawns(FEN, 'b'))).toEqual(['f7', 'h7'])
  })

  it('doblados', () => {
    expect(s(doubledPawns(FEN, 'w'))).toEqual(['d4', 'd5'])
    expect(doubledPawns(FEN, 'b')).toEqual([])
  })

  it('pasados', () => {
    // d4 y d5: no hay peones negros en c, d ni e → pasados. a2 no: los peones negros a7 y b7 lo frenan.
    expect(s(passedPawns(FEN, 'w'))).toEqual(['d4', 'd5'])
  })

  it('un peón con rival en la columna vecina por delante NO es pasado', () => {
    expect(passedPawns('4k3/p7/8/8/8/8/P7/4K3 w - - 0 1', 'w')).toEqual([])
    expect(passedPawns('4k3/1p6/8/8/8/8/P7/4K3 w - - 0 1', 'w')).toEqual([])
    expect(passedPawns('4k3/2p5/8/8/8/8/P7/4K3 w - - 0 1', 'w')).toEqual(['a2'])
  })
})

describe('piezas colgadas', () => {
  it('atacada y sin defensa, o atacada por una pieza de menor valor', () => {
    // El caballo negro de c6 está defendido por b7; la dama blanca de f3 ataca f7 (defendido por el rey).
    const fen = 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 2 3'
    expect(hangingPieces(fen, 'b')).toEqual([])
    // Dama blanca atacada por un peón: colgada.
    expect(hangingPieces('4k3/8/8/3p4/4Q3/8/8/4K3 w - - 0 1', 'w')).toEqual(['e4'])
    // Torre atacada y defendida por otra torre: no está colgada.
    expect(hangingPieces('4k3/8/8/8/3r4/8/3R4/3RK3 w - - 0 1', 'w')).toEqual([])
    // Pieza atacada sin defensa.
    expect(hangingPieces('4k3/8/8/8/3r4/8/8/3N2K1 b - - 0 1', 'w')).toEqual(['d1'])
    // El mismo caballo defendido por el rey ya no está colgado.
    expect(hangingPieces('4k3/8/8/8/3r4/8/8/3NK3 b - - 0 1', 'w')).toEqual([])
  })
})

describe('avanzadas', () => {
  it('una casilla protegida por peón y que ningún peón rival puede atacar', () => {
    // Peones blancos c4 y e4: d5 está protegido por ambos; peones negros en c6 y e6 la atacan → no.
    expect(outposts('4k3/8/2p1p3/8/2P1P3/8/8/4K3 w - - 0 1', 'w')).not.toContain('d5')
    // Sin peones negros en c y e, d5 es una avanzada para las blancas.
    expect(outposts('4k3/8/8/8/2P1P3/8/8/4K3 w - - 0 1', 'w')).toContain('d5')
    // Negras: el peón e6 protege d5 y no hay peones blancos que puedan atacarla.
    expect(outposts('4k3/8/4p3/8/8/8/8/4K3 b - - 0 1', 'b')).toContain('d5')
  })
})

describe('desarrollo', () => {
  it('caballos y alfiles que siguen en casa', () => {
    // Tras 1.e4 e5 2.Nf3 Nc6: las blancas sacaron un caballo; las negras, un caballo.
    const fen = 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3'
    expect(s(undevelopedPieces(fen, 'w'))).toEqual(['b1', 'c1', 'f1'])
    expect(s(undevelopedPieces(fen, 'b'))).toEqual(['c8', 'f8', 'g8'])
    expect(undevelopedPieces(fen, 'both')).toHaveLength(6)
  })
})

describe('columnas abiertas y alfil malo', () => {
  it('columnas sin peones', () => {
    expect(openFiles('4k3/pp3ppp/8/8/8/8/PP3PPP/4K3 w - - 0 1')).toEqual(['c', 'd', 'e'])
    expect(openFiles('4k3/8/8/8/8/8/8/4K3 w - - 0 1')).toHaveLength(8)
  })

  it('alfil encerrado por sus propios peones', () => {
    // Alfil blanco de c1 (casilla oscura) con cuatro peones propios en casillas oscuras (b2, d4, e5, g5) y poca movilidad.
    const fen = '4k3/8/8/4P1P1/3P4/P7/1P6/2B1K3 w - - 0 1'
    expect(pawnsOnBishopColor(fen, 'c1')).toBeGreaterThanOrEqual(4)
    expect(bishopMobility(fen, 'c1')).toBeLessThanOrEqual(5)
    expect(badBishops(fen, 'w')).toEqual(['c1'])
    // El mismo alfil con el centro despejado no es malo.
    expect(badBishops('4k3/8/8/8/8/8/8/2B1K3 w - - 0 1', 'w')).toEqual([])
  })
})
