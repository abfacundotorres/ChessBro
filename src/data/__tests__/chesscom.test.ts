import { describe, expect, it } from 'vitest'
import sample from '../__fixtures__/chesscom.sample.json'
import { openingFromEco, parseChesscomGame, parseMonth, pgnMoves, CHESSCOM_USERNAME_RE } from '../chesscom'
import { START_FEN, replay, type MoveInput } from '../../engine/game'

describe('importación de Chess.com', () => {
  it('extrae las jugadas del PGN sin relojes ni numeración', () => {
    expect(pgnMoves('[Event "x"]\n[White "a"]\n\n1. e4 {[%clk 0:03:00]} 1... e5 {[%clk 0:03:00]} 2. Nf3 {[%clk 0:02:59]} 1-0')).toEqual(['e4', 'e5', 'Nf3'])
  })

  it('saca el nombre de la apertura de la URL de ECO', () => {
    expect(openingFromEco('https://www.chess.com/openings/Kings-Indian-Defense-Fianchetto-Karlsbad-8.d5-Nb8')).toBe('Kings Indian Defense Fianchetto Karlsbad')
    expect(openingFromEco('https://www.chess.com/openings/Italian-Game')).toBe('Italian Game')
    expect(openingFromEco(undefined)).toBeNull()
  })

  it('convierte partidas reales y detecta el bando', () => {
    const games = (sample.games as unknown[]).map((g) => parseChesscomGame(g, 'hikaru')).filter(Boolean)
    expect(games.length).toBeGreaterThan(4)
    for (const g of games) {
      expect(g!.source).toBe('chesscom')
      expect(g!.id).toMatch(/^cc-\d+$/)
      const r = replay(START_FEN, g!.moves.map((u) => ({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] as MoveInput['promotion'] })))
      expect(r.moves.length).toBe(g!.moves.length)
      const mine = g!.me === 'w' ? g!.white : g!.black
      expect(mine.name.toLowerCase()).toBe('hikaru')
      if (g!.winner) expect((g!.winner === 'white') === (g!.me === 'w')).toBe(g!.winner === (g!.white.name.toLowerCase() === 'hikaru' ? 'white' : 'black'))
    }
  })

  it('traduce el resultado (jaque mate, abandono, tiempo)', () => {
    const all = (sample.games as unknown[]).map((g) => parseChesscomGame(g, 'hikaru')).filter(Boolean)
    const statuses = new Set(all.map((g) => g!.status))
    expect(statuses.has('resign')).toBe(true)
    expect(statuses.has('outoftime')).toBe(true)
  })

  it('ignora el bullet, a quien no jugó y la gente que no existe', () => {
    const month = parseMonth(sample, 'hikaru')
    expect(month.every((g) => g.speed !== 'bullet')).toBe(true)
    expect(month.map((g) => g.createdAt)).toEqual([...month.map((g) => g.createdAt)].sort((a, b) => b - a))
    expect(parseMonth(sample, 'nadie')).toEqual([])
    expect(parseMonth(null, 'hikaru')).toEqual([])
  })

  it('valida el usuario', () => {
    expect(CHESSCOM_USERNAME_RE.test('Hikaru')).toBe(true)
    expect(CHESSCOM_USERNAME_RE.test('a')).toBe(false)
    expect(CHESSCOM_USERNAME_RE.test('con espacio')).toBe(false)
  })
})
