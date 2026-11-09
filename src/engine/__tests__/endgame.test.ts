import { describe, expect, it } from 'vitest'
import { judgeEndgame, type EndgameDef } from '../endgame'
import { replay } from '../game'
import { uciToMove } from '../puzzle'

const krk: EndgameDef = { id: 'krk', title: '', summary: '', fen: '7k/8/6K1/8/8/8/8/R7 w - - 0 1', user: 'w', goal: 'mate', maxMoves: 5, tips: [] }
const hold: EndgameDef = { ...krk, id: 'h', fen: '7k/5K2/8/8/8/8/8/6Q1 b - - 0 1', user: 'b', goal: 'hold', maxMoves: 3 }

describe('judgeEndgame', () => {
  it('mate del usuario = ganó', () => {
    const v = replay(krk.fen, [uciToMove('a1a8')])
    expect(judgeEndgame(krk, v, 1).state).toBe('won')
  })

  it('se acaban las jugadas sin mate = perdió', () => {
    const v = replay(krk.fen, [uciToMove('a1a2')])
    expect(judgeEndgame(krk, v, 5).state).toBe('lost')
    expect(judgeEndgame(krk, v, 1).state).toBe('playing')
  })

  it('ahogado: en un final de mate cuenta como no logrado', () => {
    const v = replay('k7/8/1K6/8/8/8/8/2Q5 w - - 0 1', [uciToMove('c1c7')])
    expect(judgeEndgame({ ...krk, fen: v.startFen }, v, 1)).toMatchObject({ state: 'lost' })
  })

  it('hold: te dan mate = perdiste; aguantar = ganaste', () => {
    const mated = replay('7k/5K2/8/8/8/8/8/6Q1 w - - 0 1', [uciToMove('g1g7')])
    expect(judgeEndgame(hold, mated, 1).state).toBe('lost')
    const calm = replay(hold.fen, [uciToMove('h8h7')])
    expect(judgeEndgame(hold, calm, 1).state).toBe('playing')
    expect(judgeEndgame(hold, calm, 3).state).toBe('won')
  })
})
