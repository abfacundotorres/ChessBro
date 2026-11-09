import { describe, expect, it } from 'vitest'
import { DEFAULT_LEVEL, LEVELS, levelInfo, parseLevel } from '../level'

describe('nivel de partida', () => {
  it('el rating inicial y la banda de partida crecen con el nivel', () => {
    const ratings = LEVELS.map((l) => l.rating)
    expect(ratings).toEqual([...ratings].sort((a, b) => a - b))
    const bands = LEVELS.map((l) => l.startBand)
    expect(bands).toEqual([...bands].sort((a, b) => a - b))
    expect(LEVELS[0]!.startBand).toBe(0)
  })

  it('cada nivel apunta a una lección de su banda de partida', async () => {
    const { LESSONS } = await import('../../content/lessons')
    const { BANDS } = await import('../../content/curriculum')
    for (const l of LEVELS) {
      const lesson = LESSONS.find((x) => x.id === l.startLesson)
      expect(lesson, l.id).toBeDefined()
      expect(BANDS.findIndex((b) => b.id === lesson!.band), l.id).toBeGreaterThanOrEqual(l.startBand)
    }
  })

  it('parsea solo niveles válidos y tiene un valor por defecto', () => {
    expect(parseLevel('bajo')).toBe('bajo')
    expect(parseLevel('cualquiera')).toBeNull()
    expect(parseLevel(null)).toBeNull()
    expect(levelInfo(null).id).toBe(DEFAULT_LEVEL)
    expect(levelInfo('alto').rating).toBe(1400)
  })
})
