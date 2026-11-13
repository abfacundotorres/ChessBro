import { describe, expect, it } from 'vitest'
import { THEME_LIST } from '../themes'
import { THEME_BLURBS, blurbsFor } from '../themeBlurbs'

const GENERIC = new Set(['endgame', 'middlegame', 'opening', 'mate'])

describe('explicaciones de los temas', () => {
  it('cada tema que se muestra tiene su explicación, y no sobran claves', () => {
    for (const t of THEME_LIST) if (!GENERIC.has(t.key)) expect(THEME_BLURBS[t.key], t.key).toBeTruthy()
    const keys = new Set(THEME_LIST.map((t) => t.key))
    for (const k of Object.keys(THEME_BLURBS)) expect(keys.has(k), k).toBe(true)
  })
  it('blurbsFor ignora claves desconocidas y mantiene el orden', () => {
    expect(blurbsFor(['fork', 'nada', 'pin']).map((b) => b.key)).toEqual(['fork', 'pin'])
  })
})
