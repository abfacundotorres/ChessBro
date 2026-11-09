import { describe, expect, it } from 'vitest'
import { FOCUS, patterns } from '../patterns'
import type { ErrorKind, GameAnalysis, MoveError } from '../analysis'
import { LESSONS } from '../../content/lessons'
import themes from '../../content/themes.json'

const err = (kind: ErrorKind, severity: MoveError['severity'] = 'mistake'): MoveError => ({
  ply: 1, san: 'e4', bestUci: 'e2e4', bestSan: 'e4', severity, kind, winLoss: 15, fenBefore: '', prevUci: null, fenBeforePrev: null,
})
const game = (errors: MoveError[]): GameAnalysis => ({
  errors,
  avgWinLoss: 0,
  accuracy: 80,
  counts: { inaccuracy: errors.filter((e) => e.severity === 'inaccuracy').length, mistake: errors.filter((e) => e.severity === 'mistake').length, blunder: errors.filter((e) => e.severity === 'blunder').length },
})

describe('patrones de error', () => {
  it('cuenta por tipo, ignora imprecisiones y elige el punto débil', () => {
    const p = patterns([
      game([err('hanging', 'blunder'), err('hanging'), err('opening', 'inaccuracy')]),
      game([err('hanging'), err('missedTactic')]),
      game([err('missedTactic', 'blunder')]),
    ])
    expect(p.games).toBe(3)
    expect(p.kinds.map((k) => [k.kind, k.count])).toEqual([['hanging', 3], ['missedTactic', 2]])
    expect(p.weakness?.kind).toBe('hanging')
    expect(p.blundersPerGame).toBeCloseTo(2 / 3)
  })
  it('con menos de 3 partidas no recomienda nada', () => {
    expect(patterns([game([err('hanging'), err('hanging')]), game([err('hanging')])]).weakness).toBeNull()
  })
  it('lo posicional no es punto débil si hay otra cosa; sin nada claro, no hay', () => {
    const g = [game([err('positional'), err('positional'), err('endgame')]), game([err('positional')]), game([err('positional')])]
    expect(patterns(g).weakness?.kind).toBe('endgame')
    expect(patterns([game([err('positional')]), game([]), game([])]).weakness).toBeNull()
  })
  it('las recomendaciones apuntan a lecciones y temas que existen', () => {
    const themeKeys = new Set((themes as { key: string }[]).map((t) => t.key))
    for (const f of Object.values(FOCUS)) {
      if (f.lessonId) expect(LESSONS.some((l) => l.id === f.lessonId), f.lessonId).toBe(true)
      if (f.theme) expect(themeKeys.has(f.theme), f.theme).toBe(true)
    }
  })
})
