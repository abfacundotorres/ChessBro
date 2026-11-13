import { describe, expect, it } from 'vitest'
import { BANDS } from '../curriculum'
import { LESSONS } from '../lessons'
import { BAND_GUIDES, LESSON_ICONS, lessonIcon } from '../pathIcons'

describe('íconos y guías del camino', () => {
  it('cada banda con lecciones tiene su guía y no se repite', () => {
    const guides = BANDS.map((b) => BAND_GUIDES[b.id])
    expect(guides.every(Boolean)).toBe(true)
    expect(new Set(guides).size).toBe(guides.length)
  })
  it('las lecciones con ícono propio existen (sin ids viejos) y el resto usa el libro', () => {
    const ids = new Set(LESSONS.map((l) => l.id))
    const custom = LESSONS.filter((l) => lessonIcon(l.id) !== 'libro').length
    expect(custom).toBeGreaterThan(20)
    expect(lessonIcon('no-existe')).toBe('libro')
    for (const id of Object.keys(LESSON_ICONS)) expect(ids.has(id), id).toBe(true)
  })
})
