import { describe, expect, it } from 'vitest'
import { INTERVALS, isDue, newCard, review } from '../srs'
import { addDays, daysBetween, formatDayMonth } from '../dates'

describe('fechas', () => {
  it('suma días cruzando meses y años bisiestos', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(daysBetween('2026-11-01', '2026-12-01')).toBe(30)
    expect(formatDayMonth('2026-11-08')).toBe('08/11')
  })
})

describe('repaso espaciado', () => {
  const today = '2026-11-08'

  it('un puzzle fallado vuelve mañana', () => {
    const c = newCard('abc', today)
    expect(c.due).toBe('2026-11-09')
    expect(isDue(c, today)).toBe(false)
    expect(isDue(c, '2026-11-09')).toBe(true)
  })

  it('acertar sube de caja hasta darlo por aprendido', () => {
    let card = newCard('abc', today)
    for (let box = 1; box < INTERVALS.length; box++) {
      const r = review(card, true, card.due)
      if (r.kind !== 'scheduled') throw new Error('debería seguir')
      expect(r.card.box).toBe(box)
      expect(daysBetween(card.due, r.card.due)).toBe(INTERVALS[box])
      card = r.card
    }
    expect(review(card, true, card.due)).toEqual({ kind: 'learned' })
  })

  it('fallar vuelve a la caja 0 y suma un lapso', () => {
    const r1 = review({ puzzleId: 'x', box: 3, due: today, lapses: 1 }, false, today)
    expect(r1).toEqual({ kind: 'scheduled', card: { puzzleId: 'x', box: 0, due: '2026-11-09', lapses: 2 } })
  })
})
