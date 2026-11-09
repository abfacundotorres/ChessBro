import { describe, expect, it } from 'vitest'
import { openingStats, type StatGame } from '../openingStats'

const g = (opening: string | null, me: 'w' | 'b', winner: 'white' | 'black' | null, openingErrors: number | null = null): StatGame => ({ opening, me, winner, openingErrors })
const keyOf = (n: string | null) => (n ?? 'otras').split(':')[0]!

describe('estadísticas por apertura', () => {
  it('cuenta resultados desde tu punto de vista y separa por bando', () => {
    const s = openingStats(
      [g('Italian: A', 'w', 'white', 1), g('Italian: B', 'w', 'black', 3), g('Italian: C', 'w', null), g('Italian: D', 'b', 'black', null), g(null, 'b', 'white')],
      keyOf,
    )
    const itW = s.find((x) => x.key === 'Italian' && x.me === 'w')!
    expect(itW).toMatchObject({ games: 3, wins: 1, losses: 1, draws: 1, analyzed: 2, errors: 4 })
    expect(s.find((x) => x.key === 'Italian' && x.me === 'b')).toMatchObject({ games: 1, wins: 1, analyzed: 0 })
    expect(s.find((x) => x.key === 'otras')).toMatchObject({ me: 'b', losses: 1 })
    expect(s[0]!.games).toBe(3)
  })
})
